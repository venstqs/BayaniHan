import Feather from '@expo/vector-icons/Feather';
import { createContext, ReactNode, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleProp,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { haptic, useReduceMotion } from '@/lib/motion';
import { chunk, colors, fonts, radius, shadow, type } from '@/lib/theme';
import { PopIn } from './motion';

export type IconName = keyof typeof Feather.glyphMap;

/**
 * Lets a child (e.g. a map) pause the parent Screen's scrolling while it is being touched,
 * so dragging the map pans it instead of scrolling the page.
 */
export const ScrollLockContext = createContext<((enabled: boolean) => void) | null>(null);

export function Screen({
  children,
  scroll = true,
  padded = true,
  edges = ['top'],
  onRefresh,
  refreshing = false,
  tabBarSpace = false,
}: {
  children: ReactNode;
  scroll?: boolean;
  padded?: boolean;
  /** Pass [] on stack screens that already have a native header. */
  edges?: ('top' | 'bottom')[];
  /** Enables pull-to-refresh. */
  onRefresh?: () => void;
  refreshing?: boolean;
  /** Leave room at the bottom for the floating tab bar. */
  tabBarSpace?: boolean;
}) {
  const [scrollEnabled, setScrollEnabled] = useState(true);
  const content = (
    <View style={[padded && { padding: 20, paddingBottom: tabBarSpace ? 130 : 56 }, { gap: 18 }]}>{children}</View>
  );
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={edges}>
      {scroll ? (
        <ScrollLockContext.Provider value={setScrollEnabled}>
          <ScrollView
            keyboardShouldPersistTaps="handled"
            scrollEnabled={scrollEnabled}
            contentContainerStyle={{ flexGrow: 1 }}
            refreshControl={
              onRefresh ? <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} colors={[colors.primary]} /> : undefined
            }
          >
            {content}
          </ScrollView>
        </ScrollLockContext.Provider>
      ) : (
        content
      )}
    </SafeAreaView>
  );
}

/** Title block at the top of a screen: a short context line, the title, and an optional intro. */
export function PageHeader({ context, title, intro, right }: { context?: string; title: string; intro?: string; right?: ReactNode }) {
  return (
    <View style={{ gap: 8 }}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
        <View style={{ flex: 1, gap: 4 }}>
          {context ? (
            <View style={s.contextPill}>
              <Text style={s.contextPillText}>{context}</Text>
            </View>
          ) : null}
          <Text style={s.h1} accessibilityRole="header">
            {title}
          </Text>
        </View>
        {right}
      </View>
      {intro ? <Text style={[s.body, { color: colors.muted }]}>{intro}</Text> : null}
    </View>
  );
}

export const Eyebrow = ({ children }: { children: ReactNode }) => <Text style={s.context}>{children}</Text>;
export const H1 = ({ children, style }: { children: ReactNode; style?: StyleProp<TextStyle> }) => (
  <Text style={[s.h1, style]} accessibilityRole="header">
    {children}
  </Text>
);
export const H2 = ({ children, style }: { children: ReactNode; style?: StyleProp<TextStyle> }) => (
  <Text style={[s.h2, style]} accessibilityRole="header">
    {children}
  </Text>
);
export const H3 = ({ children, style }: { children: ReactNode; style?: StyleProp<TextStyle> }) => (
  <Text style={[s.h3, style]}>{children}</Text>
);
export const Body = ({ children, muted, style }: { children: ReactNode; muted?: boolean; style?: StyleProp<TextStyle> }) => (
  <Text style={[s.body, muted && { color: colors.muted }, style]}>{children}</Text>
);
export const Small = ({ children, muted = true, style }: { children: ReactNode; muted?: boolean; style?: StyleProp<TextStyle> }) => (
  <Text style={[s.small, muted && { color: colors.muted }, style]}>{children}</Text>
);
export const Label = ({ children, hint }: { children: ReactNode; hint?: string }) => (
  <View style={{ gap: 2, marginTop: 4 }}>
    <Text style={s.label}>{children}</Text>
    {hint ? <Text style={[s.small, { color: colors.muted }]}>{hint}</Text> : null}
  </View>
);

export function Card({
  children,
  style,
  onPress,
  accessibilityLabel,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  accessibilityLabel?: string;
}) {
  if (onPress)
    return (
      <Pressable
        onPress={() => {
          haptic.tap();
          onPress();
        }}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        style={({ pressed }) => [s.card, s.cardTappable, style, pressed && s.cardPressed]}
      >
        {children}
      </Pressable>
    );
  return <View style={[s.card, style]}>{children}</View>;
}

