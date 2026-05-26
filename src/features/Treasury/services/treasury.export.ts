import ExcelJS from 'exceljs'
import type { Transaction, ActivityBudget } from '../types'
import type { DashboardMetrics } from '../hooks/useTreasury'

const FONT = { name: 'Arial', size: 11 }
const FONT_BOLD = { name: 'Arial', size: 11, bold: true }
const FONT_SECTION = { name: 'Arial', size: 12, bold: true }

const C_PRIMARY = 'FF1B3A5C'
const C_ACCENT = 'FF56BDA3'
const C_SECONDARY = 'FFE8A838'
const C_RED = 'FFF44336'
const C_NAVY = 'FF0D2137'
const C_WHITE = 'FFFFFFFF'
const C_LIGHT_GRAY = 'FFF5F5F5'
const C_MED_GRAY = 'FFE0E0E0'
const C_DARK_GRAY = 'FF666666'

const GAIN_BG = 'FFE8F5F0'
const EXPENSE_BG = 'FFFFEBEE'
function fmtDate(iso: string): string {
  if (!iso) return ''
  const d = new Date(iso)
  return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
}

function fmtMonthRange(start: string, end: string): string {
  const s = new Date(start)
  const e = new Date(end)
  const sameYear = s.getFullYear() === e.getFullYear()
  if (sameYear) {
    return `${s.toLocaleDateString('en-US', { month: 'long' })} — ${e.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`
  }
  return `${fmtDate(start)} — ${fmtDate(end)}`
}

function fmt(num: number): string {
  return num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function addSummaryRow(ws: ExcelJS.Worksheet, rowIdx: number, label: string, value: string, color?: string) {
  const r = ws.getRow(rowIdx)
  r.getCell(2).value = label
  r.getCell(2).font = FONT_BOLD
  r.getCell(2).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: C_LIGHT_GRAY } }
  r.getCell(2).border = {
    top: { style: 'thin', color: { argb: C_MED_GRAY } },
    bottom: { style: 'thin', color: { argb: C_MED_GRAY } },
    left: { style: 'thin', color: { argb: C_MED_GRAY } },
  }
  r.getCell(5).value = value
  r.getCell(5).font = { ...FONT_BOLD, size: 13, color: color ? { argb: color } : { argb: C_PRIMARY } }
  r.getCell(5).alignment = { horizontal: 'right' }
  r.getCell(5).border = {
    top: { style: 'thin', color: { argb: C_MED_GRAY } },
    bottom: { style: 'thin', color: { argb: C_MED_GRAY } },
    right: { style: 'thin', color: { argb: C_MED_GRAY } },
  }
  r.height = 26
  return rowIdx + 1
}

