import type { Member } from './types';
import type { MemberCommitteeStats } from '../Activities/services/committeeService';
import ExcelJS from 'exceljs';
import { renderPieChart, renderBarChart, type ChartDatum } from './chartRenderer';

export interface MemberParticipationMap {
  [memberId: string]: {
    events: number;
    meetings: number;
    formations: number;
    assemblies: number;
  }
}

export interface RawParticipation {
  user_id: string;
  registered_at: string;
  activity: { type: string } | null;
}

export interface RawActivity {
  type: string;
  activity_begin_date: string;
}
export interface ActivityDetail {
  id: string;
  name: string;
  type: string;
  activity_begin_date: string;
}
export interface ParticipationActivityId {
  user_id: string;
  activity: { id: string } | null;
}

export interface DownloadOptions {
  selectedRoles: string[];
  includeTeams: boolean;
  periodStart: string;
  periodEnd: string;
  participationMap?: MemberParticipationMap;
  activityTypeCounts?: { events: number; meetings: number; formations: number; assemblies: number };
  committeeMap?: Record<string, MemberCommitteeStats>;
  rawParticipations?: RawParticipation[];
  rawActivities?: RawActivity[];
  activityDetails?: ActivityDetail[];
  participationsWithActivityId?: ParticipationActivityId[];
}

const roleColors: Record<string, { bg: string; text: string }> = {
    'President': { bg: 'FF1B3A5C', text: 'FFFFFFFF' },
    'Vice-President': { bg: 'FF56BDA3', text: 'FFFFFFFF' },
    'Conseiller': { bg: 'FFE8A838', text: 'FFFFFFFF' },
    'Member': { bg: 'FF3B82F6', text: 'FFFFFFFF' },
    'New Member': { bg: 'FF9CA3AF', text: 'FFFFFFFF' },
    'VP': { bg: 'FF56BDA3', text: 'FFFFFFFF' },
};

const BASE_COLUMN_DEFS = [
  { key: 'index', header: 'N°', width: 8, color: 'FF1B3A5C' },
  { key: 'name', header: 'Nom', width: 32, color: 'FF56BDA3' },
  { key: 'email', header: 'Email', width: 38, color: 'FFE8A838' },
  { key: 'phone', header: 'Téléphone', width: 22, color: 'FF3B82F6' },
  { key: 'role', header: 'Rôle', width: 24, color: 'FF8B5CF6' },
  { key: 'joined', header: 'Adhésion', width: 18, color: 'FF0EA5E9' },
  { key: 'events', header: 'Événements', width: 14, color: 'FFF59E0B' },
  { key: 'meetings', header: 'Réunions', width: 14, color: 'FFEF4444' },
  { key: 'trainings', header: 'Formations', width: 14, color: 'FF6366F1' },
  { key: 'assembly', header: 'Assemblée', width: 14, color: 'FF8B5CF6' },
  { key: 'presence', header: 'Taux présence', width: 18, color: 'FF56BDA3' },
];

const COLUMNS_WITH_POST = [
  { key: 'post', header: 'Poste', width: 28, color: 'FF10B981' },
];

const TEAM_COLUMN_DEFS = [
  { key: 'committees', header: 'Comités', width: 14, color: 'FFE8A838' },
  { key: 'sponsoring', header: 'Sponsoring', width: 15, color: 'FF10B981' },
  { key: 'media', header: 'Média', width: 14, color: 'FF6366F1' },
  { key: 'program', header: 'Programme', width: 15, color: 'FF1B3A5C' },
  { key: 'logistic', header: 'Logistique', width: 15, color: 'FF56BDA3' },
];

const DECISION_COLUMN_DEF = { key: 'decision', header: 'Décision', width: 20, color: 'FFDC2626' };

const getPhoneDisplay = (phone?: string): string => {
    if (!phone) return '-';
    const cleaned = phone.replace(/\D/g, '');
    const num = parseInt(cleaned, 10);
    return num > 20000000 ? phone : '-';
};

const isSimpleRole = (role: string) => {
  const lower = role.trim().toLowerCase();
  return lower === 'member' || lower === 'new member' || lower === 'membre' || lower === 'nouveau membre';
};