/**
 * A numbered question in a form. Numbers are used because forms really are a sequence.
 * `done` turns the number into a check so people can see what is still missing.
 */
export function Section({
  step,
  title,
  hint,
  done,
  optional,
  children,
}: {
  step?: number;
  title: string;
  hint?: string;
  done?: boolean;
  optional?: boolean;
  children: ReactNode;
}) {
  return (
    <View style={s.section}>
      <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
        {step !== undefined ? (
          <View style={[s.step, done && { backgroundColor: colors.lime, borderColor: colors.limeDeep }]}>
            {done ? (
              <PopIn trigger={done}>
                <Feather name="check" size={15} color={colors.text} />
              </PopIn>
            ) : (
              <Text style={s.stepText}>{step}</Text>
            )}
          </View>
        ) : null}
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={s.label}>
            {title}
            {optional ? <Text style={{ fontFamily: fonts.body, color: colors.faint }}>  optional</Text> : null}
          </Text>
          {hint ? <Text style={[s.small, { color: colors.muted }]}>{hint}</Text> : null}
        </View>
      </View>
      {children}
    </View>
  );
}

/** Big colorful tile for picking a category. Two per row. */
export function Tile({
  label,
  icon,
  color,
  selected,
  onPress,
}: {
  label: string;
  icon: IconName;
  color: string;
  selected?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={() => {
        haptic.select();
        onPress();
      }}
      accessibilityRole="radio"
      accessibilityState={{ selected: !!selected }}
      accessibilityLabel={label}
      style={({ pressed }) => [
        s.tile,
        { backgroundColor: selected ? color : colors.card, borderColor: selected ? color : colors.border, borderBottomColor: selected ? shade(color) : '#D9D2EE' },
        pressed && s.pressedChunk,
      ]}
    >
      <View style={[s.tileIcon, { backgroundColor: selected ? 'rgba(255,255,255,.25)' : `${color}1F` }]}>
        <Feather name={icon} size={22} color={selected ? '#fff' : color} />
      </View>
      <Text style={[s.tileText, selected && { color: '#fff' }]} numberOfLines={2}>
        {label}
      </Text>
      {selected ? (
        <PopIn style={s.tileCheck}>
          <Feather name="check" size={12} color={color} />
        </PopIn>
      ) : null}
    </Pressable>
  );
}

export function TileGrid({ children }: { children: ReactNode }) {
  return <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>{children}</View>;
}

export function Chip({
  label,
  selected,
  onPress,
  color,
  count,
  small,
  icon,
}: {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  color?: string;
  count?: number;
  small?: boolean;
  icon?: IconName;
}) {
  const fg = selected ? '#fff' : colors.text;
  return (
    <Pressable
      onPress={
        onPress
          ? () => {
              haptic.select();
              onPress();
            }
          : undefined
      }
      accessibilityRole="button"
      accessibilityState={{ selected: !!selected }}
      accessibilityLabel={count !== undefined ? `${label}, ${count}` : label}
      hitSlop={small ? 4 : 0}
      style={({ pressed }) => [
        s.chip,
        small && s.chipSmall,
        selected && { backgroundColor: colors.primary, borderColor: colors.primary },
        pressed && !selected && { backgroundColor: colors.sunken },
      ]}
    >
      {icon ? <Feather name={icon} size={small ? 13 : 15} color={selected ? '#fff' : color ?? colors.muted} /> : null}
      {color && !icon ? <View style={[s.dot, { backgroundColor: selected ? '#fff' : color }]} /> : null}
      <Text style={[s.chipText, small && { fontSize: 13 }, { color: fg }]}>{label}</Text>
      {count !== undefined ? (
        <View style={[s.count, selected && { backgroundColor: colors.lime }]}>
          <Text style={[s.countText, selected && { color: colors.text }]}>{count}</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

export function ChipRow({ children, scroll }: { children: ReactNode; scroll?: boolean }) {
  if (scroll)
    return (
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingHorizontal: 2 }}>
        {children}
      </ScrollView>
    );
  return <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>{children}</View>;
}

/** Chunky button: a darker bottom edge that it sinks into when pressed. */
export function Button({
  title,
  onPress,
  variant = 'primary',
  icon,
  disabled,
  size = 'md',
  style,
}: {
  title: string;
  onPress?: () => void;
  variant?: 'primary' | 'accent' | 'ghost' | 'danger' | 'soft' | 'lime';
  icon?: IconName;
  disabled?: boolean;
  size?: 'sm' | 'md';
  style?: StyleProp<ViewStyle>;
}) {
  const bg = { primary: colors.primary, accent: colors.accent, ghost: colors.card, danger: colors.danger, soft: colors.primarySoft, lime: colors.lime }[variant];
  const edge = { primary: colors.primaryDeep, accent: colors.accentDeep, ghost: '#D9D2EE', danger: '#A8182D', soft: '#D6CBFF', lime: colors.limeDeep }[variant];
  const fg = variant === 'ghost' || variant === 'lime' ? colors.text : variant === 'soft' ? colors.primary : '#fff';
  return (
    <Pressable
      onPress={
        onPress
          ? () => {
              haptic.tap();
              onPress();
            }
          : undefined
      }
      disabled={disabled}
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled }}
      style={({ pressed }) => [
        s.btn,
        size === 'sm' && s.btnSmall,
        { backgroundColor: bg, borderBottomColor: edge },
        variant === 'ghost' && { borderWidth: 2, borderColor: colors.border, borderBottomColor: edge },
        pressed && !disabled && s.pressedChunk,
        disabled && { opacity: 0.4 },
        style,
      ]}
    >
      {icon ? <Feather name={icon} size={size === 'sm' ? 15 : 18} color={fg} /> : null}
      <Text style={[s.btnText, size === 'sm' && { fontSize: 14 }, { color: fg }]}>{title}</Text>
    </Pressable>
  );
}

