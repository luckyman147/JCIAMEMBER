import { useState, useMemo } from "react";
import Navbar from "../../../Global_Components/navBar";
import MembersList from "../components/Members/MembersList";
import MembersStatistics from "../components/stats/MembersStatistics";
import ComplaintsOverview from "../../../Global_Components/ComplaintsOverview";
import { useMembers, useAllPointsHistory } from "../hooks/useMembers";
import { useAllMemberTasks } from "../../Tasks/hooks/useTasks";
import AddMemberModal from "../components/Members/AddMemberModal";
import { UserPlus, Users, ShieldCheck, User, LayoutPanelLeft, LayoutPanelTop, Search, ListFilter, ChevronDown, CreditCard, Download, X } from "lucide-react";
import { useAuth } from "../../Authentication/auth.context";
import { EXECUTIVE_LEVELS } from "../../../utils/roles";

import { useTranslation } from "react-i18next";
import { cn } from "../../../lib/utils";
import { downloadMembersAsExcel } from "../utils";
import { participationService } from "../../Activities/services/participationService";
import { toast } from "sonner";

export default function MembersPage() {
    const { t, i18n } = useTranslation();
    const isRTL = i18n.language === 'ar';
    const { data: members = [], isLoading: membersLoading } = useMembers();
    const { data: history = [], isLoading: historyLoading } = useAllPointsHistory();
    const { data: allTaskAssignments = [], isLoading: tasksLoading } = useAllMemberTasks();
    const { role } = useAuth();
    const isExecutive = EXECUTIVE_LEVELS.includes(role?.toLowerCase() || "");
    const [searchTerm, setSearchTerm] = useState("");
    const [sortBy, setSortBy] = useState("default");
    const [cotisationFilter, setCotisationFilter] = useState("all");
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [showStats, setShowStats] = useState(true);
    const [statsExpanded, setStatsExpanded] = useState(false);
    const [showDownloadModal, setShowDownloadModal] = useState(false);
    const [selectedRolesForDownload, setSelectedRolesForDownload] = useState<string[]>([]);
    const [includeTeams, setIncludeTeams] = useState(false);
    const [periodStart, setPeriodStart] = useState(`${new Date().getFullYear()}-01-01`);
    const [periodEnd, setPeriodEnd] = useState(new Date().toISOString().split('T')[0]);

    const handleDownload = async () => {
      try {
        const dataStart = Math.min(
          new Date(periodStart).getTime(),
          ...members.map(m => m.created_at ? new Date(m.created_at).getTime() : Infinity)
        );
        const earliestDataDate = new Date(dataStart).toISOString().split('T')[0];

        const memberIds = members.filter(m => !m.email?.includes('jci.hs') && m.role && m.role !== 'JCI Hammam Sousse').map(m => m.id);

        const promises: Promise<any>[] = [
          participationService.getParticipationsSince(memberIds, periodStart),
          participationService.getActivityTypeCountsSince(periodStart),
        ];

        let committeePromise: Promise<any> = Promise.resolve(undefined);
        if (includeTeams) {
          committeePromise = import('../../Activities/services/committeeService').then(m => m.committeeService.getMembersCommitteeStats());
        }
        promises.push(committeePromise);
        promises.push(participationService.getParticipationsWithDates(memberIds, earliestDataDate));
        promises.push(participationService.getAllActivitiesSince(earliestDataDate));
        promises.push(participationService.getAllActivitiesWithDetails(earliestDataDate));
        promises.push(participationService.getParticipationsWithActivityId(memberIds, earliestDataDate));

        const [participationMap, activityTypeCounts, committeeMap, rawParticipations, rawActivities, activityDetails, participationsWithActivityId] = await Promise.all(promises);

        await downloadMembersAsExcel(members, {
          selectedRoles: selectedRolesForDownload,
          includeTeams,
          periodStart,
          periodEnd,
          participationMap,
          activityTypeCounts,
          committeeMap,
          rawParticipations,
          rawActivities,
          activityDetails,
          participationsWithActivityId,
        });

        setShowDownloadModal(false);
      } catch {
        toast.error('Failed to download Excel');
      }
    };

    const loading = membersLoading || historyLoading || tasksLoading;

    const roleStats = useMemo(() => {
        const stats: Record<string, number> = {};
        members.forEach(m => {
            const r = m.role || 'Member';
            stats[r] = (stats[r] || 0) + 1;
        });
        return Object.entries(stats).sort((a, b) => b[1] - a[1]);
    }, [members]);

    const filteredMembers = useMemo(() => {
        let result = members.filter(m => 
            m.fullname.toLowerCase().includes(searchTerm.toLowerCase()) ||
            m.email?.toLowerCase().includes(searchTerm.toLowerCase())
        );

        // Filter by cotisation
        if (cotisationFilter !== 'all') {
            result = result.filter(m => {
                const [s1, s2] = m.cotisation_status || [false, false];
                const isPaid = s1 || s2;
                return cotisationFilter === 'paid' ? isPaid : !isPaid;
            });
        }

        // Sort
        if (sortBy === 'jps_desc') {
            result.sort((a, b) => (b.jps_score || 0) - (a.jps_score || 0));
        } else if (sortBy === 'jps_asc') {
            result.sort((a, b) => (a.jps_score || 0) - (b.jps_score || 0));
        } else if (sortBy === 'volunteering_desc') {
            result.sort((a, b) => (b.estimated_volunteering_hours || 0) - (a.estimated_volunteering_hours || 0));
        } else {
            // Default sort by points
            result.sort((a, b) => (b.points || 0) - (a.points || 0));
        }

        return result;
    }, [members, searchTerm, sortBy, cotisationFilter]);

    const uniqueRoles = useMemo(() => {
      const roles = new Set<string>();
      members.forEach(m => {
        if (m.role && m.role !== 'JCI Hammam Sousse' && !m.email?.includes('jci.hs')) {
          roles.add(m.role);
        }
      });
      return Array.from(roles).sort();
    }, [members]);

    return (
      <div className='min-h-screen bg-gray-50'>
        <Navbar />
        <main className='md:ml-64 pt-16 md:pt-6 pb-24 md:pb-0'>
          <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
            <div className='flex justify-between items-center mb-8'>
              <div>
                <h1 className='text-3xl font-bold text-gray-900'>
                  {t('members.title')}
                </h1>
                <p className='text-gray-500 mt-1'>{t('members.subtitle')}</p>
              </div>
              <div className='flex items-center gap-3'>
                <button
                  onClick={() => setShowStats(!showStats)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all font-semibold text-sm border shadow-sm ${
                    showStats
                      ? 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                      : 'bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-100'
                  }`}
                  title={
                    showStats ? t('profile.hideStats') : t('profile.showStats')
                  }
                >
                  {showStats ? (
                    <LayoutPanelTop className='w-4 h-4' />
                  ) : (
                    <LayoutPanelLeft className='w-4 h-4' />
                  )}
                  {showStats ? t('profile.hideStats') : t('profile.showStats')}
                </button>

                <button
                  onClick={() => setIsAddModalOpen(true)}
                  className='flex items-center gap-2 bg-(--color-myAccent) text-white px-5 py-2.5 rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 font-semibold'
                >
                  <UserPlus className='w-5 h-5' />
                  {t('members.addMember')}
                </button>
              </div>
            </div>

            {/* Quick Stats Ribbon */}
            {!loading && members.length > 0 && (
              <div
                className={`flex flex-wrap gap-4 mb-8 ${isRTL ? 'flex-row-reverse' : ''}`}
              >
                <div className='bg-white px-5 py-3 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-3'>
                  <div className='w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center'>
                    <Users className='w-5 h-5 text-blue-600' />
                  </div>
                  <div>
                    <p className='text-xs font-semibold text-gray-500 uppercase tracking-wider'>
                      {t('members.totalMembers')}
                    </p>
                    <p className='text-xl font-bold text-gray-900'>
                      {members.length}
                    </p>
                  </div>
                </div>

                {roleStats.map(([role, count]) => (
                  <div
                    key={role}
                    className='bg-white px-5 py-3 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-3'
                  >
                    <div className='w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center'>
                      {role.toLowerCase().includes('admin') ||
                      role.toLowerCase().includes('lead') ? (
                        <ShieldCheck className='w-5 h-5 text-amber-600' />
                      ) : (
                        <User className='w-5 h-5 text-gray-600' />
                      )}
                    </div>
                    <div>
                      <p className='text-xs font-semibold text-gray-500 uppercase tracking-wider'>
                        {role}
                      </p>
                      <p className='text-xl font-bold text-gray-900'>{count}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <AddMemberModal
              isOpen={isAddModalOpen}
              onClose={() => setIsAddModalOpen(false)}
            />

            {/* Leadership Tools Section */}
            {isExecutive && (
              <div className='mb-10'>
                <div className='flex items-center gap-2 mb-4 px-1'>
                  <ShieldCheck className='w-5 h-5 text-amber-600' />
                  <h2 className='text-xl font-bold text-gray-900'>
                    {t('members.leadership')}
                  </h2>
                </div>
                <ComplaintsOverview />
              </div>
            )}

            {/* Statistics Charts */}
            {!loading && members.length > 0 && showStats && (
              <div className="mb-8">
                <MembersStatistics
                  members={members}
                  tasks={allTaskAssignments}
                  history={history}
                  limit={statsExpanded ? Infinity : 2}
                />
                {!statsExpanded ? (
                  <button
                    onClick={() => setStatsExpanded(true)}
                    className="w-full mt-2 py-3 bg-white border border-gray-200 border-dashed rounded-xl text-sm font-semibold text-gray-500 hover:text-(--color-myPrimary) hover:border-(--color-myPrimary)/30 hover:bg-blue-50/30 transition-all"
                  >
                    {t('members.showMoreStats', 'Show more statistics')}
                  </button>
                ) : (
                  <button
                    onClick={() => setStatsExpanded(false)}
                    className="w-full mt-2 py-3 bg-white border border-gray-200 border-dashed rounded-xl text-sm font-semibold text-gray-500 hover:text-gray-700 hover:border-gray-300 transition-all"
                  >
                    {t('members.showLessStats', 'Show less')}
                  </button>
                )}
              </div>
            )}

            {/* Search and Filter */}
            <div className='flex flex-col md:flex-row gap-4 mb-8 items-center bg-white p-4 rounded-3xl shadow-sm border border-gray-100/80 backdrop-blur-sm'>
              <div className='relative flex-1 w-full group'>
                <Search className='absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors' />
                <input
                  type='text'
                  placeholder={t('common.search')}
                  className='w-full pl-13 pr-5 py-4 bg-gray-50/50 border border-transparent rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500/30 focus:bg-white transition-all text-sm font-medium placeholder:text-gray-400'
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <div className='flex flex-wrap md:flex-nowrap gap-3 w-full md:w-auto'>
                {/* Cotisation Filter Toggle */}
                <div className='flex bg-gray-100/50 p-1.5 rounded-2xl border border-gray-200/50 min-w-fit'>
                  {[
                    {
                      id: 'all',
                      icon: <CreditCard className='w-3.5 h-3.5' />,
                      label: t('members.filterCotisationAll', 'All'),
                    },
                    {
                      id: 'paid',
                      icon: (
                        <div className='w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-sm shadow-emerald-200' />
                      ),
                      label: t('members.paidOnly', 'Paid'),
                    },
                    {
                      id: 'unpaid',
                      icon: (
                        <div className='w-1.5 h-1.5 rounded-full bg-rose-500 shadow-sm shadow-rose-200' />
                      ),
                      label: t('members.unpaidOnly', 'Unpaid'),
                    },
                  ].map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => setCotisationFilter(opt.id as any)}
                      className={cn(
                        'flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300',
                        cotisationFilter === opt.id
                          ? 'bg-white text-blue-600 shadow-md shadow-blue-900/5 ring-1 ring-gray-100 scale-[1.02]'
                          : 'text-gray-400 hover:text-gray-600 hover:bg-white/50',
                      )}
                    >
                      {opt.icon}
                      <span>{opt.label}</span>
                    </button>
                  ))}
                </div>

                <div className='h-10 w-px bg-gray-100 hidden md:block' />

                {/* Sort Select */}
                <div className='relative group w-full md:w-64'>
                  <div className='absolute left-4 top-1/2 -translate-y-1/2 p-1.5 bg-blue-50 rounded-lg group-focus-within:bg-blue-600 group-hover:bg-blue-100 transition-colors'>
                    <ListFilter className='w-3.5 h-3.5 text-blue-600 group-focus-within:text-white transition-colors' />
                  </div>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className='w-full pl-12 pr-10 py-4 bg-gray-50/50 border border-transparent rounded-2xl outline-none appearance-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500/30 focus:bg-white transition-all text-[11px] font-black uppercase tracking-widest text-gray-700 cursor-pointer'
                  >
                    <option value='default'>
                      {t('members.sortBy', 'Sort By')}
                    </option>
                    <option value='jps_desc'>
                      🏆 {t('members.sortJPSDesc', 'JPS: High to Low')}
                    </option>
                    <option value='jps_asc'>
                      📈 {t('members.sortJPSAsc', 'JPS: Low to High')}
                    </option>
                    <option value='volunteering_desc'>
                      ⌛ {t('members.sortVolDesc', 'Hours: High to Low')}
                    </option>
                  </select>
                  <ChevronDown className='absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none group-hover:text-blue-500 transition-colors group-hover:translate-y-[-40%]' />
                </div>

                <button
                  onClick={() => setShowDownloadModal(true)}
                  className='flex items-center gap-2 px-4 py-4 bg-emerald-50 text-emerald-700 rounded-2xl hover:bg-emerald-100 transition-all font-semibold text-xs uppercase tracking-widest border border-emerald-200 whitespace-nowrap'
                  title={t('members.downloadExcel', 'Télécharger Excel')}
                >
                  <Download className='w-4 h-4' />
                  {t('members.downloadExcel', 'Télécharger')}
                </button>
              </div>
            </div>

            {/* Members List */}
            <MembersList
              members={filteredMembers}
              loading={loading}
              sortBy={sortBy}
            />

          </div>

          {showDownloadModal && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 shrink-0">
                  <h2 className="text-xl font-semibold text-gray-900">
                    {t('members.downloadOptions')}
                  </h2>
                  <button
                    onClick={() => setShowDownloadModal(false)}
                    className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                      {t('members.rolesToInclude')}
                    </p>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {uniqueRoles.map(role => (
                        <label key={role} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selectedRolesForDownload.length === 0 || selectedRolesForDownload.includes(role)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedRolesForDownload(prev =>
                                  prev.length === 0 ? prev : [...prev, role]
                                );
                              } else {
                                setSelectedRolesForDownload(prev =>
                                  prev.length === 0
                                    ? uniqueRoles.filter(r => r !== role)
                                    : prev.filter(r => r !== role)
                                );
                              }
                            }}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700">{role}</span>
                        </label>
                      ))}
                      {uniqueRoles.length > 1 && (
                        <label className="flex items-center gap-2 cursor-pointer border-t border-gray-100 pt-2 mt-2">
                          <input
                            type="checkbox"
                            checked={selectedRolesForDownload.length === 0}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedRolesForDownload([]);
                              }
                            }}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm font-semibold text-gray-700">{t('members.allRoles')}</span>
                        </label>
                      )}
                    </div>
                    {selectedRolesForDownload.length > 0 && selectedRolesForDownload.length < uniqueRoles.length && (
                      <p className="text-xs text-gray-400 mt-1">{selectedRolesForDownload.length} {t('members.rolesSelected')}</p>
                    )}
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                      {t('members.period')}
                    </p>
                    <div className="flex gap-2">
                      <input
                        type="date"
                        value={periodStart}
                        onChange={e => setPeriodStart(e.target.value)}
                        className="flex-1 px-3 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      />
                      <span className="text-xs text-gray-400 self-center">{t('members.to')}</span>
                      <input
                        type="date"
                        value={periodEnd}
                        onChange={e => setPeriodEnd(e.target.value)}
                        className="flex-1 px-3 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="flex items-center justify-between cursor-pointer">
                      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        {t('members.includeCommittees')}
                      </span>
                      <button
                        type="button"
                        onClick={() => setIncludeTeams(!includeTeams)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${includeTeams ? 'bg-blue-600' : 'bg-gray-300'}`}
                      >
                        <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${includeTeams ? 'translate-x-5' : 'translate-x-0.5'}`} />
                      </button>
                    </label>
                  </div>
                </div>

                <div className="p-6 border-t border-gray-100 flex gap-2 shrink-0">
                  <button
                    onClick={() => setShowDownloadModal(false)}
                    className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all font-semibold text-sm"
                  >
                    {t('common.cancel')}
                  </button>
                  <button
                    onClick={handleDownload}
                    className="flex-1 px-4 py-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-all font-semibold text-sm"
                  >
                    {t('members.download')}
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    )
}
