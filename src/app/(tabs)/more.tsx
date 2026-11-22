import Feather from '@expo/vector-icons/Feather';
import { Href, router } from 'expo-router';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { LangToggle, Logo } from '@/components/Brand';
import { Body, Card, Screen, Small } from '@/components/ui';
import { useT } from '@/lib/i18n';
import { useStore } from '@/lib/store';
import { colors, fonts, radius } from '@/lib/theme';

type Item = { icon: keyof typeof Feather.glyphMap; title: string; sub: string; href: Href };

const TOOLS: Item[] = [
  { icon: 'navigation', title: 'Safer route', sub: 'Compare walking routes against reported concerns', href: '/route' },
  { icon: 'message-circle', title: 'Ask BayaniHan', sub: 'Find the right hotline or office', href: '/chat' },
  { icon: 'shield', title: 'About and privacy', sub: 'How your data is protected', href: '/about' },
];

export default function MoreScreen() {
  const { reports } = useStore();
  const { t } = useT();
  const pending = reports.filter((r) => r.status === 'pending').length;

  return (
    <Screen>
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
          <Row key={it.title} item={it} />
        ))}
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

function Row({ item, badge }: { item: Item; badge?: number }) {
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
        <View style={styles.badge} accessibilityLabel={`${badge} waiting for review`}>
          <Text style={styles.badgeText}>{badge}</Text>
        </View>
      ) : null}
      <Feather name="chevron-right" size={18} color={colors.faint} />
    </Card>
  );
}

const styles = StyleSheet.create({
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
