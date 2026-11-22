import Feather from '@expo/vector-icons/Feather';
import * as Location from 'expo-location';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Alert, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import BarangayPicker from '@/components/BarangayPicker';
import LeafletMap from '@/components/LeafletMap';
import { Button, Checkbox, Chip, ChipRow, Field, IconName, PageHeader, Screen, Section, shade, Small, Tile, TileGrid } from '@/components/ui';
import { BARANGAYS, CATEGORIES, categoryById, GROUPS, NAGA_CENTER, TIMES } from '@/lib/data';
import { nearestBarangay } from '@/lib/geo';
import { useT } from '@/lib/i18n';
import { animateLayout, haptic } from '@/lib/motion';
import { FadeIn, PopIn } from '@/components/motion';
import { useStore } from '@/lib/store';
import { chunk, colors, fonts, radius, severityColors, type } from '@/lib/theme';
import type { CategoryId, GroupId, Localized, TimeOfDay } from '@/lib/types';

const SEVERITY: Localized[] = [
  { en: 'Slight', fil: 'Bahagya' },
  { en: 'Minor', fil: 'Maliit' },
  { en: 'Moderate', fil: 'Katamtaman' },
  { en: 'Serious', fil: 'Seryoso' },
  { en: 'Severe', fil: 'Malala' },
];

