import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import type { ActivityType } from "../models/Activity";
import ActivityCard from "../components/list/ActivityCard";
import ActivityCharts from "../components/analytics/ActivityCharts";
import Navbar from "../../../Global_Components/navBar";
import { Plus, Search, Filter, Calendar } from "lucide-react";
import { useAuth } from "../../Authentication/auth.context";
import { useActivities } from "../hooks/useActivities";
import { EXECUTIVE_LEVELS } from "../../../utils/roles";
import { useTranslation } from "react-i18next";

export default function AllActivitiesPage() {
    const { activities, loading } = useActivities();
    const { role } = useAuth();
    const { t, i18n } = useTranslation();

    const hasAdvancedAccess = EXECUTIVE_LEVELS.includes(role?.toLowerCase() || '');


    // Filters
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedType, setSelectedType] = useState<ActivityType | 'all'>('all');
    const [dateFilter, setDateFilter] = useState<'all' | 'upcoming' | 'past'>('all');

    const filteredActivities = (activities as any[]).filter((activity: any) => {
        // Search
        const matchesSearch = activity.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                              activity.description?.toLowerCase().includes(searchTerm.toLowerCase());
        
        // Type
        const matchesType = selectedType === 'all' || activity.type === selectedType;

        // Date
        let matchesDate = true;
        const now = new Date();
        const activityDate = new Date(activity.activity_begin_date);
        if (dateFilter === 'upcoming') {
            matchesDate = activityDate >= now;
        } else if (dateFilter === 'past') {
            matchesDate = activityDate < now;
        }

        return matchesSearch && matchesType && matchesDate;
    });

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />
                <main className="md:ms-64 pt-16 md:pt-6">

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                    <div className="text-start">
                        <h1 className="text-3xl font-bold text-gray-900">{t('activities.title')}</h1>
                        <p className="text-gray-500 mt-1">{t('activities.subtitle')}</p>
                    </div>
                    {hasAdvancedAccess && (
                        <Link 
                            to="/activities/new"
                            className="inline-flex items-center gap-2 bg-(--color-myPrimary) text-white px-5 py-2.5 rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-sm"
                        >
                            <Plus className="w-5 h-5" /> {t('activities.createActivity')}
                        </Link>
                    )}
                </div>

                {/* Charts Section */}
                {hasAdvancedAccess && !loading && activities.length > 0 && (
                    <ActivityCharts activities={filteredActivities} />
                )}

                {/* Filters Bar */}
                <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 mb-6 flex flex-col md:flex-row gap-4 items-center justify-between sticky top-20 z-10 transition-all">
                   <div className="flex-1 w-full relative">
                        <Search className={`absolute ${i18n.dir() === 'rtl' ? 'right-3' : 'left-3'} top-2.5 w-5 h-5 text-gray-400`} />
                        <input 
                            type="text" 
                            placeholder={t('activities.search')} 
                            className={`w-full ${i18n.dir() === 'rtl' ? 'pr-10 pl-4' : 'pl-10 pr-4'} py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none`}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            />
                   </div>
                   
                   <div className="flex gap-3 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
                        {/* Type Filter */}
                        <div className="relative min-w-[140px]">
                            <Filter className={`absolute ${i18n.dir() === 'rtl' ? 'right-3' : 'left-3'} top-2.5 w-4 h-4 text-gray-500`} />
                            <select 
                                className={`w-full ${i18n.dir() === 'rtl' ? 'pr-9 pl-4' : 'pl-9 pr-4'} py-2 border rounded-lg appearance-none bg-white focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer`}
                                value={selectedType}
                                onChange={(e) => setSelectedType(e.target.value as any)}
                            >
                                <option value="all">{t('activities.allTypes')}</option>
                                <option value="event">{t('activities.events')}</option>
                                <option value="meeting">{t('activities.meetings')}</option>
                                <option value="formation">{t('activities.formations')}</option>
                                <option value="general_assembly">{t('activities.generalAssembly')}</option>
                            </select>
                        </div>

                        {/* Date Filter */}
                         <div className="relative min-w-[140px]">
                            <Calendar className={`absolute ${i18n.dir() === 'rtl' ? 'right-3' : 'left-3'} top-2.5 w-4 h-4 text-gray-500`} />
                            <select 
                                className={`w-full ${i18n.dir() === 'rtl' ? 'pr-9 pl-4' : 'pl-9 pr-4'} py-2 border rounded-lg appearance-none bg-white focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer`}
                                value={dateFilter}
                                onChange={(e) => setDateFilter(e.target.value as any)}
                                >
                                <option value="all">{t('activities.allDates')}</option>
                                <option value="upcoming">{t('activities.upcoming')}</option>
                                <option value="past">{t('activities.past')}</option>
                            </select>
                        </div>
                   </div>
                </div>

                {/* Grid */}
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3, 4, 5, 6].map(i => (
                            <div key={i} className="bg-white h-96 rounded-xl animate-pulse shadow-sm" />
                        ))}
                    </div>
                ) : filteredActivities.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-xl border border-dashed border-gray-200">
                        <Calendar className="w-16 h-16 text-gray-200 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900">{t('activities.noActivities')}</h3>
                        <p className="text-gray-500 mt-1">{t('activities.noActivitiesSubtitle')}</p>
                        <button 
                            onClick={() => { setSearchTerm(''); setSelectedType('all'); setDateFilter('all'); }}
                            className="mt-4 text-blue-600 font-medium hover:underline"
                            >
                            {t('activities.clearFilters')}
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {filteredActivities.map((activity: any) => (
                            <div key={activity.id}>
                                <ActivityCard 
                                    activity={activity} 
                                />
                            </div>
                        ))}
                    </div>
                )}
            </div>
                </main>
        </div>
    );
}