const getPresenceRate = (
  member: Member,
  periodStart: string,
  periodEnd: string,
  rawParticipations?: RawParticipation[],
  rawActivities?: RawActivity[]
): { rate: string; percent: number; joinedAfterPeriod: boolean } => {
  if (!rawParticipations || !rawActivities || !member.created_at) {
    return { rate: '-', percent: -1, joinedAfterPeriod: false };
  }

  if (new Date(member.created_at) > new Date(periodEnd)) {
    return { rate: '-', percent: -2, joinedAfterPeriod: true };
  }

  const memberJoin = member.joined_at ? new Date(member.joined_at) : new Date(member.created_at);
  const startDate = new Date(Math.max(memberJoin.getTime(), new Date(periodStart).getTime()));
  const endDate = new Date(periodEnd);

  const memberParticipationsInPeriod = rawParticipations.filter(p => {
    if (p.user_id !== member.id) return false;
    const d = new Date(p.registered_at);
    return d >= startDate && d <= endDate;
  });

  const totalActivitiesSinceMember = rawActivities.filter(a => {
    const d = new Date(a.activity_begin_date);
    return d >= memberJoin && d <= endDate;
  });

  if (totalActivitiesSinceMember.length === 0) {
    return { rate: memberParticipationsInPeriod.length > 0 ? '100%' : '0%', percent: memberParticipationsInPeriod.length > 0 ? 100 : 0, joinedAfterPeriod: false };
  }

  const percent = Math.round((memberParticipationsInPeriod.length / totalActivitiesSinceMember.length) * 100);
  return { rate: `${percent}%`, percent, joinedAfterPeriod: false };
};

export const getDecision = (role: string, presencePercent: number): string => {
  if (!isSimpleRole(role)) return '-';
  if (presencePercent >= 0 && presencePercent <= 20) return 'À exclure';
  if (presencePercent >= 21 && presencePercent <= 40) return 'À encourager';
  return '-';
};

