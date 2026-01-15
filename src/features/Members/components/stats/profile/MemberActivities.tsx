import React, { useState } from 'react';
import { Calendar, PieChart } from 'lucide-react';
import { useTranslation } from "react-i18next";
import { useMemberActivities } from './hooks/useMemberActivities';
import type { MemberActivitiesProps, ActivityTab } from './interfaces/MemberActivities.types';

// Sub-components
import TabButton from './components/TabButton';
import EmptyState from './components/EmptyState';
import ActivityCard from './components/ActivityCard';
import PresenceHistoryChart from './components/PresenceHistoryChart';
import ImpactLineChart from './components/ImpactLineChart';
import ActivityLoadingSkeleton from './components/ActivityLoadingSkeleton';

const MemberActivities: React.FC<MemberActivitiesProps> = ({ memberId }) => {
  const { t } = useTranslation();
  const {
    loading,
    error,
    attendedItems,
    absentItems,
    futureItems,
    attendedCount,
    missedCount,
    futureCount,
    presenceRate,
    historyItems
  } = useMemberActivities(memberId);

  const [activeTab, setActiveTab] = useState<ActivityTab>('attended');
  const [showCharts, setShowCharts] = useState(true);

  const filteredItems = 
    activeTab === 'attended' ? attendedItems : 
    activeTab === 'absent' ? absentItems : 
    futureItems;

  if (loading) return <ActivityLoadingSkeleton />;
  if (error) return <div className="p-4 text-red-500 bg-red-50 dark:bg-red-900/20 rounded-lg text-center">{error}</div>;

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-100 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-start">
          <Calendar className="w-5 h-5 text-blue-500" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{t('profile.activityHistory')}</h3>
        </div>
        
        <div className="flex items-center gap-2">
           <button
            onClick={() => setShowCharts(!showCharts)}
            className={`p-1.5 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors ${showCharts ? 'bg-blue-50 text-blue-600' : 'text-gray-500 hover:bg-gray-50'}`}
          >
            <PieChart className="w-4 h-4" />
            {showCharts ? t('profile.hideStats') : t('profile.showStats')}
          </button>
          <div className="flex p-1 bg-gray-100 dark:bg-slate-700/50 rounded-lg">
            <TabButton active={activeTab === 'attended'} onClick={() => setActiveTab('attended')} label={t('profile.attendedCount', { count: attendedCount || 0 })} />
            <TabButton active={activeTab === 'absent'} onClick={() => setActiveTab('absent')} label={t('profile.absentCount', { count: missedCount || 0 })} />
            <TabButton active={activeTab === 'future'} onClick={() => setActiveTab('future')} label={t('profile.futureCount', { count: futureCount || 0 })} />
          </div>
        </div>
      </div>

      {/* Analytics Summary */}
      <div className="p-4 bg-slate-50 dark:bg-slate-900/40 border-b border-gray-100 dark:border-slate-700">
         <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 text-start">
            <div>
                <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-1">{t('profile.attendanceAnalytics')}</h4>
                <p className="text-xs text-gray-500 dark:text-slate-400">{t('profile.trackInvolvement')}</p>
            </div>
            <div className="flex items-center gap-2">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest hidden sm:block">{t('profile.totalRate')}</span>
                <div className="px-3 py-1 bg-(--color-myPrimary) dark:bg-blue-900/30 text-white dark:text-blue-300 rounded-full text-xs font-black">
                    {t('profile.presenceRate', { percent: presenceRate || 0 })}
                </div>
            </div>
         </div>
      </div>

       {/* Charts Section */}
       {showCharts && historyItems.length > 0 && (
         <div className="p-4 border-b border-gray-100 dark:border-slate-700 bg-white dark:bg-slate-800">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-gray-50 dark:bg-slate-900/50 p-5 rounded-2xl border border-gray-100 dark:border-slate-800">
                    <PresenceHistoryChart items={historyItems} />
                </div>
                <div className="bg-gray-50 dark:bg-slate-900/50 p-5 rounded-2xl border border-gray-100 dark:border-slate-800">
                    <ImpactLineChart items={historyItems} />
                </div>
            </div>
         </div>
      )}

      {/* Activities List */}
      <div className="divide-y divide-gray-100 dark:divide-slate-700 max-h-[600px] overflow-y-auto">
        {filteredItems.length === 0 ? (
          <EmptyState />
        ) : (
          filteredItems.map((item) => (
            <ActivityCard 
              key={item.activity.id} 
              item={item} 
            />
          ))
        )}
      </div>
    </div>
  );
};

export default MemberActivities;
