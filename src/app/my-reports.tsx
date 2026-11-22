import Feather from '@expo/vector-icons/Feather';
import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { FadeIn } from '@/components/motion';
import { Badge, Button, Card, EmptyState, Notice, PageHeader, Screen, Small } from '@/components/ui';
import { categoryById, TIMES } from '@/lib/data';
import { useT } from '@/lib/i18n';
import { useStore } from '@/lib/store';
import { colors, fonts } from '@/lib/theme';
import type { Status } from '@/lib/types';

const STATUS: Record<Status, { label: string; fg: string; bg: string; icon: keyof typeof Feather.glyphMap; help: string }> = {
  pending: { label: 'Waiting for review', fg: '#8A4B00', bg: '#FFF1DC', icon: 'clock', help: 'A youth coordinator will check it soon.' },
  approved: { label: 'On the map', fg: colors.success, bg: colors.successSoft, icon: 'check-circle', help: 'Thank you! It is now on the public map.' },
  rejected: { label: 'Not published', fg: colors.muted, bg: colors.sunken, icon: 'x-circle', help: 'It may have been a duplicate or included personal details.' },
  flagged: { label: 'Being followed up', fg: '#A8182D', bg: colors.dangerSoft, icon: 'flag', help: 'A coordinator is referring it to the right office.' },
};

export default function MyReports() {
  const { mine, reports, outbox, online, refresh, syncing, lastSync } = useStore();
  const { L } = useT();
  const waiting = new Set(outbox.filter((o) => o.kind === 'report').map((o) => o.data.id));

  return (
    <Screen edges={[]} onRefresh={online ? refresh : undefined} refreshing={syncing}>
      <PageHeader
        title="My reports"
        intro="Reports you sent from this phone. Only you can see this list; nothing here is linked to your name."
      />
      {online && lastSync ? <Small>Pull down to refresh. Last updated {new Date(lastSync).toLocaleTimeString('en-PH', { hour: 'numeric', minute: '2-digit' })}.</Small> : null}

      {mine.length === 0 ? (
        <EmptyState
          icon="inbox"
          title="No reports yet"
          body="When you report a place, you can follow its review status here."
          action={<Button size="sm" variant="accent" icon="plus" title="Report a concern" onPress={() => router.navigate('/report')} />}
        />
      ) : (
        mine.map((m, i) => {
          // Demo mode keeps statuses in the main list; online mode refreshes `mine` from the server.
          const status = (reports.find((r) => r.id === m.id)?.status ?? m.status) as Status;
          const st = STATUS[status];
          const c = categoryById(m.category);
          const isWaiting = waiting.has(m.id);
          return (
            <FadeIn key={m.id} delay={Math.min(i, 6) * 50}>
              <Card style={{ borderLeftWidth: 6, borderLeftColor: c.color }}>
                <View style={styles.row}>
                  <Text style={styles.title} numberOfLines={1}>
                    {L(c.label)}
                  </Text>
                  <View style={{ marginLeft: 'auto' }}>
                    {isWaiting ? <Badge label="Waiting to send" color={colors.primaryDeep} soft={colors.primarySoft} /> : <Badge label={st.label} color={st.fg} soft={st.bg} />}
                  </View>
                </View>
                <Text style={styles.desc} numberOfLines={3}>
                  {m.description}
                </Text>
                <Small>
                  {m.barangay}, {L(TIMES.find((x) => x.id === m.timeOfDay)!.label).toLowerCase()}. Sent{' '}
                  {new Date(m.createdAt).toLocaleDateString('en-PH', { day: 'numeric', month: 'short' })}
                </Small>
                <View style={styles.help}>
                  <Feather name={isWaiting ? 'wifi-off' : st.icon} size={14} color={isWaiting ? colors.primaryDeep : st.fg} />
                  <Small muted={false} style={{ flex: 1, color: isWaiting ? colors.primaryDeep : st.fg }}>
                    {isWaiting ? 'Saved on this phone. It will be sent when you are back online.' : st.help}
                  </Small>
                </View>
              </Card>
            </FadeIn>
          );
        })
      )}
      {!online ? <Notice>Demo mode: statuses change here when a coordinator reviews the report on this same phone.</Notice> : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title: { fontFamily: fonts.heading, fontSize: 17, lineHeight: 22, color: colors.text, flexShrink: 1 },
  desc: { fontFamily: fonts.body, fontSize: 15, lineHeight: 22, color: colors.text },
  help: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: colors.border },
});
