import Feather from '@expo/vector-icons/Feather';
import { router } from 'expo-router';
import { ComponentRef, useRef, useState } from 'react';
import { Animated, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import BarangayPicker from '@/components/BarangayPicker';
import { LangToggle, Logo } from '@/components/Brand';
import { PopIn } from '@/components/motion';
import { Button } from '@/components/ui';
import { useT } from '@/lib/i18n';
import { haptic } from '@/lib/motion';
import { useStore } from '@/lib/store';
import type { Localized } from '@/lib/types';
import { colors, fonts, radius } from '@/lib/theme';

interface Slide {
  icon: keyof typeof Feather.glyphMap;
  bg: string;
  fg: string;
  title: Localized;
  body: Localized;
}

const SLIDES: Slide[] = [
  {
    icon: 'map-pin',
    bg: colors.primary,
    fg: '#fff',
    title: { en: 'Map the places that feel unsafe', fil: 'I-mapa ang mga lugar na delikado' },
    body: {
      en: 'Dark streets, empty lots, harassment hotspots, flooding. Your reports help your barangay fix them.',
      fil: 'Madilim na kalye, bakanteng lote, pambabastos, baha. Tutulong ang ulat mo para maayos ito ng barangay.',
    },
  },
  {
    icon: 'eye-off',
    bg: colors.lime,
    fg: colors.text,
    title: { en: 'Always anonymous', fil: 'Laging anonymous' },
    body: {
      en: 'We never ask for your name, number or school. A youth coordinator checks every report before it goes on the map.',
      fil: 'Hindi namin hinihingi ang pangalan, numero o paaralan mo. Sinusuri ng youth coordinator ang bawat ulat bago ilabas.',
    },
  },
  {
    icon: 'phone-call',
    bg: colors.accent,
    fg: '#fff',
    title: { en: 'Not an emergency line', fil: 'Hindi ito emergency hotline' },
    body: {
      en: 'If you are in danger right now, call 911. BayaniHan can point you to the right hotline or office.',
      fil: 'Kung nasa panganib ka ngayon, tumawag sa 911. Matutulungan ka ng BayaniHan na hanapin ang tamang hotline.',
    },
  },
];

export default function Welcome() {
  const { width } = useWindowDimensions();
  const { L } = useT();
  const { barangay, setBarangay, setOnboarded } = useStore();
  const scroll = useRef<ComponentRef<typeof ScrollView>>(null);
  const x = useRef(new Animated.Value(0)).current;
  const [page, setPage] = useState(0);
  const pages = SLIDES.length + 1; // last page = setup
  const last = page === pages - 1;

  const goTo = (p: number) => {
    scroll.current?.scrollTo({ x: p * width, animated: true });
    setPage(p);
  };

  const finish = () => {
    haptic.success();
    setOnboarded(true);
    router.replace('/');
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={styles.top}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <Logo size={34} />
          <Text style={styles.brand}>BayaniHan</Text>
        </View>
        {!last ? (
          <Pressable onPress={() => goTo(pages - 1)} hitSlop={12} accessibilityRole="button">
            <Text style={styles.skip}>Skip</Text>
          </Pressable>
        ) : null}
      </View>

      <Animated.ScrollView
        ref={scroll}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        // JS driver: the page dots animate width, which the native driver can't do.
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { x } } }], { useNativeDriver: false })}
        scrollEventThrottle={16}
        onMomentumScrollEnd={(e) => {
          const p = Math.round(e.nativeEvent.contentOffset.x / width);
          if (p !== page) haptic.select();
          setPage(p);
        }}
      >
        {SLIDES.map((s, i) => {
          // Each illustration drifts and scales as you swipe past it.
          const input = [(i - 1) * width, i * width, (i + 1) * width];
          const scale = x.interpolate({ inputRange: input, outputRange: [0.6, 1, 0.6], extrapolate: 'clamp' });
          const rotate = x.interpolate({ inputRange: input, outputRange: ['-18deg', '-6deg', '6deg'], extrapolate: 'clamp' });
          return (
            <View key={i} style={[styles.slide, { width }]}>
              <Animated.View style={[styles.art, { backgroundColor: s.bg, transform: [{ scale }, { rotate }] }]}>
                <Feather name={s.icon} size={72} color={s.fg} />
              </Animated.View>
              <Text style={styles.title}>{L(s.title)}</Text>
              <Text style={styles.body}>{L(s.body)}</Text>
            </View>
          );
        })}
        <View style={[styles.slide, { width, justifyContent: 'flex-start', paddingTop: 24 }]}>
          <PopIn trigger={last}>
            <View style={[styles.art, styles.artSmall, { backgroundColor: colors.primarySoft }]}>
              <Feather name="sliders" size={44} color={colors.primary} />
            </View>
          </PopIn>
          <Text style={styles.title}>Set up in 10 seconds</Text>
          <View style={styles.setupCard}>
            <Text style={styles.setupLabel}>Language / Wika</Text>
            <LangToggle />
          </View>
          <View style={[styles.setupCard, { flexDirection: 'column', alignItems: 'stretch', gap: 10 }]}>
            <Text style={styles.setupLabel}>Your barangay (optional)</Text>
            <BarangayPicker value={barangay} onChange={setBarangay} allowAll />
          </View>
        </View>
      </Animated.ScrollView>

      <View style={styles.bottom}>
        <View style={styles.dots}>
          {Array.from({ length: pages }).map((_, i) => {
            const input = [(i - 1) * width, i * width, (i + 1) * width];
            const w = x.interpolate({ inputRange: input, outputRange: [8, 26, 8], extrapolate: 'clamp' });
            const o = x.interpolate({ inputRange: input, outputRange: [0.3, 1, 0.3], extrapolate: 'clamp' });
            return <Animated.View key={i} style={[styles.dot, { width: w, opacity: o }]} />;
          })}
        </View>
        <Button
          title={last ? 'Start using BayaniHan' : 'Next'}
          icon={last ? 'check' : 'arrow-right'}
          variant={last ? 'accent' : 'primary'}
          onPress={last ? finish : () => goTo(page + 1)}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 8 },
  brand: { fontFamily: fonts.heading, fontSize: 20, color: colors.text, letterSpacing: -0.5 },
  skip: { fontFamily: fonts.bold, fontSize: 15, color: colors.muted },
  slide: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 28, gap: 14 },
  art: { width: 180, height: 180, borderRadius: 56, alignItems: 'center', justifyContent: 'center', marginBottom: 18 },
  artSmall: { width: 96, height: 96, borderRadius: 32, marginBottom: 4 },
  title: { fontFamily: fonts.heading, fontSize: 30, lineHeight: 36, color: colors.text, textAlign: 'center', letterSpacing: -0.5 },
  body: { fontFamily: fonts.body, fontSize: 16, lineHeight: 24, color: colors.muted, textAlign: 'center', maxWidth: 340 },
  setupCard: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 2,
    borderColor: colors.border,
    padding: 16,
  },
  setupLabel: { fontFamily: fonts.bold, fontSize: 15, color: colors.text },
  bottom: { paddingHorizontal: 20, paddingBottom: 12, gap: 18 },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 6 },
  dot: { height: 8, borderRadius: 4, backgroundColor: colors.primary },
});
