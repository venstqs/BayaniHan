import * as Haptics from 'expo-haptics';
import { useEffect, useState } from 'react';
import { AccessibilityInfo, LayoutAnimation, Platform } from 'react-native';

/** Haptics are best-effort: never let a missing vibration motor throw. */
const safe = (p: Promise<void>) => p.catch(() => {});

export const haptic = {
  /** Picking an option (chip, tile, tab). */
  select: () => Platform.OS !== 'web' && safe(Haptics.selectionAsync()),
  /** A button press that does something. */
  tap: () => Platform.OS !== 'web' && safe(Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)),
  /** Something was saved or sent. */
  success: () => Platform.OS !== 'web' && safe(Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)),
  /** Destructive or blocked action. */
  warn: () => Platform.OS !== 'web' && safe(Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)),
};

let reduceMotion = false;
AccessibilityInfo.isReduceMotionEnabled()
  .then((v) => (reduceMotion = v))
  .catch(() => {});
AccessibilityInfo.addEventListener('reduceMotionChanged', (v) => (reduceMotion = v));

/** True when the person has asked their phone to reduce motion. */
export function useReduceMotion() {
  const [v, setV] = useState(reduceMotion);
  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled()
      .then(setV)
      .catch(() => {});
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setV);
    return () => sub.remove();
  }, []);
  return v;
}

/** Animate the next layout change (items added, removed or expanded). Skipped when reduce motion is on. */
export function animateLayout() {
  if (reduceMotion) return;
  LayoutAnimation.configureNext(LayoutAnimation.create(220, LayoutAnimation.Types.easeInEaseOut, LayoutAnimation.Properties.opacity));
}
