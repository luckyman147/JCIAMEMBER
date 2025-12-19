import { useState } from "react";
import { FileText } from "lucide-react";

interface MemberBioProps {
    description?: string;
    onUpdate: (description: string) => void;
    readOnly?: boolean;
}

export default function MemberBio({ description, onUpdate, readOnly = false }: MemberBioProps) {
    const [localDescription, setLocalDescription] = useState(description || "");

    const handleBlur = () => {
        if (localDescription !== description) {
            onUpdate(localDescription);
        }
    };

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-full">
            <div className="flex items-center gap-2 mb-6">
                <div className="p-2 bg-purple-50 rounded-lg">
                    <FileText className="w-4 h-4 text-purple-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">Bio & Notes</h3>
            </div>

            <div className="space-y-4">
                <textarea
                    rows={6}
                    className={`w-full border border-gray-200 rounded-xl p-4 text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition-all resize-none leading-relaxed ${
                        readOnly ? 'bg-gray-50/50 text-gray-600 cursor-default' : 'bg-white text-gray-900'
                    }`}
                    placeholder={readOnly ? "No bio provided yet." : "Write a professional summary or add internal notes..."}
                    value={localDescription}
                    onChange={(e) => setLocalDescription(e.target.value)}
                    onBlur={handleBlur}
                    readOnly={readOnly}
                />
                {!readOnly && (
                    <p className="text-[10px] text-gray-400 italic">
                        Your bio is automatically saved when you click outside the text area.
                    </p>
                )}
            </div>
        </div>
    );
}
