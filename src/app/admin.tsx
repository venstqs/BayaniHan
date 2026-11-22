import { useState } from 'react';
import { View } from 'react-native';
import AiFindings from '@/components/admin/AiFindings';
import Moderation from '@/components/admin/Moderation';
import Ordinances from '@/components/admin/Ordinances';
import PolicyBuilder from '@/components/admin/PolicyBuilder';
import Resources from '@/components/admin/Resources';
import { Body, Button, Card, Field, Notice, PageHeader, Screen, Segmented } from '@/components/ui';
import { colors } from '@/lib/theme';
import { useStore } from '@/lib/store';

/** Demo-only PIN. Replace with real coordinator accounts when a backend is connected. */
const DEMO_PIN = '2026';

type Tab = 'reports' | 'ai' | 'policy' | 'ordinances' | 'resources';

export default function AdminScreen() {
  const { isAdmin, setAdmin, reports } = useStore();
  const pending = reports.filter((r) => r.status === 'pending').length;
  const [pin, setPin] = useState('');
  const [err, setErr] = useState(false);
  const [tab, setTab] = useState<Tab>('reports');

  if (!isAdmin) {
    return (
      <Screen edges={[]}>
        <PageHeader
          context="Coordinators only"
          title="Sign in to review"
          intro="Barangay youth coordinators and the central team check every report before it reaches the public map."
        />
        <Card>
          <Field
            placeholder="Reviewer PIN"
            value={pin}
            onChangeText={(v) => {
              setPin(v);
              setErr(false);
            }}
            secureTextEntry
            keyboardType="number-pad"
            maxLength={8}
          />
          {err ? <Body style={{ color: colors.danger }}>That PIN isn’t right. Check it and try again.</Body> : null}
          <Button title="Sign in" icon="lock" onPress={() => (pin === DEMO_PIN ? setAdmin(true) : setErr(true))} />
        </Card>
        <Notice>Demo build: the PIN is {DEMO_PIN}. A real launch needs individual coordinator accounts.</Notice>
      </Screen>
    );
  }

  return (
    <Screen edges={[]}>
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
      <Button title="Sign out" variant="ghost" icon="log-out" onPress={() => setAdmin(false)} />
    </Screen>
  );
}
