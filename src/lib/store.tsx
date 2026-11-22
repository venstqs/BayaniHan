import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { SEED_REPORTS, SEED_SURVEYS } from './data';
import type { Lang, ModerationEntry, Report, Status, SurveyResponse } from './types';

/**
 * Local data store. Persists to AsyncStorage so the app works offline.
 * To connect a real backend (Supabase / Firebase), replace load/save and the
 * mutation functions below — screens only use the hook API.
 */
const KEY = 'bayanihan:v1';

interface Persisted {
  reports: Report[];
  surveys: SurveyResponse[];
  lang: Lang;
  barangay: string | null;
  /** Signature (scope + text) of the AI summary a reviewer last checked. Any change to the summary invalidates it. */
  reviewedFindings: string | null;
  /** Has the person finished the first-launch welcome screens? */
  onboarded: boolean;
}

interface StoreValue extends Persisted {
  ready: boolean;
  isAdmin: boolean;
  setAdmin: (v: boolean) => void;
  setLang: (l: Lang) => void;
  setBarangay: (b: string | null) => void;
  addReport: (r: Omit<Report, 'id' | 'status' | 'createdAt' | 'log'>) => void;
  moderate: (id: string, action: Status, note?: string) => void;
  editReport: (id: string, patch: Partial<Report>) => void;
  addSurvey: (s: Omit<SurveyResponse, 'id' | 'createdAt'>) => void;
  setReviewedFindings: (v: string | null) => void;
  setOnboarded: (v: boolean) => void;
  resetDemo: () => void;
}

const initial: Persisted = {
  reports: SEED_REPORTS,
  surveys: SEED_SURVEYS,
  lang: 'en',
  barangay: null,
  reviewedFindings: null,
  onboarded: false,
};

const Ctx = createContext<StoreValue | null>(null);
const uid = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<Persisted>(initial);
  const [ready, setReady] = useState(false);
  const [isAdmin, setAdmin] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(KEY)
      .then((raw) => {
        if (raw) {
          const saved = JSON.parse(raw);
          // Older builds stored a boolean here; it can't be matched to a summary, so drop it.
          if (typeof saved.reviewedFindings !== 'string') saved.reviewedFindings = null;
          setState({ ...initial, ...saved });
        }
      })
      .catch(() => {})
      .finally(() => setReady(true));
  }, []);

  useEffect(() => {
    if (ready) AsyncStorage.setItem(KEY, JSON.stringify(state)).catch(() => {});
  }, [state, ready]);

  const update = useCallback((fn: (s: Persisted) => Persisted) => setState(fn), []);

  const value = useMemo<StoreValue>(() => {
    const logEntry = (action: ModerationEntry['action'], note?: string): ModerationEntry => ({
      at: new Date().toISOString(),
      action,
      note,
    });
    return {
      ...state,
      ready,
      isAdmin,
      setAdmin,
      setLang: (lang) => update((s) => ({ ...s, lang })),
      setBarangay: (barangay) => update((s) => ({ ...s, barangay })),
      addReport: (r) =>
        update((s) => ({
          ...s,
          reports: [
            { ...r, id: uid(), status: 'pending', createdAt: new Date().toISOString(), log: [logEntry('submitted')] },
            ...s.reports,
          ],
        })),
      moderate: (id, action, note) =>
        update((s) => ({
          ...s,
          reports: s.reports.map((r) => (r.id === id ? { ...r, status: action, log: [...r.log, logEntry(action, note)] } : r)),
        })),
      editReport: (id, patch) =>
        update((s) => ({
          ...s,
          reports: s.reports.map((r) => (r.id === id ? { ...r, ...patch, log: [...r.log, logEntry('edited')] } : r)),
        })),
      addSurvey: (sv) =>
        update((s) => ({ ...s, surveys: [{ ...sv, id: uid(), createdAt: new Date().toISOString() }, ...s.surveys] })),
      setReviewedFindings: (reviewedFindings) => update((s) => ({ ...s, reviewedFindings })),
      setOnboarded: (onboarded) => update((s) => ({ ...s, onboarded })),
      resetDemo: () => update((s) => ({ ...initial, lang: s.lang, onboarded: s.onboarded })),
    };
  }, [state, ready, isAdmin, update]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useStore must be used inside StoreProvider');
  return v;
}
