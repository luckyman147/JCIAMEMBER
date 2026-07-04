export type PeriodType = 'month' | 'trimester';

// ─── Period ───────────────────────────────────────────────────────────────────

export function getTrimester(date: Date = new Date()): number {
    return Math.floor(date.getMonth() / 3) + 1;
}

export function getPeriodDates(periodType: PeriodType = 'trimester', date: Date = new Date()) {
    const m = date.getMonth(), y = date.getFullYear();
    if (periodType === 'month') return {
        startDate: new Date(y, m, 1),
        endDate:   new Date(y, m + 1, 0, 23, 59, 59),
    };
    const startMonth = Math.floor(m / 3) * 3;
    return {
        startDate: new Date(y, startMonth, 1),
        endDate:   new Date(y, startMonth + 3, 0, 23, 59, 59),
    };
}

export function getTaskMultiplier(complexity: string): number {
    return ({ lead: 15, major: 10, minor: 4 } as Record<string, number>)[complexity] ?? 4;
}

// ─── Advanced Metrics ─────────────────────────────────────────────────────────

export function calculateMCI(snapshots: { score: number }[]): number {
    if (snapshots.length < 2) return 100;
    const scores = snapshots.map(s => s.score);
    const mean   = scores.reduce((a, b) => a + b, 0) / scores.length;
    if (mean === 0) return 0;
    const variance = scores.reduce((sum, s) => sum + (s - mean) ** 2, 0) / scores.length;
    return Math.max(0, Math.round(100 * (1 - Math.sqrt(variance) / mean)));
}

export function calculateMomentum(current: number, snapshots: { score: number }[]): number {
    const prev = snapshots[0]?.score ?? 0;
    return prev ? Math.round(((current - prev) / prev) * 100) : 0;
}

export function calculateCD(totalPoints: number, createdAt: string): number {
    const joined = new Date(createdAt), now = new Date();
    const months = Math.max(1, (now.getFullYear() - joined.getFullYear()) * 12 + now.getMonth() - joined.getMonth());
    return Math.round((totalPoints / months) * 10) / 10;
}

export function calculateDoE(participations: any[]): number {
    const types = new Set(participations.map(p => p.activity?.type));
    return Math.round((types.size / 4) * 100);
}
