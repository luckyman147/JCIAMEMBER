import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Users } from 'lucide-react';
import { participationService } from '../../../../Activities/services/participationService';

export default function MostAttendedChart() {
  const { t } = useTranslation();
  const [data, setData] = useState<{ member_id: string; fullname: string; avatar_url?: string | null; count: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    participationService.getTopAttendedMembers(3)
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, []);

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-6 flex items-center justify-center h-[200px]">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" />
      </div>
    )
  }

  if (data.length === 0) return null;

  const maxCount = Math.max(...data.map(d => d.count));

  return (
    <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 mb-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-blue-50 rounded-xl border border-blue-100">
          <Users className="w-5 h-5 text-blue-500" />
        </div>
        <h3 className="text-lg font-bold text-gray-900">
          {t('members.mostAttended', 'Most Attended')}
        </h3>
      </div>

      <div className="h-[200px] w-full flex items-end justify-center gap-4 sm:gap-8 px-4 pb-2">
        {data.map((member, index) => {
          const heightPercent = Math.max((member.count / maxCount) * 100, 4);
          const colors = [
            { bg: 'from-blue-500 to-blue-600', shadow: 'shadow-blue-200', badge: 'bg-blue-500' },
            { bg: 'from-emerald-500 to-emerald-600', shadow: 'shadow-emerald-200', badge: 'bg-emerald-500' },
            { bg: 'from-amber-500 to-amber-600', shadow: 'shadow-amber-200', badge: 'bg-amber-500' },
          ][index];

          return (
            <div key={member.member_id} className="flex flex-col items-center w-14 sm:w-20">
              <div className="mb-2 px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 text-gray-600 shadow-sm">
                {member.count}
              </div>

              <div
                className={`w-full sm:w-14 rounded-t-xl bg-gradient-to-b ${colors.bg} transition-all duration-500 relative ${colors.shadow}`}
                style={{ height: `${heightPercent}%`, minHeight: '20px' }}
              >
                <div className="absolute top-0 left-0 right-0 h-1/3 bg-linear-to-b from-white/30 to-transparent rounded-t-xl pointer-events-none" />
              </div>

              <div className="mt-3 flex flex-col items-center">
                <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gray-100 overflow-hidden border-2 border-white ${colors.shadow}`}>
                  {member.avatar_url ? (
                    <img src={member.avatar_url} alt={member.fullname} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center font-bold text-gray-400 text-sm">
                      {member.fullname.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <div className={`-mt-3 ml-6 w-5 h-5 rounded-full ${colors.badge} text-white text-[10px] font-bold flex items-center justify-center border-2 border-white shadow-sm`}>
                  #{index + 1}
                </div>
                <span className="text-[10px] font-medium text-gray-500 mt-1 truncate max-w-full">
                  {member.fullname.split(' ')[0]}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
