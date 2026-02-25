import supabase from '../../../../utils/supabase';
import { getJPSCategory, type JPSResult } from './types';
import {
    getPeriodDates, getTrimester,
    getActivityMultiplier, getTaskMultiplier,
    calculateMCI, calculateMomentum, calculateCD, calculateDoE,
    type PeriodType,
} from './helpers';

// ─── Private helpers ──────────────────────────────────────────────────────────

async function fetchMIS(memberId: string): Promise<number> {
    const { data: advisees } = await supabase.from('profiles').select('id').eq('advisor_id', memberId);
    if (!advisees?.length) return 0;
    const { startDate } = getPeriodDates();
    const { data: snaps } = await supabase.from('jps_snapshots').select('score')
        .in('member_id', advisees.map(a => a.id))
        .eq('year', startDate.getFullYear())
        .eq('trimester', getTrimester(startDate));
    if (!snaps?.length) return 0;
    return Math.round(snaps.reduce((s, r) => s + r.score, 0) / snaps.length);
}

async function saveSnapshot(memberId: string, result: JPSResult) {
    const now = new Date();
    // Both month and trimester are NOT NULL in the DB — always store real values.
    // Monthly snapshots act as the single unit of storage.
    // Trimester view reads all months within a trimester and picks the most recent.
    const currentMonth     = now.getMonth() + 1;         // 1-12
    const currentTrimester = getTrimester(now);           // 1-4
    const year             = now.getFullYear();

    // Look up existing snapshot for this exact (member, year, month, trimester)
    const { data: existing } = await supabase.from('jps_snapshots').select('id')
        .eq('member_id', memberId).eq('year', year)
        .eq('month', currentMonth).eq('trimester', currentTrimester)
        .maybeSingle();

    const payload = { score: result.score, category: result.category, details: result.details };
    const { error } = existing?.id
        ? await supabase.from('jps_snapshots').update(payload).eq('id', existing.id)
        : await supabase.from('jps_snapshots').insert({ member_id: memberId, year, month: currentMonth, trimester: currentTrimester, ...payload });

    if (error) console.error('[JPS] Save failed:', error);
}

// ─── Service ──────────────────────────────────────────────────────────────────