export async function exportOverallBudgetExcel(
  sessionLabel: string,
  _budgets: ActivityBudget[],
  transactions: Transaction[],
  metrics: DashboardMetrics,
  logoUrl?: string,
  sessionStart?: string,
  sessionEnd?: string,
) {
  const wb = new ExcelJS.Workbook()
  wb.creator = 'Treasury'
  const ws = wb.addWorksheet('Treasury Report')

  ws.getColumn(1).width = 3
  ws.getColumn(2).width = 28
  ws.getColumn(3).width = 22
  ws.getColumn(4).width = 3
  ws.getColumn(5).width = 28
  ws.getColumn(6).width = 22
  ws.getColumn(7).width = 3

  let row = 1

  // Logo
  const logoBuf = logoUrl ? await (async () => {
    try {
      const resp = await fetch(logoUrl)
      const buf = await resp.arrayBuffer()
      return new Uint8Array(buf)
    } catch { return null }
  })() : null
  if (logoBuf) {
    const imgId = wb.addImage({ buffer: logoBuf as any, extension: 'png' })
    ws.addImage(imgId, { tl: { col: 0.5, row: 0.5 }, ext: { width: 120, height: 40 } })
    row = 3
  }

  // ── Title Row ──
  const titleRow = ws.getRow(row)
  ws.mergeCells(row, 2, row, 6)
  titleRow.getCell(2).value = 'TREASURY REPORT'
  titleRow.getCell(2).font = { name: 'Arial', size: 20, bold: true, color: { argb: C_WHITE } }
  titleRow.getCell(2).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: C_NAVY } }
  titleRow.getCell(2).alignment = { horizontal: 'center', vertical: 'middle' }
  titleRow.height = 44
  for (let c = 2; c <= 6; c++) {
    ws.getCell(row, c).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: C_NAVY } }
    ws.getCell(row, c).border = {
      top: { style: 'medium', color: { argb: C_NAVY } },
      bottom: { style: 'thin', color: { argb: C_ACCENT } },
    }
  }
  row++

  // ── Session Period ──
  const period = sessionStart && sessionEnd ? fmtMonthRange(sessionStart, sessionEnd) : sessionLabel
  const periodRow = ws.getRow(row)
  ws.mergeCells(row, 2, row, 6)
  periodRow.getCell(2).value = period
  periodRow.getCell(2).font = { name: 'Arial', size: 13, bold: true, color: { argb: C_PRIMARY } }
  periodRow.getCell(2).alignment = { horizontal: 'center', vertical: 'middle' }
  periodRow.height = 32
  for (let c = 2; c <= 6; c++) {
    ws.getCell(row, c).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0F4FA' } }
    ws.getCell(row, c).border = {
      top: { style: 'thin', color: { argb: C_ACCENT } },
      bottom: { style: 'thin', color: { argb: C_MED_GRAY } },
    }
  }
  row++
  row++

  // ── Gains | Expenses Header ──
  const hdrRow = ws.getRow(row)
  hdrRow.height = 34

  ws.mergeCells(row, 2, row, 3)
  hdrRow.getCell(2).value = 'GAINS'
  hdrRow.getCell(2).font = { ...FONT_SECTION, color: { argb: C_WHITE } }
  hdrRow.getCell(2).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: C_ACCENT } }
  hdrRow.getCell(2).alignment = { horizontal: 'center', vertical: 'middle' }
  hdrRow.getCell(2).border = {
    top: { style: 'thin', color: { argb: C_ACCENT } },
    bottom: { style: 'thin', color: { argb: C_ACCENT } },
    left: { style: 'thin', color: { argb: C_ACCENT } },
  }
  hdrRow.getCell(3).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: C_ACCENT } }
  hdrRow.getCell(3).border = {
    top: { style: 'thin', color: { argb: C_ACCENT } },
    bottom: { style: 'thin', color: { argb: C_ACCENT } },
    right: { style: 'thin', color: { argb: C_ACCENT } },
  }

  ws.mergeCells(row, 5, row, 6)
  hdrRow.getCell(5).value = 'EXPENSES'
  hdrRow.getCell(5).font = { ...FONT_SECTION, color: { argb: C_WHITE } }
  hdrRow.getCell(5).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: C_RED } }
  hdrRow.getCell(5).alignment = { horizontal: 'center', vertical: 'middle' }
  hdrRow.getCell(5).border = {
    top: { style: 'thin', color: { argb: C_RED } },
    bottom: { style: 'thin', color: { argb: C_RED } },
    left: { style: 'thin', color: { argb: C_RED } },
  }
  hdrRow.getCell(6).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: C_RED } }
  hdrRow.getCell(6).border = {
    top: { style: 'thin', color: { argb: C_RED } },
    bottom: { style: 'thin', color: { argb: C_RED } },
    right: { style: 'thin', color: { argb: C_RED } },
  }
  row++

  // Sub-headers
  const subHdr = ws.getRow(row)
  subHdr.getCell(2).value = 'Category'
  subHdr.getCell(2).font = FONT_BOLD
  subHdr.getCell(3).value = 'Amount (TND)'
  subHdr.getCell(3).font = FONT_BOLD
  subHdr.getCell(3).alignment = { horizontal: 'right' }
  subHdr.getCell(5).value = 'Category'
  subHdr.getCell(5).font = FONT_BOLD
  subHdr.getCell(6).value = 'Amount (TND)'
  subHdr.getCell(6).font = FONT_BOLD
  subHdr.getCell(6).alignment = { horizontal: 'right' }
  for (let c = 2; c <= 6; c++) {
    if (c !== 4) {
      ws.getCell(row, c).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: C_LIGHT_GRAY } }
      ws.getCell(row, c).border = {
        bottom: { style: 'thin', color: { argb: C_MED_GRAY } },
      }
    }
  }
  row++

  // Data rows
  const gains = transactions.filter((t) => t.type === 'gain' && t.status === 'approved')
  const expenses = transactions.filter((t) => (t.type === 'expense_paid' || t.type === 'expense_reserved') && t.status === 'approved')
  const maxLen = Math.max(gains.length, expenses.length, 1)

  for (let i = 0; i < maxLen; i++) {
    const r = ws.getRow(row)
    r.height = 22
    if (i < gains.length) {
      r.getCell(2).value = gains[i].categories?.name || '-'
      r.getCell(2).font = FONT
      r.getCell(2).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: GAIN_BG } }
      r.getCell(3).value = gains[i].amount
      r.getCell(3).font = FONT
      r.getCell(3).alignment = { horizontal: 'right' }
      r.getCell(3).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: GAIN_BG } }
      r.getCell(3).numFmt = '#,##0.00'
    }

    if (i < expenses.length) {
      r.getCell(5).value = expenses[i].categories?.name || '-'
      r.getCell(5).font = FONT
      r.getCell(5).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: EXPENSE_BG } }
      r.getCell(6).value = expenses[i].amount
      r.getCell(6).font = FONT
      r.getCell(6).alignment = { horizontal: 'right' }
      r.getCell(6).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: EXPENSE_BG } }
      r.getCell(6).numFmt = '#,##0.00'
    }

    row++
  }

  // Totals
  const gainsTotal = gains.reduce((s, t) => s + t.amount, 0)
  const expensesTotal = expenses.reduce((s, t) => s + t.amount, 0)

  const totalRow = ws.getRow(row)
  totalRow.height = 28
  totalRow.getCell(2).value = 'Total Gains'
  totalRow.getCell(2).font = FONT_BOLD
  totalRow.getCell(2).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD4EDE1' } }
  totalRow.getCell(2).border = { top: { style: 'medium', color: { argb: C_ACCENT } }, bottom: { style: 'thin', color: { argb: C_ACCENT } } }
  totalRow.getCell(3).value = gainsTotal
  totalRow.getCell(3).font = FONT_BOLD
  totalRow.getCell(3).alignment = { horizontal: 'right' }
  totalRow.getCell(3).numFmt = '#,##0.00'
  totalRow.getCell(3).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD4EDE1' } }
  totalRow.getCell(3).border = { top: { style: 'medium', color: { argb: C_ACCENT } }, bottom: { style: 'thin', color: { argb: C_ACCENT } } }
  totalRow.getCell(5).value = 'Total Expenses'
  totalRow.getCell(5).font = FONT_BOLD
  totalRow.getCell(5).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFCDD2' } }
  totalRow.getCell(5).border = { top: { style: 'medium', color: { argb: C_RED } }, bottom: { style: 'thin', color: { argb: C_RED } } }
  totalRow.getCell(6).value = expensesTotal
  totalRow.getCell(6).font = FONT_BOLD
  totalRow.getCell(6).alignment = { horizontal: 'right' }
  totalRow.getCell(6).numFmt = '#,##0.00'
  totalRow.getCell(6).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFCDD2' } }
  totalRow.getCell(6).border = { top: { style: 'medium', color: { argb: C_RED } }, bottom: { style: 'thin', color: { argb: C_RED } } }
  row++
  row++

  // Balance
  const balance = gainsTotal - expensesTotal
  const balanceColor = balance >= 0 ? C_ACCENT : C_RED
  const balanceBg = balance >= 0 ? 'FFE8F5F0' : 'FFFFEBEE'
  const balanceRow = ws.getRow(row)
  ws.mergeCells(row, 2, row, 3)
  balanceRow.getCell(2).value = 'BALANCE'
  balanceRow.getCell(2).font = { name: 'Arial', size: 18, bold: true, color: { argb: C_NAVY } }
  ws.mergeCells(row, 5, row, 6)
  balanceRow.getCell(5).value = `${balance >= 0 ? '+' : ''}${fmt(balance)} TND`
  balanceRow.getCell(5).font = { name: 'Arial', size: 18, bold: true, color: { argb: balanceColor } }
  balanceRow.getCell(5).alignment = { horizontal: 'right' }
  balanceRow.height = 40
  for (let c = 2; c <= 6; c++) {
    if (c !== 4) {
      ws.getCell(row, c).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: balanceBg } }
      ws.getCell(row, c).border = {
        top: { style: 'medium', color: { argb: balanceColor } },
        bottom: { style: 'medium', color: { argb: balanceColor } },
      }
    }
  }
  row++
  row++

  // Summary section
  const summaryTitle = ws.getRow(row)
  ws.mergeCells(row, 2, row, 6)
  summaryTitle.getCell(2).value = 'SUMMARY'
  summaryTitle.getCell(2).font = { name: 'Arial', size: 14, bold: true, color: { argb: C_WHITE } }
  summaryTitle.getCell(2).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: C_PRIMARY } }
  summaryTitle.getCell(2).alignment = { horizontal: 'center', vertical: 'middle' }
  summaryTitle.height = 32
  for (let c = 2; c <= 6; c++) {
    ws.getCell(row, c).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: C_PRIMARY } }
  }
  row++

  row = addSummaryRow(ws, row, 'Planned Budget', `${fmt(metrics.planned_budget)} TND`)
  row = addSummaryRow(ws, row, 'Reserved Amount', `${fmt(metrics.reserved_amount)} TND`, C_SECONDARY)
  row = addSummaryRow(ws, row, 'Total Spent', `${fmt(metrics.total_spent)} TND`, C_RED)
  row = addSummaryRow(ws, row, 'Current Balance', `${fmt(metrics.current_balance)} TND`,
    metrics.current_balance >= 0 ? C_ACCENT : C_RED)
  row = addSummaryRow(ws, row, 'Pending Transactions', String(metrics.pending_count))
  row++

  // Generated timestamp
  const footer = ws.getRow(row)
  ws.mergeCells(row, 2, row, 6)
  footer.getCell(2).value = `Generated: ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}`
  footer.getCell(2).font = { name: 'Arial', size: 9, italic: true, color: { argb: C_DARK_GRAY } }
  footer.getCell(2).alignment = { horizontal: 'right' }

  const buf = await wb.xlsx.writeBuffer()
  const blob = new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `treasury_report_${sessionLabel.replace(/\s+/g, '_')}.xlsx`
  a.click()
  URL.revokeObjectURL(url)
}

