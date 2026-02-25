export interface JPSDetails {
    activityPoints:          number;
    meetingsPoints:          number;
    formationsPoints:        number;
    gaPoints:                number;
    eventsPoints:            number;
    taskPoints:              number;
    earnedPoints:            number;
    participationRate:       number; // Score multiplier (may be boosted for leniency)
    actualParticipationRate: number; // Raw rate for display
    complaintsPenalty:       number;
    feeMultiplier:           number;
}

export interface JPSComparison {
    mentorshipImpact:    number; // MIS
    consistencyIndex:    number; // MCI
    contributionDensity: number; // CD
    engagementDiversity: number; // DoE
    momentum:            number; // Growth %
}

export interface JPSResult {
    score:      number;
    category:   PerformanceCategory;
    details:    JPSDetails;
    comparison: JPSComparison;
}

export type PerformanceCategory =
    | 'Observer'
    | 'Active Citizen'
    | 'Rising Leader'
    | 'Impact Architect'
    | 'Outstanding Leader';

type CategoryMeta = { color: string; bg: string };

const CATEGORY_META: Record<PerformanceCategory, CategoryMeta> = {
    'Outstanding Leader': { color: 'text-purple-600', bg: 'bg-purple-100' },
    'Impact Architect':   { color: 'text-blue-600',   bg: 'bg-blue-100'   },
    'Rising Leader':      { color: 'text-green-600',  bg: 'bg-green-100'  },
    'Active Citizen':     { color: 'text-amber-600',  bg: 'bg-amber-100'  },
    'Observer':           { color: 'text-gray-600',   bg: 'bg-gray-100'   },
};

export const JPS_CATEGORIES: { range: [number, number]; name: PerformanceCategory }[] = [
    { range: [0,    75        ], name: 'Observer'           },
    { range: [76,   200       ], name: 'Active Citizen'     },
    { range: [201,  400       ], name: 'Rising Leader'      },
    { range: [401,  650       ], name: 'Impact Architect'   },
    { range: [651,  Infinity  ], name: 'Outstanding Leader' },
];

export const getJPSCategory = (score: number) => {
    const name = JPS_CATEGORIES.find(c => score >= c.range[0] && score <= c.range[1])?.name ?? 'Observer';
    return { name, ...CATEGORY_META[name] };
};
