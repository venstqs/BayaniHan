import Feather from '@expo/vector-icons/Feather';
import { Redirect, Tabs } from 'expo-router';
import { View } from 'react-native';
import { haptic } from '@/lib/motion';
import { useT } from '@/lib/i18n';
import { useStore } from '@/lib/store';
import { colors, fonts } from '@/lib/theme';

type IconName = keyof typeof Feather.glyphMap;

/** Active tab gets a violet pill behind its icon. */
const icon =
  (name: IconName) =>
  ({ focused }: { focused: boolean }) => (
    <View
      style={{
        width: 52,
        height: 30,
        borderRadius: 15,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: focused ? colors.primary : 'transparent',
      }}
    >
      <Feather name={name} size={20} color={focused ? '#fff' : colors.muted} />
    </View>
  );

export default function TabLayout() {
  const { t } = useT();
  const { onboarded } = useStore();
  if (!onboarded) return <Redirect href="/welcome" />;
  return (
    <Tabs
      screenListeners={{ tabPress: () => void haptic.select() }}
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
        tabBarLabelStyle: { fontFamily: fonts.bold, fontSize: 11, marginTop: 4 },
        tabBarStyle: { backgroundColor: colors.card, borderTopWidth: 0, paddingTop: 8, elevation: 12, shadowColor: '#3A1D99', shadowOpacity: 0.08, shadowRadius: 12, shadowOffset: { width: 0, height: -4 } },
      }}
    >
      <Tabs.Screen name="index" options={{ title: t('tabMap'), tabBarIcon: icon('map') }} />
      <Tabs.Screen name="report" options={{ title: t('tabReport'), tabBarIcon: icon('plus-circle') }} />
      <Tabs.Screen name="survey" options={{ title: t('tabSurvey'), tabBarIcon: icon('clipboard') }} />
      <Tabs.Screen name="findings" options={{ title: t('tabFindings'), tabBarIcon: icon('bar-chart-2') }} />
      <Tabs.Screen name="more" options={{ title: t('tabMore'), tabBarIcon: icon('menu') }} />
    </Tabs>
  );
}
