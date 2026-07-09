import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Trophy, Medal, Award } from 'lucide-react';
import { participationService } from '../../../../Activities/services/participationService';

const rankIcons = [Trophy, Medal, Award];
const rankColors = [
  { bg: 'bg-[#EDBE38]/10 border-[#EDBE38]/30', ring: 'ring-[#EDBE38]', text: 'text-[#EDBE38]', bar: 'bg-[#EDBE38]' },
  { bg: 'bg-[#0097D7]/10 border-[#0097D7]/30', ring: 'ring-[#0097D7]', text: 'text-[#0097D7]', bar: 'bg-[#0097D7]' },
  { bg: 'bg-[#56BDA3]/10 border-[#56BDA3]/30', ring: 'ring-[#56BDA3]', text: 'text-[#56BDA3]', bar: 'bg-[#56BDA3]' },
];

export default function MostAttendedChart() {
  const { t } = useTranslation();
  const [data, setData] = useState<Record<string, { member_id: string; fullname: string; avatar_url?: string | null; count: number }[]>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    participationService.getTopAttendedMembers()
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, []);

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-6 flex items-center justify-center h-[200px]">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#0097D7]" />
      </div>
    )
  }

  const roleEntries = Object.entries(data);
  if (roleEntries.length === 0) return null;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-6 overflow-hidden">
      <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-[#001F3F] to-[#001F3F]/90">
        <div className="p-2 bg-white/15 rounded-xl">
          <Trophy className="w-5 h-5 text-[#EDBE38]" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-white">
            {t('members.mostAttended', 'Most Attended')}
          </h3>
          <p className="text-xs text-white/60">Top 3 per role by participation count</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-gray-100">
        {roleEntries.map(([role, members]) => {
          if (members.length === 0) return null;
          const maxCount = Math.max(...members.map(m => m.count));

          return (
            <div key={role} className="bg-white p-5">
              <h4 className="text-xs font-bold text-[#001F3F]/60 uppercase tracking-widest mb-4 pb-3 border-b border-gray-100">{role}</h4>
              <div className="space-y-3">
                {members.map((member, index) => {
                  const widthPercent = Math.max((member.count / maxCount) * 100, 4);
                  const colors = rankColors[index];
                  const RankIcon = rankIcons[index];

                  return (
                    <div key={member.member_id} className="flex items-center gap-3">
                      <div className={`shrink-0 w-7 h-7 rounded-full ${colors.bg} flex items-center justify-center border`}>
                        <RankIcon className={`w-3.5 h-3.5 ${colors.text}`} />
                      </div>
                      <div className={`w-8 h-8 rounded-full bg-gray-100 overflow-hidden ring-2 ${colors.ring} shrink-0`}>
                        {member.avatar_url ? (
                          <img src={member.avatar_url} alt={member.fullname} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center font-bold text-gray-400 text-xs">
                            {member.fullname.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-medium text-gray-700 truncate">{member.fullname}</span>
                          <span className={`text-xs font-bold ${colors.text} shrink-0`}>{member.count}</span>
                        </div>
                        <div className="mt-1.5 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${colors.bar}`}
                            style={{ width: `${widthPercent}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}