
import { useEffect, useState } from 'react';
import { recruitmentService } from '../../Recruitment/services/recruitmentService';
import type { Candidate } from '../../Recruitment/models/types';
import { UserPlus, Clock, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export default function PendingCandidates() {
    const { t } = useTranslation();
    const [candidates, setCandidates] = useState<Candidate[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadCandidates();
    }, []);

    const loadCandidates = async () => {
        try {
            const data = await recruitmentService.getCandidates();
            // Filter pending and limit to 5
            setCandidates(data.filter(c => c.status === 'pending').slice(0, 5));
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
                    <div className="p-2 bg-orange-100 rounded-lg text-orange-600">
                        <UserPlus className="w-5 h-5" />
                    </div>
                    <div className="flex items-baseline gap-2">
                         <h3 className="font-bold text-gray-900 text-lg">{t('home.pendingCandidates')}</h3>
                         <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-medium">
                            {candidates.length}
                         </span>
                    </div>
                   
                </div>
                 <Link to="/recruitment" className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1">
                    {t('common.manage')} <ArrowRight className="w-4 h-4" />
                </Link>
            </div>

            <div className="space-y-3 flex-1">
                {candidates.length === 0 ? (
                    <div className="text-center py-6">
                        <p className="text-gray-500 text-sm">{t('common.noPendingCandidates')}</p>
                    </div>
                ) : (
                    candidates.map(candidate => (
                    <div key={candidate.id} className="flex justify-between items-center p-3 rounded-lg hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-100">
                        <div className="min-w-0">
                            <h4 className="font-semibold text-gray-900 text-sm truncate">{candidate.fullname}</h4>
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                                <span>{candidate.phone}</span>
                                <span>•</span>
                                <span className="flex items-center gap-1">
                                    <Clock className="w-3 h-3" /> 
                                    {new Date(candidate.created_at).toLocaleDateString()}
                                </span>
                            </div>
                        </div>
                        <Link 
                            to={`/recruitment/candidates/${candidate.id}`}
                            className="bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 hover:text-blue-600 text-xs font-medium px-3 py-1.5 rounded-md transition-colors"
                        >
                            {t('common.evaluate')}
                        </Link>
                    </div>
                )))}
            </div>
        </div>
    );
}