export const downloadMembersAsExcel = async (
  members: Member[],
  options: DownloadOptions
): Promise<void> => {
    const { selectedRoles, includeTeams, periodStart, periodEnd, participationMap, committeeMap, rawParticipations, rawActivities, activityDetails, participationsWithActivityId } = options;

    const groupedMembers = members.reduce((acc, member) => {
        if (!member.role || member.role === 'JCI Hammam Sousse') return acc;
        if (member.email?.includes('jci.hs')) return acc;
        if (selectedRoles.length > 0 && !selectedRoles.includes(member.role)) return acc;
        if (!acc[member.role]) acc[member.role] = [];
        acc[member.role].push(member);
        return acc;
    }, {} as Record<string, Member[]>);

    const sortedRoles = Object.keys(groupedMembers).sort();
    const isSingleRole = sortedRoles.length === 1;

    const hidePost = isSingleRole
      ? true
      : (selectedRoles.length === 0
          ? members.every(m => isSimpleRole(m.role))
          : selectedRoles.every(r => isSimpleRole(r)));

    let columnDefs = BASE_COLUMN_DEFS;
    if (isSingleRole) {
      columnDefs = columnDefs.filter(d => d.key !== 'role');
    } else if (!hidePost) {
      const idx = columnDefs.findIndex(d => d.key === 'role');
      columnDefs = [
        ...columnDefs.slice(0, idx + 1),
        ...COLUMNS_WITH_POST,
        ...columnDefs.slice(idx + 1),
      ];
    }
    if (includeTeams) {
      columnDefs = [...columnDefs, ...TEAM_COLUMN_DEFS];
    }
    columnDefs = [...columnDefs, DECISION_COLUMN_DEF];

    const TOTAL_COLS = columnDefs.length;
    const columnHeaders = columnDefs.map(c => c.header);
    const columnColors = columnDefs.map(c => c.color);
    const columnWidths = columnDefs.map(c => c.width);

    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Membres');

    ws.columns = columnWidths.map(w => ({ width: w }));

    let currentRow = 1;

    ws.mergeCells(currentRow, 1, currentRow, TOTAL_COLS);
    const titleRow = ws.getRow(currentRow);
    titleRow.getCell(1).value = isSingleRole
      ? `MEMBRES JCI HAMMAM SOUSSE — ${sortedRoles[0].toUpperCase()}`
      : 'MEMBRES JCI HAMMAM SOUSSE';
    titleRow.getCell(1).font = { name: 'Arial', size: 18, bold: true, color: { argb: 'FFFFFFFF' } };
    titleRow.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0D2137' } };
    titleRow.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
    titleRow.height = 35;
    currentRow++;

    ws.getRow(currentRow).height = 8;
    currentRow++;

    const headerRow = ws.getRow(currentRow);
    headerRow.font = { name: 'Arial', size: 12, bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.height = 28;

    for (let idx = 0; idx < TOTAL_COLS; idx++) {
        const cell = headerRow.getCell(idx + 1);
        cell.value = columnHeaders[idx];
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: columnColors[idx] || 'FF6366F1' } };
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
        cell.border = {
            top: { style: 'medium', color: { argb: 'FF000000' } },
            bottom: { style: 'medium', color: { argb: 'FF000000' } },
            left: { style: 'thin', color: { argb: 'FF000000' } },
            right: { style: 'thin', color: { argb: 'FF000000' } }
        };
    }
    currentRow++;

    let globalIndex = 1;
    const statusCounts: Record<string, number> = {};

    sortedRoles.forEach((role, roleIndex) => {
        const roleMembers = groupedMembers[role];
        const colors = roleColors[role] || { bg: 'FFE5E7EB', text: 'FF1F2937' };

        roleMembers.forEach((member, memberIndex) => {
            const row = ws.getRow(currentRow);
            const counts = participationMap?.[member.id];
            const cStats = committeeMap?.[member.id];
            const presence = getPresenceRate(member, periodStart, periodEnd, rawParticipations, rawActivities);

            const getStatus = () => {
              if (member.is_banned) return 'Suspendu';
              if (presence.joinedAfterPeriod) return 'Pas encore membre';
              if (presence.percent >= 0 && presence.percent <= 20) return 'Inactif';
              return 'Actif';
            };

            const status = getStatus();
            statusCounts[status] = (statusCounts[status] || 0) + 1;

            const cellValues: Record<string, string | number> = {
                index: globalIndex,
                name: member.fullname,
                email: member.email || '-',
                phone: getPhoneDisplay(member.phone),
                role: role,
                joined: member.created_at ? new Date(member.created_at).toLocaleDateString() : '-',
                events: counts?.events ?? '-',
                meetings: counts?.meetings ?? '-',
                trainings: counts?.formations ?? '-',
                assembly: counts?.assemblies ?? '-',
                status: status,
                presence: presence.joinedAfterPeriod ? '-' : presence.rate,
                decision: getDecision(role, presence.percent),
            };

            if (!hidePost) {
              cellValues.post = member.poste?.name || '-';
            }

            if (includeTeams) {
                cellValues.committees = cStats ? cStats.totalCommittees : 0;
                cellValues.sponsoring = cStats?.sponsoring ?? 0;
                cellValues.media = cStats?.media ?? 0;
                cellValues.program = cStats?.program ?? 0;
                cellValues.logistic = cStats?.logistic ?? 0;
            }

            columnDefs.forEach((def, colIdx) => {
                const cell = row.getCell(colIdx + 1);
                cell.value = cellValues[def.key] ?? '-';
            });

            const isEmptyPresence = presence.percent === -1 || presence.percent === -2;
            const hasLowPresence = presence.percent >= 0 && presence.percent < 10;
            const hasMediumPresence = presence.percent >= 10 && presence.percent <= 20;

            const bgColor = memberIndex % 2 === 0 ? colors.bg : 'FFF9FAFB';
            for (let col = 1; col <= TOTAL_COLS; col++) {
                const cell = row.getCell(col);
                const isPresenceCol = columnDefs[col - 1]?.key === 'presence';
                const isStatusCol = columnDefs[col - 1]?.key === 'status';
                const isDecisionCol = columnDefs[col - 1]?.key === 'decision';
                cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgColor } };
                cell.font = {
                    name: 'Arial',
                    size: 11,
                    color: { argb: memberIndex % 2 === 0 ? colors.text : 'FF1F2937' }
                };
                if (isPresenceCol && isEmptyPresence) {
                    cell.font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FFFF0000' } };
                } else if (isPresenceCol && hasLowPresence) {
                    cell.font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FFFF0000' } };
                } else if (isPresenceCol && hasMediumPresence) {
                    cell.font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FFFF8C00' } };
                }
                if (isStatusCol && isEmptyPresence) {
                    cell.font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FFFF0000' } };
                }
                if (isDecisionCol && cellValues.decision === 'À exclure') {
                    cell.font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FFFF0000' } };
                } else if (isDecisionCol && cellValues.decision === 'À encourager') {
                    cell.font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FFFF8C00' } };
                }
                cell.alignment = { horizontal: 'center', vertical: 'middle' };
                cell.border = {
                    top: { style: 'thin', color: { argb: 'FFE5E7EB' } },
                    bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } },
                    left: { style: 'thin', color: { argb: 'FFE5E7EB' } },
                    right: { style: 'thin', color: { argb: 'FFE5E7EB' } }
                };
            }

            row.height = 24;
            currentRow++;
            globalIndex++;
        });

        if (roleIndex < sortedRoles.length - 1) {
            currentRow++;
        }
    });

    currentRow++;

    ws.mergeCells(currentRow, 1, currentRow, TOTAL_COLS);
    const summaryTitleRow = ws.getRow(currentRow);
    summaryTitleRow.getCell(1).value = 'RÉSUMÉ';
    summaryTitleRow.getCell(1).font = { name: 'Arial', size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
    summaryTitleRow.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0D2137' } };
    summaryTitleRow.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
    summaryTitleRow.height = 28;
    currentRow++;

    const filteredMembersForSummary = Object.values(groupedMembers).flat();
    const totalMembers = filteredMembersForSummary.length;
    const summaryRow = ws.getRow(currentRow);
    summaryRow.getCell(2).value = 'Total des membres :';
    summaryRow.getCell(2).font = { name: 'Arial', size: 12, bold: true, color: { argb: 'FF1B3A5C' } };
    summaryRow.getCell(4).value = totalMembers;
    summaryRow.getCell(4).font = { name: 'Arial', size: 12, bold: true, color: { argb: 'FF1B3A5C' } };
    summaryRow.getCell(4).alignment = { horizontal: 'center', vertical: 'middle' };
    summaryRow.height = 24;
    for (let col = 2; col <= TOTAL_COLS; col++) {
        summaryRow.getCell(col).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0F4FA' } };
        summaryRow.getCell(col).border = {
            top: { style: 'thin', color: { argb: 'FFE5E7EB' } },
            bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } }
        };
    }
    currentRow++;

    if (participationMap) {
        let totalEvents = 0;
        let totalMeetings = 0;
        let totalFormations = 0;
        let totalAssemblies = 0;
        let membersWithData = 0;

        filteredMembersForSummary.forEach(m => {
            const c = participationMap[m.id]
            if (c) {
                totalEvents += c.events
                totalMeetings += c.meetings
                totalFormations += c.formations
                totalAssemblies += c.assemblies
                membersWithData++
            }
        })

        ws.mergeCells(currentRow, 1, currentRow, TOTAL_COLS);
        const partTitleRow = ws.getRow(currentRow);
        const periodLabel = `${new Date(periodStart).toLocaleDateString()} - ${new Date(periodEnd).toLocaleDateString()}`;
        partTitleRow.getCell(1).value = `RÉSUMÉ DES PARTICIPATIONS (${periodLabel})`;
        partTitleRow.getCell(1).font = { name: 'Arial', size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
        partTitleRow.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0EA5E9' } };
        partTitleRow.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
        partTitleRow.height = 28;
        currentRow++;

        const avgEvents = membersWithData > 0 ? (totalEvents / membersWithData).toFixed(1) : '-';
        const avgMeetings = membersWithData > 0 ? (totalMeetings / membersWithData).toFixed(1) : '-';
        const avgFormations = membersWithData > 0 ? (totalFormations / membersWithData).toFixed(1) : '-';
        const avgAssemblies = membersWithData > 0 ? (totalAssemblies / membersWithData).toFixed(1) : '-';
        const totalAll = totalEvents + totalMeetings + totalFormations + totalAssemblies;
        const overallAvg = membersWithData > 0 ? (totalAll / membersWithData / 4).toFixed(1) : '-';

        const statsData: [string, string, string, string, string, string][] = [
            ['Total des participations', totalEvents.toString(), totalMeetings.toString(), totalFormations.toString(), totalAssemblies.toString(), (totalAll / membersWithData).toFixed(1)],
            ['Moyenne par membre', avgEvents, avgMeetings, avgFormations, avgAssemblies, overallAvg],
        ]

        if (options.activityTypeCounts) {
            const rateEvents = options.activityTypeCounts.events > 0 ? ((totalEvents / options.activityTypeCounts.events)).toFixed(1) : '-'
            const rateMeetings = options.activityTypeCounts.meetings > 0 ? ((totalMeetings / options.activityTypeCounts.meetings)).toFixed(1) : '-'
            const rateFormations = options.activityTypeCounts.formations > 0 ? ((totalFormations / options.activityTypeCounts.formations)).toFixed(1) : '-'
            const rateAssemblies = options.activityTypeCounts.assemblies > 0 ? ((totalAssemblies / options.activityTypeCounts.assemblies)).toFixed(1) : '-'
            statsData.push([
                'Taux moyen par type',
                `(moy ${rateEvents}/évén)`,
                `(moy ${rateMeetings}/réun)`,
                `(moy ${rateFormations}/form)`,
                `(moy ${rateAssemblies}/ass)`,
                '-'
            ])
        }

        const eventsCol = columnDefs.findIndex(d => d.key === 'events') + 1;
        const meetingsCol = columnDefs.findIndex(d => d.key === 'meetings') + 1;
        const trainingsCol = columnDefs.findIndex(d => d.key === 'trainings') + 1;
        const assemblyCol = columnDefs.findIndex(d => d.key === 'assembly') + 1;
        const overallCol = columnDefs.findIndex(d => d.key === 'overall') + 1;

        statsData.forEach(([label, ev, mt, tr, asm, overall]) => {
            const row = ws.getRow(currentRow)
            row.getCell(2).value = label
            row.getCell(2).font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FF374151' } }
            if (eventsCol > 0) {
                row.getCell(eventsCol).value = ev
                row.getCell(eventsCol).font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FF1B3A5C' } }
                row.getCell(eventsCol).alignment = { horizontal: 'center', vertical: 'middle' }
            }
            if (meetingsCol > 0) {
                row.getCell(meetingsCol).value = mt
                row.getCell(meetingsCol).font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FF1B3A5C' } }
                row.getCell(meetingsCol).alignment = { horizontal: 'center', vertical: 'middle' }
            }
            if (trainingsCol > 0) {
                row.getCell(trainingsCol).value = tr
                row.getCell(trainingsCol).font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FF1B3A5C' } }
                row.getCell(trainingsCol).alignment = { horizontal: 'center', vertical: 'middle' }
            }
            if (assemblyCol > 0) {
                row.getCell(assemblyCol).value = asm
                row.getCell(assemblyCol).font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FF1B3A5C' } }
                row.getCell(assemblyCol).alignment = { horizontal: 'center', vertical: 'middle' }
            }
            if (overallCol > 0) {
                row.getCell(overallCol).value = overall
                row.getCell(overallCol).font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FF1B3A5C' } }
                row.getCell(overallCol).alignment = { horizontal: 'center', vertical: 'middle' }
            }
            row.height = 22
            for (let col = 2; col <= TOTAL_COLS; col++) {
                row.getCell(col).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0F9FF' } }
                row.getCell(col).border = { bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } } }
            }
            currentRow++
        })

        currentRow++
    }

    currentRow++;

    sortedRoles.forEach((role) => {
        const count = groupedMembers[role].length;
        const row = ws.getRow(currentRow);
        row.getCell(2).value = `${role}:`;
        row.getCell(2).font = { name: 'Arial', size: 11, color: { argb: 'FF374151' } };
        row.getCell(4).value = count;
        row.getCell(4).font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FF1B3A5C' } };
        row.getCell(4).alignment = { horizontal: 'center', vertical: 'middle' };
        row.height = 22;
        for (let col = 2; col <= TOTAL_COLS; col++) {
            row.getCell(col).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFAFAFA' } };
            row.getCell(col).border = {
                bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } }
            };
        }
        currentRow++;
    });

    if (includeTeams && committeeMap) {
        currentRow++;

        ws.mergeCells(currentRow, 1, currentRow, TOTAL_COLS);
        const comTitleRow = ws.getRow(currentRow);
        comTitleRow.getCell(1).value = 'RÉSUMÉ DES COMITÉS';
        comTitleRow.getCell(1).font = { name: 'Arial', size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
        comTitleRow.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1B3A5C' } };
        comTitleRow.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
        comTitleRow.height = 28;
        currentRow++;

        let totalSponsoring = 0;
        let totalMedia = 0;
        let totalProgram = 0;
        let totalLogistic = 0;
        let totalCommittees = 0;
        let membersWithCommittees = 0;

        Object.values(committeeMap).forEach(stats => {
            totalSponsoring += stats.sponsoring;
            totalMedia += stats.media;
            totalProgram += stats.program;
            totalLogistic += stats.logistic;
            totalCommittees += stats.totalCommittees;
            if (stats.totalCommittees > 0) membersWithCommittees++;
        });

        const avgSponsoring = membersWithCommittees > 0 ? (totalSponsoring / membersWithCommittees).toFixed(1) : '0';
        const avgMedia = membersWithCommittees > 0 ? (totalMedia / membersWithCommittees).toFixed(1) : '0';
        const avgProgram = membersWithCommittees > 0 ? (totalProgram / membersWithCommittees).toFixed(1) : '0';
        const avgLogistic = membersWithCommittees > 0 ? (totalLogistic / membersWithCommittees).toFixed(1) : '0';
        const avgTotal = membersWithCommittees > 0 ? (totalCommittees / membersWithCommittees).toFixed(1) : '0';

        const committeesCol = columnDefs.findIndex(d => d.key === 'committees') + 1;
        const sponsoringCol = columnDefs.findIndex(d => d.key === 'sponsoring') + 1;
        const mediaCol = columnDefs.findIndex(d => d.key === 'media') + 1;
        const programCol = columnDefs.findIndex(d => d.key === 'program') + 1;
        const logisticCol = columnDefs.findIndex(d => d.key === 'logistic') + 1;

        const comStatsRows: [string, string, string, string, string, string][] = [
            ['Total des adhésions aux comités', totalSponsoring.toString(), totalMedia.toString(), totalProgram.toString(), totalLogistic.toString(), totalCommittees.toString()],
            ['Moyenne par membre', avgSponsoring, avgMedia, avgProgram, avgLogistic, avgTotal],
        ];

        comStatsRows.forEach(([label, sp, me, pr, lo, total]) => {
            const row = ws.getRow(currentRow);
            row.getCell(2).value = label;
            row.getCell(2).font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FF374151' } };
            if (committeesCol > 0) {
                row.getCell(committeesCol).value = total;
                row.getCell(committeesCol).font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FF1B3A5C' } };
                row.getCell(committeesCol).alignment = { horizontal: 'center', vertical: 'middle' };
            }
            if (sponsoringCol > 0) {
                row.getCell(sponsoringCol).value = sp;
                row.getCell(sponsoringCol).font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FF56BDA3' } };
                row.getCell(sponsoringCol).alignment = { horizontal: 'center', vertical: 'middle' };
            }
            if (mediaCol > 0) {
                row.getCell(mediaCol).value = me;
                row.getCell(mediaCol).font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FF56BDA3' } };
                row.getCell(mediaCol).alignment = { horizontal: 'center', vertical: 'middle' };
            }
            if (programCol > 0) {
                row.getCell(programCol).value = pr;
                row.getCell(programCol).font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FF56BDA3' } };
                row.getCell(programCol).alignment = { horizontal: 'center', vertical: 'middle' };
            }
            if (logisticCol > 0) {
                row.getCell(logisticCol).value = lo;
                row.getCell(logisticCol).font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FF56BDA3' } };
                row.getCell(logisticCol).alignment = { horizontal: 'center', vertical: 'middle' };
            }
            row.height = 22;
            for (let col = 2; col <= TOTAL_COLS; col++) {
                row.getCell(col).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0F4FA' } };
                row.getCell(col).border = { bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } } };
            }
            currentRow++;
        });
    }

    currentRow += 2;

    let attendanceByActivity: Record<string, Set<string>> = {};
    if (activityDetails && participationsWithActivityId) {
      const distributionResult = addDistributionTable(ws, currentRow, groupedMembers, activityDetails, participationsWithActivityId, periodEnd);
      currentRow = distributionResult.nextRow;
      attendanceByActivity = distributionResult.attendanceByActivity;
    }

    if (participationMap) {
      currentRow = addChartsSection(wb, ws, currentRow, groupedMembers, statusCounts, participationMap, activityDetails ?? [], attendanceByActivity, periodEnd);
    }

    const buf = await wb.xlsx.writeBuffer();
    const blob = new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Membres_JCI_Hammam_Sousse_${new Date().toISOString().split('T')[0]}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
};

