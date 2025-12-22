import { useState } from "react";
import type { Complaint } from "../../types";
import { useTranslation } from "react-i18next";

interface MemberComplaintsProps {
    complaints: Complaint[];
    onAddComplaint: (complaint: string) => void;
    readOnly?: boolean;
}

export default function MemberComplaints({ complaints, onAddComplaint, readOnly = false }: MemberComplaintsProps) {
    const { t } = useTranslation();
    const [newComplaint, setNewComplaint] = useState("");

    const handleAdd = () => {
        if (newComplaint.trim()) {
            onAddComplaint(newComplaint);
            setNewComplaint("");
        }
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('profile.complaintsTitle')}</h3>
            
            <div className="space-y-3 mb-4 max-h-40 overflow-y-auto">
                 {complaints.length === 0 ? (
                    <p className="text-gray-500 text-sm italic">{t('profile.noComplaintsRecorded')}</p>
                ) : (
                    complaints.map((c) => (
                        <div key={c.id} className="bg-red-50 text-red-700 text-sm p-3 rounded border border-red-100 flex justify-between items-center">
                            <span>{c.content}</span>
                            <span className="text-xs text-red-500 opacity-75">{new Date(c.created_at).toLocaleDateString()}</span>
                        </div>
                    ))
                )}
            </div>

            {!readOnly && (
                <div className="flex gap-2">
                    <input 
                        type="text" 
                        placeholder={t('profile.logComplaintPlaceholder')} 
                        value={newComplaint}
                        onChange={(e) => setNewComplaint(e.target.value)}
                        className="flex-1 border rounded px-3 py-2 text-sm"
                    />
                    <button 
                        onClick={handleAdd}
                        disabled={!newComplaint.trim()}
                        className="bg-red-600 text-white px-4 py-2 rounded text-sm font-medium disabled:opacity-50 hover:bg-red-700"
                    >
                        {t('common.add')}
                    </button>
                </div>
            )}
        </div>
    );
}
