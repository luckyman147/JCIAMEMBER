import React, { useEffect, useState } from 'react';
import { activityService } from '../../../Activities/services/activityService';
import { getMemberById } from '../../services/members.service';
import type { Activity } from '../../../Activities/models/Activity'; // Use type import
import { Calendar, Star, MessageSquare, Award, XCircle, CheckCircle, PieChart, Activity as ActivityIcon, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import supabase from '../../../../utils/supabase';

interface MemberActivitiesProps {
  memberId: string;
}

interface ActivityHistoryItem {
  activity: Activity;
  status: 'attended' | 'missed' | 'recommended';
  participation?: {
    id: string;
    rate: number | null;
    notes: string | null;
    registered_at: string;
  };
}

// Helper to define partial participation type from service
interface ServiceParticipation {
  id: string;
  rate: number | null;
  notes: string | null;
  registered_at: string;
  activity: { id: string } | null; // We only need ID for matching
}

const MemberActivities: React.FC<MemberActivitiesProps> = ({ memberId }) => {
  const [historyItems, setHistoryItems] = useState<ActivityHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'attended' | 'absent' | 'future'>('attended');
  const [showCharts, setShowCharts] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // 1. Get Member to find join date and preferences
        const member = await getMemberById(memberId);
        if (!member) {
          setError("Member not found");
          setLoading(false);
          return;
        }

        const joinDate = member.created_at || new Date().toISOString();
        
        // 2. Fetch Member Categories
        const { data: memberCategoriesData } = await activityService.getMembers().then(() => 
      supabase.from('profile_categories').select('category_id').eq('profile_id', memberId)
          
        );
        const preferredCategoryIds = memberCategoriesData?.map(c => c.category_id) || [];

        // 3. Fetch all activities
        const { data: allActivities, error: actError } = await supabase
            .from('activities')
            .select('*, activity_participants(count)')
            .gte('activity_begin_date', joinDate)
            .order('activity_begin_date', { ascending: false });

        if (actError) throw actError;

        // 4. Fetch all activity categories links to bypass relationship issues
        const { data: allCategoryLinks } = await supabase
            .from('activity_categories')
            .select('activity_id, category_id');

        // Create a map of activity_id -> category_ids[]
        const activityCatMap = new Map<string, number[]>();
        (allCategoryLinks || []).forEach(link => {
            const list = activityCatMap.get(link.activity_id) || [];
            list.push(link.category_id);
            activityCatMap.set(link.activity_id, list);
        });

        // 5. Fetch member's actual participations
        const myParticipations = await activityService.getMemberParticipations(memberId);
        
        // Create a map for quick lookup
        const participationMap = new Map<string, ServiceParticipation>();
        (myParticipations as unknown as ServiceParticipation[]).forEach(p => {
          if (p.activity?.id) {
            participationMap.set(p.activity.id, p);
          }
        });

        const now = new Date();

        // 6. Merge and Categorize Data
        // Map to hold unique activities by ID
        const itemsMap = new Map<string, ActivityHistoryItem>();

        // First, add all participated activities (Attended)
        (myParticipations as unknown as ServiceParticipation[]).forEach(p => {
            if (p.activity) {
                itemsMap.set(p.activity.id, {
                    activity: p.activity as Activity,
                    status: 'attended',
                    participation: {
                        id: p.id,
                        rate: p.rate,
                        notes: p.notes,
                        registered_at: p.registered_at
                    }
                });
            }
        });

        // Then, add other activities (Missed or Recommended) if they aren't already in the map
        (allActivities || []).forEach(activity => {
            if (!itemsMap.has(activity.id)) {
                const activityDate = new Date(activity.activity_begin_date);
                const hasStarted = activityDate < now;
                const activityCatIds = activityCatMap.get(activity.id) || [];
                
                if (hasStarted) {
                    itemsMap.set(activity.id, {
                        activity: activity as Activity,
                        status: 'missed'
                    });
                } else {
                    const isRecommended = activityCatIds.some((id: number) => preferredCategoryIds.includes(id));
                    itemsMap.set(activity.id, {
                        activity: activity as Activity,
                        status: isRecommended ? 'recommended' : 'missed' 
                    });
                }
            }
        });

        const mergedItems = Array.from(itemsMap.values()).sort((a, b) => 
            new Date(b.activity.activity_begin_date).getTime() - new Date(a.activity.activity_begin_date).getTime()
        );
        
        setHistoryItems(mergedItems);
      } catch (err: any) {
        console.error("Failed to load activity history", err);
        setError("Failed to load activity history.");
      } finally {
        setLoading(false);
      }
    };

    if (memberId) {
      fetchData();
    }
  }, [memberId]);

  const attendedItems = historyItems.filter(i => i.status === 'attended');
  const absentItems = historyItems.filter(i => i.status === 'missed' && new Date(i.activity.activity_begin_date) < new Date());
  const futureItems = historyItems.filter(i => !i.participation && new Date(i.activity.activity_begin_date) >= new Date());

  const filteredItems = 
    activeTab === 'attended' ? attendedItems : 
    activeTab === 'absent' ? absentItems : 
    futureItems;

  const attendedCount = attendedItems.length;
  const missedCount = absentItems.length;
  const futureCount = futureItems.length;

  if (loading) return <LoadingSkeleton />;
  if (error) return <ErrorDisplay message={error} />;

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden">
      <div className="p-4 border-b border-gray-100 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-blue-500" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Activity History</h3>
        </div>
        
        <div className="flex items-center gap-2">
           <button
            onClick={() => setShowCharts(!showCharts)}
            className={`p-1.5 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors ${showCharts ? 'bg-blue-50 text-blue-600' : 'text-gray-500 hover:bg-gray-50'}`}
          >
            <PieChart className="w-4 h-4" />
            {showCharts ? 'Hide Stats' : 'Show Stats'}
          </button>
          <div className="flex p-1 bg-gray-100 dark:bg-slate-700/50 rounded-lg">
            <button
              onClick={() => setActiveTab('attended')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                activeTab === 'attended'
                  ? 'bg-white dark:bg-slate-600 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200'
              }`}
            >
              Attended ({attendedCount})
            </button>
            <button
              onClick={() => setActiveTab('absent')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                activeTab === 'absent'
                  ? 'bg-white dark:bg-slate-600 text-red-600 dark:text-red-400 shadow-sm'
                  : 'text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200'
              }`}
            >
              Absent ({missedCount})
            </button>
            <button
              onClick={() => setActiveTab('future')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                activeTab === 'future'
                  ? 'bg-white dark:bg-slate-600 text-amber-600 dark:text-amber-400 shadow-sm'
                  : 'text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200'
              }`}
            >
              Future ({futureCount})
            </button>
          </div>
        </div>
      </div>


      {/* Presence Statistics Navigation */}
      <div className="p-4 bg-slate-50 dark:bg-slate-900/40 border-b border-gray-100 dark:border-slate-700">
         <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
                <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-1">Attendance Analytics</h4>
                <p className="text-xs text-gray-500 dark:text-slate-400">Track your involvement levels across different time periods.</p>
            </div>
            <div className="flex items-center gap-2">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest hidden sm:block">Total Rate:</span>
                <div className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-xs font-black">
                    {Math.round((attendedCount / (attendedCount + missedCount || 1)) * 100)}% Presence
                </div>
            </div>
         </div>
      </div>

       {showCharts && historyItems.length > 0 && (
         <div className="p-4 border-b border-gray-100 dark:border-slate-700 bg-white dark:bg-slate-800">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Presence History Chart (NEW) */}
                <div className="bg-gray-50 dark:bg-slate-900/50 p-5 rounded-2xl border border-gray-100 dark:border-slate-800">
                    <PresenceHistoryChart items={historyItems} />
                </div>

                {/* Impact/Ratings Line Chart */}
                <div className="bg-gray-50 dark:bg-slate-900/50 p-5 rounded-2xl border border-gray-100 dark:border-slate-800">
                    <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-6 flex items-center gap-2">
                        <ActivityIcon className="w-4 h-4 text-orange-500" /> Member Impact Trend
                    </h4>
                    <ImpactLineChart items={historyItems} />
                </div>
            </div>
         </div>
      )}

      <div className="divide-y divide-gray-100 dark:divide-slate-700 max-h-[600px] overflow-y-auto">
        {filteredItems.length === 0 ? (
          <EmptyState />
        ) : (
          filteredItems.map((item) => <ActivityCard key={item.activity.id} item={item} />)
        )}
      </div>
    </div>
  );
};

// --- Sub-Components ---

const PresenceHistoryChart = ({ items }: { items: ActivityHistoryItem[] }) => {
    const [period, setPeriod] = useState<'month' | 'trimester' | 'year' | 'custom'>('month');
    const [customStart, setCustomStart] = useState('');
    const [customEnd, setCustomEnd] = useState('');

    // Pre-calculated periods
    const getGroupedData = () => {
        const attended = items.filter(i => i.status === 'attended');
        const now = new Date();
        
        let filteredAttended = attended;
        let groupBy: (d: Date) => string;
        let buckets: string[] = [];

        if (period === 'month') {
            const start = new Date(now.getFullYear(), now.getMonth(), 1);
            filteredAttended = attended.filter(i => new Date(i.activity.activity_begin_date) >= start);
            groupBy = (d) => `Day ${d.getDate()}`;
            // Simple: just days of current month
            const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
            buckets = Array.from({length: daysInMonth}, (_, i) => `Day ${i + 1}`);
        } else if (period === 'trimester') {
            const start = new Date();
            start.setMonth(now.getMonth() - 3);
            filteredAttended = attended.filter(i => new Date(i.activity.activity_begin_date) >= start);
            groupBy = (d) => d.toLocaleString('default', { month: 'short' });
            buckets = [];
            for(let i=3; i>=0; i--) {
                const d = new Date();
                d.setMonth(now.getMonth() - i);
                buckets.push(d.toLocaleString('default', { month: 'short' }));
            }
        } else if (period === 'year') {
            const start = new Date(now.getFullYear(), 0, 1);
            filteredAttended = attended.filter(i => new Date(i.activity.activity_begin_date) >= start);
            groupBy = (d) => d.toLocaleString('default', { month: 'short' });
            buckets = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        } else {
            // Custom
            const start = customStart ? new Date(customStart) : new Date(0);
            const end = customEnd ? new Date(customEnd) : new Date();
            filteredAttended = attended.filter(i => {
                const d = new Date(i.activity.activity_begin_date);
                return d >= start && d <= end;
            });
            groupBy = (d) => d.toLocaleDateString('default', { month: 'short', day: 'numeric' });
            // Sort by date for custom
            const sortedDates = filteredAttended
                .map(i => new Date(i.activity.activity_begin_date))
                .sort((a,b) => a.getTime() - b.getTime());
            
            buckets = Array.from(new Set(sortedDates.map(groupBy)));
        }

        const counts = new Map<string, number>();
        filteredAttended.forEach(i => {
            const key = groupBy(new Date(i.activity.activity_begin_date));
            counts.set(key, (counts.get(key) || 0) + 1);
        });

        return buckets.map(b => ({ label: b, count: counts.get(b) || 0 }));
    };

    const data = getGroupedData();
    const maxVal = Math.max(...data.map(d => d.count), 5);

    return (
        <div className="flex-1 flex flex-col min-h-[200px]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" /> Count of Presences
                </h4>
                <div className="flex p-1 bg-gray-200 dark:bg-slate-800 rounded-lg overflow-x-auto">
                    {(['month', 'trimester', 'year', 'custom'] as const).map(p => (
                        <button
                            key={p}
                            onClick={() => setPeriod(p)}
                            className={`px-2 py-1 text-[10px] font-black uppercase tracking-widest rounded-md transition-all whitespace-nowrap ${
                                period === p ? 'bg-white dark:bg-slate-700 text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            {p}
                        </button>
                    ))}
                </div>
            </div>

            {period === 'custom' && (
                <div className="flex gap-2 mb-4 animate-in slide-in-from-top-2">
                    <input 
                        type="date" 
                        value={customStart} 
                        onChange={e => setCustomStart(e.target.value)} 
                        className="bg-white dark:bg-slate-800 border dark:border-slate-700 text-[10px] p-1 rounded-md flex-1 outline-none focus:ring-1 focus:ring-blue-500 text-gray-700 dark:text-white"
                    />
                    <input 
                        type="date" 
                        value={customEnd} 
                        onChange={e => setCustomEnd(e.target.value)} 
                        className="bg-white dark:bg-slate-800 border dark:border-slate-700 text-[10px] p-1 rounded-md flex-1 outline-none focus:ring-1 focus:ring-blue-500 text-gray-700 dark:text-white"
                    />
                </div>
            )}

            <div className="flex-1 flex items-end justify-between gap-1 h-32 mt-auto">
                {data.map((d, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative h-full justify-end">
                        {d.count > 0 && (
                            <div className="absolute bottom-full mb-1 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 text-white text-[10px] font-bold rounded py-1 px-2 z-20 whitespace-nowrap">
                                {d.count} Activities
                            </div>
                        )}
                        <div 
                            className={`w-full rounded-t-lg transition-all duration-500 ${d.count > 0 ? 'bg-green-500/80 shadow-[0_-4px_12px_rgba(34,197,94,0.2)]' : 'bg-gray-200/50 dark:bg-slate-700/50'}`}
                            style={{ height: `${(d.count / maxVal) * 100}%`, minHeight: '4px' }}
                        />
                        <span className="text-[8px] font-bold text-gray-400 dark:text-gray-500 uppercase truncate w-full text-center">
                            {period === 'month' ? (i % 5 === 0 ? d.label : '') : d.label}
                        </span>
                    </div>
                ))}
            </div>
            {data.length === 0 && (
                <div className="flex flex-col items-center justify-center h-32 border-2 border-dashed border-gray-100 dark:border-slate-800 rounded-xl">
                    <span className="text-[10px] font-bold text-gray-400">No presences found for this range</span>
                </div>
            )}
        </div>
    );
};

