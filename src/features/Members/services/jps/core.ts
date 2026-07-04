
import supabase from '../../../../utils/supabase';
import { getJPSCategory, type JPSResult, type JPSPeriodScore, type JPSPeriodScores } from './types';
import {
    getPeriodDates, getTrimester,
    getTaskMultiplier,
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

    const payload = { score: result.score, category: result.category, details: result.details, updated_at: now.toISOString() };
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
            .select('id, type, activity_points')
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
        const [{ count: totalActivities }, { count: complaintsCount }, { data: committeeMemberships }] = await Promise.all([
            supabase.from('activities').select('*', { count: 'exact', head: true }).gte('activity_begin_date', effectiveStart).lte('activity_begin_date', cutoff),
            supabase.from('complaints').select('*', { count: 'exact', head: true }).eq('member_id', memberId).eq('status', 'resolved').gte('created_at', startISO).lte('created_at', endISO),
            supabase.from('team_members').select('team_id, role, team:teams!inner(activity_id)').eq('member_id', memberId).not('team.activity_id', 'is', null),
        ]);

        // Step 3: Compute scores
        let activityPoints = 0, meetingsPoints = 0, formationsPoints = 0, gaPoints = 0, eventsPoints = 0;
        participations.forEach(p => {
            const total = p.activity?.activity_points ?? 0; // presence × the activity's own configured points
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
        const committeeCount      = new Set((committeeMemberships ?? []).map(m => m.team_id)).size;
        const committeeIsChef     = (committeeMemberships ?? []).some(m => m.role === 'lead');
        const committeeFactor     = committeeCount * (committeeIsChef ? 1.5 : 1);
        const finalScore          = Math.max(0, (activityPoints + taskPoints + earnedPoints + committeeFactor) * participationRate * feeMultiplier - complaintsPenalty);

        // Step 4: Historical metrics
        const { data: snaps } = await supabase.from('jps_snapshots').select('score, year, month, trimester')
            .eq('member_id', memberId).order('year', { ascending: false }).order('month', { ascending: false }).limit(6);

        return {
            score:    Math.round(finalScore),
            category: getJPSCategory(finalScore).name,
            details:  { activityPoints, meetingsPoints, formationsPoints, gaPoints, eventsPoints, taskPoints, earnedPoints, participationRate, actualParticipationRate: actualRate, complaintsPenalty, feeMultiplier, committeeCount, committeeIsChef, committeeFactor },
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
            .select('id, fullname, avatar_url, roles(name), leaderboard_privacy, poste:poste_id(id, name), estimated_volunteering_hours, cotisation_status, created_at, advisor_id');
        if (mErr) throw mErr;

        // Advisors = anyone at least one other member has picked as their advisor.
        // New Members = joined within the last 6 months and not already an advisor.
        // Everyone else = Members. (Assumption on the 6-month window — easy to adjust.)
        const advisorIds = new Set((allMembers ?? []).map(m => m.advisor_id).filter(Boolean));
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

        const getRoleGroup = (m: { id: string; created_at?: string }): 'advisor' | 'new' | 'member' => {
            if (advisorIds.has(m.id)) return 'advisor';
            if (m.created_at && new Date(m.created_at) >= sixMonthsAgo) return 'new';
            return 'member';
        };

        const buildResult = (snapshotMap: Map<string, any>) => (allMembers ?? [])
            .filter(m => !m.leaderboard_privacy)
            .map(m => {
                const snap = snapshotMap.get(m.id);
                return {
                    id: m.id, fullname: m.fullname, avatar_url: m.avatar_url,
                    role: (m.roles as { name: string }[])?.[0]?.name ?? 'Member',
                    roleGroup: getRoleGroup(m),
                    jps_score: snap?.score ?? 0, jps_category: snap?.category ?? 'Observer', jps_updated_at: snap?.updated_at ?? null,
                    poste: m.poste, estimated_volunteering_hours: m.estimated_volunteering_hours, cotisation_status: m.cotisation_status,
                };
            })
            .sort((a, b) => b.jps_score - a.jps_score);

        // Year and All read the dedicated annual aggregate (Jan 1 -> today), a real
        // cumulative score — not just whichever trimester snapshot happens to exist.
        if (period === 'year' || period === 'all') {
            const { data: yearSnaps, error: yErr } = await supabase.from('jps_year_snapshots')
                .select('score, category, member_id, updated_at').eq('year', year);
            if (yErr) throw yErr;
            const snapshotMap = new Map((yearSnaps ?? []).map(s => [s.member_id, s]));
            return buildResult(snapshotMap);
        }

        // Month reads the dedicated calendar-month table — genuinely month-scoped,
        // not the trimester-window score that jps_snapshots stores.
        if (period === 'month') {
            const { data: monthSnaps, error: monErr } = await supabase.from('jps_month_snapshots')
                .select('score, category, member_id, updated_at').eq('year', year).eq('month', value);
            if (monErr) throw monErr;
            const snapshotMap = new Map((monthSnaps ?? []).map(s => [s.member_id, s]));
            return buildResult(snapshotMap);
        }

        // Trimester: jps_snapshots is trimester-scoped despite its `month` column
        // (see 20250704010000_jps_realtime_triggers.sql) — pick the latest month's row within it.
        const { data: snaps, error: sErr } = await supabase.from('jps_snapshots')
            .select('score, category, month, year, trimester, member_id, updated_at').eq('year', year).eq('trimester', value);
        if (sErr) throw sErr;

        const snapshotMap = new Map<string, any>();
        (snaps ?? []).forEach(s => {
            const ex = snapshotMap.get(s.member_id);
            if (!ex || s.year > ex.year || (s.year === ex.year && (s.month ?? 0) > (ex.month ?? 0))) snapshotMap.set(s.member_id, s);
        });

        return buildResult(snapshotMap);
    },

    // Reads the three live, trigger-maintained scores for one member directly
    // from the DB (month/trimester/year), instead of recomputing client-side.
    async getMemberPeriodScores(memberId: string): Promise<JPSPeriodScores> {
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth() + 1;
        const trimester = getTrimester(now);

        const empty: JPSPeriodScore = { score: 0, category: 'Observer', details: null, updatedAt: null };
        const toResult = (row: any): JPSPeriodScore =>
            row ? { score: row.score, category: row.category, details: row.details ?? null, updatedAt: row.updated_at ?? null } : empty;

        const [{ data: monthRow }, { data: trimesterRow }, { data: yearRow }] = await Promise.all([
            supabase.from('jps_month_snapshots').select('score, category, details, updated_at')
                .eq('member_id', memberId).eq('year', year).eq('month', month).maybeSingle(),
            supabase.from('jps_snapshots').select('score, category, details, updated_at')
                .eq('member_id', memberId).eq('year', year).eq('month', month).eq('trimester', trimester).maybeSingle(),
            supabase.from('jps_year_snapshots').select('score, category, details, updated_at')
                .eq('member_id', memberId).eq('year', year).maybeSingle(),
        ]);

        return { month: toResult(monthRow), trimester: toResult(trimesterRow), year: toResult(yearRow) };
    },
};
