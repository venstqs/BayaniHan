import Feather from '@expo/vector-icons/Feather';
import { Href, router } from 'expo-router';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { LangToggle, Logo } from '@/components/Brand';
import { Body, Button, Card, Screen, Small } from '@/components/ui';
import { useT } from '@/lib/i18n';
import { useStore } from '@/lib/store';
import { colors, fonts, radius } from '@/lib/theme';

type Item = { icon: keyof typeof Feather.glyphMap; title: string; sub: string; href: Href };

const TOOLS: Item[] = [
  { icon: 'clock', title: 'My reports', sub: 'Follow the review status of reports you sent', href: '/my-reports' },
  { icon: 'phone-call', title: 'Get help now', sub: 'Hotlines, share your location, safety tips', href: '/hotlines' },
  { icon: 'navigation', title: 'Safer route', sub: 'Compare walking routes against reported concerns', href: '/route' },
  { icon: 'message-circle', title: 'Ask BayaniHan', sub: 'Find the right hotline or office', href: '/chat' },
  { icon: 'shield', title: 'About and privacy', sub: 'How your data is protected', href: '/about' },
];

export default function MoreScreen() {
  const { reports, mine, online, outbox, syncing, syncError, lastSync, refresh } = useStore();
  const { t } = useT();
  const pending = reports.filter((r) => r.status === 'pending').length;

  return (
    <Screen tabBarSpace>
      <View style={styles.hero}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <Logo size={48} />
          <View style={{ flex: 1 }}>
            <Text style={styles.heroTitle}>BayaniHan</Text>
            <Text style={styles.heroSub}>Project BayaniHan, CSNHS</Text>
          </View>
          <LangToggle />
        </View>
        <Text style={styles.heroBody}>
          A youth-led safety map for Naga City&apos;s 27 barangays, part of the Safe Spaces Project Challenge.
        </Text>
      </View>

      <Pressable
        onPress={() => Linking.openURL('tel:911').catch(() => {})}
        style={({ pressed }) => [styles.sos, pressed && { opacity: 0.85 }]}
        accessibilityRole="button"
        accessibilityLabel="Call 911"
      >
        <Feather name="phone-call" size={18} color="#fff" />
        <Text style={styles.sosText}>{t('emergency')}</Text>
      </Pressable>

      <View style={{ gap: 10 }}>
        {TOOLS.map((it) => (
          <Row key={it.title} item={it} badge={it.href === '/my-reports' ? mine.length : undefined} badgeTone="soft" />
        ))}
      </View>

      <View style={styles.status}>
        <View style={[styles.statusDot, { backgroundColor: !online ? colors.warning : syncError ? colors.danger : colors.success }]} />
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={styles.title}>{!online ? 'Demo mode' : syncError ? 'Offline' : 'Connected'}</Text>
          <Small>
            {!online
              ? 'No server connected. Reports stay on this phone.'
              : syncError
                ? `${syncError}${outbox.length ? ` ${outbox.length} item(s) will send automatically.` : ''}`
                : lastSync
                  ? `Up to date as of ${new Date(lastSync).toLocaleTimeString('en-PH', { hour: 'numeric', minute: '2-digit' })}.${outbox.length ? ` Sending ${outbox.length}…` : ''}`
                  : 'Syncing…'}
          </Small>
        </View>
        {online ? <Button size="sm" variant="soft" title={syncing ? 'Syncing…' : 'Sync'} icon="refresh-cw" onPress={refresh} disabled={syncing} /> : null}
      </View>

      <Text style={styles.groupLabel}>For coordinators</Text>
      <Row
        item={{ icon: 'lock', title: 'Review reports', sub: 'Moderation, AI findings and policy builder', href: '/admin' }}
        badge={pending}
      />

      <Pressable onPress={() => router.push('/about')}>
        <Small style={{ textAlign: 'center', marginTop: 12 }}>Supported by the Global Peace Foundation Philippines Safe Spaces Project Challenge.</Small>
      </Pressable>
    </Screen>
  );
}

function Row({ item, badge, badgeTone = 'accent' }: { item: Item; badge?: number; badgeTone?: 'accent' | 'soft' }) {
  return (
    <Card onPress={() => router.push(item.href)} style={styles.row} accessibilityLabel={item.title}>
      <View style={styles.icon}>
        <Feather name={item.icon} size={20} color={colors.primary} />
      </View>
      <View style={{ flex: 1, gap: 1 }}>
        <Text style={styles.title}>{item.title}</Text>
        <Body muted style={{ fontSize: 13, lineHeight: 18 }}>
          {item.sub}
        </Body>
      </View>
      {badge ? (
        <View style={[styles.badge, badgeTone === 'soft' && { backgroundColor: colors.primarySoft }]} accessibilityLabel={`${badge}`}>
          <Text style={[styles.badgeText, badgeTone === 'soft' && { color: colors.primary }]}>{badge}</Text>
        </View>
      ) : null}
      <Feather name="chevron-right" size={18} color={colors.faint} />
    </Card>
  );
}

const styles = StyleSheet.create({
  status: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 2,
    borderColor: colors.border,
    padding: 14,
  },
  statusDot: { width: 12, height: 12, borderRadius: 6 },
  hero: { backgroundColor: colors.primary, borderRadius: radius.lg, padding: 20, gap: 16, borderBottomWidth: 5, borderBottomColor: colors.primaryDeep },
  heroTitle: { fontFamily: fonts.heading, fontSize: 26, lineHeight: 30, color: '#fff', letterSpacing: -0.5 },
  heroSub: { fontFamily: fonts.bold, fontSize: 13, color: colors.lime },
  heroBody: { fontFamily: fonts.body, fontSize: 15, lineHeight: 22, color: 'rgba(255,255,255,.9)' },
  sos: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.danger, borderRadius: radius.md, padding: 16, borderBottomWidth: 4, borderBottomColor: '#A8182D' },
  sosText: { flex: 1, fontFamily: fonts.bold, fontSize: 15, color: '#fff' },
  groupLabel: { fontFamily: fonts.bold, fontSize: 13, color: colors.muted, marginTop: 6 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  icon: { width: 46, height: 46, borderRadius: 15, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  title: { fontFamily: fonts.bold, fontSize: 16, color: colors.text },
  badge: { backgroundColor: colors.accent, borderRadius: 999, minWidth: 24, height: 24, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 7 },
  badgeText: { fontFamily: fonts.bold, fontSize: 12, color: '#fff' },
});
