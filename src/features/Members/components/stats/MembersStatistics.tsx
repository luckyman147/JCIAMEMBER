import type { Member } from '../../types';
import type { MemberTask } from '../../../Tasks/types';
import { useTranslation } from 'react-i18next';
import { DemographicStats } from './dashboard/DemographicStats';
import { PersonalityStats } from './dashboard/PersonalityStats';
import { EngagementStats } from './dashboard/EngagementStats';
import { PreferenceStats } from './dashboard/PreferenceStats';
import { MemberTalentStats } from './dashboard/MemberTalentStats';
import { CotisationStats } from './dashboard/CotisationStats';
import { AvailabilityStats } from './dashboard/AvailabilityStats';
import { VolunteeringStats } from './dashboard/VolunteeringStats';
import { Zap, Heart, CreditCard, Calendar, Target, Brain, Clock } from 'lucide-react';

interface MembersStatisticsProps {
    members: Member[];
    tasks?: MemberTask[];
}

export default function MembersStatistics({ members, tasks = [] }: MembersStatisticsProps) {
    const { t } = useTranslation();

    if (members.length === 0) return null;

    return (
        <div className="space-y-12 mb-12">
            {/* 1. Community Overview */}
            <section className="space-y-6">
                <div className="flex items-center gap-3 border-l-4 border-blue-500 pl-4 py-1">
                    <Brain className="w-5 h-5 text-blue-500" />
                    <h2 className="text-xl font-bold text-gray-900 tracking-tight">{t('members.demographicsTitle', 'Community Overview')}</h2>
                </div>
                <DemographicStats members={members} />
              
            </section>

            {/* 2. Talent & Growth Potential */}
            <section className="space-y-6">
                <div className="flex items-center gap-3 border-l-4 border-amber-500 pl-4 py-1">
                    <Target className="w-5 h-5 text-amber-500" />
                    <h2 className="text-xl font-bold text-gray-900 tracking-tight">{t('members.talentGrowthTitle', 'Talent & Growth Hub')}</h2>
                </div>
                <MemberTalentStats members={members} /> 
                 <div className="mt-8">
                    <PersonalityStats members={members} />
                </div>
            </section>

            {/* 3. Engagement & Performance */}
            <section className="space-y-6">
                <div className="flex items-center gap-3 border-l-4 border-emerald-500 pl-4 py-1">
                    <Zap className="w-5 h-5 text-emerald-500" />
                    <h2 className="text-xl font-bold text-gray-900 tracking-tight">{t('members.performanceTitle', 'Task Performance')}</h2>
                </div>
                <EngagementStats members={members} tasks={tasks} />
                
                <div className="mt-8">
                    <div className="flex items-center border-l-4 border-(--color-mySecondary) pl-4 py-1 gap-3 mb-6">
                        <Clock className="w-5 h-5 text-(--color-mySecondary)" />
                        <h3 className="text-xl font-bold text-gray-900 tracking-tight">{t('members.volunteeringSection', 'Volunteering Commitment')}</h3>
                    </div>
                    <VolunteeringStats members={members} />
                </div>
            </section>

            {/* 4. Availability */}
            <section className="space-y-6">
                <div className="flex items-center gap-3 border-l-4 border-orange-500 pl-4 py-1">
                    <Calendar className="w-5 h-5 text-orange-500" />
                    <h2 className="text-xl font-bold text-gray-900 tracking-tight">{t('members.availabilityTitle', 'Availability')}</h2>
                </div>
                <AvailabilityStats members={members} />
            </section>

            {/* 5. Cotisation & Financials */}
            <section className="space-y-6">
                <div className="flex items-center gap-3 border-l-4 border-indigo-500 pl-4 py-1">
                    <CreditCard className="w-5 h-5 text-indigo-500" />
                    <h2 className="text-xl font-bold text-gray-900 tracking-tight">{t('members.financialsTitle', 'Membership Fees')}</h2>
                </div>
                <CotisationStats members={members} />
            </section>

            {/* 6. Personal Preferences */}
            <section className="space-y-6">
                <div className="flex items-center gap-3 border-l-4 border-pink-500 pl-4 py-1">
                    <Heart className="w-5 h-5 text-pink-500" />
                    <h2 className="text-xl font-bold text-gray-900 tracking-tight">{t('members.preferencesTitle', 'Interests & Preferences')}</h2>
                </div>
                <PreferenceStats members={members} />
            </section>
        </div>
    );
}
