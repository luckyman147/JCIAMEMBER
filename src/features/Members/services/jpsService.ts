import supabase from "../../../utils/supabase";


export interface JPSResult {
    score: number;
    category: PerformanceCategory;
    details: {
        activityPoints: number;
        meetingsPoints: number;
        formationsPoints: number;
        gaPoints: number;
        eventsPoints: number;
        taskPoints: number;
        earnedPoints: number;
        participationRate: number; // For score multiplyer
        actualParticipationRate: number; // For real display
        complaintsPenalty: number;
        feeMultiplier: number;
    };
    comparison: {
        mentorshipImpact: number; // MIS
        consistencyIndex: number; // MCI
        contributionDensity: number; // CD
        engagementDiversity: number; // DoE
        momentum: number; // Growth
    };
}

export type PerformanceCategory = 
    | 'Observer' 
    | 'Active Citizen' 
    | 'Rising Leader' 
    | 'Impact Architect' 
    | 'Outstanding Leader';

export const JPS_CATEGORIES: { range: [number, number]; name: PerformanceCategory }[] = [
    { range: [0, 75], name: 'Observer' },
    { range: [76, 200], name: 'Active Citizen' },
    { range: [201, 400], name: 'Rising Leader' },
    { range: [401, 650], name: 'Impact Architect' },
    { range: [651, Infinity], name: 'Outstanding Leader' },
];

export const getJPSCategory = (score: number) => {
    const categoryName = JPS_CATEGORIES.find(c => score >= c.range[0] && score <= c.range[1])?.name || 'Observer';
    return {
        name: categoryName,
        ...getCategoryMetadata(categoryName)
    };
};

const getCategoryMetadata = (name: PerformanceCategory) => {
    switch (name) {
        case 'Outstanding Leader': return { color: 'text-purple-600', bg: 'bg-purple-100' };
        case 'Impact Architect': return { color: 'text-blue-600', bg: 'bg-blue-100' };
        case 'Rising Leader': return { color: 'text-green-600', bg: 'bg-green-100' };
        case 'Active Citizen': return { color: 'text-amber-600', bg: 'bg-amber-100' };
        default: return { color: 'text-gray-600', bg: 'bg-gray-100' };
    }
};

/**
 * Service to calculate JCI Performance Score (JPS)
 */
