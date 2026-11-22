import Feather from '@expo/vector-icons/Feather';
import { router } from 'expo-router';
import * as Location from 'expo-location';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import BarangayPicker from '@/components/BarangayPicker';
import { LangToggle, Logo } from '@/components/Brand';
import LeafletMap, { MapMarker } from '@/components/LeafletMap';
import { FadeIn } from '@/components/motion';
import { Chip, ChipRow } from '@/components/ui';
import { haptic } from '@/lib/motion';
import { BARANGAYS, CATEGORIES, categoryById, GROUPS, NAGA_CENTER, TIMES } from '@/lib/data';
import { useT } from '@/lib/i18n';
import { useStore } from '@/lib/store';
import { chunk, colors, fonts, radius, severityColors, shadow, type } from '@/lib/theme';
import type { CategoryId } from '@/lib/types';

export default function MapScreen() {
  const { reports, barangay, setBarangay, confirm, confirmed, outbox, refresh, syncing } = useStore();
  const insets = useSafeAreaInsets();
  const { t, L, lang } = useT();
  const [filter, setFilter] = useState<CategoryId | 'all'>('all');
  const [selected, setSelected] = useState<string | null>(null);
  const [me, setMe] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(false);
  /** Set when the person taps "locate me"; cleared when they pick a barangay. */
  const [focus, setFocus] = useState<{ lat: number; lng: number; key: string } | null>(null);

  useEffect(() => setFocus(null), [barangay]);

  const locate = async () => {
    setLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Location is off', 'Allow location for BayaniHan in your phone settings to see where you are on the map.');
        return;
      }
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const p = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      setMe(p);
      setFocus({ ...p, key: `me-${Date.now()}` });
    } catch {
      Alert.alert('Location not found', 'Your phone couldn’t find your position. Try again outdoors.');
    } finally {
      setLocating(false);
    }
  };

  const approved = useMemo(
    () => reports.filter((r) => r.status === 'approved' && (!barangay || r.barangay === barangay)),
    [reports, barangay],
  );
  const visible = useMemo(() => (filter === 'all' ? approved : approved.filter((r) => r.category === filter)), [approved, filter]);
  const markers: MapMarker[] = useMemo(
    () => visible.map((r) => ({ id: r.id, lat: r.lat, lng: r.lng, color: categoryById(r.category).color })),
    [visible],
  );

  const b = BARANGAYS.find((x) => x.name === barangay);
  const center = focus ?? (b ? { lat: b.lat, lng: b.lng } : NAGA_CENTER);
  const sel = reports.find((r) => r.id === selected);
  const selCat = sel ? categoryById(sel.category) : null;
  const confirmedThis = !!sel && confirmed.includes(sel.id);

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <LeafletMap
        style={StyleSheet.absoluteFill}
        center={center}
        zoom={focus || b ? 16 : 14}
        centerKey={focus?.key ?? barangay ?? 'city'}
        markers={markers}
        userLocation={me}
        showZoomControls
        onMarkerPress={(id) => {
          haptic.select();
          setSelected(id);
        }}
        onMapPress={() => setSelected(null)}
      />

      <SafeAreaView edges={['top']} style={styles.top} pointerEvents="box-none">
        <View style={styles.panel}>
          <View style={styles.brandRow}>
            <Logo size={40} />
            <View style={{ flex: 1 }}>
              <Text style={styles.brand}>BayaniHan</Text>
              <Text style={styles.tagline} numberOfLines={1}>
                {t('tagline')}
              </Text>
            </View>
            <LangToggle />
          </View>
          <BarangayPicker value={barangay} onChange={setBarangay} allowAll compact />
          <ChipRow scroll>
            <Chip small label={t('all')} count={approved.length} selected={filter === 'all'} onPress={() => setFilter('all')} />
            {CATEGORIES.map((c) => (
              <Chip
                key={c.id}
                small
                label={L(c.label)}
                color={c.color}
                count={approved.filter((r) => r.category === c.id).length}
                selected={filter === c.id}
                onPress={() => setFilter(c.id)}
              />
            ))}
          </ChipRow>
        </View>
      </SafeAreaView>

      <View style={[styles.bottom, { bottom: insets.bottom + 104 }]} pointerEvents="box-none">
        {outbox.length ? (
          <Pressable onPress={refresh} style={styles.syncPill} accessibilityRole="button">
            <Feather name="upload-cloud" size={14} color={colors.primaryDeep} />
            <Text style={styles.syncText}>
              {outbox.length} waiting to send{syncing ? '…' : '. Tap to retry.'}
            </Text>
          </Pressable>
        ) : null}
        {sel && selCat ? (
          <FadeIn key={sel.id} from={40} duration={260} style={styles.detail}>
            <View style={[styles.detailStripe, { backgroundColor: selCat.color }]} />
            <View style={{ padding: 16, paddingLeft: 20, gap: 10 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <View style={[styles.catIcon, { backgroundColor: `${selCat.color}22` }]}>
                  <Feather name={selCat.icon as keyof typeof Feather.glyphMap} size={16} color={selCat.color} />
                </View>
                <Text style={styles.detailTitle} numberOfLines={1}>
                  {L(selCat.label)}
                </Text>
                <View style={[styles.sev, { backgroundColor: severityColors[sel.severity - 1] }]}>
                  <Text style={styles.sevText}>{sel.severity}/5</Text>
                </View>
                <Pressable onPress={() => setSelected(null)} accessibilityRole="button" accessibilityLabel="Close" style={styles.close}>
                  <Feather name="x" size={18} color={colors.text} />
                </Pressable>
              </View>
              <Text style={styles.desc}>{sel.description}</Text>
              <View style={styles.metaRow}>
                <Meta icon="map-pin" text={sel.barangay} />
                <Meta icon="clock" text={L(TIMES.find((x) => x.id === sel.timeOfDay)!.label)} />
                <Meta
                  icon="calendar"
                  text={new Date(sel.createdAt).toLocaleDateString(lang === 'fil' ? 'fil-PH' : 'en-PH', { day: 'numeric', month: 'short' })}
                />
                <Meta icon="users" text={L(GROUPS.find((g) => g.id === sel.group)!.label)} />
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <View style={[styles.reviewed, { flex: 1 }]}>
                  <Feather name="check-circle" size={13} color={colors.success} />
                  <Text style={styles.reviewedText}>Reviewed</Text>
                </View>
                <Pressable
                  onPress={() => {
                    if (confirmedThis) return;
                    haptic.success();
                    confirm(sel.id);
                  }}
                  disabled={confirmedThis}
                  accessibilityRole="button"
                  accessibilityLabel={confirmedThis ? 'You said me too' : 'Me too: I feel unsafe here too'}
                  style={({ pressed }) => [styles.meToo, confirmedThis && styles.meTooDone, pressed && { opacity: 0.8 }]}
                >
                  <Feather name={confirmedThis ? 'check' : 'thumbs-up'} size={15} color={confirmedThis ? colors.text : '#fff'} />
                  <Text style={[styles.meTooText, confirmedThis && { color: colors.text }]}>
                    {confirmedThis ? 'You too' : 'Me too'}
                    {sel.confirmations ? ` · ${sel.confirmations}` : ''}
                  </Text>
                </Pressable>
              </View>
            </View>
          </FadeIn>
        ) : (
          <View style={styles.pill}>
            <Feather name="shield" size={13} color={colors.primary} />
            <Text style={styles.pillText}>
              {visible.length} {t('approvedAnon')}
            </Text>
          </View>
        )}
        <View style={styles.actions} pointerEvents="box-none">
          <RoundButton icon="message-circle" label={t('askBayanihan')} bg={colors.primary} edge={colors.primaryDeep} onPress={() => router.push('/chat')} />
          <View style={{ flex: 1 }} />
          <RoundButton icon="phone-call" label="Get help now" bg={colors.danger} edge="#A8182D" onPress={() => router.push('/hotlines')} />
          <RoundButton
            icon="crosshair"
            label="Show my location"
            bg={colors.card}
            edge="#D9D2EE"
            fg={me ? colors.primary : colors.text}
            busy={locating}
            onPress={locate}
          />
        </View>
      </View>
    </View>
  );
}

