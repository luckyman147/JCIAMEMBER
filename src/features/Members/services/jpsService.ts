import supabase from "../../../utils/supabase";


export interface JPSResult {
    score: number;
    category: PerformanceCategory;
    details: {
        activityPoints: number;
        taskPoints: number;
        earnedPoints: number;
        participationRate: number; // For score multiplyer
        actualParticipationRate: number; // For real display
        complaintsPenalty: number;
        rankBonus: number;
        feeMultiplier: number;
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
     * Get trimester date range
     */
    getTrimesterDates(date: Date = new Date()) {
        const month = date.getMonth();
        const year = date.getFullYear();
        let startMonth = 0;
        
        if (month >= 0 && month <= 2) startMonth = 0; // T1
        else if (month >= 3 && month <= 5) startMonth = 3; // T2
        else if (month >= 6 && month <= 8) startMonth = 6; // T3
        else startMonth = 9; // T4

        const startDate = new Date(year, startMonth, 1);
        const endDate = new Date(year, startMonth + 3, 0, 23, 59, 59);
        
        return { startDate, endDate };
    },

    /**
     * Calculate JPS for a member in a specific trimester
     */
    async calculateJPS(memberId: string, customDate?: Date): Promise<JPSResult> {
        const { startDate, endDate } = this.getTrimesterDates(customDate);
        const startISO = startDate.toISOString();
        const endISO = endDate.toISOString();

        // 1. Fetch Participations (Using activity date, not registration date)
        const referenceDate = customDate || new Date();
        const calculationDateLimit = referenceDate < endDate ? referenceDate.toISOString() : endISO;

        const { data: participations } = await supabase
            .from('activity_participants')
            .select('*, activity:activities!inner(*), formation:formations(*), meeting:meetings(*), ga:general_assemblies(*)')
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
            .select('cotisation_status, created_at')
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

        // A. Activity Points Σ(M × S)
        let activityPoints = 0;
        participations?.forEach(p => {
            const m = this.getActivityMultiplier(p);
            const s = p.rate || 3; // Default to 3 stars if not rated
            activityPoints += (m * s);
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

        // G. Rank Bonus
        const rankBonus = await this.calculateRankBonus(memberId, startISO, endISO);

        // --- FINAL FORMULA ---
        // JPS = ([Σ(M × S) + Σ(T × S) + Σ(PointsEarned)] × P × FeeMultiplier) - (C × 25) + RankBonus
        const rawScore = (activityPoints + taskPoints + earnedPoints) * participationRate * feeMultiplier;
        const finalScore = Math.max(0, rawScore - complaintsPenalty + rankBonus);

        return {
            score: Math.round(finalScore),
            category: getJPSCategory(finalScore).name,
            details: {
                activityPoints,
                taskPoints,
                earnedPoints,
                participationRate,
                actualParticipationRate,
                complaintsPenalty,
                rankBonus,
                feeMultiplier
            }
        };
    },

    getActivityMultiplier(p: any) {
        const type = p.activity?.type;
        if (type === 'general_assembly') {
            const gaType = p.ga?.assembly_type;
            if (gaType === 'national' || gaType === 'international') return 12;
            if (gaType === 'zonal') return 9;
            return 6; // local
        }
        if (type === 'meeting') {
            return 10;
        }
        if (type === 'formation') {
            const trType = p.formation?.training_type;
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

    async calculateRankBonus(memberId: string, start: string, end: string): Promise<number> {
        // This is expensive if many members, but for JCI local it's fine.
        // We sum points from points_history for all members in the period
        const { data: allHistory } = await supabase
            .from('points_history')
            .select('member_id, points')
            .gte('created_at', start)
            .lte('created_at', end);

        if (!allHistory) return 0;

        const memberPointsMap: Record<string, number> = {};
        allHistory.forEach(h => {
            memberPointsMap[h.member_id] = (memberPointsMap[h.member_id] || 0) + h.points;
        });

        const sortedMemberIds = Object.keys(memberPointsMap).sort((a, b) => memberPointsMap[b] - memberPointsMap[a]);
        const rank = sortedMemberIds.indexOf(memberId) + 1;

        if (rank === 0) return 0;
        if (rank === 1) return 50;
        if (rank <= 5) return 30;
        if (rank <= 10) return 10;
        return 0;
    },

    /**
     * Refresh JPS snapshot for a member
     */
    async refreshJPS(memberId: string): Promise<JPSResult> {
        const result = await this.calculateJPS(memberId);
        const { startDate } = this.getTrimesterDates();
        
        await supabase
            .from('jps_snapshots')
            .upsert({
                member_id: memberId,
                score: result.score,
                category: result.category,
                trimester: Math.floor(startDate.getMonth() / 3) + 1,
                month: new Date().getMonth() + 1,
                year: startDate.getFullYear(),
                details: result.details
            }, { onConflict: 'member_id, trimester, month, year' });

        return result;
    },

    /**
     * Refresh JPS for all members
     */
    async refreshAllJPS() {
        // Fetch ALL members including their full names for logging/verification if needed
        const { data: members, error } = await supabase.from('profiles').select('id, fullname');
        if (error || !members) {
            console.error("Failed to fetch all members for JPS refresh:", error);
            throw new Error("Could not fetch members list");
        }
        
        console.log(`Refreshing JPS for ${members.length} members...`);
        
        // Use Promise.all with chunks of 5 to avoid overloading but stay fast
        const chunkSize = 5;
        for (let i = 0; i < members.length; i += chunkSize) {
            const chunk = members.slice(i, i + chunkSize);
            await Promise.all(chunk.map(m => this.refreshJPS(m.id).catch(err => {
                console.error(`Failed to refresh JPS for ${m.fullname}:`, err);
            })));
        }
        
        console.log("JPS Refresh completed for all members.");
    },

    async getTopMembersByPeriod(period: 'month' | 'trimester' | 'year' | 'all', year: number, value: number) {
        let query = supabase
            .from('jps_snapshots')
            .select(`
                score,
                category,
                month,
                year,
                trimester,
                member:profiles!member_id(
                    id, 
                    fullname, 
                    avatar_url, 
                    roles(name), 
                    leaderboard_privacy, 
                    poste:poste_id(id, name),
                    estimated_volunteering_hours,
                    cotisation_status
                )
            `)
            .eq('year', year);

        if (period === 'month') {
            query = query.eq('month', value);
        } else if (period === 'trimester') {
            query = query.eq('trimester', value);
        }

        const { data, error } = await query.order('score', { ascending: false });

        if (error) {
            console.error("Supabase JPS Query Error:", error);
            throw error;
        }

        // Deduplicate: If multiple snapshots match (e.g. for 'year' or 'all'), take the latest one per member
        const latestPerMember = new Map<string, any>();
        
        data.forEach((s: any) => {
            if (!s.member) return; // Skip if relationship failed
            if (s.member.leaderboard_privacy === true) return; // Explicitly hidden

            const existing = latestPerMember.get(s.member.id);
            if (!existing) {
                latestPerMember.set(s.member.id, s);
            } else {
                // Determine which is later
                if (s.year > existing.year || (s.year === existing.year && s.month > existing.month)) {
                    latestPerMember.set(s.member.id, s);
                }
            }
        });

        // Map and sort values
        return Array.from(latestPerMember.values())
            .map((s: any) => ({
                id: s.member.id,
                fullname: s.member.fullname,
                avatar_url: s.member.avatar_url,
                role: (Array.isArray(s.member.roles) ? s.member.roles[0]?.name : s.member.roles?.name) || 'Member',
                jps_score: s.score,
                jps_category: s.category,
                poste: s.member.poste,
                estimated_volunteering_hours: s.member.estimated_volunteering_hours,
                cotisation_status: s.member.cotisation_status
            }))
            .sort((a, b) => b.jps_score - a.jps_score);
    }
};
