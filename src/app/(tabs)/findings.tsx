import { router } from 'expo-router';
import { View } from 'react-native';
import BarangayPicker from '@/components/BarangayPicker';
import { Bar, Button, Card, EmptyState, H2, Notice, PageHeader, Screen, Small, Stat } from '@/components/ui';
import { computeFindings } from '@/lib/analysis';
import { categoryById, GROUPS, WANTS } from '@/lib/data';
import { useT } from '@/lib/i18n';
import { useStore } from '@/lib/store';
import { colors, severityColors } from '@/lib/theme';

export default function FindingsScreen() {
  const { reports, surveys, barangay, setBarangay } = useStore();
  const { L, t } = useT();
  const f = computeFindings(reports, surveys, barangay);
  const maxCat = Math.max(1, ...f.byCategory.map((c) => c.count));
  const maxB = Math.max(1, ...f.byBarangay.map((b) => b.count));
  const maxW = Math.max(1, ...f.topWants.map((w) => w.count));
  const maxG = Math.max(1, ...f.groupCounts.map((g) => g.count));
  const empty = f.total === 0 && f.surveyCount === 0;
  const sevColor = f.avgSeverity ? severityColors[Math.min(4, Math.max(0, Math.round(f.avgSeverity) - 1))] : colors.text;

  return (
    <Screen>
      <PageHeader
        context="What young people are reporting"
        title={barangay ? barangay : 'Naga City findings'}
        intro={barangay ? 'Snapshot for this barangay.' : 'All 27 barangays, from reviewed reports and the youth survey.'}
      />
      <BarangayPicker value={barangay} onChange={setBarangay} allowAll />

      {empty ? (
        <EmptyState
          icon="map"
          title="No reviewed data here yet"
          body="Be the first to report a place or answer the survey for this barangay."
          action={<Button size="sm" variant="accent" icon="plus" title={t('reportConcern')} onPress={() => router.navigate('/report')} />}
        />
      ) : (
        <>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
            <Stat label="Reviewed reports" value={f.total} color={colors.primary} />
            <Stat label="Survey answers" value={f.surveyCount} />
            <Stat label="Happen after dark" value={`${Math.round(f.nightShare * 100)}%`} tint={colors.lime} />
            {barangay ? (
              <Stat label="Average severity" value={f.avgSeverity ? f.avgSeverity.toFixed(1) : '–'} color={sevColor} hint="out of 5" />
            ) : (
              <Stat label="Barangays covered" value={f.coveredBarangays} hint="of 27" />
            )}
          </View>

          <Card>
            <H2>Concerns by type</H2>
            {f.byCategory.map((c) => (
              <Bar key={c.id} label={L(categoryById(c.id).label)} value={c.count} max={maxCat} color={categoryById(c.id).color} />
            ))}
          </Card>

          {!barangay && f.byBarangay.length ? (
            <Card>
              <H2>Barangays with the most reports</H2>
              <Small>Tap a barangay to see its snapshot.</Small>
              {f.byBarangay.slice(0, 8).map((b) => (
                <Bar key={b.name} label={b.name} value={b.count} max={maxB} color={colors.primary} onPress={() => setBarangay(b.name)} />
              ))}
            </Card>
          ) : null}

          {f.surveyCount ? (
            <Card>
              <H2>What youth ask for</H2>
              <Small>
                {Math.round(f.unsafeShare * 100)}% of {f.surveyCount} respondents feel unsafe at least sometimes.
              </Small>
              {f.topWants.map((w) => (
                <Bar key={w.id} label={L(WANTS.find((x) => x.id === w.id)!.label)} value={w.count} max={maxW} color={colors.accent} />
              ))}
            </Card>
          ) : null}

          <Card>
            <H2>Groups most affected</H2>
            <Small>Combines reviewed reports and survey answers. No names or personal details are collected.</Small>
            {f.groupCounts.map((g) => (
              <Bar key={g.id} label={L(GROUPS.find((x) => x.id === g.id)!.label)} value={g.count} max={maxG} color="#00A896" />
            ))}
          </Card>
        </>
      )}

      <Notice>{t('onlyApproved')}</Notice>
    </Screen>
  );
}