export async function exportActivityBudgetExcel(
  budget: ActivityBudget,
  transactions: Transaction[],
  sessionLabel: string,
  logoUrl?: string,
  sessionStart?: string,
  sessionEnd?: string,
) {
  const wb = new ExcelJS.Workbook()
  wb.creator = 'Treasury'
  const ws = wb.addWorksheet('Budget Report')

  ws.getColumn(1).width = 3
  ws.getColumn(2).width = 28
  ws.getColumn(3).width = 22
  ws.getColumn(4).width = 3
  ws.getColumn(5).width = 28
  ws.getColumn(6).width = 22
  ws.getColumn(7).width = 3

  let row = 1

  const logoBuf = logoUrl ? await (async () => {
    try {
      const resp = await fetch(logoUrl)
      const buf = await resp.arrayBuffer()
      return new Uint8Array(buf)
    } catch { return null }
  })() : null
  if (logoBuf) {
    const imgId = wb.addImage({ buffer: logoBuf as any, extension: 'png' })
    ws.addImage(imgId, { tl: { col: 0.5, row: 0.5 }, ext: { width: 120, height: 40 } })
    row = 3
  }

  const activityName = budget.activities?.name || 'Budget'

  // Title
  const titleRow = ws.getRow(row)
  ws.mergeCells(row, 2, row, 6)
  titleRow.getCell(2).value = `${activityName.toUpperCase()}`
  titleRow.getCell(2).font = { name: 'Arial', size: 20, bold: true, color: { argb: C_WHITE } }
  titleRow.getCell(2).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: C_NAVY } }
  titleRow.getCell(2).alignment = { horizontal: 'center', vertical: 'middle' }
  titleRow.height = 44
  for (let c = 2; c <= 6; c++) {
    ws.getCell(row, c).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: C_NAVY } }
  }
  row++

  // Session period
  const period = sessionStart && sessionEnd ? fmtMonthRange(sessionStart, sessionEnd) : sessionLabel
  const periodRow = ws.getRow(row)
  ws.mergeCells(row, 2, row, 6)
  periodRow.getCell(2).value = period
  periodRow.getCell(2).font = { name: 'Arial', size: 13, bold: true, color: { argb: C_PRIMARY } }
  periodRow.getCell(2).alignment = { horizontal: 'center', vertical: 'middle' }
  periodRow.height = 32
  for (let c = 2; c <= 6; c++) {
    ws.getCell(row, c).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0F4FA' } }
  }
  row++
  row++

  // Budget summary cards
  const budgetHeader = ws.getRow(row)
  ws.mergeCells(row, 2, row, 6)
  budgetHeader.getCell(2).value = 'BUDGET OVERVIEW'
  budgetHeader.getCell(2).font = { name: 'Arial', size: 14, bold: true, color: { argb: C_WHITE } }
  budgetHeader.getCell(2).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: C_PRIMARY } }
  budgetHeader.getCell(2).alignment = { horizontal: 'center', vertical: 'middle' }
  budgetHeader.height = 30
  for (let c = 2; c <= 6; c++) {
    ws.getCell(row, c).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: C_PRIMARY } }
  }
  row++

  row = addSummaryRow(ws, row, 'Allocated', `${fmt(budget.allocated_amount)} TND`)
  row = addSummaryRow(ws, row, 'Spent', `${fmt(budget.spent_amount)} TND`, C_RED)
  row = addSummaryRow(ws, row, 'Remaining', `${fmt(budget.remaining_amount)} TND`, C_ACCENT)
  const usagePct = budget.allocated_amount > 0 ? (budget.spent_amount / budget.allocated_amount) * 100 : 0
  const usageColor = usagePct >= 95 ? C_RED : usagePct >= 80 ? C_SECONDARY : C_ACCENT
  row = addSummaryRow(ws, row, 'Usage', `${usagePct.toFixed(1)}%`, usageColor)
  row++
  row++

  // Gains | Expenses header
  const hdrRow = ws.getRow(row)
  hdrRow.height = 34
  ws.mergeCells(row, 2, row, 3)
  hdrRow.getCell(2).value = 'GAINS'
  hdrRow.getCell(2).font = { ...FONT_SECTION, color: { argb: C_WHITE } }
  hdrRow.getCell(2).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: C_ACCENT } }
  hdrRow.getCell(2).alignment = { horizontal: 'center', vertical: 'middle' }
  hdrRow.getCell(3).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: C_ACCENT } }
  ws.mergeCells(row, 5, row, 6)
  hdrRow.getCell(5).value = 'EXPENSES'
  hdrRow.getCell(5).font = { ...FONT_SECTION, color: { argb: C_WHITE } }
  hdrRow.getCell(5).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: C_RED } }
  hdrRow.getCell(5).alignment = { horizontal: 'center', vertical: 'middle' }
  hdrRow.getCell(6).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: C_RED } }
  row++

  const sub = ws.getRow(row)
  sub.getCell(2).value = 'Category'
  sub.getCell(2).font = FONT_BOLD
  sub.getCell(3).value = 'Amount (TND)'
  sub.getCell(3).font = FONT_BOLD
  sub.getCell(3).alignment = { horizontal: 'right' }
  sub.getCell(5).value = 'Category'
  sub.getCell(5).font = FONT_BOLD
  sub.getCell(6).value = 'Amount (TND)'
  sub.getCell(6).font = FONT_BOLD
  sub.getCell(6).alignment = { horizontal: 'right' }
  for (let c = 2; c <= 6; c++) {
    if (c !== 4) {
      ws.getCell(row, c).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: C_LIGHT_GRAY } }
    }
  }
  row++

  const actGains = transactions.filter((t) => t.type === 'gain' && t.status === 'approved')
  const actExpenses = transactions.filter((t) => (t.type === 'expense_paid' || t.type === 'expense_reserved') && t.status === 'approved')
  const max = Math.max(actGains.length, actExpenses.length, 1)

  for (let i = 0; i < max; i++) {
    const r = ws.getRow(row)
    r.height = 22
    if (i < actGains.length) {
      r.getCell(2).value = actGains[i].categories?.name || '-'
      r.getCell(2).font = FONT
      r.getCell(2).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: GAIN_BG } }
      r.getCell(3).value = actGains[i].amount
      r.getCell(3).font = FONT
      r.getCell(3).alignment = { horizontal: 'right' }
      r.getCell(3).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: GAIN_BG } }
      r.getCell(3).numFmt = '#,##0.00'
    }
    if (i < actExpenses.length) {
      r.getCell(5).value = actExpenses[i].categories?.name || '-'
      r.getCell(5).font = FONT
      r.getCell(5).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: EXPENSE_BG } }
      r.getCell(6).value = actExpenses[i].amount
      r.getCell(6).font = FONT
      r.getCell(6).alignment = { horizontal: 'right' }
      r.getCell(6).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: EXPENSE_BG } }
      r.getCell(6).numFmt = '#,##0.00'
    }
    row++
  }

  const gTotal = actGains.reduce((s, t) => s + t.amount, 0)
  const eTotal = actExpenses.reduce((s, t) => s + t.amount, 0)

  const tRow = ws.getRow(row)
  tRow.height = 28
  tRow.getCell(2).value = 'Total Gains'
  tRow.getCell(2).font = FONT_BOLD
  tRow.getCell(2).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD4EDE1' } }
  tRow.getCell(3).value = gTotal
  tRow.getCell(3).font = FONT_BOLD
  tRow.getCell(3).alignment = { horizontal: 'right' }
  tRow.getCell(3).numFmt = '#,##0.00'
  tRow.getCell(3).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD4EDE1' } }
  tRow.getCell(5).value = 'Total Expenses'
  tRow.getCell(5).font = FONT_BOLD
  tRow.getCell(5).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFCDD2' } }
  tRow.getCell(6).value = eTotal
  tRow.getCell(6).font = FONT_BOLD
  tRow.getCell(6).alignment = { horizontal: 'right' }
  tRow.getCell(6).numFmt = '#,##0.00'
  tRow.getCell(6).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFCDD2' } }
  row++
  row++

  const bal = gTotal - eTotal
  const balColor = bal >= 0 ? C_ACCENT : C_RED
  const balBg = bal >= 0 ? 'FFE8F5F0' : 'FFFFEBEE'
  const bRow = ws.getRow(row)
  ws.mergeCells(row, 2, row, 3)
  bRow.getCell(2).value = 'BALANCE'
  bRow.getCell(2).font = { name: 'Arial', size: 18, bold: true, color: { argb: C_NAVY } }
  ws.mergeCells(row, 5, row, 6)
  bRow.getCell(5).value = `${bal >= 0 ? '+' : ''}${fmt(bal)} TND`
  bRow.getCell(5).font = { name: 'Arial', size: 18, bold: true, color: { argb: balColor } }
  bRow.getCell(5).alignment = { horizontal: 'right' }
  bRow.height = 40
  for (let c = 2; c <= 6; c++) {
    if (c !== 4) {
      ws.getCell(row, c).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: balBg } }
      ws.getCell(row, c).border = {
        top: { style: 'medium', color: { argb: balColor } },
        bottom: { style: 'medium', color: { argb: balColor } },
      }
    }
  }

  const buf = await wb.xlsx.writeBuffer()
  const blob = new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${activityName.replace(/\s+/g, '_')}_budget_report.xlsx`
  a.click()
  URL.revokeObjectURL(url)
}
