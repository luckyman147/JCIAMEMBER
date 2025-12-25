import { useState, useEffect } from "react";
import { Share2, ExternalLink, Pencil, Check, X } from "lucide-react";
import type { Member } from "../../types";
import { useTranslation } from "react-i18next";

interface Props {
    member: Member;
    onUpdate?: (updates: Partial<Member>) => void;
    readOnly?: boolean;
}

export default function MemberSocialInfo({ member, onUpdate, readOnly = true }: Props) {
    const { t } = useTranslation();
    const [isEditing, setIsEditing] = useState(false);
    const [platform, setPlatform] = useState(member.preferred_social_media || '');
    const [link, setLink] = useState(member.social_media_link || '');

    useEffect(() => {
        setPlatform(member.preferred_social_media || '');
        setLink(member.social_media_link || '');
    }, [member]);

    const handleSave = () => {
        onUpdate?.({ preferred_social_media: platform, social_media_link: link });
        setIsEditing(false);
    };

    return (
        <div className={`bg-white p-6 rounded-2xl shadow-sm border transition-all ${isEditing ? 'border-pink-400 ring-4 ring-pink-50' : 'border-gray-100 hover:shadow-md'}`}>
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-pink-50 rounded-xl flex items-center justify-center">
                        <Share2 className="w-5 h-5 text-pink-600" />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">{t('profile.preferredSocialMedia')}</h3>
                        {member.preferred_social_media && !isEditing && (
                            <p className="text-xs text-gray-500 font-medium">{t(`profile.socialMedia.${member.preferred_social_media}`)}</p>
                        )}
                    </div>
                </div>
                {!readOnly && (
                    <div className="flex gap-2">
                        {isEditing ? (
                            <>
                                <button onClick={handleSave} className="p-1.5 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors">
                                    <Check className="w-4 h-4" />
                                </button>
                                <button onClick={() => setIsEditing(false)} className="p-1.5 bg-gray-100 text-gray-400 rounded-lg hover:bg-gray-200 transition-colors">
                                    <X className="w-4 h-4" />
                                </button>
                            </>
                        ) : (
                            <button onClick={() => setIsEditing(true)} className="p-1.5 text-gray-400 hover:text-pink-600 hover:bg-pink-50 rounded-lg transition-all">
                                <Pencil className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                )}
            </div>

            <div className="space-y-4">
                {isEditing ? (
                    <div className="space-y-3 animate-in fade-in slide-in-from-top-1 duration-200">
                        <div>
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1 block">{t('profile.preferredSocialMedia')}</label>
                            <select
                                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl outline-none focus:border-pink-500"
                                value={platform}
                                onChange={(e) => setPlatform(e.target.value)}
                            >
                                <option value="">{t('common.select')}</option>
                                {['facebook', 'instagram', 'linkedin', 'x', 'tiktok', 'other'].map(p => (
                                    <option key={p} value={p}>{t(`profile.socialMedia.${p}`)}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1 block">{t('profile.socialMediaLink')}</label>
                            <input
                                type="url"
                                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl outline-none focus:border-pink-500"
                                value={link}
                                onChange={(e) => setLink(e.target.value)}
                                placeholder="https://..."
                            />
                        </div>
                    </div>
                ) : (
                    <div className="flex items-center justify-between bg-gray-50 rounded-xl p-3 border border-gray-100">
                         <div className="flex items-center gap-3">
                            <Share2 className="w-4 h-4 text-pink-400" />
                            <span className="text-sm font-bold text-gray-700">
                                {member.preferred_social_media ? t(`profile.socialMedia.${member.preferred_social_media}`) : <span className="text-gray-400 italic font-medium">{t('profile.notSpecified')}</span>}
                            </span>
                         </div>
                         {member.social_media_link && (
                             <a 
                                href={member.social_media_link} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="p-2 bg-white text-blue-500 rounded-lg shadow-sm border border-gray-100 hover:scale-110 transition-transform"
                             >
                                <ExternalLink className="w-4 h-4" />
                             </a>
                         )}
                    </div>
                )}
            </div>
        </div>
    );
}
