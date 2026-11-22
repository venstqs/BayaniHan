import Feather from '@expo/vector-icons/Feather';
import type { BottomTabBarProps } from 'expo-router/tabs';
import { useEffect, useRef, useState } from 'react';
import { Animated, Keyboard, Pressable, StyleSheet, Text, View } from 'react-native';
import { haptic, useReduceMotion } from '@/lib/motion';
import { chunk, colors, fonts, shadow } from '@/lib/theme';

type IconName = keyof typeof Feather.glyphMap;

const ICONS: Record<string, IconName> = {
  index: 'map',
  survey: 'clipboard',
  report: 'plus',
  findings: 'bar-chart-2',
  more: 'grid',
};

/** The center tab is the big round "Report" button. */
const CENTER = 'report';

/** Floating bar of round buttons. Hides while the keyboard is open so it never covers a text field. */
export default function TabBar({ state, descriptors, emitter, navigateToTab, insets }: BottomTabBarProps) {
  const [keyboard, setKeyboard] = useState(false);
  useEffect(() => {
    const show = Keyboard.addListener('keyboardDidShow', () => setKeyboard(true));
    const hide = Keyboard.addListener('keyboardDidHide', () => setKeyboard(false));
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);
  if (keyboard) return null;

  return (
    <View pointerEvents="box-none" style={[styles.wrap, { paddingBottom: Math.max(insets.bottom, 10) + 6 }]}>
      <View style={styles.bar} accessibilityRole="tablist">
        {state.routes.map((route, index) => {
          const focused = index === state.index;
          const { options } = descriptors[route.key];
          const label = typeof options.title === 'string' ? options.title : route.name;
          const onPress = () => {
            haptic.select();
            const event = emitter.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
            if (!focused && !event.defaultPrevented) navigateToTab(route.key);
          };
          return route.name === CENTER ? (
            <CenterButton key={route.key} label={label} focused={focused} onPress={onPress} />
          ) : (
            <RoundTab key={route.key} icon={ICONS[route.name] ?? 'circle'} label={label} focused={focused} onPress={onPress} />
          );
        })}
      </View>
    </View>
  );
}

function RoundTab({ icon, label, focused, onPress }: { icon: IconName; label: string; focused: boolean; onPress: () => void }) {
  const reduce = useReduceMotion();
  const v = useRef(new Animated.Value(focused ? 1 : 0)).current;
  useEffect(() => {
    Animated.spring(v, { toValue: focused ? 1 : 0, friction: 6, tension: 160, useNativeDriver: true }).start();
  }, [focused, v]);
  const scale = reduce ? 1 : v.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1] });
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="tab"
      accessibilityState={{ selected: focused }}
      accessibilityLabel={label}
      hitSlop={6}
      style={styles.item}
    >
      <Animated.View style={[styles.circle, focused && styles.circleActive, { transform: [{ scale }] }]}>
        <Feather name={icon} size={21} color={focused ? '#fff' : colors.muted} />
      </Animated.View>
      <Text style={[styles.label, focused && { color: colors.primary }]} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}

function CenterButton({ label, focused, onPress }: { label: string; focused: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="tab" accessibilityState={{ selected: focused }} accessibilityLabel={label} style={styles.item}>
      {({ pressed }) => (
        <>
          <View style={[styles.center, pressed && styles.centerPressed]}>
            <Feather name="plus" size={30} color="#fff" />
          </View>
          <Text style={[styles.label, { color: colors.accentDeep }]} numberOfLines={1}>
            {label}
          </Text>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 14 },
  bar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    backgroundColor: colors.card,
    borderRadius: 32,
    paddingHorizontal: 8,
    paddingTop: 8,
    paddingBottom: 6,
    ...shadow,
    shadowOpacity: 0.16,
    elevation: 10,
  },
  item: { flex: 1, alignItems: 'center', gap: 3 },
  circle: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.sunken },
  circleActive: { backgroundColor: colors.primary },
  label: { fontFamily: fonts.bold, fontSize: 10.5, color: colors.muted },
  center: {
    width: 64,
    height: 64,
    marginTop: -28,
    borderRadius: 32,
    backgroundColor: colors.accent,
    borderWidth: 4,
    borderColor: colors.card,
    borderBottomWidth: 4 + chunk,
    borderBottomColor: colors.accentDeep,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow,
    shadowColor: colors.accent,
    shadowOpacity: 0.4,
    elevation: 8,
  },
  centerPressed: { transform: [{ translateY: chunk - 1 }], borderBottomWidth: 5, marginBottom: chunk - 1 },
});
