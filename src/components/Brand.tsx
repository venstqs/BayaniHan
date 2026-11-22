import Feather from '@expo/vector-icons/Feather';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useStore } from '@/lib/store';
import { colors, fonts } from '@/lib/theme';

export function Logo({ size = 44 }: { size?: number }) {
  return (
    <View style={[styles.logo, { width: size, height: size, borderRadius: size * 0.34 }]}>
      <Feather name="map-pin" size={size * 0.48} color="#fff" />
      <View style={[styles.logoDot, { width: size * 0.28, height: size * 0.28, borderRadius: size * 0.14 }]} />
    </View>
  );
}

export function LangToggle() {
  const { lang, setLang } = useStore();
  return (
    <View style={styles.lang}>
      {(['en', 'fil'] as const).map((l) => (
        <Pressable key={l} onPress={() => setLang(l)} style={[styles.langItem, lang === l && { backgroundColor: colors.primary }]}>
          <Text style={[styles.langText, lang === l && { color: '#fff' }]}>{l.toUpperCase()}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  logo: { backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', transform: [{ rotate: '-6deg' }] },
  logoDot: { position: 'absolute', top: -3, right: -3, backgroundColor: colors.lime, borderWidth: 2.5, borderColor: '#fff' },
  lang: { flexDirection: 'row', backgroundColor: colors.sunken, borderRadius: 999, padding: 3 },
  langItem: { paddingHorizontal: 11, paddingVertical: 6, borderRadius: 999 },
  langText: { fontFamily: fonts.bold, fontSize: 11, color: colors.muted },
});