export default function ReportScreen() {
  const { addReport, barangay: currentBarangay } = useStore();
  const { t, L } = useT();
  const [barangay, setBarangay] = useState<string | null>(currentBarangay);
  const [category, setCategory] = useState<CategoryId | null>(null);
  const [severity, setSeverity] = useState(3);
  const [timeOfDay, setTime] = useState<TimeOfDay>('night');
  const [group, setGroup] = useState<GroupId>('everyone');
  const [description, setDescription] = useState('');
  const [point, setPoint] = useState(NAGA_CENTER);
  const [mapKey, setMapKey] = useState('init');
  const [consent, setConsent] = useState(false);
  const [locating, setLocating] = useState(false);
  const [sent, setSent] = useState(false);
  const [queued, setQueued] = useState(false);
  const [sending, setSending] = useState(false);
  /** Shown under the map when the barangay was filled in from the pin. */
  const [autoNote, setAutoNote] = useState<string | null>(null);
  // When the barangay is set FROM the pin, don't jump the pin back to the barangay centre.
  const skipRecenter = useRef(false);

  // Move pin to the selected barangay center when the person picks a barangay.
  useEffect(() => {
    if (skipRecenter.current) {
      skipRecenter.current = false;
      return;
    }
    const b = BARANGAYS.find((x) => x.name === barangay);
    if (b) {
      setPoint({ lat: b.lat, lng: b.lng });
      setMapKey(`b-${b.name}`);
      setAutoNote(null);
    }
  }, [barangay]);

  /** Put the pin somewhere and fill in the barangay it falls in. */
  const placePin = (p: { lat: number; lng: number }) => {
    setPoint(p);
    const near = nearestBarangay(p);
    animateLayout();
    if (!near) {
      setAutoNote('This spot looks outside Naga City. Please check the pin.');
      return;
    }
    if (near.name !== barangay) {
      skipRecenter.current = true;
      setBarangay(near.name);
      setAutoNote(`Barangay set to ${near.name} from the pin. Change it in step 1 if that's wrong.`);
    }
  };

  const useMyLocation = async () => {
    setLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Location is off', 'BayaniHan can’t use your location. Tap the map to place the pin instead.');
        return;
      }
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      placePin({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      setMapKey(`gps-${Date.now()}`);
      haptic.success();
    } catch {
      Alert.alert('Location not found', 'Your phone couldn’t find your position. Tap the map to place the pin instead.');
    } finally {
      setLocating(false);
    }
  };

  const descOk = description.trim().length >= 5;
  const missing = [
    !barangay && 'barangay',
    !category && 'type of concern',
    !descOk && 'a short description',
    !consent && 'the consent box',
  ].filter(Boolean) as string[];
  const canSubmit = missing.length === 0;

  const submit = async () => {
    if (!canSubmit || sending) return;
    setSending(true);
    try {
      const res = await addReport({ barangay: barangay!, category: category!, severity, timeOfDay, group, description: description.trim(), ...point });
      setQueued(res.queued);
      haptic.success();
      setSent(true);
    } catch (e) {
      haptic.warn();
      Alert.alert('Report not sent', e instanceof Error ? e.message : 'Please check your answers and try again.');
    } finally {
      setSending(false);
    }
  };

  const startOver = () => {
    setCategory(null);
    setDescription('');
    setSeverity(3);
    setConsent(false);
    setAutoNote(null);
    setSent(false);
  };

  if (sent) {
    return (
      <Screen tabBarSpace>
        <View style={styles.done}>
          <PopIn>
            <View style={styles.doneIcon}>
              <Feather name="check" size={44} color={colors.text} />
            </View>
          </PopIn>
          <FadeIn delay={150}>
            <Text style={styles.doneTitle}>{t('sentTitle')}</Text>
          </FadeIn>
          <FadeIn delay={250}>
            <Text style={styles.doneBody}>
              {queued ? 'You’re offline right now. Your report is saved on this phone and will be sent automatically when you’re back online.' : t('sentBody')}
            </Text>
          </FadeIn>
          <FadeIn delay={350} style={{ alignSelf: 'stretch', gap: 10, marginTop: 12 }}>
            <Button title="Track it in My reports" icon="clock" onPress={() => { startOver(); router.push('/my-reports'); }} />
            <Button title={t('viewMap')} variant="soft" icon="map" onPress={() => { startOver(); router.navigate('/'); }} />
            <Button title={t('reportAnother')} variant="ghost" icon="plus" onPress={startOver} />
          </FadeIn>
        </View>
      </Screen>
    );
  }

  const pinColor = category ? categoryById(category).color : colors.accent;

  return (
    <Screen tabBarSpace>
      <PageHeader context="Anonymous, reviewed before it goes public" title={t('reportConcern')} />
      <Pressable
        onPress={() => Linking.openURL('tel:911').catch(() => {})}
        accessibilityRole="button"
        accessibilityLabel="Call 911"
        style={({ pressed }) => [styles.sos, pressed && { opacity: 0.85 }]}
      >
        <Feather name="phone-call" size={18} color="#fff" />
        <Text style={styles.sosText}>{t('emergency')}</Text>
        <Text style={styles.sosCta}>{t('tapToCall')}</Text>
      </Pressable>

      <Section step={1} title="Barangay" done={!!barangay}>
        <BarangayPicker value={barangay} onChange={setBarangay} />
      </Section>

      <Section step={2} title={t('category')} done={!!category}>
        <TileGrid>
          {CATEGORIES.map((c) => (
            <Tile
              key={c.id}
              label={L(c.label)}
              icon={c.icon as IconName}
              color={c.color}
              selected={category === c.id}
              onPress={() => setCategory(c.id)}
            />
          ))}
        </TileGrid>
      </Section>

      <Section step={3} title={t('severity')} done>
        <View style={{ flexDirection: 'row', gap: 6 }} accessibilityRole="radiogroup">
          {SEVERITY.map((label, i) => {
            const v = i + 1;
            const active = severity === v;
            const c = severityColors[i];
            return (
              <Pressable
                key={label.en}
                onPress={() => {
                  haptic.select();
                  setSeverity(v);
                }}
                accessibilityRole="radio"
                accessibilityState={{ selected: active }}
                accessibilityLabel={`${v}, ${L(label)}`}
                style={({ pressed }) => [styles.sev, active && { backgroundColor: c, borderColor: c, borderBottomColor: shade(c) }, pressed && styles.sevPressed]}
              >
                <View style={[styles.sevBar, { backgroundColor: active ? 'rgba(255,255,255,.5)' : c, height: 4 + v * 3 }]} />
                <Text style={[styles.sevNum, active && { color: '#fff' }]}>{v}</Text>
                <Text style={[styles.sevText, active && { color: '#fff' }]} numberOfLines={1}>
                  {L(label)}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </Section>

      <Section step={4} title={t('timeOfDay')} done>
        <ChipRow>
          {TIMES.map((x) => (
            <Chip
              key={x.id}
              icon={x.id === 'day' ? 'sun' : x.id === 'evening' ? 'sunset' : 'moon'}
              label={L(x.label)}
              selected={timeOfDay === x.id}
              onPress={() => setTime(x.id)}
            />
          ))}
        </ChipRow>
      </Section>

      <Section step={5} title={t('whoAffected')} done>
        <ChipRow>
          {GROUPS.map((g) => (
            <Chip key={g.id} label={L(g.label)} selected={group === g.id} onPress={() => setGroup(g.id)} />
          ))}
        </ChipRow>
      </Section>

      <Section step={6} title={t('describe')} done={descOk}>
        <Field
          multiline
          counter
          value={description}
          onChangeText={setDescription}
          placeholder="e.g. Streetlight broken at the corner near the covered court"
          maxLength={400}
        />
      </Section>

      <Section step={7} title={t('location')} hint={t('locationHint')} done>
        <View style={styles.mapCard}>
          <LeafletMap
            style={{ height: 240 }}
            center={point}
            zoom={16}
            centerKey={mapKey}
            markers={[{ id: 'pick', lat: point.lat, lng: point.lng, color: pinColor }]}
            onMapPress={(lat, lng) => placePin({ lat, lng })}
          />
          <View style={styles.mapFoot}>
            <Small style={{ flex: 1 }}>
              {point.lat.toFixed(4)}, {point.lng.toFixed(4)}
            </Small>
            <Button
              size="sm"
              variant="soft"
              title={locating ? 'Finding you…' : t('useMyLocation')}
              icon="crosshair"
              onPress={useMyLocation}
              disabled={locating}
            />
          </View>
          {autoNote ? (
            <View style={styles.autoNote}>
              <Feather name="info" size={14} color={colors.primaryDeep} />
              <Small muted={false} style={{ flex: 1, color: colors.primaryDeep }}>
                {autoNote}
              </Small>
            </View>
          ) : null}
        </View>
      </Section>

      <Checkbox checked={consent} onChange={setConsent} label={t('consent')} />
      <Button title={sending ? 'Sending…' : t('sendReport')} variant="accent" icon="send" onPress={submit} disabled={!canSubmit || sending} />
      {!canSubmit ? (
        <Small style={{ textAlign: 'center' }}>
          {t('stillNeeded')} {missing.join(', ')}.
        </Small>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  sos: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.danger,
    borderBottomWidth: chunk,
    borderBottomColor: '#A8182D',
    borderRadius: radius.md,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  sosText: { flex: 1, fontFamily: fonts.bold, fontSize: 15, color: '#fff' },
  sosCta: { fontFamily: fonts.medium, fontSize: 12, color: 'rgba(255,255,255,.85)' },
  sev: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 3,
    paddingTop: 12,
    paddingBottom: 10,
    borderRadius: radius.sm,
    backgroundColor: colors.card,
    borderWidth: 2,
    borderBottomWidth: chunk,
    borderColor: colors.border,
    borderBottomColor: '#D9D2EE',
  },
  sevPressed: { transform: [{ translateY: chunk - 1 }], borderBottomWidth: 1, marginBottom: chunk - 1 },
  sevBar: { width: 18, borderRadius: 2, marginBottom: 2 },
  sevNum: { fontFamily: fonts.heading, fontSize: 20, lineHeight: 24, color: colors.text },
  sevText: { fontFamily: fonts.medium, fontSize: 10, color: colors.muted },
  mapCard: { borderRadius: radius.md, overflow: 'hidden', borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card },
  autoNote: { flexDirection: 'row', gap: 8, alignItems: 'flex-start', backgroundColor: colors.primarySoft, paddingHorizontal: 14, paddingVertical: 10 },
  mapFoot: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 10, paddingLeft: 14 },
  done: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 60 },
  doneIcon: {
    width: 96,
    height: 96,
    borderRadius: 32,
    backgroundColor: colors.lime,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    transform: [{ rotate: '-6deg' }],
  },
  doneTitle: { fontFamily: fonts.headingBold, ...type.display, color: colors.text, textAlign: 'center' },
  doneBody: { fontFamily: fonts.body, ...type.body, color: colors.muted, textAlign: 'center', maxWidth: 320 },
});