export const jpsService = {
    /**
     * Get period date range
     */
    getPeriodDates(periodType: 'month' | 'trimester' = 'trimester', date: Date = new Date()) {
        const month = date.getMonth();
        const year = date.getFullYear();
        let startDate: Date;
        let endDate: Date;

        if (periodType === 'month') {
             startDate = new Date(year, month, 1);
             endDate = new Date(year, month + 1, 0, 23, 59, 59);
        } else {
            let startMonth = 0;
            if (month >= 0 && month <= 2) startMonth = 0; // T1
            else if (month >= 3 && month <= 5) startMonth = 3; // T2
            else if (month >= 6 && month <= 8) startMonth = 6; // T3
            else startMonth = 9; // T4

            startDate = new Date(year, startMonth, 1);
            endDate = new Date(year, startMonth + 3, 0, 23, 59, 59);
        }
        
        return { startDate, endDate };
    },



    /**
     * Calculate JPS for a member in a specific period (month or trimester)
     */
    async calculateJPS(memberId: string, periodType: 'month' | 'trimester' = 'trimester', customDate?: Date): Promise<JPSResult> {
        const { startDate, endDate } = this.getPeriodDates(periodType, customDate);
        const startISO = startDate.toISOString();
        const endISO = endDate.toISOString();

        // 1. Fetch Participations (Using activity date, not registration date)
        const referenceDate = customDate || new Date();
        const calculationDateLimit = referenceDate < endDate ? referenceDate.toISOString() : endISO;

        const { data: participations } = await supabase
            .from('activity_participants')
            .select(`
                *,
                activity:activities!inner(
                    *,
                    formation:formations(*),
                    meeting:meetings(*),
                    ga:general_assemblies(*)
                )
            `)
            .eq('user_id', memberId)
            .gte('activity.activity_begin_date', startISO)
            .lte('activity.activity_begin_date', calculationDateLimit)
            .eq('is_interested', false);

        // 2. Fetch Tasks
        const { data: memberTasks } = await supabase
            .from('member_tasks')
            .select('*, task:tasks(*)')
            .eq('member_id', memberId)
            .eq('status', 'completed')
            .gte('updated_at', startISO)
            .lte('updated_at', endISO);

        // 3. Fetch Points Earned (History)
        const { data: pointsHistory } = await supabase
            .from('points_history')
            .select('points')
            .eq('member_id', memberId)
            .gte('created_at', startISO)
            .lte('created_at', endISO)
            .neq('source_type', 'jps'); 

        // 5. Fetch Total Activities for Participation Rate (Filtered by Induction Date)
        const { data: member } = await supabase
            .from('profiles')
            .select('cotisation_status, created_at, points')
            .eq('id', memberId)
            .single();

        const inductionDate = member?.created_at || startISO;
        const effectiveStartDate = inductionDate > startISO ? inductionDate : startISO;

        const { count: totalActivities } = await supabase
            .from('activities')
            .select('*', { count: 'exact', head: true })
            .gte('activity_begin_date', effectiveStartDate)
            .lte('activity_begin_date', calculationDateLimit);

        // 4. Fetch Resolved Complaints Only
        const { count: complaintsCount } = await supabase
            .from('complaints')
            .select('*', { count: 'exact', head: true })
            .eq('member_id', memberId)
            .eq('status', 'resolved')
            .gte('created_at', startISO)
            .lte('created_at', endISO);

        // --- CALCULATIONS ---

        // A. Activity Points Breakdown Σ(M × S)
        let activityPoints = 0;
        let meetingsPoints = 0;
        let formationsPoints = 0;
        let gaPoints = 0;
        let eventsPoints = 0;

        participations?.forEach(p => {
            const m = this.getActivityMultiplier(p);
            const s = (p.rate || 3) * 0.1; // Star rating (1-5) scaled to 0.1-0.5
            const total = m * s;
            
            activityPoints += total;
            
            const type = p.activity?.type;
            if (type === 'meeting') meetingsPoints += total;
            else if (type === 'formation') formationsPoints += total;
            else if (type === 'general_assembly') gaPoints += total;
            else if (type === 'event') eventsPoints += total;
        });

        // B. Task Points Σ(T × S)
        let taskPoints = 0;
        memberTasks?.forEach(mt => {
            const t = this.getTaskMultiplier(mt.task?.complexity || 'minor');
            const s = mt.star_rating || 3;
            taskPoints += (t * s);
        });

        // C. Earned Points
        const earnedPoints = pointsHistory?.reduce((acc, curr) => acc + (curr.points || 0), 0) || 0;

        // D. Participation Rate (P)
        const attendedCount = participations?.length || 0;
        const actualParticipationRate = totalActivities && totalActivities > 0 
            ? attendedCount / totalActivities 
            : 1;

        let participationRate = actualParticipationRate;
        
        if (totalActivities && totalActivities > 0 && totalActivities < 3) {
            // Leniency: If less than 3 activities in the period, don't punish below 80% for score
            participationRate = Math.max(0.8, actualParticipationRate);
        }
        participationRate = Math.min(1, participationRate);

        // E. Fee Multiplier
        const paidFull = member?.cotisation_status?.every((s: boolean) => s) || false;
        const feeMultiplier = paidFull ? 1.1 : 1.0;

        // F. Complaints Penalty
        const complaintsPenalty = (complaintsCount || 0) * 25;

        // --- FINAL FORMULA ---
        // JPS = ([Σ(M × S) + Σ(T × S) + Σ(PointsEarned)] × P × FeeMultiplier) - (C × 25)
        const rawScore = (activityPoints + taskPoints + earnedPoints) * participationRate * feeMultiplier;
        const finalScore = Math.max(0, rawScore - complaintsPenalty);

        // --- ADVANCED METRICS (NEW) ---
        
        // 1. Mentorship Impact (MIS)
        const mentorshipImpact = await this.calculateMIS(memberId);

        // 2. Consistency & Momentum (Historical)
        const { data: snapshots } = await supabase
            .from('jps_snapshots')
            .select('score, year, month, trimester')
            .eq('member_id', memberId)
            .order('year', { ascending: false })
            .order('month', { ascending: false })
            .limit(6);

        const consistencyIndex = this.calculateMCI(snapshots || []);
        const momentum = this.calculateMomentum(finalScore, snapshots || []);

        // 3. Contribution Density (CD)
        const contributionDensity = this.calculateCD(member?.points || 0, member?.created_at);

        // 4. Diversity of Engagement (DoE)
        const engagementDiversity = this.calculateDoE(participations || []);

        return {
            score: Math.round(finalScore),
            category: getJPSCategory(finalScore).name,
            details: {
                activityPoints,
                meetingsPoints,
                formationsPoints,
                gaPoints,
                eventsPoints,
                taskPoints,
                earnedPoints,
                participationRate,
                actualParticipationRate,
                complaintsPenalty,
                feeMultiplier
            },
            comparison: {
                mentorshipImpact,
                consistencyIndex,
                contributionDensity,
                engagementDiversity,
                momentum
            }
        };
    },

    getActivityMultiplier(p: any) {
        const activity = p.activity;
        const type = activity?.type;
        
        if (type === 'general_assembly') {
            // Check both nested join and potential property if already flattened
            const gaType = activity?.ga?.assembly_type || p.ga?.assembly_type;
            if (gaType === 'national' || gaType === 'international') return 12;
            if (gaType === 'zonal') return 9;
            return 6; // local
        }
        if (type === 'meeting') {
            const meetingType = activity?.meeting?.meeting_type || p.meeting?.meeting_type;
            if (meetingType === 'official') return 10;
            if (meetingType === 'committee') return 7;
            return 8; // Default meeting multiplier
        }
        if (type === 'formation') {
            const trType = activity?.formation?.training_type || p.formation?.training_type;
            if (trType === 'official_session') return 9;
            if (trType === 'important_training') return 7;
            if (trType === 'just_training') return 5;
            if (trType === 'member_to_member') return 4;
            return 5;
        }
        if (type === 'event') return 8;
        return 5;
    },

    getTaskMultiplier(complexity: string) {
        switch (complexity) {
            case 'lead': return 15;
            case 'major': return 10;
            case 'minor': return 4;
            default: return 4;
        }
    },


    /**
     * ADVANCED METRIC HELPERS
     */

    async calculateMIS(memberId: string): Promise<number> {
        const { data: advisees } = await supabase
            .from('profiles')
            .select('id')
            .eq('advisor_id', memberId);
        
        if (!advisees || advisees.length === 0) return 0;

        const { startDate } = this.getPeriodDates();
        
        const { data: adviseeSnapshots } = await supabase
            .from('jps_snapshots')
            .select('score')
            .in('member_id', advisees.map(a => a.id))
            .eq('year', startDate.getFullYear())
            .eq('trimester', Math.floor(startDate.getMonth() / 3) + 1);

        if (!adviseeSnapshots || adviseeSnapshots.length === 0) return 0;

        const avgJPS = adviseeSnapshots.reduce((acc, s) => acc + s.score, 0) / adviseeSnapshots.length;
        return Math.round(avgJPS);
    },

    calculateMCI(snapshots: any[]): number {
        if (snapshots.length < 2) return 100; // Perfect consistency for newcomers or if no history

        const scores = snapshots.map(s => s.score);
        const mean = scores.reduce((a, b) => a + b) / scores.length;
        if (mean === 0) return 0;

        const variance = scores.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / scores.length;
        const stdDev = Math.sqrt(variance);
        
        // CV = stdDev / Mean. Score = 100 * (1 - CV)
        const cv = stdDev / mean;
        return Math.max(0, Math.round(100 * (1 - cv)));
    },

    calculateMomentum(currentScore: number, snapshots: any[]): number {
        if (snapshots.length === 0) return 0;
        
        // Find the most recent snapshot that isn't from the current trimester calculation
        // Since refreshJPS might have already updated it, we look for previous trimester's avg or previous month
        const previousScore = snapshots[0]?.score || 0;
        if (previousScore === 0) return 0;

        const growth = ((currentScore - previousScore) / previousScore) * 100;
        return Math.round(growth);
    },

    calculateCD(totalPoints: number, createdAt: string): number {
        const joinDate = new Date(createdAt);
        const now = new Date();
        const months = Math.max(1, (now.getFullYear() - joinDate.getFullYear()) * 12 + (now.getMonth() - joinDate.getMonth()));
        
        return Math.round((totalPoints / months) * 10) / 10;
    },

    calculateDoE(participations: any[]): number {
        const typesParticipated = new Set(participations.map(p => p.activity?.type));
        const totalTypes = 4; // meeting, formation, event, general_assembly
        return Math.round((typesParticipated.size / totalTypes) * 100);
    },

    /**
     * Refresh JPS snapshot for a member
     */
    async refreshJPS(memberId: string, periodType: 'month' | 'trimester' = 'trimester'): Promise<JPSResult> {
        const result = await this.calculateJPS(memberId, periodType);
        
        const now = new Date();
        const year = now.getFullYear();
        
        let monthValue: number | null = null;
        let trimesterValue: number | null = null;

        // Store differently based on period type to avoid overwriting trimester data with partial month data
        // and to allow distinct retrieval
        if (periodType === 'month') {
            monthValue = now.getMonth() + 1;
            // When calculating for a specific month, we store it as a 'month' snapshot
            // We explicitely set trimester to null (or 0 if DB requires int) to distinguish it
        } else {
            trimesterValue = Math.floor(now.getMonth() / 3) + 1;
            // When calculating for a trimester, we store it as a 'trimester' snapshot
        }

        // We need to handle the upsert carefully. 
        // Ideally, the DB constraint should be (member_id, year, month, trimester) where nulls are significant.
        // Assuming the DB can handle multiple rows for the same year if one has month set and other has trimester set.
        
        const snapshotData: any = {
            member_id: memberId,
            score: result.score,
            category: result.category,
            year: year,
            details: result.details
        };

        if (periodType === 'month') {
             snapshotData.month = monthValue;
             snapshotData.trimester = null;
        } else {
             snapshotData.month = null;
             snapshotData.trimester = trimesterValue;
        }

        // We need to use specific onConflict strategies or just rely on the ID if we had one.
        // Since we likely have a unique constraint, we rely on supabase's upsert matching.
        // Note: For this to work perfectly, the DB constraint must align. 
        // If the current constraint is (member_id, trimester, month, year), it might fail if nulls aren't unique index compatible in strict ways, 
        // but typically (id, year, month, null) != (id, year, null, tri).
        
        // However, if the constraint enforces all 4 columns, we just pass what we have.
        // If the DB forces non-null, we might need to use 0 for "not applicable".
        // Let's assume standard nullable columns or we might need to check schema. 
        // Reverting to previous explicit upsert but with conditional fields:

        await supabase
            .from('jps_snapshots')
            .upsert(snapshotData, { 
                onConflict: 'member_id, year, month, trimester',
                ignoreDuplicates: false 
            });

        return result;
    },

    /**
     * Refresh JPS for all members
     */
    async refreshAllJPS(periodType: 'month' | 'trimester' = 'trimester') {
        // Fetch ALL members including their full names for logging/verification if needed
        const { data: members, error } = await supabase.from('profiles').select('id, fullname');
        if (error || !members) {
            console.error("Failed to fetch all members for JPS refresh:", error);
            throw new Error("Could not fetch members list");
        }
        
        console.log(`Refreshing JPS (${periodType}) for ${members.length} members...`);
        
        // Use Promise.all with chunks of 5 to avoid overloading but stay fast
        const chunkSize = 5;
        for (let i = 0; i < members.length; i += chunkSize) {
            const chunk = members.slice(i, i + chunkSize);
            await Promise.all(chunk.map(m => this.refreshJPS(m.id, periodType).catch(err => {
                console.error(`Failed to refresh JPS for ${m.fullname}:`, err);
            })));
        }
        
        console.log("JPS Refresh completed for all members.");
    },

    async getTopMembersByPeriod(period: 'month' | 'trimester' | 'year' | 'all', year: number, value: number) {
        // 1. Fetch all members first
        const { data: allMembers, error: membersError } = await supabase
            .from('profiles')
            .select(`
                id, 
                fullname, 
                avatar_url, 
                roles(name), 
                leaderboard_privacy, 
                poste:poste_id(id, name),
                estimated_volunteering_hours,
                cotisation_status
            `);

        if (membersError) {
             console.error("Supabase Members Fetch Error:", membersError);
             throw membersError;
        }

        // 2. Fetch Snapshots
        let query = supabase
            .from('jps_snapshots')
            .select(`
                score,
                category,
                month,
                year,
                trimester,
                member_id
            `)
            .eq('year', year);

        if (period === 'month') {
            query = query.eq('month', value).is('trimester', null);
        } else if (period === 'trimester') {
            query = query.eq('trimester', value).is('month', null);
        }

        const { data: snapshots, error } = await query;

        if (error) {
            console.error("Supabase JPS Query Error:", error);
            throw error;
        }

        // 3. Map snapshots to member IDs for checking
        // Deduplicate: If multiple snapshots match (e.g. for 'year' or 'all'), take the latest one per member
        const snapshotMap = new Map<string, any>();
        
        snapshots?.forEach((s: any) => {
             const existing = snapshotMap.get(s.member_id);
             if (!existing) {
                 snapshotMap.set(s.member_id, s);
             } else {
                 if (s.year > existing.year || (s.year === existing.year && s.month > existing.month)) {
                     snapshotMap.set(s.member_id, s);
                 }
             }
        });

        // 4. Combine and Sort
        return allMembers
            .filter((m: any) => m.leaderboard_privacy !== true) // Filter out private members
            .map((m: any) => {
                const snapshot = snapshotMap.get(m.id);
                return {
                    id: m.id,
                    fullname: m.fullname,
                    avatar_url: m.avatar_url,
                    role: (Array.isArray(m.roles) ? m.roles[0]?.name : m.roles?.name) || 'Member',
                    jps_score: snapshot?.score || 0,
                    jps_category: snapshot?.category || 'Observer',
                    poste: m.poste,
                    estimated_volunteering_hours: m.estimated_volunteering_hours,
                    cotisation_status: m.cotisation_status
                };
            })
            .sort((a, b) => b.jps_score - a.jps_score);
    }
};
