import { useState } from 'react';
import { Share, View } from 'react-native';
import BarangayPicker from '@/components/BarangayPicker';
import { Body, Button, Card, Checkbox, H2, Notice } from '@/components/ui';
import { computeFindings, draftSummary } from '@/lib/analysis';
import { useStore } from '@/lib/store';

export default function AiFindings() {
  const { reports, surveys, reviewedFindings, setReviewedFindings } = useStore();
  const [scope, setScope] = useState<string | null>(null);
  const f = computeFindings(reports, surveys, scope);
  const lines = draftSummary(f, scope ?? 'Naga City');
  // "Reviewed" applies only to this exact scope + text; new data or another barangay needs a fresh check.
  const signature = `${scope ?? '__city'}\n${lines.join('\n')}`;
  const reviewed = reviewedFindings === signature;

  const share = () =>
    Share.share({
      message: `BayaniHan findings — ${scope ?? 'Naga City'}\n${reviewed ? '(Reviewed by the team)' : '(DRAFT — not yet reviewed)'}\n\n${lines.map((l) => `• ${l}`).join('\n')}`,
    });

  return (
    <>
      <Notice tone="warn">Draft — generated automatically from approved reports and surveys. A person must review it before use.</Notice>
      <BarangayPicker value={scope} onChange={setScope} allowAll />
      <Card>
        <H2>Summary {reviewed ? '· reviewed ✓' : '· draft'}</H2>
        {lines.map((l, i) => (
          <View key={i} style={{ flexDirection: 'row', gap: 8 }}>
            <Body>•</Body>
            <Body style={{ flex: 1 }}>{l}</Body>
          </View>
        ))}
      </Card>
      <Checkbox checked={reviewed} onChange={(v) => setReviewedFindings(v ? signature : null)} label="I have checked this summary against the underlying reports." />
      <Button title="Share summary" icon="share-2" onPress={share} />
    </>
  );
}
