# Members Excel Export: Activity Matrix + Charts Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the aggregate "distribution by activity type" table in the Members Excel export with a per-activity/per-member ✓/✗/- matrix, add four PNG chart images, collapse the Rôle/Poste columns when only one role is exported, and add a `Décision` column flagging regular members for exclusion or encouragement based on presence rate.

**Architecture:** All changes live in `src/features/Members/utils.ts` (the ExcelJS-based `downloadMembersAsExcel` export builder), a new `src/features/Members/chartRenderer.ts` (canvas-based PNG chart rendering, no new dependency), and `src/features/Members/pages/MembersPage.tsx` (wiring two already-existing but previously unused `participationService` calls into the download flow).

**Tech Stack:** React 19 + TypeScript, ExcelJS 4.4 (workbook/worksheet building, `addImage` for embedding PNGs), browser Canvas 2D API (chart rendering — no chart library).

**Design doc:** `docs/superpowers/specs/2026-07-09-members-excel-charts-and-matrix-design.md`

## Global Constraints

- No new npm dependency — charts are hand-drawn on `<canvas>`, not via a charting library.
- Charts are static PNG images embedded via ExcelJS `addImage`, not native/editable Excel chart objects (ExcelJS 4.4 cannot create those).
- All text added to the workbook (column header, decision values, chart titles, chart data labels) must be in French.
- `Décision` values are only populated for `Member`/`New Member` rows (`isSimpleRole` in `utils.ts`); leadership rows always show `-`.
- `Décision` thresholds, based on the presence-rate percent already computed by `getPresenceRate`: `0-20%` → `À exclure`, `21-40%` → `À encourager`, everything else (including the `-1`/`-2` "no data"/"not yet a member" sentinels) → `-`.
- The distribution matrix's columns and rows must be sized generously (wide columns, tall rows) — see Task 4 for the exact widths/heights and the shared-column-width gotcha.
- This repo has no test framework (no vitest/jest/anything) and no existing test files. Per-task verification uses two methods depending on what the code touches:
  - **Pure logic with no DOM/canvas dependency** (`getDecision`, `addDistributionTable` — ExcelJS itself runs fine in plain Node): a throwaway Node script imported directly against the real `.ts` source (Node 22's built-in TypeScript type-stripping runs `.ts` files without a build step — confirmed working against this exact file during planning), with plain `if` assertions and a non-zero exit code on failure. Deleted after the task's verification passes; never committed.
  - **Canvas/DOM-dependent code** (`chartRenderer.ts`, `addChartsSection`) and **UI wiring** (`MembersPage.tsx`): `npx tsc -b` for type-correctness, with full manual verification deferred to Task 7 (run the dev server, download real exports, open them).

---

### Task 1: `Décision` column definition + `getDecision` helper

**Files:**
- Modify: `src/features/Members/utils.ts`

**Interfaces:**
- Consumes: nothing new (uses the existing `isSimpleRole` helper already defined at `src/features/Members/utils.ts:99-102`).
- Produces: `export const getDecision(role: string, presencePercent: number): string`, and `const DECISION_COLUMN_DEF: { key: string; header: string; width: number; color: string }` — both consumed by Task 2.

- [ ] **Step 1: Add the `getDecision` helper**

In `src/features/Members/utils.ts`, find `getPresenceRate` (ends at line 140, right before `export const downloadMembersAsExcel`). Insert this new exported function immediately after it, before `export const downloadMembersAsExcel = async (`:

```ts
export const getDecision = (role: string, presencePercent: number): string => {
  if (!isSimpleRole(role)) return '-';
  if (presencePercent >= 0 && presencePercent <= 20) return 'À exclure';
  if (presencePercent >= 21 && presencePercent <= 40) return 'À encourager';
  return '-';
};
```

- [ ] **Step 2: Add the `Décision` column definition constant**

In the same file, find `TEAM_COLUMN_DEFS` (lines 78-84):

```ts
const TEAM_COLUMN_DEFS = [
  { key: 'committees', header: 'Comités', width: 14, color: 'FFE8A838' },
  { key: 'sponsoring', header: 'Sponsoring', width: 15, color: 'FF10B981' },
  { key: 'media', header: 'Média', width: 14, color: 'FF6366F1' },
  { key: 'program', header: 'Programme', width: 15, color: 'FF1B3A5C' },
  { key: 'logistic', header: 'Logistique', width: 15, color: 'FF56BDA3' },
];
```

Add this new constant right after it:

```ts
const DECISION_COLUMN_DEF = { key: 'decision', header: 'Décision', width: 20, color: 'FFDC2626' };
```

(It's kept separate from `BASE_COLUMN_DEFS`/`TEAM_COLUMN_DEFS` rather than appended to either — Task 2 appends it last in the `columnDefs` pipeline, after team columns are added, so `Décision` is always the true last column of the table, including when `includeTeams` is on.)

- [ ] **Step 3: Verify `getDecision` with a throwaway Node script**

Create `verify-decision.mjs` at the repo root (`c:/Users/Iyed/Desktop/JCIAMember_Project/jci-a-member-app/verify-decision.mjs`):

```js
import { getDecision } from './src/features/Members/utils.ts';

const cases = [
  [['Member', 0], 'À exclure'],
  [['Member', 20], 'À exclure'],
  [['Member', 21], 'À encourager'],
  [['Member', 40], 'À encourager'],
  [['Member', 41], '-'],
  [['Member', -1], '-'],
  [['Member', -2], '-'],
  [['New Member', 10], 'À exclure'],
  [['Nouveau membre', 30], 'À encourager'],
  [['Président', 5], '-'],
  [['Président', 100], '-'],
];

let failed = false;
for (const [[role, percent], expected] of cases) {
  const actual = getDecision(role, percent);
  if (actual !== expected) {
    failed = true;
    console.error(`FAIL getDecision(${role}, ${percent}) = ${actual}, expected ${expected}`);
  }
}
if (failed) {
  process.exit(1);
}
console.log('All getDecision assertions passed');
```

Run: `node verify-decision.mjs`
Expected output: `All getDecision assertions passed` (exit code 0). If it fails, the error lines name exactly which case is wrong — fix `getDecision` and rerun.

- [ ] **Step 4: Delete the throwaway script**

Run: `rm verify-decision.mjs`

- [ ] **Step 5: Typecheck**

Run: `npx tsc -b`
Expected: no output, exit code 0.

- [ ] **Step 6: Commit**

```bash
git add src/features/Members/utils.ts
git commit -m "Add Decision column helper and column definition to members Excel export"
```

---

### Task 2: Single-role collapse + wire `Décision`/status into the main table

**Files:**
- Modify: `src/features/Members/utils.ts`

**Interfaces:**
- Consumes: `getDecision` and `DECISION_COLUMN_DEF` from Task 1.
- Produces: `statusCounts: Record<string, number>` (tallied inside `downloadMembersAsExcel`, consumed by Task 5's `addChartsSection` call), `isSingleRole`/`sortedRoles`/`groupedMembers` now computed at the top of `downloadMembersAsExcel` (previously computed partway through — Task 4 and Task 5 both rely on these being available before the header row is built).

- [ ] **Step 1: Reorder `groupedMembers` computation and add single-role collapse**

In `src/features/Members/utils.ts`, replace the whole top portion of `downloadMembersAsExcel`, from the function signature through the header-row loop (currently lines 142-217):

```ts
export const downloadMembersAsExcel = async (
  members: Member[],
  options: DownloadOptions
): Promise<void> => {
    const { selectedRoles, includeTeams, periodStart, periodEnd, participationMap, committeeMap, rawParticipations, rawActivities, activityDetails, participationsWithActivityId } = options;

    const hidePost = selectedRoles.length === 0
      ? members.every(m => isSimpleRole(m.role))
      : selectedRoles.every(r => isSimpleRole(r));

    let columnDefs = BASE_COLUMN_DEFS;
    if (!hidePost) {
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
    titleRow.getCell(1).value = 'MEMBRES JCI HAMMAM SOUSSE';
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
        if (selectedRoles.length > 0 && !selectedRoles.includes(member.role)) return acc;
        if (!acc[member.role]) acc[member.role] = [];
        acc[member.role].push(member);
        return acc;
    }, {} as Record<string, Member[]>);

    const sortedRoles = Object.keys(groupedMembers).sort();
    let globalIndex = 1;
```

with:

```ts
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
```

- [ ] **Step 2: Wire `getDecision` and `statusCounts` into the per-member row loop**

In the same file, find the row loop (currently lines 219-267, right after the block just replaced):

```ts
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
                overall: getAvgDisplay(counts),
                status: getStatus(),
                presence: presence.joinedAfterPeriod ? '-' : presence.rate,
            };
```

Replace with:

```ts
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
                overall: getAvgDisplay(counts),
                status: status,
                presence: presence.joinedAfterPeriod ? '-' : presence.rate,
                decision: getDecision(role, presence.percent),
            };
```

- [ ] **Step 3: Color the `Décision` cell**

In the same file, find the cell-coloring loop right after `cellValues` is finalized (currently lines 269-301):

```ts
            const isEmptyPresence = presence.percent === -1 || presence.percent === -2;
            const hasLowPresence = presence.percent >= 0 && presence.percent < 10;
            const hasMediumPresence = presence.percent >= 10 && presence.percent <= 20;

            const bgColor = memberIndex % 2 === 0 ? colors.bg : 'FFF9FAFB';
            for (let col = 1; col <= TOTAL_COLS; col++) {
                const cell = row.getCell(col);
                const isPresenceCol = columnDefs[col - 1]?.key === 'presence';
                const isStatusCol = columnDefs[col - 1]?.key === 'status';
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
                cell.alignment = { horizontal: 'center', vertical: 'middle' };
                cell.border = {
                    top: { style: 'thin', color: { argb: 'FFE5E7EB' } },
                    bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } },
                    left: { style: 'thin', color: { argb: 'FFE5E7EB' } },
                    right: { style: 'thin', color: { argb: 'FFE5E7EB' } }
                };
            }
```

Replace with:

```ts
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
```

- [ ] **Step 4: Remove the now-duplicate `groupedMembers`/`sortedRoles` computation further down**

Still in `downloadMembersAsExcel`, find this block that appears later in the function (originally around line 324, right after the member rows loop closes and before the `RÉSUMÉ` section):

```ts
    const filteredMembersForSummary = Object.values(groupedMembers).flat();
```

This line itself is fine and stays (it reads `groupedMembers`, doesn't redeclare it) — confirm there is no second `const groupedMembers = members.reduce(...)` or `const sortedRoles = ...` anywhere else in the file below this point. There shouldn't be, since Step 1 removed the only other declaration; this step is a verification-only check, no edit needed if the search comes back empty.

Run: `grep -n "const groupedMembers\|const sortedRoles" src/features/Members/utils.ts`
Expected: exactly one match for each (both in the block edited in Step 1, near the top of `downloadMembersAsExcel`).

- [ ] **Step 5: Typecheck**

Run: `npx tsc -b`
Expected: no output, exit code 0. (`DECISION_COLUMN_DEF`, `getDecision` must resolve — this task depends on Task 1 being done first.)

- [ ] **Step 6: Manual verification**

Run: `npm run dev`, then in a browser:
1. Navigate to the Members page.
2. Click "Télécharger" to open the download modal.
3. Uncheck all roles except one simple role (e.g. only "Member"), download.
4. Open the resulting `.xlsx` (Excel or LibreOffice Calc). Verify: the title cell reads `MEMBRES JCI HAMMAM SOUSSE — MEMBER` (or whatever that role's uppercased name is), there is no `Rôle` column and no `Poste` column, and the last column is `Décision` with values `À exclure`, `À encourager`, or `-` — spot-check one member you know has low participation shows `À exclure` or `À encourager` appropriately.
5. Re-open the download modal, select "Tous les rôles" (multi-role), download again.
6. Open that file: verify the title has no role suffix (`MEMBRES JCI HAMMAM SOUSSE`), the `Rôle` column is back, and the `Décision` column is populated only for Member/New Member rows — leadership rows (Président, VP, etc.) show `-`.

- [ ] **Step 7: Commit**

```bash
git add src/features/Members/utils.ts
git commit -m "Add single-role column collapse and wire Decision column into members Excel export"
```

---

### Task 3: Canvas chart renderer

**Files:**
- Create: `src/features/Members/chartRenderer.ts`

**Interfaces:**
- Produces: `export interface ChartDatum { label: string; value: number; color: string }`, `export function renderPieChart(data: ChartDatum[], opts?: { width?: number; height?: number }): string`, `export function renderBarChart(data: ChartDatum[], opts?: { width?: number; height?: number }): string` — both return a PNG data URL (`data:image/png;base64,...`). Consumed by Task 5's `addChartsSection`.
- Consumes: nothing (pure browser Canvas 2D API, no imports from the rest of the app).

- [ ] **Step 1: Write the chart renderer**

Create `src/features/Members/chartRenderer.ts`:

```ts
export interface ChartDatum {
  label: string;
  value: number;
  color: string;
}

const createCanvas = (width: number, height: number): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D } => {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context unavailable');
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, width, height);
  return { canvas, ctx };
};

export function renderPieChart(data: ChartDatum[], opts: { width?: number; height?: number } = {}): string {
  const width = opts.width ?? 480;
  const height = opts.height ?? 320;
  const { canvas, ctx } = createCanvas(width, height);

  const total = data.reduce((sum, d) => sum + d.value, 0);
  const cx = width * 0.35;
  const cy = height / 2;
  const radius = Math.min(cx, cy) - 20;

  let startAngle = -Math.PI / 2;
  data.forEach(d => {
    const slice = total > 0 ? (d.value / total) * Math.PI * 2 : 0;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, radius, startAngle, startAngle + slice);
    ctx.closePath();
    ctx.fillStyle = d.color;
    ctx.fill();
    startAngle += slice;
  });

  const legendX = width * 0.68;
  let legendY = height / 2 - (data.length * 24) / 2;
  ctx.font = '13px Arial';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  data.forEach(d => {
    ctx.fillStyle = d.color;
    ctx.fillRect(legendX, legendY - 6, 12, 12);
    ctx.fillStyle = '#1F2937';
    ctx.fillText(`${d.label} (${d.value})`, legendX + 18, legendY);
    legendY += 24;
  });

  return canvas.toDataURL('image/png');
}

export function renderBarChart(data: ChartDatum[], opts: { width?: number; height?: number } = {}): string {
  const width = opts.width ?? 480;
  const height = opts.height ?? 320;
  const { canvas, ctx } = createCanvas(width, height);

  const paddingLeft = 40;
  const paddingBottom = 70;
  const paddingTop = 20;
  const chartWidth = width - paddingLeft - 20;
  const chartHeight = height - paddingBottom - paddingTop;
  const maxValue = Math.max(1, ...data.map(d => d.value));
  const barWidth = data.length > 0 ? chartWidth / data.length : chartWidth;

  ctx.strokeStyle = '#D1D5DB';
  ctx.beginPath();
  ctx.moveTo(paddingLeft, paddingTop);
  ctx.lineTo(paddingLeft, height - paddingBottom);
  ctx.lineTo(width - 20, height - paddingBottom);
  ctx.stroke();

  ctx.font = '11px Arial';
  data.forEach((d, i) => {
    const barHeight = (d.value / maxValue) * chartHeight;
    const x = paddingLeft + i * barWidth + barWidth * 0.15;
    const y = height - paddingBottom - barHeight;
    const w = barWidth * 0.7;

    ctx.fillStyle = d.color;
    ctx.fillRect(x, y, w, barHeight);

    ctx.fillStyle = '#1F2937';
    ctx.textAlign = 'center';
    ctx.fillText(String(d.value), x + w / 2, y - 6);

    const label = d.label.length > 14 ? `${d.label.slice(0, 13)}…` : d.label;
    ctx.save();
    ctx.translate(x + w / 2, height - paddingBottom + 14);
    ctx.rotate(-Math.PI / 6);
    ctx.textAlign = 'right';
    ctx.fillText(label, 0, 0);
    ctx.restore();
  });

  return canvas.toDataURL('image/png');
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc -b`
Expected: no output, exit code 0.

- [ ] **Step 3: Commit**

```bash
git add src/features/Members/chartRenderer.ts
git commit -m "Add canvas-based pie/bar chart renderer for members Excel export"
```

---

### Task 4: Rewrite distribution section into the per-activity/member matrix

**Files:**
- Modify: `src/features/Members/utils.ts`

**Interfaces:**
- Consumes: `groupedMembers`, `isSingleRole`/`sortedRoles` context from Task 2 (already computed at the top of `downloadMembersAsExcel`); `ActivityDetail`, `ParticipationActivityId` types already defined at the top of `utils.ts` (lines 24-33).
- Produces: `export const addDistributionTable(ws: ExcelJS.Worksheet, startRow: number, groupedMembers: Record<string, Member[]>, activityDetails: ActivityDetail[], participationsWithActivityId: ParticipationActivityId[], periodEnd: string): { nextRow: number; attendanceByActivity: Record<string, Set<string>> }` — consumed by this same task's call-site update, and by Task 5's `addChartsSection` (which needs `attendanceByActivity`).

- [ ] **Step 1: Delete the old `addDistributionTable` and `buildActivityMatrix` functions**

In `src/features/Members/utils.ts`, delete both functions in their entirety — everything from `const addDistributionTable = (ws: ExcelJS.Worksheet, ...` through the end of `buildActivityMatrix` (currently lines 566-735, ending right before `export const getRankColor`).

- [ ] **Step 2: Add the new matrix-based `addDistributionTable`**

In the same location, add:

```ts
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
```

- [ ] **Step 3: Update the call site**

Find where the old functions were called (currently lines 546-554):

```ts
    currentRow += 5;

    if (participationMap) {
      currentRow = addDistributionTable(ws, currentRow, groupedMembers, participationMap);
    }

    if (activityDetails && participationsWithActivityId) {
      buildActivityMatrix(ws, currentRow, groupedMembers, activityDetails, participationsWithActivityId, periodStart, periodEnd);
    }
```

Replace with:

```ts
    currentRow += 2;

    let attendanceByActivity: Record<string, Set<string>> = {};
    if (activityDetails && participationsWithActivityId) {
      const distributionResult = addDistributionTable(ws, currentRow, groupedMembers, activityDetails, participationsWithActivityId, periodEnd);
      currentRow = distributionResult.nextRow;
      attendanceByActivity = distributionResult.attendanceByActivity;
    }
```

(Task 5 will add an `addChartsSection` call right after this block.)

- [ ] **Step 4: Typecheck**

Run: `npx tsc -b`
Expected: no output, exit code 0. If it complains about an unused `periodStart` parameter in some now-dead code path, there is none introduced by this task — re-check the diff against Step 3 exactly.

- [ ] **Step 5: Verify the matrix with a throwaway Node script**

Create `verify-matrix.mjs` at the repo root:

```js
import ExcelJS from 'exceljs';
import { addDistributionTable } from './src/features/Members/utils.ts';

const wb = new ExcelJS.Workbook();
const ws = wb.addWorksheet('Test');

const groupedMembers = {
  Member: [
    { id: 'm1', fullname: 'Alice', created_at: '2024-01-01', joined_at: '2024-01-01' },
    { id: 'm2', fullname: 'Bob', created_at: '2024-06-01', joined_at: '2024-06-01' },
    { id: 'm3', fullname: 'Carol', created_at: '2025-06-01', joined_at: '2025-06-01' },
  ],
};

const activityDetails = [
  { id: 'a1', name: 'Réunion Janvier', type: 'meeting', activity_begin_date: '2024-02-01' },
  { id: 'a2', name: 'Assemblée Générale', type: 'general_assembly', activity_begin_date: '2024-03-01' },
];

const participationsWithActivityId = [
  { user_id: 'm1', activity: { id: 'a1' } },
];

const { nextRow, attendanceByActivity } = addDistributionTable(
  ws, 1, groupedMembers, activityDetails, participationsWithActivityId, '2024-12-31'
);

const assertions = [
  [ws.getCell(3, 3).value, '✓', 'Alice attended Réunion Janvier'],
  [ws.getCell(3, 4).value, '✗', 'Alice did not attend Assemblée Générale'],
  [ws.getCell(4, 3).value, '✗', 'Bob did not attend Réunion Janvier'],
  [ws.getCell(5, 3).value, '-', 'Carol joined after periodEnd, so all her cells are -'],
  [ws.getColumn(3).width >= 22, true, 'activity column width >= 22'],
  [ws.getColumn(2).width >= 34, true, 'member name column width >= 34'],
  [ws.getRow(3).height, 26, 'member row height is 26'],
  [typeof nextRow, 'number', 'nextRow is a number'],
  [attendanceByActivity['a1']?.has('m1'), true, 'attendanceByActivity tracks a1/m1'],
  [attendanceByActivity['a2'], undefined, 'a2 has no attendees, so no Set was created'],
];

let failed = false;
for (const [actual, expected, label] of assertions) {
  if (actual !== expected) {
    failed = true;
    console.error(`FAIL ${label}: got ${JSON.stringify(actual)}, expected ${JSON.stringify(expected)}`);
  }
}
if (failed) process.exit(1);
console.log('All addDistributionTable assertions passed');
```

Run: `node verify-matrix.mjs`
Expected output: `All addDistributionTable assertions passed` (exit code 0).

- [ ] **Step 6: Delete the throwaway script**

Run: `rm verify-matrix.mjs`

- [ ] **Step 7: Commit**

```bash
git add src/features/Members/utils.ts
git commit -m "Replace aggregate distribution table with per-activity/member attendance matrix"
```

---

### Task 5: Wire the four charts into the sheet

**Files:**
- Modify: `src/features/Members/utils.ts`

**Interfaces:**
- Consumes: `renderPieChart`, `renderBarChart`, `ChartDatum` from `src/features/Members/chartRenderer.ts` (Task 3); `groupedMembers`, `statusCounts` (Task 2); `attendanceByActivity` (Task 4).
- Produces: `addChartsSection(...)` called from `downloadMembersAsExcel`, nothing consumed by later tasks.

- [ ] **Step 1: Import the chart renderer**

At the top of `src/features/Members/utils.ts`, find:

```ts
import type { Member } from './types';
import type { MemberCommitteeStats } from '../Activities/services/committeeService';
import ExcelJS from 'exceljs';
```

Replace with:

```ts
import type { Member } from './types';
import type { MemberCommitteeStats } from '../Activities/services/committeeService';
import ExcelJS from 'exceljs';
import { renderPieChart, renderBarChart, type ChartDatum } from './chartRenderer';
```

- [ ] **Step 2: Add the `addChartsSection` function**

Add this function right after the new `addDistributionTable` (added in Task 4), before `export const getRankColor`:

```ts
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
```

- [ ] **Step 3: Call `addChartsSection` from `downloadMembersAsExcel`**

Find the block added in Task 4, Step 3:

```ts
    currentRow += 2;

    let attendanceByActivity: Record<string, Set<string>> = {};
    if (activityDetails && participationsWithActivityId) {
      const distributionResult = addDistributionTable(ws, currentRow, groupedMembers, activityDetails, participationsWithActivityId, periodEnd);
      currentRow = distributionResult.nextRow;
      attendanceByActivity = distributionResult.attendanceByActivity;
    }
```

Replace with:

```ts
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
```

- [ ] **Step 4: Typecheck**

Run: `npx tsc -b`
Expected: no output, exit code 0.

- [ ] **Step 5: Commit**

```bash
git add src/features/Members/utils.ts
git commit -m "Embed role/activity-type/attendance-rate/status charts into members Excel export"
```

(Full visual verification of the charts happens in Task 7 — canvas rendering needs a real browser, so it can't be checked with a Node script.)

---

### Task 6: Wire the two new data calls into `MembersPage.tsx`

**Files:**
- Modify: `src/features/Members/pages/MembersPage.tsx`

**Interfaces:**
- Consumes: `participationService.getAllActivitiesWithDetails(sinceDate: string)` and `participationService.getParticipationsWithActivityId(memberIds: string[], sinceDate: string)`, both already implemented in `src/features/Activities/services/participationService.ts:223-252` and previously unused.
- Produces: `activityDetails`/`participationsWithActivityId` passed into `downloadMembersAsExcel`'s `options` — the last missing piece for Tasks 4 and 5 to actually receive real data at runtime.

- [ ] **Step 1: Add the two calls and pass them through**

In `src/features/Members/pages/MembersPage.tsx`, find `handleDownload` (currently lines 39-80):

```ts
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

        const [participationMap, activityTypeCounts, committeeMap, rawParticipations, rawActivities] = await Promise.all(promises);

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
        });

        setShowDownloadModal(false);
      } catch {
        toast.error('Failed to download Excel');
      }
    };
```

Replace with:

```ts
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
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc -b`
Expected: no output, exit code 0.

- [ ] **Step 3: Commit**

```bash
git add src/features/Members/pages/MembersPage.tsx
git commit -m "Fetch and pass per-activity attendance data into members Excel export"
```

---

### Task 7: End-to-end manual verification

**Files:** none (verification only).

**Interfaces:** none.

- [ ] **Step 1: Full build**

Run: `npm run build`
Expected: exits 0, no TypeScript errors, Vite build completes.

- [ ] **Step 2: Start the dev server**

Run: `npm run dev` (leave running).

- [ ] **Step 3: Multi-role export**

In the browser: navigate to the Members page, open the download modal, leave "Tous les rôles" selected, leave "Inclure les comités" on, download.

Open the resulting `.xlsx`. Verify, in order down the sheet:
1. Title: `MEMBRES JCI HAMMAM SOUSSE` (no role suffix).
2. Main table has `Rôle` and `Poste` columns, and a `Décision` column as the very last column (after the committee columns, since `includeTeams` is on) — populated only on Member/New Member rows.
3. `RÉSUMÉ`, `RÉSUMÉ DES PARTICIPATIONS`, `RÉSUMÉ DES COMITÉS` sections unchanged in appearance from before this change.
4. `DISTRIBUTION PAR ACTIVITÉ` section: one column per real activity name (not "Événements/Réunions/Formations/Assemblée" aggregates), one row per member, cells showing ✓, ✗, or `-`. Columns and rows visibly wider/taller than the rest of the table.
5. `GRAPHIQUES` section: four chart images render as actual pie/bar charts (not broken image icons), roughly in a 2×2 layout, each with a French title (`RÉPARTITION PAR RÔLE`, `PARTICIPATION PAR TYPE D'ACTIVITÉ`, `TAUX DE PRÉSENCE PAR ACTIVITÉ (%)`, `RÉPARTITION PAR STATUT`) and readable legends/labels.
6. There is only one worksheet tab (`Membres`) — no separate "Présences par activité" tab.

- [ ] **Step 4: Single-role export**

Repeat the download with only one role checked (a simple role, e.g. "Member"). Verify:
1. Title includes the role suffix, e.g. `MEMBRES JCI HAMMAM SOUSSE — MEMBER`.
2. No `Rôle` or `Poste` columns.
3. `Décision` column present and populated.
4. Distribution matrix and charts sections still render correctly with the smaller member set.

- [ ] **Step 5: Empty-activity edge case**

If feasible, pick a period range (`Période` fields in the download modal) with no activities at all, download, and confirm the `DISTRIBUTION PAR ACTIVITÉ` section shows "Aucune activité dans la période sélectionnée" instead of an empty or broken table, and the workbook still opens without errors (charts section may show zero-value bars/pies, which is acceptable).

- [ ] **Step 6: Final commit (if any fixes were needed)**

If Steps 3-5 uncovered any bugs, fix them, re-run `npx tsc -b`, re-verify manually, then:

```bash
git add -A
git commit -m "Fix issues found in members Excel export end-to-end verification"
```

If no fixes were needed, no commit is required for this task.
