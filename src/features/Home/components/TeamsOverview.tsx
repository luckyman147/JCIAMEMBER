
import { useEffect, useState } from 'react';
import { getTeams } from '../../Teams/services/teams.service';
import type { Team } from '../../Teams/types';
import { Users, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export default function TeamsOverview() {
    const { t } = useTranslation();
    const [teams, setTeams] = useState<Team[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadTeams();
    }, []);

    const loadTeams = async () => {
        try {
            const data = await getTeams();
            setTeams(data.slice(0, 3)); // Limit to first 3
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="animate-pulse h-64 bg-white rounded-xl shadow-sm border border-gray-100 p-6"></div>;

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col h-full">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                    <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                        <Users className="w-5 h-5" />
                    </div>
                    <h3 className="font-bold text-gray-900 text-lg">{t('home.activeTeams')}</h3>
                </div>
                <Link to="/teams" className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1">
                    {t('home.viewAll')} <ArrowRight className="w-4 h-4" />
                </Link>
            </div>

            <div className="space-y-4 flex-1">
                {teams.length === 0 ? (
                    <p className="text-gray-500 text-sm italic">{t('common.noTeamsCreated')}</p>
                ) : (
                    teams.map(team => (
                    <Link key={team.id} to={`/teams/${team.id}`} className="block group">
                         <div className="p-4 rounded-lg bg-gray-50 border border-gray-200 group-hover:border-blue-300 group-hover:shadow-sm transition-all">
                             <div className="flex justify-between items-start mb-2">
                                 <h4 className="font-semibold text-gray-900 line-clamp-1">{team.name}</h4>
                                 <span className="text-xs font-medium text-gray-600 bg-white px-2 py-0.5 rounded border border-gray-200">
                                     {team.member_count} {t('common.members')}
                                 </span>
                             </div>
                             <p className="text-xs text-gray-500 line-clamp-2">{team.description || 'No description'}</p>
                         </div>
                    </Link>
                )))}
            </div>
             <Link to="/teams" className="mt-4 w-full py-2 flex items-center justify-center text-sm font-medium text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors">
                Explore Teams
            </Link>
        </div>
    );
}
