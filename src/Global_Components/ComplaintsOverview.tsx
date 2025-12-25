import { useState, useEffect } from 'react';
import { MessageSquare, CheckCircle, Clock, Filter } from 'lucide-react';
import { getAllComplaints, updateComplaintStatus } from '../features/Members/services/members.service';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

export default function ComplaintsOverview() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.dir() === 'rtl';
  const [complaints, setComplaints] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'resolved'>('all');

  const loadComplaints = async () => {
    try {
      setLoading(true);
      const data = await getAllComplaints();
      setComplaints(data);
    } catch (error) {
      console.error('Failed to load complaints', error);
      toast.error('Failed to load complaints');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadComplaints();
  }, []);

  const handleStatusUpdate = async (id: string, newStatus: 'pending' | 'resolved') => {
    // Optimistic update
    const previousComplaints = [...complaints];
    setComplaints(prev => prev.map(c => c.id === id ? { ...c, status: newStatus } : c));

    try {
      await updateComplaintStatus(id, newStatus);
      toast.success(t('profile.complaintUpdated'));
    } catch (error) {
      console.error('Failed to update status', error);
      toast.error(t('profile.complaintFailed'));
      // Rollback
      setComplaints(previousComplaints);
    }
  };

  const filteredComplaints = complaints.filter(c => 
    filter === 'all' ? true : c.status === filter
  );

  if (loading) return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 animate-pulse">
      <div className="h-6 w-1/3 bg-gray-200 rounded mb-4"></div>
      <div className="space-y-3">
        {[1, 2, 3].map(i => <div key={i} className="h-16 bg-gray-100 rounded-xl"></div>)}
      </div>
    </div>
  );

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden h-full flex flex-col">
      {/* Header */}
      <div className={`p-6 border-b border-gray-100 flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
        <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
          <div className="p-2 bg-red-50 rounded-lg">
            <MessageSquare className="w-5 h-5 text-red-600" />
          </div>
          <h3 className="text-lg font-bold text-gray-900">{t('home.memberComplaints')}</h3>
        </div>
        
        <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <Filter className="w-4 h-4 text-gray-400 mr-1" />
            <select 
                value={filter} 
                onChange={(e) => setFilter(e.target.value as any)}
                className="text-sm border-none bg-gray-50 rounded-lg px-2 py-1 outline-none text-gray-600 font-medium"
            >
                <option value="all">{t('common.all')}</option>
                <option value="pending">{t('common.pending')}</option>
                <option value="resolved">{t('common.resolved')}</option>
            </select>
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto max-h-[400px]">
        {filteredComplaints.length === 0 ? (
          <div className="p-10 text-center">
            <p className="text-gray-500 font-medium">{t('home.noComplaints')}</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {filteredComplaints.map((c) => (
              <div key={c.id} className={`p-4 hover:bg-gray-50/50 transition-colors group ${isRTL ? 'text-right' : 'text-left'}`}>
                <div className={`flex items-start gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  {/* Member Avatar */}
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gray-100 overflow-hidden border">
                    {c.profiles?.avatar_url ? (
                      <img src={c.profiles.avatar_url} className="w-full h-full object-cover" alt="" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400 font-bold">
                        {c.profiles?.fullname?.charAt(0)}
                      </div>
                    )}
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className={`flex items-center justify-between mb-1 ${isRTL ? 'flex-row-reverse' : ''}`}>
                      <span className="text-sm font-bold text-gray-900 truncate">
                        {c.profiles?.fullname}
                      </span>
                      <span className="text-[10px] text-gray-400 font-medium italic">
                        {new Date(c.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed mb-2">
                      {c.content}
                    </p>
                    
                    <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
                       <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                         c.status === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'
                       }`}>
                         {t(`common.${c.status}`)}
                       </span>
                       
                       <div className={`flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ${isRTL ? 'flex-row-reverse' : ''}`}>
                         {c.status === 'pending' ? (
                            <button 
                                onClick={() => handleStatusUpdate(c.id, 'resolved')}
                                className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                title={t('common.resolve')}
                            >
                                <CheckCircle className="w-4 h-4" />
                            </button>
                         ) : (
                            <button 
                                onClick={() => handleStatusUpdate(c.id, 'pending')}
                                className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                                title={t('common.setPending')}
                            >
                                <Clock className="w-4 h-4" />
                            </button>
                         )}

                       </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
