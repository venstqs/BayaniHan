import { useState } from 'react';
import { View } from 'react-native';
import AiFindings from '@/components/admin/AiFindings';
import Moderation from '@/components/admin/Moderation';
import Ordinances from '@/components/admin/Ordinances';
import PolicyBuilder from '@/components/admin/PolicyBuilder';
import Resources from '@/components/admin/Resources';
import { Body, Button, Card, Field, Notice, PageHeader, Screen, Segmented, Small } from '@/components/ui';
import { colors } from '@/lib/theme';
import { haptic } from '@/lib/motion';
import { useStore } from '@/lib/store';

/** Demo-only PIN. Replace with real coordinator accounts when a backend is connected. */
const DEMO_PIN = '2026';

type Tab = 'reports' | 'ai' | 'policy' | 'ordinances' | 'resources';

export default function AdminScreen() {
  const { isAdmin, setAdmin, reports, online, signIn, signOut, coordinatorEmail, refresh, syncing, syncError } = useStore();
  const pending = reports.filter((r) => r.status === 'pending').length;
  const [pin, setPin] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>('reports');

  const submit = async () => {
    setErr(null);
    if (!online) {
      if (pin === DEMO_PIN) {
        haptic.success();
        setAdmin(true);
      } else {
        haptic.warn();
        setErr('That PIN isn’t right. Check it and try again.');
      }
      return;
    }
    setBusy(true);
    try {
      await signIn(email, password);
      haptic.success();
      setPassword('');
    } catch (e) {
      haptic.warn();
      setErr(e instanceof Error ? e.message : 'Could not sign in.');
    } finally {
      setBusy(false);
    }
  };

  if (!isAdmin) {
    return (
      <Screen edges={[]}>
        <PageHeader
          context="Coordinators only"
          title="Sign in to review"
          intro="Barangay youth coordinators and the central team check every report before it reaches the public map."
        />
        <Card>
          {online ? (
            <>
              <Field
                placeholder="Coordinator email"
                value={email}
                onChangeText={(v) => {
                  setEmail(v);
                  setErr(null);
                }}
                autoCapitalize="none"
                autoComplete="email"
                keyboardType="email-address"
                textContentType="username"
              />
              <Field
                placeholder="Password"
                value={password}
                onChangeText={(v) => {
                  setPassword(v);
                  setErr(null);
                }}
                secureTextEntry
                autoComplete="password"
                textContentType="password"
                onSubmitEditing={submit}
                returnKeyType="go"
              />
            </>
          ) : (
            <Field
              placeholder="Reviewer PIN"
              value={pin}
              onChangeText={(v) => {
                setPin(v);
                setErr(null);
              }}
              secureTextEntry
              keyboardType="number-pad"
              maxLength={8}
              onSubmitEditing={submit}
            />
          )}
          {err ? <Body style={{ color: colors.danger }}>{err}</Body> : null}
          <Button
            title={busy ? 'Signing in…' : 'Sign in'}
            icon="lock"
            onPress={submit}
            disabled={busy || (online ? !email.trim() || !password : !pin)}
          />
        </Card>
        {online ? (
          <Notice>Coordinator accounts are created by the BayaniHan team in Supabase. Ask your project lead if you need one.</Notice>
        ) : (
          <Notice>Demo mode (no server connected): the PIN is {DEMO_PIN}. Connect Supabase to use real coordinator accounts.</Notice>
        )}
      </Screen>
    );
  }

  return (
    <Screen edges={[]} onRefresh={online ? refresh : undefined} refreshing={syncing}>
      {online ? (
        <Small>
          Signed in as {coordinatorEmail}. Pull down to refresh.
        </Small>
      ) : null}
      {syncError ? <Notice tone="warn">{syncError}</Notice> : null}
      <Segmented<Tab>
        value={tab}
        onChange={setTab}
        options={[
          { id: 'reports', label: 'Reports', icon: 'flag', badge: pending },
          { id: 'ai', label: 'AI findings', icon: 'zap' },
          { id: 'policy', label: 'Policy builder', icon: 'book-open' },
          { id: 'ordinances', label: 'Ordinances', icon: 'file-text' },
          { id: 'resources', label: 'Resources', icon: 'phone' },
        ]}
      />
      <View style={{ gap: 14 }}>
        {tab === 'reports' && <Moderation />}
        {tab === 'ai' && <AiFindings />}
        {tab === 'policy' && <PolicyBuilder />}
        {tab === 'ordinances' && <Ordinances />}
        {tab === 'resources' && <Resources />}
      </View>
      <Button title="Sign out" variant="ghost" icon="log-out" onPress={signOut} />
    </Screen>
  );
}
