import { useMemo, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import LeafletMap, { MapMarker } from '@/components/LeafletMap';
import { Body, Button, Card, Chip, ChipRow, H3, Notice, Screen, Small, Stat } from '@/components/ui';
import { categoryById, NAGA_CENTER, TIMES } from '@/lib/data';
import { distToPolyline, lineLength } from '@/lib/geo';
import { useT } from '@/lib/i18n';
import { haptic } from '@/lib/motion';
import { useStore } from '@/lib/store';
import { colors, fonts, radius, severityColors } from '@/lib/theme';
import type { Report } from '@/lib/types';

type Pt = { lat: number; lng: number };
interface RouteOption {
  line: [number, number][];
  meters: number;
  nearby: Report[];
  risk: number;
  source: 'osrm' | 'straight';
}

const NEAR_M = 80;

export default function SaferRouteScreen() {
  const { reports } = useStore();
  const { L } = useT();
  const [start, setStart] = useState<Pt | null>(null);
  const [end, setEnd] = useState<Pt | null>(null);
  const [options, setOptions] = useState<RouteOption[]>([]);
  const [chosen, setChosen] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const approved = useMemo(() => reports.filter((r) => r.status === 'approved'), [reports]);

  const score = (line: [number, number][], source: RouteOption['source']): RouteOption => {
    const nearby = approved.filter((r) => distToPolyline(r, line) <= NEAR_M);
    // Night-time concerns weigh more because the tool is mostly used for walking home.
    const risk = nearby.reduce((s, r) => s + r.severity * (r.timeOfDay === 'day' ? 1 : 1.5), 0);
    return { line, meters: lineLength(line), nearby, risk, source };
  };

  // Ignore results from an older request if the user has tapped a new start point since.
  const requestId = useRef(0);

  const compute = async (a: Pt, b: Pt) => {
    const id = ++requestId.current;
    setLoading(true);
    setError(null);
    try {
      // The public router.project-osrm.org demo only serves CAR routes (the "foot" profile is ignored),
      // so use the FOSSGIS walking server instead.
      const url = `https://routing.openstreetmap.de/routed-foot/route/v1/foot/${a.lng},${a.lat};${b.lng},${b.lat}?overview=full&geometries=geojson&alternatives=3`;
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 15000);
      const res = await fetch(url, { signal: ctrl.signal }).finally(() => clearTimeout(timer));
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      if (!json.routes?.length) throw new Error('no routes');
      const opts: RouteOption[] = json.routes.map((r: { geometry: { coordinates: [number, number][] } }) =>
        score(r.geometry.coordinates.map(([lng, lat]) => [lat, lng] as [number, number]), 'osrm'),
      );
      opts.sort((x, y) => x.risk - y.risk || x.meters - y.meters);
      if (id !== requestId.current) return;
      setOptions(opts);
      haptic.success();
    } catch {
      if (id !== requestId.current) return;
      setError('Could not reach the routing service (are you online?). Showing a straight line instead.');
      setOptions([score([[a.lat, a.lng], [b.lat, b.lng]], 'straight')]);
    } finally {
      if (id === requestId.current) {
        setChosen(0);
        setLoading(false);
      }
    }
  };

  const reset = () => {
    requestId.current++;
    setStart(null);
    setEnd(null);
    setOptions([]);
    setError(null);
    setLoading(false);
  };

  const onPress = (lat: number, lng: number) => {
    haptic.select();
    if (!start || end) {
      requestId.current++;
      setStart({ lat, lng });
      setEnd(null);
      setOptions([]);
      setError(null);
      setLoading(false);
    } else {
      const e = { lat, lng };
      setEnd(e);
      compute(start, e);
    }
  };

  const route = options[chosen];
  const markers: MapMarker[] = [
    ...approved.map((r) => ({ id: r.id, lat: r.lat, lng: r.lng, color: categoryById(r.category).color })),
    ...(start ? [{ id: 'A', lat: start.lat, lng: start.lng, color: colors.primary, label: 'A' }] : []),
    ...(end ? [{ id: 'B', lat: end.lat, lng: end.lng, color: colors.accent, label: 'B' }] : []),
  ];

  return (
    <Screen edges={[]}>
      <View style={styles.steps}>
        <Step letter="A" color={colors.primary} label="Start" done={!!start} active={!start} />
        <View style={styles.stepLine} />
        <Step letter="B" color={colors.accent} label="Destination" done={!!end} active={!!start && !end} />
      </View>
      <Body muted>{!start ? 'Tap the map where you are starting from.' : !end ? 'Now tap where you are going.' : 'Tap the map again to plan a new route.'}</Body>
      <View style={styles.mapCard}>
        <LeafletMap style={{ height: 360 }} center={NAGA_CENTER} zoom={14} centerKey="route" markers={markers} route={route?.line} onMapPress={onPress} />
        {loading ? (
          <View style={styles.loading}>
            <ActivityIndicator color={colors.primary} />
            <Small muted={false}>Finding walking routes…</Small>
          </View>
        ) : null}
      </View>
      {error ? <Notice tone="warn">{error}</Notice> : null}

      {options.length > 1 ? (
        <ChipRow>
          {options.map((o, i) => (
            <Chip
              key={i}
              icon={i === 0 ? 'shield' : undefined}
              label={`${i === 0 ? 'Lowest risk' : `Option ${i + 1}`}, ${(o.meters / 1000).toFixed(1)} km`}
              selected={i === chosen}
              onPress={() => setChosen(i)}
            />
          ))}
        </ChipRow>
      ) : null}

      {route ? (
        <Card>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <Stat compact label="Distance" value={`${(route.meters / 1000).toFixed(1)} km`} />
            <Stat compact label="Walking time" value={`${Math.max(1, Math.round(route.meters / 80))} min`} />
            <Stat compact label="Concerns nearby" value={route.nearby.length} color={route.nearby.length ? colors.accent : colors.success} />
          </View>
          <H3>{route.nearby.length ? `Reported within ${NEAR_M} m of this route` : `No reported concerns within ${NEAR_M} m`}</H3>
          {route.nearby.map((r) => {
            const c = categoryById(r.category);
            return (
              <View key={r.id} style={styles.near}>
                <View style={[styles.nearDot, { backgroundColor: c.color }]} />
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={styles.nearTitle}>
                    {L(c.label)}, {L(TIMES.find((x) => x.id === r.timeOfDay)!.label).toLowerCase()}
                  </Text>
                  <Small>{r.description}</Small>
                </View>
                <View style={[styles.sev, { backgroundColor: severityColors[r.severity - 1] }]}>
                  <Text style={styles.sevText}>{r.severity}/5</Text>
                </View>
              </View>
            );
          })}
          <Button title="Plan a new route" variant="ghost" icon="rotate-ccw" onPress={reset} />
        </Card>
      ) : null}
      <Notice tone="warn">Suggestions are based only on reports in this app and can’t guarantee safety. Walk with a buddy at night and call 911 in an emergency.</Notice>
    </Screen>
  );
}

