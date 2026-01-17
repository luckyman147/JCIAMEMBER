import { useState, useEffect, useCallback } from 'react';
import supabase from '../../../../../../utils/supabase';
import { getMemberById } from '../../../../services/members.service';
import { activityService } from '../../../../../Activities/services/activityService';
import type { Activity } from '../../../../../Activities/models/Activity';
import type { ActivityHistoryItem, ServiceParticipation } from '../interfaces/MemberActivities.types';
import { useTranslation } from 'react-i18next';

export const useMemberActivities = (memberId: string) => {
  const { t } = useTranslation();
  const [historyItems, setHistoryItems] = useState<ActivityHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [memberJoinDate, setMemberJoinDate] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      
      const member = await getMemberById(memberId);
      if (!member) {
        setError(t('profile.memberNotFound'));
        setLoading(false);
        return;
      }

      const joinDate = member.created_at || new Date().toISOString();
      setMemberJoinDate(joinDate);
      
      const { data: memberCategoriesData } = await activityService.getMembers().then(() => 
        supabase.from('profile_categories').select('category_id').eq('profile_id', memberId)
      );
      const preferredCategoryIds = memberCategoriesData?.map(c => c.category_id) || [];

      const { data: allActivities, error: actError } = await supabase
          .from('activities')
          .select('*, activity_participants(count)')
          .gte('activity_begin_date', joinDate)
          .order('activity_begin_date', { ascending: false });

      if (actError) throw actError;

      const { data: allCategoryLinks } = await supabase
          .from('activity_categories')
          .select('activity_id, category_id');

      const activityCatMap = new Map<string, number[]>();
      (allCategoryLinks || []).forEach(link => {
          const list = activityCatMap.get(link.activity_id) || [];
          list.push(link.category_id);
          activityCatMap.set(link.activity_id, list);
      });

      const myParticipations = await activityService.getMemberParticipations(memberId);
      
      const participationMap = new Map<string, ServiceParticipation>();
      (myParticipations as unknown as ServiceParticipation[]).forEach(p => {
        if (p.activity?.id) {
          participationMap.set(p.activity.id, p);
        }
      });

      const now = new Date();
      const itemsMap = new Map<string, ActivityHistoryItem>();

      (myParticipations as unknown as ServiceParticipation[]).forEach(p => {
          if (p.activity) {
              itemsMap.set(p.activity.id, {
                  activity: p.activity as Activity,
                  status: 'attended',
                  participation: {
                      id: p.id,
                      rate: p.rate,
                      notes: p.notes,
                      registered_at: p.registered_at,
                      is_interested: p.is_interested
                  }
              });
          }
      });

      (allActivities || []).forEach(activity => {
          if (!itemsMap.has(activity.id)) {
              const activityDate = new Date(activity.activity_begin_date);
              const hasStarted = activityDate < now;
              const activityCatIds = activityCatMap.get(activity.id) || [];
              
              if (hasStarted) {
                  itemsMap.set(activity.id, {
                      activity: activity as Activity,
                      status: 'missed'
                  });
              } else {
                  const isRecommended = activityCatIds.some((id: number) => preferredCategoryIds.includes(id));
                  itemsMap.set(activity.id, {
                      activity: activity as Activity,
                      status: isRecommended ? 'recommended' : 'missed' 
                  });
              }
          }
      });

      const mergedItems = Array.from(itemsMap.values()).sort((a, b) => 
          new Date(b.activity.activity_begin_date).getTime() - new Date(a.activity.activity_begin_date).getTime()
      );
      
      setHistoryItems(mergedItems);
      setError(null);
    } catch (err: any) {
      console.error("Failed to load activity history", err);
      setError(t('profile.failedLoadHistory'));
    } finally {
      setLoading(false);
    }
  }, [memberId, t]);

  useEffect(() => {
    if (memberId) {
      fetchData();
    }
  }, [memberId, fetchData]);


  const attendedItems = historyItems.filter(i => i.status === 'attended');
  const absentItems = historyItems.filter(i => i.status === 'missed' && new Date(i.activity.activity_begin_date) < new Date());
  const futureItems = historyItems.filter(i => !i.participation && new Date(i.activity.activity_begin_date) >= new Date());

  const attendedCount = attendedItems.length;
  const missedCount = absentItems.length;
  const futureCount = futureItems.length;

  // Refined Presence Rate calculation: (Attended Past Since Join) / (Total Past Since Join)
  const presenceRate = (() => {
    if (!memberJoinDate || historyItems.length === 0) return 0;
    const jd = new Date(memberJoinDate);
    const now = new Date();

    const pastAttendedSinceJoin = historyItems.filter(i => 
      i.status === 'attended' && 
      new Date(i.activity.activity_begin_date) < now &&
      new Date(i.activity.activity_begin_date) >= jd
    ).length;

    const pastMissedSinceJoin = historyItems.filter(i => 
      i.status === 'missed' && 
      new Date(i.activity.activity_begin_date) < now
      // Note: 'missed' status items from allActivities are already >= joinDate
    ).length;

    const totalSinceJoin = pastAttendedSinceJoin + pastMissedSinceJoin;
    return totalSinceJoin > 0 ? Math.round((pastAttendedSinceJoin / totalSinceJoin) * 100) : 0;
  })();

  return {
    historyItems,
    loading,
    error,
    attendedItems,
    absentItems,
    futureItems,
    attendedCount,
    missedCount,
    futureCount,
    presenceRate
  };
};

