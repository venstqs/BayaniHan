import { BARANGAYS, CATEGORIES, categoryById, FEELINGS, GROUPS, WANTS } from './data';
import type { CategoryId, Report, SurveyResponse } from './types';

export interface Findings {
  total: number;
  byCategory: { id: CategoryId; count: number }[];
  byBarangay: { name: string; count: number; avgSeverity: number }[];
  nightShare: number;
  avgSeverity: number;
  groupCounts: { id: string; count: number }[];
  surveyCount: number;
  unsafeShare: number;
  topWants: { id: string; count: number }[];
  coveredBarangays: number;
}

export function computeFindings(reports: Report[], surveys: SurveyResponse[], barangay?: string | null): Findings {
  const rs = reports.filter((r) => r.status === 'approved' && (!barangay || r.barangay === barangay));
  const ss = surveys.filter((s) => !barangay || s.barangay === barangay);

  const byCategory = CATEGORIES.map((c) => ({ id: c.id, count: rs.filter((r) => r.category === c.id).length })).sort(
    (a, b) => b.count - a.count,
  );

  const byBarangay = BARANGAYS.map((b) => {
    const list = rs.filter((r) => r.barangay === b.name);
    return {
      name: b.name,
      count: list.length,
      avgSeverity: list.length ? list.reduce((s, r) => s + r.severity, 0) / list.length : 0,
    };
  })
    .filter((b) => b.count > 0)
    .sort((a, b) => b.count - a.count || b.avgSeverity - a.avgSeverity);

  const groupCounts = GROUPS.filter((g) => g.id !== 'everyone')
    .map((g) => ({ id: g.id, count: rs.filter((r) => r.group === g.id).length + ss.filter((s) => s.group === g.id).length }))
    .sort((a, b) => b.count - a.count);

  const unsafe = ss.filter((s) => s.feeling === 'unsafe' || s.feeling === 'sometimes_unsafe').length;
  const topWants = WANTS.map((w) => ({ id: w.id, count: ss.filter((s) => s.wants.includes(w.id)).length }))
    .filter((w) => w.count > 0)
    .sort((a, b) => b.count - a.count);

  return {
    total: rs.length,
    byCategory,
    byBarangay,
    nightShare: rs.length ? rs.filter((r) => r.timeOfDay !== 'day').length / rs.length : 0,
    avgSeverity: rs.length ? rs.reduce((s, r) => s + r.severity, 0) / rs.length : 0,
    groupCounts,
    surveyCount: ss.length,
    unsafeShare: ss.length ? unsafe / ss.length : 0,
    topWants,
    coveredBarangays: new Set([...rs.map((r) => r.barangay), ...ss.map((s) => s.barangay)]).size,
  };
}

const pct = (n: number) => `${Math.round(n * 100)}%`;

/**
 * On-device "AI-assisted" summary (rule-based). Output is always a DRAFT that a
 * human reviewer must check before it is used in any report or policy.
 */
export function draftSummary(f: Findings, scope: string): string[] {
  if (f.total === 0 && f.surveyCount === 0) return [`No approved data yet for ${scope}.`];
  const lines: string[] = [];
  const top = f.byCategory.filter((c) => c.count > 0);
  if (top.length) {
    lines.push(
      `${scope}: ${f.total} approved reports. Most common concern is "${categoryById(top[0].id).label.en}" (${top[0].count})` +
        (top[1] ? `, followed by "${categoryById(top[1].id).label.en}" (${top[1].count}).` : '.'),
    );
  }
  if (f.total) lines.push(`${pct(f.nightShare)} of concerns happen in the evening or at night — lighting and patrol timing matter.`);
  if (f.byBarangay.length > 1) {
    const hs = f.byBarangay.slice(0, 3).map((b) => `${b.name} (${b.count})`).join(', ');
    lines.push(`Priority barangays by number of reports: ${hs}.`);
  }
  const g = f.groupCounts[0];
  if (g && g.count > 0) {
    const label = GROUPS.find((x) => x.id === g.id)!.label.en;
    lines.push(`"${label}" appear most often among affected groups (${g.count} mentions across reports and surveys).`);
  }
  if (f.surveyCount) {
    lines.push(`${pct(f.unsafeShare)} of ${f.surveyCount} survey respondents feel unsafe at least sometimes.`);
    if (f.topWants.length) {
      const w = f.topWants.slice(0, 3).map((x) => WANTS.find((y) => y.id === x.id)!.label.en.toLowerCase());
      lines.push(`Youth most often ask for: ${w.join(', ')}.`);
    }
  }
  if (f.avgSeverity >= 3) lines.push(`Average severity is ${f.avgSeverity.toFixed(1)}/5 — consider fast-tracking the top items.`);
  return lines;
}

export const avgFeeling = (surveys: SurveyResponse[]) =>
  surveys.length ? surveys.reduce((s, x) => s + FEELINGS.find((f) => f.id === x.feeling)!.score, 0) / surveys.length : 0;

export interface PolicyItem {
  concern: string;
  ask: string;
  office: string;
  budget: number;
}

const POLICY_RULES: Record<CategoryId, { ask: (n: number) => string; office: string; unit: number }> = {
  lighting: { ask: (n) => `Install or repair streetlights at ${n} reported spot(s); monthly lighting check by SK.`, office: 'Barangay Council / City Engineering Office', unit: 15000 },
  harassment: { ask: (n) => `Scheduled tanod patrols and Safe Spaces (Ord. 2023-107) signage at ${n} hotspot(s); promote the Bawal Bastos hotline.`, office: 'Barangay VAW Desk / PNP WCPD', unit: 20000 },
  abandoned: { ask: (n) => `Clear, light, and secure ${n} abandoned lot(s); coordinate with owners.`, office: 'Barangay Council / City ENRO', unit: 10000 },
  route: { ask: (n) => `Fix sidewalks and mark safe walking routes on ${n} stretch(es); add CCTV at key crossings.`, office: 'SK Council / City Engineering Office', unit: 25000 },
  flooding: { ask: (n) => `De-clog canals and put hazard signage at ${n} location(s).`, office: 'City DRRMO / City Engineering Office', unit: 12000 },
  other: { ask: (n) => `Barangay assessment of ${n} other concern(s).`, office: 'Barangay Council', unit: 5000 },
};

export function buildPolicy(reports: Report[], barangay: string | null): PolicyItem[] {
  const rs = reports.filter((r) => r.status === 'approved' && (!barangay || r.barangay === barangay));
  return CATEGORIES.map((c) => {
    const n = rs.filter((r) => r.category === c.id).length;
    if (!n) return null;
    const rule = POLICY_RULES[c.id];
    return { concern: c.label.en, ask: rule.ask(n), office: rule.office, budget: rule.unit * n };
  }).filter((x): x is PolicyItem => !!x);
}

export const peso = (n: number) => `₱${n.toLocaleString('en-PH')}`;