const ImpactLineChart = ({ items }: { items: ActivityHistoryItem[] }) => {
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

    // 1. Filter attended items with ratings & sort by date ascending
    const ratedItems = items
        .filter(i => i.status === 'attended' && i.participation?.rate)
        .sort((a, b) => new Date(a.activity.activity_begin_date).getTime() - new Date(b.activity.activity_begin_date).getTime());

    if (ratedItems.length < 2) {
        return (
            <div className="flex-1 flex items-center justify-center text-xs text-gray-400 italic min-h-[120px]">
                Not enough rated activities to show trend.
            </div>
        );
    }

    // 2. Normalize Data for SVG
    const height = 120;
    const width = 240;
    const padding = 15;
    
    // Y-axis: Rating 0-5. Map 5 -> padding, 0 -> height-padding
    const getY = (rate: number) => height - padding - (rate / 5) * (height - 2 * padding);
    
    // X-axis: Dates. Distribute evenly for simplicity of "Trend"
    const getX = (index: number) => padding + (index / (ratedItems.length - 1)) * (width - 2 * padding);

    const points = ratedItems.map((item, index) => {
        const rate = item.participation?.rate || 0;
        return `${getX(index)},${getY(rate)}`;
    }).join(' ');

    const getRatingColor = (rate: number) => {
        if (rate >= 4.5) return "#22c55e"; // green-500
        if (rate >= 3.5) return "#a3e635"; // lime-400
        if (rate >= 2.5) return "#facc15"; // yellow-400
        if (rate >= 1.5) return "#fb923c"; // orange-400
        return "#f87171"; // red-400
    };

    return (
        <div className="flex-1 min-h-[120px] w-full relative group flex items-center justify-center">
            <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
                {/* Gradient Definition */}
                <defs>
                    <linearGradient id="lineGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--color-myPrimary, #3b82f6)" stopOpacity="0.5" />
                        <stop offset="100%" stopColor="var(--color-myPrimary, #3b82f6)" stopOpacity="0" />
                    </linearGradient>
                </defs>

                {/* Grid Lines */}
                {[1, 2, 3, 4, 5].map(r => (
                    <line key={r} x1={padding} y1={getY(r)} x2={width - padding} y2={getY(r)} stroke="#e5e7eb" strokeWidth="1" strokeDasharray="4" className="dark:stroke-slate-700" />
                ))}

                {/* Area Fill (Optional beautification) */}
                <polygon 
                    points={`${getX(0)},${height-padding} ${points} ${getX(ratedItems.length-1)},${height-padding}`}
                    fill="url(#lineGradient)"
                    className="opacity-20"
                />

                {/* The Line */}
                <polyline 
                    fill="none" 
                    stroke="var(--color-myPrimary, #3b82f6)" 
                    strokeWidth="3" 
                    points={points} 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    className="drop-shadow-sm"
                />

                {/* Data Points */}
                {ratedItems.map((item, index) => {
                    const rate = item.participation?.rate || 0;
                    const cx = getX(index);
                    const cy = getY(rate);
                    const isHovered = hoveredIndex === index;
                    const color = getRatingColor(rate);

                    return (
                        <g key={item.activity.id} 
                           onMouseEnter={() => setHoveredIndex(index)}
                           onMouseLeave={() => setHoveredIndex(null)}
                           className="cursor-pointer"
                        >
                            {/* Hover Halo */}
                            <circle 
                                cx={cx} cy={cy} r={isHovered ? 8 : 0} 
                                fill={color} opacity="0.3" 
                                className="transition-all duration-300"
                            />
                            {/* Main Dot */}
                            <circle 
                                cx={cx} cy={cy} r={isHovered ? 5 : 3.5} 
                                fill={isHovered ? color : "white"} 
                                stroke={color} 
                                strokeWidth="2.5"
                                className="transition-all duration-200"
                            />
                        </g>
                    );
                })}
            </svg>

            {/* Custom Tooltip Overlay */}
            {hoveredIndex !== null && ratedItems[hoveredIndex] && (
                <div 
                    className="absolute z-10 bg-slate-800 text-white text-xs rounded-lg py-1.5 px-3 shadow-xl pointer-events-none transform -translate-y-full transition-all"
                    style={{ 
                        left: `${(getX(hoveredIndex) / width) * 100}%`, 
                        top: `${(getY(ratedItems[hoveredIndex].participation?.rate || 0) / height) * 100}%`,
                        marginTop: '-12px',
                        transform: 'translateX(-50%)'
                    }}
                >
                    <div className="font-semibold whitespace-nowrap">{ratedItems[hoveredIndex].activity.name}</div>
                    <div className="flex items-center gap-1 text-slate-300">
                        <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" /> 
                        {ratedItems[hoveredIndex].participation?.rate}/5
                    </div>
                </div>
            )}
            
            <div className="absolute bottom-0 right-0 text-[10px] text-gray-400">Latest →</div>
        </div>
    );
};