export const addDistributionTable = (
  ws: ExcelJS.Worksheet,
  startRow: number,
  groupedMembers: Record<string, Member[]>,
  activityDetails: ActivityDetail[],
  participationsWithActivityId: ParticipationActivityId[],
  periodEnd: string
): { nextRow: number; attendanceByActivity: Record<string, Set<string>> } => {
  const filteredMembers = Object.values(groupedMembers).flat();
  const memberSet = new Set(filteredMembers.map(m => m.id));

  const attendanceByActivity: Record<string, Set<string>> = {};
  for (const p of participationsWithActivityId) {
    const actId = p.activity?.id;
    if (!actId || !memberSet.has(p.user_id)) continue;
    if (!attendanceByActivity[actId]) attendanceByActivity[actId] = new Set();
    attendanceByActivity[actId].add(p.user_id);
  }

  let row = startRow;

  if (activityDetails.length === 0 || filteredMembers.length === 0) {
    ws.getCell(row, 1).value = `DISTRIBUTION PAR ACTIVITÉ`;
    ws.getCell(row, 1).font = { name: 'Arial', size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
    ws.getCell(row, 1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0D2137' } };
    row++;
    ws.getCell(row, 1).value = 'Aucune activité dans la période sélectionnée';
    ws.getCell(row, 1).font = { name: 'Arial', size: 11, italic: true, color: { argb: 'FF9CA3AF' } };
    row++;
    return { nextRow: row + 1, attendanceByActivity };
  }

  const SECTION_COLS = activityDetails.length + 2;

  ws.mergeCells(row, 1, row, SECTION_COLS);
  const titleRow = ws.getRow(row);
  titleRow.getCell(1).value = `DISTRIBUTION PAR ACTIVITÉ`;
  titleRow.getCell(1).font = { name: 'Arial', size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
  titleRow.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0D2137' } };
  titleRow.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
  titleRow.height = 28;
  row++;

  ws.getColumn(2).width = Math.max(ws.getColumn(2).width ?? 0, 34);
  activityDetails.forEach((activity, i) => {
    const col = i + 3;
    const desired = Math.max(22, activity.name.length + 4);
    ws.getColumn(col).width = Math.max(ws.getColumn(col).width ?? 0, desired);
  });

  const headerRow = ws.getRow(row);
  headerRow.getCell(2).value = 'Membre';
  headerRow.getCell(2).font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
  headerRow.getCell(2).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1B3A5C' } };
  headerRow.getCell(2).alignment = { horizontal: 'center', vertical: 'middle' };
  activityDetails.forEach((activity, i) => {
    const cell = headerRow.getCell(i + 3);
    cell.value = activity.name;
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0D2137' } };
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
  });
  headerRow.height = 32;
  row++;

  const periodEndDate = new Date(periodEnd);

  filteredMembers.forEach((member, memberIdx) => {
    const rowObj = ws.getRow(row);
    const memberJoin = member.joined_at ? new Date(member.joined_at) : (member.created_at ? new Date(member.created_at) : null);
    const joinedAfterPeriod = memberJoin ? memberJoin > periodEndDate : false;

    rowObj.getCell(2).value = member.fullname;
    rowObj.getCell(2).font = { name: 'Arial', size: 10, bold: true };
    rowObj.getCell(2).alignment = { vertical: 'middle' };

    activityDetails.forEach((activity, i) => {
      const cell = rowObj.getCell(i + 3);

      if (joinedAfterPeriod) {
        cell.value = '-';
        cell.font = { name: 'Arial', size: 10, color: { argb: 'FF9CA3AF' } };
      } else if (attendanceByActivity[activity.id]?.has(member.id)) {
        cell.value = '✓';
        cell.font = { name: 'Arial', size: 12, color: { argb: 'FF10B981' }, bold: true };
      } else {
        cell.value = '✗';
        cell.font = { name: 'Arial', size: 10, color: { argb: 'FFEF4444' } };
      }
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFE5E7EB' } },
        bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } },
      };

      if (memberIdx % 2 === 0) {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF9FAFB' } };
      }
    });

    rowObj.height = 26;
    row++;
  });

  return { nextRow: row + 1, attendanceByActivity };
};

