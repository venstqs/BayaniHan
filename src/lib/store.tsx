import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AppState } from 'react-native';
import * as api from './backend';
import { SEED_REPORTS, SEED_SURVEYS } from './data';
import type { Lang, ModerationEntry, Report, Status, SurveyResponse } from './types';

/**
 * App data store.
 * - With a backend configured (see lib/backend.ts): reports and surveys go to Supabase. Anything sent while
 *   offline waits in an outbox and is retried automatically. The last downloaded data is cached for offline use.
 * - Without a backend: offline demo mode with sample data, saved on this phone only.
 */
const KEY = 'bayanihan:v1';

type Outbox = { kind: 'report'; data: Report } | { kind: 'survey'; data: SurveyResponse };

interface Persisted {
  reports: Report[];
  surveys: SurveyResponse[];
  lang: Lang;
  barangay: string | null;
  /** Signature (scope + text) of the AI summary a reviewer last checked. Any change to the summary invalidates it. */
  reviewedFindings: string | null;
  /** Has the person finished the first-launch welcome screens? */
  onboarded: boolean;
  /** Reports sent from this phone (kept locally so people can follow their status). */
  mine: Report[];
  /** Report ids this phone already said "me too" to. */
  confirmed: string[];
  /** Waiting to be sent when the connection comes back. */
  outbox: Outbox[];
  lastSync: string | null;
}

export type NewReport = Omit<Report, 'id' | 'status' | 'createdAt' | 'log' | 'confirmations'>;
export type NewSurvey = Omit<SurveyResponse, 'id' | 'createdAt'>;

interface StoreValue extends Persisted {
  ready: boolean;
  online: boolean;
  syncing: boolean;
  syncError: string | null;
  isAdmin: boolean;
  coordinatorEmail: string | null;
  setAdmin: (v: boolean) => void;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => void;
  refresh: () => Promise<void>;
  setLang: (l: Lang) => void;
  setBarangay: (b: string | null) => void;
  /** Resolves to `queued: true` when there was no connection and the report will be sent later. */
  addReport: (r: NewReport) => Promise<{ id: string; queued: boolean }>;
  addSurvey: (s: NewSurvey) => Promise<{ queued: boolean }>;
  moderate: (id: string, action: Status, note?: string) => Promise<void>;
  editReport: (id: string, patch: Partial<Pick<Report, 'description' | 'category'>>) => Promise<void>;
  confirm: (id: string) => void;
  setReviewedFindings: (v: string | null) => void;
  setOnboarded: (v: boolean) => void;
  resetDemo: () => void;
}

const initial: Persisted = {
  reports: api.backendEnabled ? [] : SEED_REPORTS,
  surveys: api.backendEnabled ? [] : SEED_SURVEYS,
  lang: 'en',
  barangay: null,
  reviewedFindings: null,
  onboarded: false,
  mine: [],
  confirmed: [],
  outbox: [],
  lastSync: null,
};

