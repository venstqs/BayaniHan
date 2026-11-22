import { Redirect, Tabs } from 'expo-router';
import TabBar from '@/components/TabBar';
import { useT } from '@/lib/i18n';
import { useStore } from '@/lib/store';

export default function TabLayout() {
  const { t } = useT();
  const { onboarded } = useStore();
  if (!onboarded) return <Redirect href="/welcome" />;
  return (
    <Tabs tabBar={(props) => <TabBar {...props} />} screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="index" options={{ title: t('tabMap') }} />
      <Tabs.Screen name="survey" options={{ title: t('tabSurvey') }} />
      <Tabs.Screen name="report" options={{ title: t('tabReport') }} />
      <Tabs.Screen name="findings" options={{ title: t('tabFindings') }} />
      <Tabs.Screen name="more" options={{ title: t('tabMore') }} />
    </Tabs>
  );
}
