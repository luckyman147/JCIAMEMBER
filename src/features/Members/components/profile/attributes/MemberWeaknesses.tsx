import { AlertCircle } from "lucide-react";
import { useTranslation } from "react-i18next";
import { ProfileCard, TagManager } from "../shared";

interface MemberWeaknessesProps {
    weaknesses: string[];
    onUpdate: (weaknesses: string[]) => void;
    readOnly?: boolean;
}

const WEAKNESS_OPTIONS = [
    'Time Management', 'Delegation', 'Perfectionism', 'Public Speaking', 
    'Networking', 'Confidence', 'Overthinking', 'Multitasking', 
    'Attention to Detail', 'Sensitivity', 'Work-Life Balance',
    'Technical Skills', 'Impatience', 'Procrastination'
];

export default function MemberWeaknesses({ weaknesses = [], onUpdate, readOnly = false }: MemberWeaknessesProps) {
    const { t } = useTranslation();

    return (
        <ProfileCard
            title={t('profile.weaknessesTitle')}
            subtitle={t('profile.weaknessesSubtitle')}
            icon={AlertCircle}
            iconColorClass="text-red-600"
            iconBgClass="bg-red-50"
            readOnly={true}
            className="h-full border-red-100 hover:border-red-200"
        >
            <TagManager
                tags={weaknesses}
                onUpdate={onUpdate}
                options={WEAKNESS_OPTIONS}
                readOnly={readOnly}
                placeholder={t('profile.addWeakness')}
                tagColorClass="text-white"
                tagBgClass="bg-red-500"
                tagBorderClass="border-red-100"
                translationPrefix="profile.weaknessOptions"
            />
        </ProfileCard>
    );
}