export const jpsService = {
    getPeriodDates,

    async calculateJPS(memberId: string, periodType: PeriodType = 'trimester', customDate?: Date): Promise<JPSResult> {
        const { startDate, endDate } = getPeriodDates(periodType, customDate);
        const startISO = startDate.toISOString();
        const endISO   = endDate.toISOString();
        const cutoff   = ((customDate ?? new Date()) < endDate ? (customDate ?? new Date()) : endDate).toISOString();

        // Step 1: Fetch activities in period → resolve participations safely
        const { data: acts } = await supabase.from('activities')
            .select('id, type, formations(*), meetings(*), general_assemblies(*)')
            .gte('activity_begin_date', startISO).lte('activity_begin_date', cutoff);

        const actMap = new Map((acts ?? []).map(a => [a.id, a]));
        let participations: any[] = [];
        if (acts?.length) {
            const { data } = await supabase.from('activity_participants')
                .select('*').eq('user_id', memberId).in('activity_id', acts.map(a => a.id));
            participations = (data ?? []).filter(p => !p.is_interested)
                .map(p => ({ ...p, activity: actMap.get(p.activity_id) }));
        }

        // Step 2: Parallel data fetch
        const [{ data: memberTasks }, { data: pointsHistory }, { data: member }] = await Promise.all([
            supabase.from('member_tasks').select('*, task:tasks(*)').eq('member_id', memberId).eq('status', 'completed').gte('updated_at', startISO).lte('updated_at', endISO),
            supabase.from('points_history').select('points').eq('member_id', memberId).gte('created_at', startISO).lte('created_at', endISO).neq('source_type', 'jps'),
            supabase.from('profiles').select('cotisation_status, created_at, points').eq('id', memberId).single(),
        ]);
        const effectiveStart = (member?.created_at ?? startISO) > startISO ? member!.created_at : startISO;
        const [{ count: totalActivities }, { count: complaintsCount }] = await Promise.all([
            supabase.from('activities').select('*', { count: 'exact', head: true }).gte('activity_begin_date', effectiveStart).lte('activity_begin_date', cutoff),
            supabase.from('complaints').select('*', { count: 'exact', head: true }).eq('member_id', memberId).eq('status', 'resolved').gte('created_at', startISO).lte('created_at', endISO),
        ]);

        // Step 3: Compute scores
        let activityPoints = 0, meetingsPoints = 0, formationsPoints = 0, gaPoints = 0, eventsPoints = 0;
        participations.forEach(p => {
            const total = getActivityMultiplier(p) * ((p.rate ?? 3) * 0.1);
            activityPoints += total;
            switch (p.activity?.type) {
                case 'meeting':          meetingsPoints   += total; break;
                case 'formation':        formationsPoints += total; break;
                case 'general_assembly': gaPoints         += total; break;
                case 'event':            eventsPoints     += total; break;
            }
        });
        const taskPoints   = (memberTasks ?? []).reduce((sum, mt) => {
            const t = Array.isArray(mt.task) ? mt.task[0] : mt.task;
            return sum + getTaskMultiplier(t?.complexity ?? 'minor') * (mt.star_rating ?? 3);
        }, 0);
        const earnedPoints = (pointsHistory ?? []).reduce((s, r) => s + (r.points ?? 0), 0);
        const count        = totalActivities ?? 0;
        const actualRate   = count > 0 ? participations.length / count : 1;
        const participationRate   = Math.min(1, count < 3 ? Math.max(0.8, actualRate) : Math.max(0.1, actualRate));
        const feeMultiplier       = member?.cotisation_status?.every(Boolean) ? 1.1 : 1.0;
        const complaintsPenalty   = (complaintsCount ?? 0) * 25;
        const finalScore          = Math.max(0, (activityPoints + taskPoints + earnedPoints) * participationRate * feeMultiplier - complaintsPenalty);

        // Step 4: Historical metrics
        const { data: snaps } = await supabase.from('jps_snapshots').select('score, year, month, trimester')
            .eq('member_id', memberId).order('year', { ascending: false }).order('month', { ascending: false }).limit(6);

        return {
            score:    Math.round(finalScore),
            category: getJPSCategory(finalScore).name,
            details:  { activityPoints, meetingsPoints, formationsPoints, gaPoints, eventsPoints, taskPoints, earnedPoints, participationRate, actualParticipationRate: actualRate, complaintsPenalty, feeMultiplier },
            comparison: {
                mentorshipImpact:    await fetchMIS(memberId),
                consistencyIndex:    calculateMCI(snaps ?? []),
                contributionDensity: calculateCD(member?.points ?? 0, member?.created_at ?? new Date().toISOString()),
                engagementDiversity: calculateDoE(participations),
                momentum:            calculateMomentum(finalScore, snaps ?? []),
            },
        };
    },

    async refreshJPS(memberId: string, periodType: PeriodType = 'trimester'): Promise<JPSResult> {
        const result = await this.calculateJPS(memberId, periodType);
        await saveSnapshot(memberId, result);
        return result;
    },

    async refreshAllJPS(periodType: PeriodType = 'trimester'): Promise<void> {
        const { data: members, error } = await supabase.from('profiles').select('id, fullname');
        if (error || !members) throw new Error('Could not fetch members');
        const chunks = Array.from({ length: Math.ceil(members.length / 5) }, (_, i) => members.slice(i * 5, i * 5 + 5));
        for (const chunk of chunks) {
            await Promise.all(chunk.map(m => this.refreshJPS(m.id, periodType).catch(e => console.error(`JPS failed for ${m.fullname}:`, e))));
        }
    },

    async getTopMembersByPeriod(period: 'month' | 'trimester' | 'year' | 'all', year: number, value: number) {
        const { data: allMembers, error: mErr } = await supabase.from('profiles')
            .select('id, fullname, avatar_url, roles(name), leaderboard_privacy, poste:poste_id(id, name), estimated_volunteering_hours, cotisation_status');
        if (mErr) throw mErr;

        let query = supabase.from('jps_snapshots').select('score, category, month, year, trimester, member_id').eq('year', year);
        if (period === 'month')     query = query.eq('month', value).eq('trimester', Math.ceil(value / 3));
        if (period === 'trimester') query = query.eq('trimester', value);
        const { data: snaps, error: sErr } = await query;
        if (sErr) throw sErr;

        const snapshotMap = new Map<string, any>();
        (snaps ?? []).forEach(s => {
            const ex = snapshotMap.get(s.member_id);
            if (!ex || s.year > ex.year || (s.year === ex.year && (s.month ?? 0) > (ex.month ?? 0))) snapshotMap.set(s.member_id, s);
        });

        return (allMembers ?? [])
            .filter(m => !m.leaderboard_privacy)
            .map(m => {
                const snap = snapshotMap.get(m.id);
                return {
                    id: m.id, fullname: m.fullname, avatar_url: m.avatar_url,
                    role: (Array.isArray(m.roles) ? m.roles[0]?.name : m.roles?.name) ?? 'Member',
                    jps_score: snap?.score ?? 0, jps_category: snap?.category ?? 'Observer',
                    poste: m.poste, estimated_volunteering_hours: m.estimated_volunteering_hours, cotisation_status: m.cotisation_status,
                };
            })
            .sort((a, b) => b.jps_score - a.jps_score);
    },
};
