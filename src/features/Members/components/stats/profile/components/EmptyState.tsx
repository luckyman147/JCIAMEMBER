import React from 'react';
import { Calendar } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const EmptyState: React.FC = () => {
    const { t } = useTranslation();
    return (
        <div className="p-8 text-center text-gray-500 dark:text-slate-400">
            <Calendar className="w-10 h-10 mx-auto mb-2 text-gray-300 dark:text-slate-600" />
            <p>{t('profile.noActivitiesFound')}</p>
        </div>
    );
};

export default EmptyState;