export function Field(props: TextInputProps & { counter?: boolean }) {
  const [focused, setFocused] = useState(false);
  const { counter, ...rest } = props;
  const len = typeof props.value === 'string' ? props.value.length : 0;
  return (
    <View style={{ gap: 4 }}>
      <TextInput
        placeholderTextColor={colors.faint}
        {...rest}
        onFocus={(e) => {
          setFocused(true);
          props.onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          props.onBlur?.(e);
        }}
        style={[
          s.input,
          focused && { borderColor: colors.primary, backgroundColor: '#fff' },
          props.multiline && { minHeight: 104, textAlignVertical: 'top' },
          props.style,
        ]}
      />
      {counter && props.maxLength ? (
        <Text style={[s.tiny, { alignSelf: 'flex-end', color: len > props.maxLength * 0.9 ? colors.accentDeep : colors.faint }]}>
          {len}/{props.maxLength}
        </Text>
      ) : null}
    </View>
  );
}

export function Stat({
  label,
  value,
  color,
  hint,
  compact,
  tint,
}: {
  label: string;
  value: string | number;
  color?: string;
  hint?: string;
  /** Fits three in a row (no minimum width, smaller number). */
  compact?: boolean;
  /** Background color for a highlighted stat. */
  tint?: string;
}) {
  return (
    <View style={[s.stat, tint ? { backgroundColor: tint, borderColor: tint } : null, compact && { minWidth: 0, padding: 12 }]}>
      <Text style={[s.statValue, compact && { fontSize: 22, lineHeight: 28 }, color ? { color } : null]} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
      <Text style={s.statLabel}>{label}</Text>
      {hint ? <Text style={[s.tiny, { color: colors.faint }]}>{hint}</Text> : null}
    </View>
  );
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { id: T; label: string; icon?: IconName; badge?: number }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.seg}>
      {options.map((o) => {
        const active = o.id === value;
        return (
          <Pressable
            key={o.id}
            onPress={() => {
              haptic.select();
              onChange(o.id);
            }}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            style={[s.segItem, active && s.segActive]}
          >
            {o.icon ? <Feather name={o.icon} size={15} color={active ? '#fff' : colors.muted} /> : null}
            <Text style={[s.segText, active && { color: '#fff' }]}>{o.label}</Text>
            {o.badge ? (
              <View style={[s.segBadge, active && { backgroundColor: colors.lime }]}>
                <Text style={[s.segBadgeText, active && { color: colors.text }]}>{o.badge}</Text>
              </View>
            ) : null}
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

export function Bar({
  label,
  value,
  max,
  color,
  suffix,
  onPress,
}: {
  label: string;
  value: number;
  max: number;
  color: string;
  suffix?: string;
  /** Makes the row tappable (shows a chevron), e.g. to drill into a barangay. */
  onPress?: () => void;
}) {
  const pct = max ? (value / max) * 100 : 0;
  const reduce = useReduceMotion();
  // Bars grow from zero when they first appear or when their value changes.
  const grow = useRef(new Animated.Value(reduce ? pct : 0)).current;
  useEffect(() => {
    if (reduce) return grow.setValue(pct);
    const a = Animated.timing(grow, { toValue: pct, duration: 500, easing: Easing.out(Easing.cubic), useNativeDriver: false });
    a.start();
    return () => a.stop();
  }, [pct, reduce, grow]);
  const width = grow.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'] });
  const inner = (
    <>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
        <Text style={[s.body, { flex: 1 }]} numberOfLines={1}>
          {label}
        </Text>
        <Text style={[s.body, { fontFamily: fonts.bold, color: value ? colors.text : colors.faint }]}>
          {value}
          {suffix}
        </Text>
        {onPress ? <Feather name="chevron-right" size={16} color={colors.faint} /> : null}
      </View>
      <View style={s.barTrack}>
        <Animated.View style={[s.barFill, { width: value ? width : '0%', minWidth: value ? 14 : 0, backgroundColor: color }]} />
      </View>
    </>
  );
  if (onPress)
    return (
      <Pressable
        onPress={() => {
          haptic.select();
          onPress();
        }}
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${value}${suffix ?? ''}. Open details`}
        style={({ pressed }) => [{ gap: 6, borderRadius: 10 }, pressed && { opacity: 0.6 }]}
      >
        {inner}
      </Pressable>
    );
  return (
    <View style={{ gap: 6 }} accessible accessibilityLabel={`${label}: ${value}${suffix ?? ''}`}>
      {inner}
    </View>
  );
}

export function Notice({ children, tone = 'info', icon }: { children: ReactNode; tone?: 'info' | 'warn' | 'danger'; icon?: IconName }) {
  const bg = { info: colors.primarySoft, warn: '#FFF1DC', danger: colors.dangerSoft }[tone];
  const fg = { info: colors.primaryDeep, warn: '#8A4B00', danger: '#A8182D' }[tone];
  const ic: IconName = icon ?? (tone === 'info' ? 'info' : 'alert-circle');
  return (
    <View style={[s.notice, { backgroundColor: bg }]}>
      <Feather name={ic} size={17} color={fg} style={{ marginTop: 2 }} />
      <Text style={[s.body, { color: fg, flex: 1 }]}>{children}</Text>
    </View>
  );
}

export function Badge({ label, color = colors.muted, soft }: { label: string; color?: string; soft?: string }) {
  return (
    <View style={[s.badge, { backgroundColor: soft ?? colors.sunken }]}>
      <Text style={[s.badgeText, { color }]}>{label}</Text>
    </View>
  );
}

export function EmptyState({ icon, title, body, action }: { icon: IconName; title: string; body?: string; action?: ReactNode }) {
  return (
    <View style={s.empty}>
      <View style={s.emptyIcon}>
        <Feather name={icon} size={26} color={colors.primary} />
      </View>
      <Text style={[s.h3, { textAlign: 'center' }]}>{title}</Text>
      {body ? <Text style={[s.small, { color: colors.muted, textAlign: 'center' }]}>{body}</Text> : null}
      {action}
    </View>
  );
}

export function Checkbox({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <Pressable
      onPress={() => {
        haptic.select();
        onChange(!checked);
      }}
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      style={[s.checkRow, checked && { borderColor: colors.primary, backgroundColor: colors.primarySoft }]}
    >
      <View style={[s.check, checked && { backgroundColor: colors.primary, borderColor: colors.primary }]}>
        {checked ? <Feather name="check" size={15} color="#fff" /> : null}
      </View>
      <Text style={[s.small, { flex: 1, color: colors.text }]}>{label}</Text>
    </Pressable>
  );
}

/** Darken a #RRGGBB color for the chunky bottom edge. */
export function shade(hex: string, amount = 0.22) {
  const n = parseInt(hex.slice(1), 16);
  const f = (v: number) => Math.max(0, Math.round(v * (1 - amount)));
  const r = f((n >> 16) & 255);
  const g = f((n >> 8) & 255);
  const b = f(n & 255);
  return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`;
}

export const s = StyleSheet.create({
  context: { fontFamily: fonts.medium, ...type.small, color: colors.muted },
  contextPill: { alignSelf: 'flex-start', backgroundColor: colors.lime, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3, marginBottom: 4 },
  contextPillText: { fontFamily: fonts.bold, fontSize: 12, color: colors.text },
  h1: { fontFamily: fonts.heading, ...type.h1, color: colors.text, letterSpacing: -0.5 },
  h2: { fontFamily: fonts.heading, ...type.h2, color: colors.text, letterSpacing: -0.2 },
  h3: { fontFamily: fonts.bold, ...type.h3, color: colors.text },
  body: { fontFamily: fonts.body, ...type.body, color: colors.text },
  small: { fontFamily: fonts.body, ...type.small, color: colors.text },
  tiny: { fontFamily: fonts.medium, ...type.tiny },
  label: { fontFamily: fonts.bold, fontSize: 16, lineHeight: 21, color: colors.text },
  card: { backgroundColor: colors.card, borderRadius: radius.md, padding: 18, borderWidth: 2, borderColor: colors.border, gap: 12 },
  cardTappable: { borderBottomWidth: chunk, borderBottomColor: '#D9D2EE' },
  cardPressed: { transform: [{ translateY: chunk - 1 }], borderBottomWidth: 1, marginBottom: chunk - 1 },
  pressedChunk: { transform: [{ translateY: chunk - 1 }], borderBottomWidth: 1, marginBottom: chunk - 1 },
  section: { gap: 12, paddingTop: 4 },
  step: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepText: { fontFamily: fonts.heading, fontSize: 14, color: colors.primary },
  tile: {
    width: '48.4%',
    minHeight: 104,
    borderRadius: radius.md,
    borderWidth: 2,
    borderBottomWidth: chunk,
    padding: 14,
    gap: 10,
    justifyContent: 'space-between',
  },
  tileIcon: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  tileText: { fontFamily: fonts.bold, fontSize: 15, lineHeight: 19, color: colors.text },
  tileCheck: { position: 'absolute', top: 12, right: 12, width: 22, height: 22, borderRadius: 11, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: 42,
    paddingHorizontal: 15,
    borderRadius: radius.pill,
    backgroundColor: colors.card,
    borderWidth: 2,
    borderColor: colors.border,
  },
  chipSmall: { minHeight: 34, paddingHorizontal: 12, borderWidth: 1.5 },
  chipText: { fontFamily: fonts.medium, fontSize: 14, color: colors.text },
  dot: { width: 10, height: 10, borderRadius: 5 },
  count: { backgroundColor: colors.sunken, borderRadius: 999, paddingHorizontal: 7, paddingVertical: 1, minWidth: 22, alignItems: 'center' },
  countText: { fontFamily: fonts.bold, fontSize: 11, color: colors.muted },
  btn: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 54,
    paddingHorizontal: 22,
    borderRadius: radius.sm,
    borderBottomWidth: chunk,
  },
  btnSmall: { minHeight: 40, paddingHorizontal: 14, gap: 6, borderRadius: 12 },
  btnText: { fontFamily: fonts.heading, fontSize: 16, letterSpacing: 0.2 },
  input: {
    backgroundColor: colors.sunken,
    borderWidth: 2,
    borderColor: colors.sunken,
    borderRadius: radius.sm,
    paddingHorizontal: 16,
    paddingVertical: 13,
    fontFamily: fonts.body,
    fontSize: 15,
    color: colors.text,
  },
  stat: { flex: 1, minWidth: '45%', backgroundColor: colors.card, borderRadius: radius.md, borderWidth: 2, borderColor: colors.border, padding: 16, gap: 2 },
  statLabel: { fontFamily: fonts.medium, ...type.small, color: colors.muted },
  statValue: { fontFamily: fonts.heading, fontSize: 34, lineHeight: 40, color: colors.text, letterSpacing: -0.5 },
  seg: { backgroundColor: colors.sunken, borderRadius: radius.pill, padding: 5, gap: 4 },
  segItem: { flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 40, paddingHorizontal: 15, borderRadius: radius.pill },
  segActive: { backgroundColor: colors.primary, ...shadow, shadowOpacity: 0.2, elevation: 2 },
  segText: { fontFamily: fonts.bold, fontSize: 14, color: colors.muted },
  segBadge: { backgroundColor: colors.border, borderRadius: 999, paddingHorizontal: 6, minWidth: 20, alignItems: 'center' },
  segBadgeText: { fontFamily: fonts.bold, fontSize: 11, color: colors.muted },
  barTrack: { height: 14, backgroundColor: colors.sunken, borderRadius: 7, overflow: 'hidden' },
  barFill: { height: 14, borderRadius: 7 },
  notice: { flexDirection: 'row', gap: 10, padding: 16, borderRadius: radius.sm },
  badge: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4, alignSelf: 'flex-start' },
  badgeText: { fontFamily: fonts.bold, fontSize: 12 },
  empty: {
    alignItems: 'center',
    gap: 8,
    paddingVertical: 32,
    paddingHorizontal: 20,
    borderRadius: radius.md,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#D6CBFF',
    backgroundColor: colors.card,
  },
  emptyIcon: { width: 56, height: 56, borderRadius: 18, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  checkRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
    padding: 16,
    borderRadius: radius.sm,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  check: { width: 24, height: 24, borderRadius: 8, borderWidth: 2, borderColor: colors.faint, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' },
});
