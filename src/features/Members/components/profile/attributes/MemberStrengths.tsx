import { ShieldCheck } from "lucide-react";
import { useTranslation } from "react-i18next";
import { ProfileCard, TagManager } from "../shared";

interface MemberStrengthsProps {
    strengths: string[];
    onUpdate: (strengths: string[]) => void;
    readOnly?: boolean;
}

const STRENGTH_OPTIONS = [
    'Leadership', 'Communication', 'Teamwork', 'Problem Solving', 
    'Public Speaking', 'Creativity', 'Organization', 'Adaptability', 
    'Strategic Thinking', 'Project Management', 'Conflict Resolution',
    'Decision Making', 'Time Management', 'Networking'
];

export default function MemberStrengths({ strengths = [], onUpdate, readOnly = false }: MemberStrengthsProps) {
    const { t } = useTranslation();

    return (
        <ProfileCard
            title={t('profile.strengthsTitle')}
            subtitle={t('profile.strengthsSubtitle')}
            icon={ShieldCheck}
            iconColorClass="text-green-600"
            iconBgClass="bg-green-50"
            readOnly={true} // Managing edit state internally in this simple version or we could lift it. 
            // In original it was always showing input if not readOnly.
            className="h-full border-green-100 hover:border-green-200"
        >
            <TagManager
                tags={strengths}
                onUpdate={onUpdate}
                options={STRENGTH_OPTIONS}
                readOnly={readOnly}
                placeholder={t('profile.addStrength')}
                tagColorClass="text-white"
                tagBgClass="bg-(--color-myAccent)"
                tagBorderClass="border-green-100"
                translationPrefix="profile.strengthOptions"
            />
        </ProfileCard>
    );
}