function RoundButton({
  icon,
  label,
  bg,
  edge,
  fg = '#fff',
  busy,
  onPress,
}: {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  bg: string;
  edge: string;
  fg?: string;
  busy?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={() => {
        haptic.tap();
        onPress();
      }}
      disabled={busy}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [styles.round, { backgroundColor: bg, borderBottomColor: edge }, pressed && styles.sink]}
    >
      {busy ? <ActivityIndicator color={fg === '#fff' ? '#fff' : colors.primary} /> : <Feather name={icon} size={22} color={fg} />}
    </Pressable>
  );
}

function Meta({ icon, text }: { icon: keyof typeof Feather.glyphMap; text: string }) {
  return (
    <View style={styles.meta}>
      <Feather name={icon} size={12} color={colors.muted} />
      <Text style={styles.metaText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  top: { position: 'absolute', top: 0, left: 0, right: 0, paddingHorizontal: 12 },
  panel: {
    backgroundColor: 'rgba(255,255,255,0.97)',
    borderRadius: radius.lg,
    padding: 12,
    gap: 10,
    marginTop: 6,
    ...shadow,
  },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  brand: { fontFamily: fonts.heading, fontSize: 22, lineHeight: 26, color: colors.text, letterSpacing: -0.5 },
  tagline: { fontFamily: fonts.body, ...type.small, color: colors.muted },
  bottom: { position: 'absolute', left: 12, right: 12, gap: 10 },
  round: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: chunk,
    ...shadow,
  },
  close: { marginLeft: 'auto', width: 36, height: 36, borderRadius: 18, backgroundColor: colors.sunken, alignItems: 'center', justifyContent: 'center' },
  meToo: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.primary, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 9 },
  meTooDone: { backgroundColor: colors.lime },
  meTooText: { fontFamily: fonts.bold, fontSize: 14, color: '#fff' },
  syncPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'center',
    backgroundColor: colors.primarySoft,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  syncText: { fontFamily: fonts.bold, fontSize: 13, color: colors.primaryDeep },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'center',
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 7,
    ...shadow,
    shadowOpacity: 0.06,
  },
  pillText: { fontFamily: fonts.medium, fontSize: 13, color: colors.text },
  actions: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  sink: { transform: [{ translateY: chunk - 1 }], borderBottomWidth: 1, marginBottom: chunk - 1 },
  detail: { backgroundColor: colors.card, borderRadius: radius.lg, overflow: 'hidden', ...shadow },
  detailStripe: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 6 },
  catIcon: { width: 34, height: 34, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  detailTitle: { fontFamily: fonts.heading, fontSize: 19, lineHeight: 24, color: colors.text, flexShrink: 1 },
  sev: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999 },
  sevText: { fontFamily: fonts.bold, fontSize: 12, color: '#fff' },
  desc: { fontFamily: fonts.body, ...type.body, color: colors.text },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.sunken, borderRadius: 999, paddingHorizontal: 9, paddingVertical: 4 },
  metaText: { fontFamily: fonts.medium, fontSize: 12, color: colors.muted },
  reviewed: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  reviewedText: { fontFamily: fonts.medium, fontSize: 12, color: colors.success },
});