const LoadingSkeleton = () => (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 p-6">
        <div className="animate-pulse space-y-4">
            <div className="h-6 bg-gray-200 dark:bg-slate-700 rounded w-1/4"></div>
            <div className="space-y-3">
                {[1, 2, 3].map(i => (
                    <div key={i} className="flex gap-4">
                        <div className="h-16 w-16 bg-gray-200 dark:bg-slate-700 rounded"></div>
                        <div className="flex-1 space-y-2">
                            <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-3/4"></div>
                            <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-1/2"></div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    </div>
);

const ErrorDisplay = ({ message }: { message: string }) => (
    <div className="p-4 text-red-500 bg-red-50 dark:bg-red-900/20 rounded-lg text-center">
        {message}
    </div>
);

const EmptyState = () => (
    <div className="p-8 text-center text-gray-500 dark:text-slate-400">
        <Calendar className="w-10 h-10 mx-auto mb-2 text-gray-300 dark:text-slate-600" />
        <p>No activities found in this section.</p>
    </div>
);

const ActivityCard = ({ item }: { item: ActivityHistoryItem }) => {
    const participantCount = item.activity.activity_participants?.[0]?.count || 0;
    
    return (
        <Link to={`/activities/${item.activity.id}`} className="block">
            <div className="p-4 hover:bg-gray-50 dark:hover:bg-slate-700/30 transition-colors relative group">
                <div className="flex gap-4">
                    {/* Visual Indicator Line */}
                    <div className={`absolute left-0 top-0 bottom-0 w-1 ${
                        item.status === 'attended' ? 'bg-green-500' : 
                        item.status === 'recommended' ? 'bg-amber-400' : 'bg-red-400'
                    }`} />

                    {/* Activity Image or Placeholder */}
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
                        {/* Status Overlay Icon */}
                        <div className="absolute bottom-1 right-1">
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
                                <h4 className={`font-medium truncate pr-2 ${
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
                                        {item.activity.type}
                                    </span>
                                    <div className="flex items-center gap-1 text-[10px] font-bold text-slate-500 bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded">
                                        <Users className="w-3 h-3 text-blue-500" />
                                        {participantCount}
                                    </div>
                                    <span className="text-xs text-slate-500">
                                        {new Date(item.activity.activity_begin_date).toLocaleDateString()}
                                    </span>
                                    {item.status === 'recommended' && (
                                        <span className="text-[10px] bg-amber-50 text-amber-600 px-1.5 py-0.5 rounded border border-amber-100 font-bold uppercase">
                                            Matched your interests
                                        </span>
                                    )}
                                </div>
                            </div>
                            
                            {/* Points Badge */}
                            <div className={`flex flex-col items-end ${item.status === 'missed' ? 'opacity-50' : ''}`}>
                                 {(item.activity.activity_points || 0) > 0 && (
                                <div className="flex items-center gap-1 px-2 py-1 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-500 rounded text-xs font-bold">
                                    <Award className="w-3 h-3" />
                                    {item.status === 'attended' ? '+' : ''}{item.activity.activity_points}
                                </div>
                                )}
                            </div>
                        </div>

                        {/* Feedback Section (Only for attended) */}
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
                                        <span className="text-xs text-slate-500 ml-1">Rating</span>
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

export default MemberActivities;