const Ctx = createContext<StoreValue | null>(null);
const uuid = () => Crypto.randomUUID();
const now = () => new Date().toISOString();
const entry = (action: ModerationEntry['action'], note?: string): ModerationEntry => ({ at: now(), action, ...(note ? { note } : {}) });

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<Persisted>(initial);
  const [ready, setReady] = useState(false);
  const [demoAdmin, setDemoAdmin] = useState(false);
  const [session, setSession] = useState<api.Session | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);

  // Refs so async work always sees the latest values.
  const stateRef = useRef(state);
  stateRef.current = state;
  const sessionRef = useRef(session);
  sessionRef.current = session;
  const syncingRef = useRef(false);

  useEffect(() => {
    AsyncStorage.getItem(KEY)
      .then((raw) => {
        if (!raw) return;
        const saved = JSON.parse(raw);
        // Older builds stored a boolean here; it can't be matched to a summary, so drop it.
        if (typeof saved.reviewedFindings !== 'string') saved.reviewedFindings = null;
        // Demo sample data must not leak into a real backend (and vice versa).
        if (api.backendEnabled && Array.isArray(saved.reports) && saved.reports.some((r: Report) => r.id.startsWith('seed-'))) {
          saved.reports = [];
          saved.surveys = [];
        }
        setState({ ...initial, ...saved });
      })
      .catch(() => {})
      .finally(() => setReady(true));
  }, []);

  useEffect(() => {
    if (ready) AsyncStorage.setItem(KEY, JSON.stringify(state)).catch(() => {});
  }, [state, ready]);

  const update = useCallback((fn: (s: Persisted) => Persisted) => setState(fn), []);

  const token = useCallback(async () => {
    const s = sessionRef.current;
    if (!s) return undefined;
    try {
      const fresh = await api.freshSession(s);
      if (fresh !== s) setSession(fresh);
      return fresh.accessToken;
    } catch {
      setSession(null);
      return undefined;
    }
  }, []);

  /** Send queued items, then download the latest data. Safe to call often. */
  const refresh = useCallback(async () => {
    if (!api.backendEnabled || syncingRef.current) return;
    syncingRef.current = true;
    setSyncing(true);
    try {
      // 1. Flush the outbox, keeping anything that still fails.
      const pending = stateRef.current.outbox;
      const failed: Outbox[] = [];
      for (const item of pending) {
        try {
          if (item.kind === 'report') await api.submitReport(item.data);
          else await api.submitSurvey(item.data);
        } catch (e) {
          // 4xx = the server rejected it (e.g. invalid data); retrying won't help, so drop it.
          if (!(e instanceof api.BackendError && e.status >= 400 && e.status < 500)) failed.push(item);
        }
      }
      if (pending.length) {
        update((s) => ({ ...s, outbox: [...failed, ...s.outbox.filter((o) => !pending.includes(o))] }));
      }
      // 2. Pull fresh data.
      const t = await token();
      const [reports, surveys, statuses] = await Promise.all([
        api.fetchReports(t),
        api.fetchSurveys(t),
        api.fetchStatuses(stateRef.current.mine.map((m) => m.id)).catch(() => ({}) as Record<string, Status>),
      ]);
      update((s) => ({
        ...s,
        reports,
        surveys,
        mine: s.mine.map((m) => (statuses[m.id] ? { ...m, status: statuses[m.id] } : m)),
        lastSync: now(),
      }));
      setSyncError(null);
    } catch (e) {
      setSyncError(e instanceof Error ? e.message : 'Could not reach the server.');
    } finally {
      syncingRef.current = false;
      setSyncing(false);
    }
  }, [token, update]);

  // Sync on start and whenever the app comes back to the foreground.
  useEffect(() => {
    if (!ready || !api.backendEnabled) return;
    refresh();
    const sub = AppState.addEventListener('change', (s) => s === 'active' && refresh());
    return () => sub.remove();
  }, [ready, refresh]);

  // Re-download after signing in or out so coordinators see pending reports (and others don't).
  useEffect(() => {
    if (ready && api.backendEnabled) refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.accessToken === undefined]);

  const value = useMemo<StoreValue>(() => {
    const isAdmin = api.backendEnabled ? !!session : demoAdmin;

    const patchLocal = (id: string, fn: (r: Report) => Report) =>
      update((s) => ({ ...s, reports: s.reports.map((r) => (r.id === id ? fn(r) : r)) }));

    return {
      ...state,
      ready,
      online: api.backendEnabled,
      syncing,
      syncError,
      isAdmin,
      coordinatorEmail: session?.email ?? null,
      setAdmin: setDemoAdmin,
      signIn: async (email, password) => {
        const s = await api.signIn(email, password);
        setSession(s);
      },
      signOut: () => {
        setSession(null);
        setDemoAdmin(false);
        // Drop non-public reports from the cache straight away.
        if (api.backendEnabled) update((s) => ({ ...s, reports: s.reports.filter((r) => r.status === 'approved') }));
      },
      refresh,
      setLang: (lang) => update((s) => ({ ...s, lang })),
      setBarangay: (barangay) => update((s) => ({ ...s, barangay })),

      addReport: async (r) => {
        const report: Report = { ...r, id: uuid(), status: 'pending', confirmations: 0, createdAt: now(), log: [entry('submitted')] };
        if (!api.backendEnabled) {
          update((s) => ({ ...s, reports: [report, ...s.reports], mine: [report, ...s.mine] }));
          return { id: report.id, queued: false };
        }
        update((s) => ({ ...s, mine: [report, ...s.mine] }));
        try {
          await api.submitReport(report);
          return { id: report.id, queued: false };
        } catch (e) {
          if (e instanceof api.BackendError && e.status >= 400 && e.status < 500) {
            update((s) => ({ ...s, mine: s.mine.filter((m) => m.id !== report.id) }));
            throw e;
          }
          update((s) => ({ ...s, outbox: [...s.outbox, { kind: 'report', data: report }] }));
          return { id: report.id, queued: true };
        }
      },

      addSurvey: async (sv) => {
        const survey: SurveyResponse = { ...sv, id: uuid(), createdAt: now() };
        update((s) => ({ ...s, surveys: [survey, ...s.surveys] }));
        if (!api.backendEnabled) return { queued: false };
        try {
          await api.submitSurvey(survey);
          return { queued: false };
        } catch (e) {
          if (e instanceof api.BackendError && e.status >= 400 && e.status < 500) {
            update((s) => ({ ...s, surveys: s.surveys.filter((x) => x.id !== survey.id) }));
            throw e;
          }
          update((s) => ({ ...s, outbox: [...s.outbox, { kind: 'survey', data: survey }] }));
          return { queued: true };
        }
      },

      moderate: async (id, action, note) => {
        const before = stateRef.current.reports.find((r) => r.id === id);
        if (!before) return;
        const log = [...before.log, entry(action, note)];
        patchLocal(id, (r) => ({ ...r, status: action, log }));
        if (!api.backendEnabled) return;
        try {
          const t = await token();
          if (!t) throw new api.BackendError('Your coordinator session ended. Sign in again.', 401);
          await api.updateReport(t, id, { status: action, log });
        } catch (e) {
          patchLocal(id, () => before); // undo the optimistic change
          throw e;
        }
      },

      editReport: async (id, patch) => {
        const before = stateRef.current.reports.find((r) => r.id === id);
        if (!before) return;
        const log = [...before.log, entry('edited')];
        patchLocal(id, (r) => ({ ...r, ...patch, log }));
        if (!api.backendEnabled) return;
        try {
          const t = await token();
          if (!t) throw new api.BackendError('Your coordinator session ended. Sign in again.', 401);
          await api.updateReport(t, id, { ...patch, log });
        } catch (e) {
          patchLocal(id, () => before);
          throw e;
        }
      },

      confirm: (id) => {
        if (stateRef.current.confirmed.includes(id)) return;
        update((s) => ({
          ...s,
          confirmed: [...s.confirmed, id],
          reports: s.reports.map((r) => (r.id === id ? { ...r, confirmations: (r.confirmations ?? 0) + 1 } : r)),
        }));
        if (api.backendEnabled) api.confirmReport(id).catch(() => {});
      },

      setReviewedFindings: (reviewedFindings) => update((s) => ({ ...s, reviewedFindings })),
      setOnboarded: (onboarded) => update((s) => ({ ...s, onboarded })),
      resetDemo: () =>
        update((s) => ({ ...initial, lang: s.lang, onboarded: s.onboarded, mine: api.backendEnabled ? s.mine : [], outbox: s.outbox })),
    };
  }, [state, ready, syncing, syncError, session, demoAdmin, refresh, token, update]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useStore must be used inside StoreProvider');
  return v;
}
