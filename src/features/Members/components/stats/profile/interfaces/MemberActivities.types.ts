import type { Activity } from '../../../../../Activities/models/Activity';

export interface MemberActivitiesProps {
  memberId: string;
}

export interface ActivityHistoryItem {
  activity: Activity;
  status: 'attended' | 'missed' | 'recommended';
  participation?: {
    id: string;
    rate: number | null;
    notes: string | null;
    registered_at: string;
  };
}

export interface ServiceParticipation {
  id: string;
  rate: number | null;
  notes: string | null;
  registered_at: string;
  activity: { id: string } | null;
}

export type ActivityTab = 'attended' | 'absent' | 'future';
export type TimeRange = 'month' | 'trimester' | 'year' | 'custom';

export interface ChartData {
  label: string;
  count: number;
}
