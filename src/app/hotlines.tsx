import Feather from '@expo/vector-icons/Feather';
import * as Location from 'expo-location';
import { useState } from 'react';
import { Alert, Linking, Pressable, Share, StyleSheet, Text, View } from 'react-native';
import { PopIn } from '@/components/motion';
import { Button, Card, H2, Notice, Screen, Small } from '@/components/ui';
import { CONTACTS } from '@/lib/data';
import { useT } from '@/lib/i18n';
import { haptic } from '@/lib/motion';
import { chunk, colors, fonts, radius } from '@/lib/theme';

const TIPS = [
  { icon: 'users' as const, text: 'Walk with a buddy at night and tell someone your route.' },
  { icon: 'sun' as const, text: 'Stick to lit streets with people around, even if it is longer.' },
  { icon: 'home' as const, text: 'If you feel followed, go into a store, barangay hall or police station.' },
  { icon: 'battery-charging' as const, text: 'Keep your phone charged and know these numbers before you need them.' },
];

const call = (n: string) => {
  haptic.tap();
  Linking.openURL(`tel:${n}`).catch(() => Alert.alert('Can’t start a call', `Dial ${n} from your phone app.`));
};

export default function Hotlines() {
  const { L } = useT();
  const [sharing, setSharing] = useState(false);

  /** Share a map link to the person's current spot through any messaging app. */
  const shareLocation = async () => {
    haptic.tap();
    setSharing(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Location is off', 'Allow location for BayaniHan in your phone settings to share where you are.');
        return;
      }
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const { latitude: lat, longitude: lng } = pos.coords;
      await Share.share({
        message: `I'm sharing my location for safety: https://maps.google.com/?q=${lat.toFixed(6)},${lng.toFixed(6)} (sent with BayaniHan)`,
      });
    } catch {
      Alert.alert('Location not found', 'Your phone couldn’t find your position. Try again, or call 911 if you are in danger.');
    } finally {
      setSharing(false);
    }
  };

  return (
    <Screen edges={[]}>
      <PopIn>
        <Pressable onPress={() => call('911')} style={({ pressed }) => [styles.sos, pressed && styles.sosPressed]} accessibilityRole="button" accessibilityLabel="Call 911">
          <View style={styles.sosIcon}>
            <Feather name="phone-call" size={30} color={colors.danger} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.sosTitle}>Call 911</Text>
            <Text style={styles.sosSub}>Police, fire and medical emergencies</Text>
          </View>
        </Pressable>
      </PopIn>

      <Card>
        <H2>Share my location</H2>
        <Small>Send a map link of where you are right now to someone you trust, through SMS, Messenger or any app.</Small>
        <Button title={sharing ? 'Finding you…' : 'Share my location'} icon="share-2" variant="primary" onPress={shareLocation} disabled={sharing} />
      </Card>

      <H2>Hotlines</H2>
      {CONTACTS.map((c) => {
        const callable = /^\d+$/.test(c.number);
        return (
          <Card key={c.name} onPress={callable ? () => call(c.number) : undefined} style={styles.row} accessibilityLabel={callable ? `Call ${c.name}, ${c.number}` : c.name}>
            <View style={[styles.icon, !callable && { backgroundColor: colors.sunken }]}>
              <Feather name={callable ? 'phone' : 'map-pin'} size={18} color={callable ? colors.primary : colors.muted} />
            </View>
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={styles.name}>{c.name}</Text>
              <Small>{L(c.detail)}</Small>
            </View>
            <Text style={[styles.number, !callable && { color: colors.faint, fontSize: 12 }]}>{callable ? c.number : c.verified ? c.number : 'Being confirmed'}</Text>
          </Card>
        );
      })}

      <H2>Staying safe</H2>
      <Card>
        {TIPS.map((t) => (
          <View key={t.text} style={{ flexDirection: 'row', gap: 12, alignItems: 'flex-start' }}>
            <Feather name={t.icon} size={18} color={colors.primary} style={{ marginTop: 2 }} />
            <Small muted={false} style={{ flex: 1, fontSize: 14, lineHeight: 20 }}>
              {t.text}
            </Small>
          </View>
        ))}
      </Card>
      <Notice>BayaniHan does not dispatch help. Local numbers marked “being confirmed” are still being verified with the offices.</Notice>
    </Screen>
  );
}

const styles = StyleSheet.create({
  sos: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    backgroundColor: colors.danger,
    borderRadius: radius.lg,
    padding: 20,
    borderBottomWidth: chunk + 1,
    borderBottomColor: '#A8182D',
  },
  sosPressed: { transform: [{ translateY: chunk }], borderBottomWidth: 1, marginBottom: chunk },
  sosIcon: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  sosTitle: { fontFamily: fonts.heading, fontSize: 28, lineHeight: 32, color: '#fff' },
  sosSub: { fontFamily: fonts.medium, fontSize: 14, color: 'rgba(255,255,255,.9)' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  icon: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  name: { fontFamily: fonts.bold, fontSize: 15, color: colors.text },
  number: { fontFamily: fonts.heading, fontSize: 18, color: colors.primary },
});
