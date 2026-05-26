
import type { Member } from './types';
import ExcelJS from 'exceljs';

export interface MemberParticipationMap {
  [memberId: string]: {
    events: number;
    meetings: number;
    formations: number;
    assemblies: number;
  }
}

const roleColors: Record<string, { bg: string; text: string }> = {
    'President': { bg: 'FF1B3A5C', text: 'FFFFFFFF' },
    'Vice-President': { bg: 'FF56BDA3', text: 'FFFFFFFF' },
    'Conseiller': { bg: 'FFE8A838', text: 'FFFFFFFF' },
    'Member': { bg: 'FF3B82F6', text: 'FFFFFFFF' },
    'New Member': { bg: 'FF9CA3AF', text: 'FFFFFFFF' },
    'VP': { bg: 'FF56BDA3', text: 'FFFFFFFF' },
};

const columnColors = ['FF1B3A5C', 'FF56BDA3', 'FFE8A838', 'FF3B82F6', 'FF8B5CF6', 'FF10B981', 'FF0EA5E9', 'FFF59E0B', 'FFEF4444', 'FF6366F1', 'FF8B5CF6', 'FF64748B'];
const columnHeaders = ['#', 'Name', 'Email', 'Phone', 'Role', 'Post', 'Events', 'Meetings', 'Trainings', 'Assembly', 'Overall', 'Status'];
const columnWidths = [6, 28, 35, 18, 20, 25, 10, 10, 12, 12, 10, 12];
const TOTAL_COLS = columnHeaders.length;

const getPhoneDisplay = (phone?: string): string => {
    if (!phone) return '-';
    const cleaned = phone.replace(/\D/g, '');
    const num = parseInt(cleaned, 10);
    return num > 20000000 ? phone : '-';
};

const getAvgDisplay = (counts: { events: number; meetings: number; formations: number; assemblies: number } | undefined): string => {
    if (!counts) return '-';
    const total = counts.events + counts.meetings + counts.formations + counts.assemblies;
    return total > 0 ? (total / 4).toFixed(1) : '-';
};

