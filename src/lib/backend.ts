/**
 * Supabase backend over plain REST (no SDK needed).
 * Configure with EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY (see .env.example).
 * When they are missing the app runs in offline demo mode with sample data.
 */
import type { ModerationEntry, Report, Status, SurveyResponse } from './types';

const URL_ = (process.env.EXPO_PUBLIC_SUPABASE_URL ?? '').replace(/\/+$/, '');
const KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

/** True when the app is connected to a real backend. */
export const backendEnabled = /^https:\/\//.test(URL_) && KEY.length > 20;

export interface Session {
  accessToken: string;
  refreshToken: string;
  expiresAt: number; // epoch ms
  email: string;
}

export class BackendError extends Error {
  constructor(
    message: string,
    public status = 0,
  ) {
    super(message);
  }
}

async function call<T>(path: string, init: RequestInit & { token?: string; timeoutMs?: number } = {}): Promise<T> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), init.timeoutMs ?? 15000);
  try {
    const res = await fetch(`${URL_}${path}`, {
      ...init,
      signal: ctrl.signal,
      headers: {
        apikey: KEY,
        Authorization: `Bearer ${init.token ?? KEY}`,
        'Content-Type': 'application/json',
        ...(init.headers ?? {}),
      },
    });
    const text = await res.text();
    const body = text ? JSON.parse(text) : null;
    if (!res.ok) {
      const msg = body?.message || body?.error_description || body?.msg || `Request failed (${res.status})`;
      throw new BackendError(msg, res.status);
    }
    return body as T;
  } catch (e) {
    if (e instanceof BackendError) throw e;
    throw new BackendError('No connection to the BayaniHan server.');
  } finally {
    clearTimeout(timer);
  }
}

/* ---------- Mapping between database rows and app types ---------- */

interface ReportRow {
  id: string;
  category: Report['category'];
  severity: number;
  barangay: string;
  time_of_day: Report['timeOfDay'];
  group: Report['group'];
  description: string;
  lat: number;
  lng: number;
  status: Status;
  confirmations: number;
  log: ModerationEntry[];
  created_at: string;
}

const fromReportRow = (r: ReportRow): Report => ({
  id: r.id,
  category: r.category,
  severity: r.severity,
  barangay: r.barangay,
  timeOfDay: r.time_of_day,
  group: r.group,
  description: r.description,
  lat: r.lat,
  lng: r.lng,
  status: r.status,
  confirmations: r.confirmations ?? 0,
  log: Array.isArray(r.log) ? r.log : [],
  createdAt: r.created_at,
});

interface SurveyRow {
  id: string;
  barangay: string;
  feeling: SurveyResponse['feeling'];
  time_of_day: SurveyResponse['timeOfDay'];
  group: SurveyResponse['group'];
  wants: string[];
  comment?: string;
  created_at: string;
}

const fromSurveyRow = (s: SurveyRow): SurveyResponse => ({
  id: s.id,
  barangay: s.barangay,
  feeling: s.feeling,
  timeOfDay: s.time_of_day,
  group: s.group,
  wants: s.wants ?? [],
  comment: s.comment ?? '',
  createdAt: s.created_at,
});

/* ---------- Public (anonymous) ---------- */

/** Approved reports for the public map (coordinators also get pending/rejected/flagged). */
export async function fetchReports(token?: string): Promise<Report[]> {
  const rows = await call<ReportRow[]>('/rest/v1/reports?select=*&order=created_at.desc&limit=1000', { token });
  return rows.map(fromReportRow);
}

/** Survey answers without comments for everyone; full rows (with comments) for coordinators. */
export async function fetchSurveys(token?: string): Promise<SurveyResponse[]> {
  const table = token ? 'surveys' : 'survey_stats';
  const rows = await call<SurveyRow[]>(`/rest/v1/${table}?select=*&order=created_at.desc&limit=2000`, { token });
  return rows.map(fromSurveyRow);
}

