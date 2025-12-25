import React from 'react';
import { Calendar, Star, MessageSquare, Award, XCircle, CheckCircle, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { ActivityHistoryItem } from '../interfaces/MemberActivities.types';

interface ActivityCardProps {
    item: ActivityHistoryItem;
    onJoin: (activityId: string) => Promise<void>;
    isJoining: boolean;
}

const ActivityCard: React.FC<ActivityCardProps> = ({ item, onJoin, isJoining }) => {
    const { t, i18n } = useTranslation();
    const participantCount = item.activity.activity_participants?.[0]?.count || 0;
    const isFutureActivity = new Date(item.activity.activity_begin_date) >= new Date();
    const hasJoined = item.status === 'attended';

    return (
        <Link to={`/activities/${item.activity.id}/GET`} className="block">
            <div className="p-4 hover:bg-gray-50 dark:hover:bg-slate-700/30 transition-colors relative group">
                <div className="flex gap-4">
                    <div className={`absolute start-0 top-0 bottom-0 w-1 ${
                        item.status === 'attended' ? 'bg-green-500' :
                        item.status === 'recommended' ? 'bg-amber-400' : 'bg-red-400'
                    }`} />

                    <div className="flex-shrink-0 w-16 h-16 rounded-lg bg-gray-200 dark:bg-slate-700 overflow-hidden relative">
                        {item.activity.image_url ? (
                            <img
                                src={item.activity.image_url}
                                alt={item.activity.name}
                                className={`w-full h-full object-cover ${item.status === 'missed' ? 'grayscale opacity-70' : ''}`}
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400 dark:text-slate-500">
                                <Calendar className="w-6 h-6" />
                            </div>
                        )}
                        <div className="absolute bottom-1 end-1">
                            {item.status === 'attended' ? (
                                <CheckCircle className="w-4 h-4 text-green-500 bg-white rounded-full" />
                            ) : item.status === 'recommended' ? (
                                <Star className="w-4 h-4 text-amber-500 bg-white rounded-full fill-current" />
                            ) : (
                                <XCircle className="w-4 h-4 text-red-400 bg-white rounded-full" />
                            )}
                        </div>
                    </div>

                    <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start">
                            <div>
                                <h4 className={`font-medium truncate pe-2 ${
                                    item.status !== 'missed'
                                    ? 'text-gray-900 dark:text-white'
                                    : 'text-gray-500 dark:text-slate-400'
                                }`}>
                                    {item.activity.name}
                                </h4>
                                <div className="flex flex-wrap items-center gap-2 mt-1">
                                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                                        item.activity.type === 'event' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' :
                                        item.activity.type === 'meeting' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' :
                                        'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300'
                                    }`}>
                                        {t(`profile.${item.activity.type}`)}
                                    </span>
                                    <div className="flex items-center gap-1 text-[10px] font-bold text-slate-500 bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded">
                                        <Users className="w-3 h-3 text-blue-500" />
                                        {participantCount}
                                    </div>
                                    <span className="text-xs text-slate-500">
                                        {new Date(item.activity.activity_begin_date).toLocaleDateString(i18n.language)}
                                    </span>
                                    {item.status === 'recommended' && (
                                        <span className="text-[10px] bg-amber-50 text-amber-600 px-1.5 py-0.5 rounded border border-amber-100 font-bold uppercase">
                                            {t('profile.matchedInterests')}
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div className={`flex flex-col items-end gap-2 ${item.status === 'missed' ? 'opacity-50' : ''}`}>
                                {isFutureActivity && (
                                    <button
                                        onClick={(e) => {
                                            e.preventDefault();
                                            if (!hasJoined && !isJoining) {
                                                onJoin(item.activity.id);
                                            }
                                        }}
                                        disabled={hasJoined || isJoining}
                                        className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
                                            hasJoined
                                                ? 'bg-amber-100 text-amber-700 ring-1 ring-amber-200 dark:bg-amber-900/40 dark:text-amber-400 dark:ring-amber-800 cursor-default shadow-sm'
                                                : isJoining
                                                    ? 'bg-gray-100 text-gray-400 cursor-wait'
                                                    : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50 hover:border-gray-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 dark:hover:bg-slate-700 shadow-sm'
                                        }`}
                                    >
                                        {hasJoined ? (
                                            <>
                                                <Star className="w-3.5 h-3.5 fill-current" />
                                                {t('interested', 'Interested')}
                                            </>
                                        ) : (
                                            <>
                                                <Star className="w-3.5 h-3.5" />
                                                {t('interested', 'Interested')}
                                            </>
                                        )}
                                    </button>
                                )}
                                {(item.activity.activity_points || 0) > 0 && (
                                    <div className="flex items-center gap-1 px-2 py-1 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-500 rounded text-xs font-bold">
                                        <Award className="w-3 h-3" />
                                        {item.status === 'attended' ? '+' : ''}{item.activity.activity_points}
                                    </div>
                                )}
                            </div>
                        </div>

                        {item.status === 'attended' && item.participation && (item.participation.rate || item.participation.notes) && (
                            <div className="mt-3 bg-slate-50 dark:bg-slate-900/50 p-2 rounded text-sm border border-slate-100 dark:border-slate-800">
                                {item.participation.rate && (
                                    <div className="flex items-center gap-1 mb-1 text-amber-500">
                                        {Array.from({ length: 5 }).map((_, i) => (
                                            <Star
                                                key={i}
                                                className={`w-3 h-3 ${i < item.participation!.rate! ? 'fill-current' : 'text-gray-300 dark:text-slate-600'}`}
                                            />
                                        ))}
                                        <span className="text-xs text-slate-500 ms-1">{t('profile.rating')}</span>
                                    </div>
                                )}
                                {item.participation.notes && (
                                    <div className="flex gap-2 text-slate-600 dark:text-slate-400 text-xs italic">
                                        <MessageSquare className="w-3 h-3 mt-0.5 flex-shrink-0" />
                                        <p>"{item.participation.notes}"</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </Link>
    );
};

export default ActivityCard;