export const downloadMembersAsExcel = async (
  members: Member[],
  participationMap?: MemberParticipationMap,
  activityTypeCounts?: { events: number; meetings: number; formations: number; assemblies: number }
): Promise<void> => {
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Members');

    ws.columns = columnWidths.map(w => ({ width: w }));

    let currentRow = 1;

    ws.mergeCells(currentRow, 1, currentRow, TOTAL_COLS);
    const titleRow = ws.getRow(currentRow);
    titleRow.getCell(1).value = 'JCI HAMMAM SOUSSE MEMBERS';
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

    const groupedMembers = members.reduce((acc, member) => {
        if (!member.role || member.role === 'JCI Hammam Sousse') return acc;
        if (member.email?.includes('jci.hs')) return acc;
        if (!acc[member.role]) acc[member.role] = [];
        acc[member.role].push(member);
        return acc;
    }, {} as Record<string, Member[]>);

    const sortedRoles = Object.keys(groupedMembers).sort();
    let globalIndex = 1;

    sortedRoles.forEach((role, roleIndex) => {
        const roleMembers = groupedMembers[role];
        const colors = roleColors[role] || { bg: 'FFE5E7EB', text: 'FF1F2937' };

        roleMembers.forEach((member, memberIndex) => {
            const row = ws.getRow(currentRow);
            const counts = participationMap?.[member.id];

            row.getCell(1).value = globalIndex;
            row.getCell(2).value = member.fullname;
            row.getCell(3).value = member.email || '-';
            row.getCell(4).value = getPhoneDisplay(member.phone);
            row.getCell(5).value = role;
            row.getCell(6).value = member.poste?.name || '-';
            row.getCell(7).value = counts?.events ?? '-';
            row.getCell(8).value = counts?.meetings ?? '-';
            row.getCell(9).value = counts?.formations ?? '-';
            row.getCell(10).value = counts?.assemblies ?? '-';
            row.getCell(11).value = getAvgDisplay(counts);
            row.getCell(12).value = member.is_banned ? 'Banned' : 'Active';

            const bgColor = memberIndex % 2 === 0 ? colors.bg : 'FFF9FAFB';
            for (let col = 1; col <= TOTAL_COLS; col++) {
                const cell = row.getCell(col);
                cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgColor } };
                cell.font = {
                    name: 'Arial',
                    size: 11,
                    color: { argb: memberIndex % 2 === 0 ? colors.text : 'FF1F2937' }
                };
                cell.alignment = col === 1 ? { horizontal: 'center', vertical: 'middle' } : { horizontal: 'center', vertical: 'middle' };
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
    summaryTitleRow.getCell(1).value = 'SUMMARY';
    summaryTitleRow.getCell(1).font = { name: 'Arial', size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
    summaryTitleRow.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0D2137' } };
    summaryTitleRow.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
    summaryTitleRow.height = 28;
    currentRow++;

    const totalMembers = Object.values(groupedMembers).reduce((sum, arr) => sum + arr.length, 0);
    const summaryRow = ws.getRow(currentRow);
    summaryRow.getCell(2).value = 'Total Members:';
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

        members.forEach(m => {
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
        partTitleRow.getCell(1).value = 'PARTICIPATION SUMMARY (Jan - Now)';
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
            ['Total Participations', totalEvents.toString(), totalMeetings.toString(), totalFormations.toString(), totalAssemblies.toString(), (totalAll / membersWithData).toFixed(1)],
            ['Average per Member', avgEvents, avgMeetings, avgFormations, avgAssemblies, overallAvg],
        ]

        if (activityTypeCounts) {
            const rateEvents = activityTypeCounts.events > 0 ? ((totalEvents / activityTypeCounts.events)).toFixed(1) : '-'
            const rateMeetings = activityTypeCounts.meetings > 0 ? ((totalMeetings / activityTypeCounts.meetings)).toFixed(1) : '-'
            const rateFormations = activityTypeCounts.formations > 0 ? ((totalFormations / activityTypeCounts.formations)).toFixed(1) : '-'
            const rateAssemblies = activityTypeCounts.assemblies > 0 ? ((totalAssemblies / activityTypeCounts.assemblies)).toFixed(1) : '-'
            statsData.push([
                'Avg Attendance by Type',
                `(avg ${rateEvents}/event)`,
                `(avg ${rateMeetings}/meeting)`,
                `(avg ${rateFormations}/training)`,
                `(avg ${rateAssemblies}/assembly)`,
                '-'
            ])
        }

        statsData.forEach(([label, ev, mt, tr, asm, overall]) => {
            const row = ws.getRow(currentRow)
            row.getCell(2).value = label
            row.getCell(2).font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FF374151' } }
            row.getCell(7).value = ev
            row.getCell(7).font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FF1B3A5C' } }
            row.getCell(7).alignment = { horizontal: 'center', vertical: 'middle' }
            row.getCell(8).value = mt
            row.getCell(8).font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FF1B3A5C' } }
            row.getCell(8).alignment = { horizontal: 'center', vertical: 'middle' }
            row.getCell(9).value = tr
            row.getCell(9).font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FF1B3A5C' } }
            row.getCell(9).alignment = { horizontal: 'center', vertical: 'middle' }
            row.getCell(10).value = asm
            row.getCell(10).font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FF1B3A5C' } }
            row.getCell(10).alignment = { horizontal: 'center', vertical: 'middle' }
            row.getCell(11).value = overall
            row.getCell(11).font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FF1B3A5C' } }
            row.getCell(11).alignment = { horizontal: 'center', vertical: 'middle' }
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

    const buf = await wb.xlsx.writeBuffer();
    const blob = new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `JCI_Hammam_Sousse_Members_${new Date().toISOString().split('T')[0]}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
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