/** Turn database validation errors into something a person can act on. */
function friendly(e: unknown, what: string): never {
  if (e instanceof BackendError && e.status === 400) {
    throw new BackendError(
      what === 'report'
        ? 'The server couldn’t accept this report. Make sure the pin is inside Naga City and the description is 5–400 characters.'
        : 'The server couldn’t accept these answers. Please check them and try again.',
      400,
    );
  }
  throw e;
}

/** Submit a report. The id is generated on the device so "My reports" can track it. */
export async function submitReport(r: Report): Promise<void> {
  await call('/rest/v1/reports', {
    method: 'POST',
    headers: { Prefer: 'return=minimal' },
    body: JSON.stringify({
      id: r.id,
      category: r.category,
      severity: r.severity,
      barangay: r.barangay,
      time_of_day: r.timeOfDay,
      group: r.group,
      description: r.description,
      lat: r.lat,
      lng: r.lng,
      log: r.log,
      created_at: r.createdAt,
    }),
  }).catch((e) => friendly(e, 'report'));
}

export async function submitSurvey(s: SurveyResponse): Promise<void> {
  await call('/rest/v1/surveys', {
    method: 'POST',
    headers: { Prefer: 'return=minimal' },
    body: JSON.stringify({
      id: s.id,
      barangay: s.barangay,
      feeling: s.feeling,
      time_of_day: s.timeOfDay,
      group: s.group,
      wants: s.wants,
      comment: s.comment,
      created_at: s.createdAt,
    }),
  }).catch((e) => friendly(e, 'survey'));
}

/** Current status of the reports this device submitted. */
export async function fetchStatuses(ids: string[]): Promise<Record<string, Status>> {
  if (!ids.length) return {};
  const rows = await call<{ id: string; status: Status }[]>('/rest/v1/rpc/report_status', {
    method: 'POST',
    body: JSON.stringify({ ids }),
  });
  return Object.fromEntries(rows.map((r) => [r.id, r.status]));
}

/** "Me too" on an approved report. Returns the new count. */
export async function confirmReport(id: string): Promise<number | null> {
  return call<number | null>('/rest/v1/rpc/confirm_report', { method: 'POST', body: JSON.stringify({ report_id: id }) });
}

/* ---------- Coordinators ---------- */

interface AuthResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  user: { email: string };
}

const toSession = (a: AuthResponse): Session => ({
  accessToken: a.access_token,
  refreshToken: a.refresh_token,
  expiresAt: Date.now() + a.expires_in * 1000,
  email: a.user?.email ?? '',
});

export async function signIn(email: string, password: string): Promise<Session> {
  try {
    const a = await call<AuthResponse>('/auth/v1/token?grant_type=password', {
      method: 'POST',
      body: JSON.stringify({ email: email.trim(), password }),
    });
    const session = toSession(a);
    const ok = await call<boolean>('/rest/v1/rpc/is_coordinator', { method: 'POST', body: '{}', token: session.accessToken });
    if (!ok) throw new BackendError('This account is not registered as a coordinator.', 403);
    return session;
  } catch (e) {
    if (e instanceof BackendError && e.status === 400) throw new BackendError('Wrong email or password.', 400);
    throw e;
  }
}

/** Returns a session with a valid access token, refreshing it if it is about to expire. */
export async function freshSession(s: Session): Promise<Session> {
  if (s.expiresAt - Date.now() > 60_000) return s;
  const a = await call<AuthResponse>('/auth/v1/token?grant_type=refresh_token', {
    method: 'POST',
    body: JSON.stringify({ refresh_token: s.refreshToken }),
  });
  return toSession(a);
}

export async function updateReport(token: string, id: string, patch: Partial<Pick<Report, 'status' | 'description' | 'category' | 'log'>>) {
  await call(`/rest/v1/reports?id=eq.${encodeURIComponent(id)}`, {
    method: 'PATCH',
    token,
    headers: { Prefer: 'return=minimal' },
    body: JSON.stringify(patch),
  });
}