function Step({ letter, color, label, done, active }: { letter: string; color: string; label: string; done: boolean; active: boolean }) {
  return (
    <View style={[styles.step, active && { borderColor: color, backgroundColor: colors.card }]}>
      <View style={[styles.stepPin, { backgroundColor: done || active ? color : colors.border }]}>
        <Text style={styles.stepLetter}>{letter}</Text>
      </View>
      <Text style={[styles.stepLabel, (done || active) && { color: colors.text }]}>{done ? `${label} set` : label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  steps: { flexDirection: 'row', alignItems: 'center' },
  step: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    borderRadius: radius.sm,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.bg,
  },
  stepLine: { width: 14, height: 2, backgroundColor: colors.border },
  stepPin: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  stepLetter: { fontFamily: fonts.bold, fontSize: 12, color: '#fff' },
  stepLabel: { fontFamily: fonts.medium, fontSize: 13, color: colors.muted },
  mapCard: { borderRadius: radius.md, overflow: 'hidden', borderWidth: 1, borderColor: colors.border },
  loading: {
    position: 'absolute',
    top: 12,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.card,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  near: { flexDirection: 'row', gap: 10, alignItems: 'flex-start', paddingVertical: 4 },
  nearDot: { width: 10, height: 10, borderRadius: 5, marginTop: 6 },
  nearTitle: { fontFamily: fonts.bold, fontSize: 14, color: colors.text },
  sev: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999 },
  sevText: { fontFamily: fonts.bold, fontSize: 12, color: '#fff' },
});
