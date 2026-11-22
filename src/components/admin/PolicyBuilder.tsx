import { useEffect, useState } from 'react';
import { Share, Text, View } from 'react-native';
import BarangayPicker from '@/components/BarangayPicker';
import { Body, Button, Card, Field, H2, Label, Notice } from '@/components/ui';
import { buildPolicy, peso, PolicyItem } from '@/lib/analysis';
import { useStore } from '@/lib/store';
import { colors, fonts } from '@/lib/theme';

export default function PolicyBuilder() {
  const { reports } = useStore();
  const [scope, setScope] = useState<string | null>(null);
  const [items, setItems] = useState<PolicyItem[]>([]);

  useEffect(() => setItems(buildPolicy(reports, scope)), [reports, scope]);

  const update = (i: number, patch: Partial<PolicyItem>) => setItems((xs) => xs.map((x, j) => (j === i ? { ...x, ...patch } : x)));
  const total = items.reduce((s, x) => s + (Number.isFinite(x.budget) ? x.budget : 0), 0);
  const title = scope ? `Barangay ${scope} Youth Safety Action Plan` : 'Naga City Youth Safety Resolution (draft)';

  const exportText = () =>
    [
      title.toUpperCase(),
      'Prepared by BayaniHan youth volunteers. Aligned with Naga City Ordinance No. 2023-107 (Safe Spaces Ordinance) and RA 11313.',
      '',
      ...items.map((x, i) => `${i + 1}. ${x.concern}\n   Ask: ${x.ask}\n   Responsible office: ${x.office}\n   Budget line: ${peso(x.budget)}`),
      '',
      `TOTAL ESTIMATED BUDGET: ${peso(total)}`,
      '',
      'DRAFT — figures are estimates for discussion and must be validated with the responsible offices.',
    ].join('\n');

  return (
    <>
      <Body muted>Turns approved reports into a costed action plan with specific asks, a responsible office, and budget lines. Edit anything before exporting.</Body>
      <BarangayPicker value={scope} onChange={setScope} allowAll />
      <H2>{title}</H2>
      {items.length === 0 ? (
        <Card>
          <Body muted>No approved reports for this scope yet.</Body>
        </Card>
      ) : (
        items.map((x, i) => (
          <Card key={`${scope}-${x.concern}`}>
            <Text style={{ fontFamily: fonts.heading, fontSize: 17, color: colors.text }}>
              {i + 1}. {x.concern}
            </Text>
            <Label>Ask</Label>
            <Field multiline value={x.ask} onChangeText={(v) => update(i, { ask: v })} style={{ minHeight: 60 }} />
            <Label>Responsible office</Label>
            <Field value={x.office} onChangeText={(v) => update(i, { office: v })} />
            <Label>Budget line (₱)</Label>
            <Field keyboardType="number-pad" value={String(x.budget)} onChangeText={(v) => update(i, { budget: Number(v.replace(/\D/g, '')) || 0 })} />
          </Card>
        ))
      )}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Body style={{ fontFamily: fonts.bold }}>Total estimated budget</Body>
        <Text style={{ fontFamily: fonts.heading, fontSize: 22, color: colors.primary }}>{peso(total)}</Text>
      </View>
      <Notice tone="warn">Draft for youth policy workshops. Unit costs are placeholders — validate with the responsible offices before presenting.</Notice>
      <Button title="Export / share plan" icon="share-2" variant="accent" onPress={() => Share.share({ message: exportText() })} disabled={!items.length} />
    </>
  );
}
