import Feather from '@expo/vector-icons/Feather';
import { createContext, ReactNode, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Animated, Easing, Pressable, StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useReduceMotion } from '@/lib/motion';
import { colors, fonts, radius, shadow } from '@/lib/theme';

/** Springs in from small when mounted (or when `trigger` changes). Used for success badges and check marks. */
export function PopIn({ children, delay = 0, trigger, style }: { children: ReactNode; delay?: number; trigger?: unknown; style?: StyleProp<ViewStyle> }) {
  const reduce = useReduceMotion();
  const v = useRef(new Animated.Value(reduce ? 1 : 0)).current;
  useEffect(() => {
    if (reduce) {
      v.setValue(1);
      return;
    }
    v.setValue(0);
    const a = Animated.sequence([Animated.delay(delay), Animated.spring(v, { toValue: 1, friction: 5, tension: 140, useNativeDriver: true })]);
    a.start();
    return () => a.stop();
  }, [trigger, reduce, delay, v]);
  return (
    <Animated.View style={[style, { opacity: v.interpolate({ inputRange: [0, 0.4, 1], outputRange: [0, 1, 1] }), transform: [{ scale: v }] }]}>
      {children}
    </Animated.View>
  );
}

/** Fades and rises slightly into place when mounted. */
export function FadeIn({
  children,
  delay = 0,
  from = 12,
  duration = 280,
  style,
}: {
  children: ReactNode;
  delay?: number;
  /** Starting vertical offset in px (positive = from below). */
  from?: number;
  duration?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const reduce = useReduceMotion();
  const v = useRef(new Animated.Value(reduce ? 1 : 0)).current;
  useEffect(() => {
    if (reduce) return v.setValue(1);
    const a = Animated.timing(v, { toValue: 1, duration, delay, easing: Easing.out(Easing.cubic), useNativeDriver: true });
    a.start();
    return () => a.stop();
  }, [reduce, delay, duration, v]);
  return (
    <Animated.View style={[style, { opacity: v, transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [from, 0] }) }] }]}>
      {children}
    </Animated.View>
  );
}

/** Three bouncing dots: "the assistant is typing". */
export function TypingDots() {
  const reduce = useReduceMotion();
  const dots = useRef([0, 1, 2].map(() => new Animated.Value(0))).current;
  useEffect(() => {
    if (reduce) return;
    const loops = dots.map((d, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 140),
          Animated.timing(d, { toValue: 1, duration: 260, useNativeDriver: true }),
          Animated.timing(d, { toValue: 0, duration: 260, useNativeDriver: true }),
          Animated.delay((2 - i) * 140),
        ]),
      ),
    );
    loops.forEach((l) => l.start());
    return () => loops.forEach((l) => l.stop());
  }, [reduce, dots]);
  return (
    <View style={{ flexDirection: 'row', gap: 5, paddingVertical: 4 }} accessibilityLabel="Typing">
      {dots.map((d, i) => (
        <Animated.View
          key={i}
          style={[
            styles.dot,
            { opacity: d.interpolate({ inputRange: [0, 1], outputRange: [0.35, 1] }), transform: [{ translateY: d.interpolate({ inputRange: [0, 1], outputRange: [0, -4] }) }] },
          ]}
        />
      ))}
    </View>
  );
}

/* ---------- Toast with optional action (e.g. Undo) ---------- */

interface ToastOptions {
  message: string;
  icon?: keyof typeof Feather.glyphMap;
  action?: { label: string; onPress: () => void };
  /** ms before it hides; default 3500 */
  duration?: number;
}

const ToastCtx = createContext<(t: ToastOptions) => void>(() => {});
export const useToast = () => useContext(ToastCtx);

export function ToastProvider({ children }: { children: ReactNode }) {
  const insets = useSafeAreaInsets();
  const reduce = useReduceMotion();
  const [toast, setToast] = useState<(ToastOptions & { key: number }) | null>(null);
  const v = useRef(new Animated.Value(0)).current;
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const hide = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    Animated.timing(v, { toValue: 0, duration: reduce ? 0 : 180, useNativeDriver: true }).start(({ finished }) => finished && setToast(null));
  }, [reduce, v]);

  const show = useCallback(
    (t: ToastOptions) => {
      if (timer.current) clearTimeout(timer.current);
      setToast({ ...t, key: Date.now() });
      v.setValue(0);
      Animated.spring(v, { toValue: 1, friction: 7, tension: 120, useNativeDriver: true }).start();
      timer.current = setTimeout(hide, t.duration ?? 3500);
    },
    [hide, v],
  );

  useEffect(() => () => void (timer.current && clearTimeout(timer.current)), []);

  return (
    <ToastCtx.Provider value={show}>
      {children}
      {toast ? (
        <Animated.View
          pointerEvents="box-none"
          accessibilityLiveRegion="polite"
          style={[
            styles.toastWrap,
            { bottom: insets.bottom + 84, opacity: v, transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [reduce ? 0 : 30, 0] }) }] },
          ]}
        >
          <View style={styles.toast}>
            {toast.icon ? <Feather name={toast.icon} size={18} color={colors.lime} /> : null}
            <Text style={styles.toastText}>{toast.message}</Text>
            {toast.action ? (
              <Pressable
                hitSlop={10}
                onPress={() => {
                  toast.action!.onPress();
                  hide();
                }}
                accessibilityRole="button"
              >
                <Text style={styles.toastAction}>{toast.action.label}</Text>
              </Pressable>
            ) : null}
          </View>
        </Animated.View>
      ) : null}
    </ToastCtx.Provider>
  );
}

const styles = StyleSheet.create({
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary },
  toastWrap: { position: 'absolute', left: 16, right: 16, alignItems: 'center' },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.text,
    borderRadius: radius.sm,
    paddingHorizontal: 16,
    paddingVertical: 14,
    maxWidth: 480,
    alignSelf: 'stretch',
    ...shadow,
    shadowOpacity: 0.25,
  },
  toastText: { flex: 1, fontFamily: fonts.medium, fontSize: 14, color: '#fff' },
  toastAction: { fontFamily: fonts.heading, fontSize: 14, color: colors.lime },
});