const addChartsSection = (
  wb: ExcelJS.Workbook,
  ws: ExcelJS.Worksheet,
  startRow: number,
  groupedMembers: Record<string, Member[]>,
  statusCounts: Record<string, number>,
  participationMap: MemberParticipationMap,
  activityDetails: ActivityDetail[],
  attendanceByActivity: Record<string, Set<string>>,
  periodEnd: string
): number => {
  const argbToHex = (argb: string): string => `#${argb.slice(2)}`;

  let row = startRow;

  ws.mergeCells(row, 1, row, 12);
  const titleRow = ws.getRow(row);
  titleRow.getCell(1).value = 'GRAPHIQUES';
  titleRow.getCell(1).font = { name: 'Arial', size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
  titleRow.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0D2137' } };
  titleRow.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
  titleRow.height = 28;
  row += 2;

  const roleColorPalette = ['#1B3A5C', '#56BDA3', '#E8A838', '#3B82F6', '#9CA3AF', '#8B5CF6'];
  const roleData: ChartDatum[] = Object.entries(groupedMembers).map(([role, roleMembers], i) => ({
    label: role,
    value: roleMembers.length,
    color: roleColorPalette[i % roleColorPalette.length],
  }));

  const filteredMembersForCharts = Object.values(groupedMembers).flat();
  let totalEvents = 0, totalMeetings = 0, totalFormations = 0, totalAssemblies = 0;
  filteredMembersForCharts.forEach(m => {
    const c = participationMap[m.id];
    if (c) {
      totalEvents += c.events;
      totalMeetings += c.meetings;
      totalFormations += c.formations;
      totalAssemblies += c.assemblies;
    }
  });
  const typeData: ChartDatum[] = [
    { label: 'Événements', value: totalEvents, color: argbToHex('FF6366F1') },
    { label: 'Réunions', value: totalMeetings, color: argbToHex('FF0EA5E9') },
    { label: 'Formations', value: totalFormations, color: argbToHex('FFF59E0B') },
    { label: 'Assemblée', value: totalAssemblies, color: argbToHex('FFEF4444') },
  ];

  const periodEndDate = new Date(periodEnd);
  const eligibleCount = filteredMembersForCharts.filter(m => {
    const joinDate = m.joined_at ? new Date(m.joined_at) : (m.created_at ? new Date(m.created_at) : null);
    return !(joinDate && joinDate > periodEndDate);
  }).length;
  const activityRateData: ChartDatum[] = activityDetails.map(activity => {
    const attendees = attendanceByActivity[activity.id]?.size ?? 0;
    const rate = eligibleCount > 0 ? Math.round((attendees / eligibleCount) * 100) : 0;
    return { label: activity.name, value: rate, color: argbToHex('FF10B981') };
  });

  const statusColors: Record<string, string> = {
    'Actif': argbToHex('FF10B981'),
    'Inactif': argbToHex('FFEF4444'),
    'Suspendu': argbToHex('FF1B3A5C'),
    'Pas encore membre': argbToHex('FF9CA3AF'),
  };
  const statusData: ChartDatum[] = Object.entries(statusCounts).map(([status, count]) => ({
    label: status,
    value: count,
    color: statusColors[status] || '#6366F1',
  }));

  const charts: { title: string; imageDataUrl: string }[] = [
    { title: 'RÉPARTITION PAR RÔLE', imageDataUrl: renderPieChart(roleData) },
    { title: "PARTICIPATION PAR TYPE D'ACTIVITÉ", imageDataUrl: renderBarChart(typeData) },
    { title: 'TAUX DE PRÉSENCE PAR ACTIVITÉ (%)', imageDataUrl: renderBarChart(activityRateData) },
    { title: 'RÉPARTITION PAR STATUT', imageDataUrl: renderPieChart(statusData) },
  ];

  const chartColsWide = 8;
  const chartRowsTall = 17;

  charts.forEach((chart, i) => {
    const gridCol = i % 2;
    const gridRow = Math.floor(i / 2);
    const anchorCol = gridCol * chartColsWide;
    const anchorRow = row + gridRow * chartRowsTall;

    ws.getCell(anchorRow, anchorCol + 1).value = chart.title;
    ws.getCell(anchorRow, anchorCol + 1).font = { name: 'Arial', size: 12, bold: true, color: { argb: 'FF1B3A5C' } };

    const imageId = wb.addImage({ base64: chart.imageDataUrl, extension: 'png' });
    ws.addImage(imageId, {
      tl: { col: anchorCol, row: anchorRow },
      ext: { width: 420, height: 280 },
    });
  });

  return row + 2 * chartRowsTall + 2;
};

export const getRankColor = (tier: string): string => {
    switch (tier) {
        case 'Senator': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
        case 'Leader': return 'bg-purple-100 text-purple-800 border-purple-200';
        case 'Active Member': return 'bg-blue-100 text-blue-800 border-blue-200';
        case 'Member': return 'bg-green-100 text-green-800 border-green-200';
        case 'Guest': return 'bg-gray-100 text-gray-800 border-gray-200';
        case 'new-member': return 'bg-gray-100 text-gray-800 border-gray-200';
        default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
};

export const getValidationStatusColor = (isValidated: boolean): string => {
    return isValidated
        ? 'bg-green-100 text-green-800 border-green-200'
        : 'bg-red-100 text-red-800 border-red-200';
};