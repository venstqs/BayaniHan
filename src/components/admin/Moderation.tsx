import Feather from '@expo/vector-icons/Feather';
import { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { Badge, Body, Button, Card, Chip, ChipRow, EmptyState, Field, H2, Segmented, Small } from '@/components/ui';
import { categoryById, CATEGORIES, FEELINGS, GROUPS, TIMES, WANTS } from '@/lib/data';
import { useToast } from '@/components/motion';
import { animateLayout, haptic } from '@/lib/motion';
import { useStore } from '@/lib/store';
import { colors, fonts, severityColors } from '@/lib/theme';
import type { CategoryId, Report, Status } from '@/lib/types';

const STATUS: Record<Status, { label: string; fg: string; bg: string }> = {
  pending: { label: 'Waiting for review', fg: colors.accentDeep, bg: colors.accentSoft },
  approved: { label: 'Approved', fg: colors.success, bg: colors.successSoft },
  rejected: { label: 'Rejected', fg: colors.muted, bg: colors.sunken },
  flagged: { label: 'Flagged', fg: '#A8182D', bg: colors.dangerSoft },
};

const ACTION_LABEL: Record<string, string> = {
  submitted: 'Submitted',
  approved: 'Approved',
  rejected: 'Rejected',
  flagged: 'Flagged',
  pending: 'Moved back to pending',
  edited: 'Edited',
};

function ReportCard({ r }: { r: Report }) {
  const { moderate, editReport } = useStore();
  const [editing, setEditing] = useState(false);
  const [desc, setDesc] = useState(r.description);
  const [cat, setCat] = useState<CategoryId>(r.category);
  const [showLog, setShowLog] = useState(false);
  const c = categoryById(r.category);
  const st = STATUS[r.status];
  const toast = useToast();

  /** Change status with a smooth list update and an Undo toast (so no "are you sure?" popup is needed). */
  const fail = (e: unknown) => {
    haptic.warn();
    animateLayout();
    toast({ message: e instanceof Error ? e.message : 'Could not save. Check your connection.', icon: 'alert-circle' });
  };

  const act = (action: Status, message: string, note?: string) => {
    const prev = r.status;
    animateLayout();
    moderate(r.id, action, note).catch(fail);
    action === 'rejected' ? haptic.warn() : haptic.success();
    toast({
      message,
      icon: action === 'approved' ? 'check-circle' : action === 'flagged' ? 'flag' : 'x-circle',
      action: {
        label: 'Undo',
        onPress: () => {
          animateLayout();
          moderate(r.id, prev, 'Undone').catch(fail);
        },
      },
    });
  };

  return (
    <Card style={{ borderLeftWidth: 5, borderLeftColor: c.color }}>
      <View style={styles.row}>
        <Text style={styles.title} numberOfLines={1}>
          {c.label.en}
        </Text>
        <View style={[styles.sev, { backgroundColor: severityColors[r.severity - 1] }]}>
          <Text style={styles.sevText}>{r.severity}/5</Text>
        </View>
        <View style={{ marginLeft: 'auto' }}>
          <Badge label={st.label} color={st.fg} soft={st.bg} />
        </View>
      </View>
      <Small>
        {r.barangay}, {TIMES.find((t) => t.id === r.timeOfDay)!.label.en.toLowerCase()}. Sent{' '}
        {new Date(r.createdAt).toLocaleString('en-PH', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })}
      </Small>
      {editing ? (
        <>
          <ChipRow>
            {CATEGORIES.map((x) => (
              <Chip key={x.id} small label={x.label.en} color={x.color} selected={cat === x.id} onPress={() => setCat(x.id)} />
            ))}
          </ChipRow>
          <Field multiline value={desc} onChangeText={setDesc} />
          <View style={styles.row}>
            <Button
              title="Save changes"
              size="sm"
              style={{ flex: 1 }}
              disabled={desc.trim().length < 5}
              onPress={() => {
                animateLayout();
                editReport(r.id, { description: desc.trim(), category: cat }).catch(fail);
                setEditing(false);
                toast({ message: 'Changes saved.', icon: 'check' });
              }}
            />
            <Button title="Cancel" size="sm" variant="ghost" style={{ flex: 1 }} onPress={() => setEditing(false)} />
          </View>
        </>
      ) : (
        <Body>{r.description}</Body>
      )}
      <View style={[styles.row, { flexWrap: 'wrap' }]}>
        <Meta icon="users" text={GROUPS.find((g) => g.id === r.group)!.label.en} />
        <Meta icon="map-pin" text={`${r.lat.toFixed(4)}, ${r.lng.toFixed(4)}`} />
      </View>
      {!editing ? (
        <>
          <View style={styles.row}>
            {r.status !== 'approved' && (
              <Button title="Approve" size="sm" icon="check" style={{ flex: 1 }} onPress={() => act('approved', 'Approved. It’s now on the public map.')} />
            )}
            {r.status !== 'rejected' && (
              <Button
                title="Reject"
                size="sm"
                variant="ghost"
                icon="x"
                style={{ flex: 1 }}
                onPress={() => act('rejected', 'Rejected. It won’t appear on the map.')}
              />
            )}
          </View>
          <View style={[styles.row, { flexWrap: 'wrap' }]}>
            {r.status !== 'flagged' && (
              <Chip small icon="flag" label="Flag for follow-up" onPress={() => act('flagged', 'Flagged for follow-up.', 'Needs follow-up / possible referral')} />
            )}
            <Chip
              small
              icon="edit-2"
              label="Edit"
              onPress={() => {
                // Start from the current saved values, not leftovers from a cancelled edit.
                setDesc(r.description);
                setCat(r.category);
                animateLayout();
                setEditing(true);
              }}
            />
            <Chip small icon="clock" label={showLog ? 'Hide history' : 'History'} selected={showLog} onPress={() => {
                animateLayout();
                setShowLog(!showLog);
              }} />
          </View>
        </>
      ) : null}
      {showLog ? (
        <View style={styles.log}>
          {r.log.map((l, i) => (
            <View key={i} style={{ flexDirection: 'row', gap: 8 }}>
              <View style={styles.logDot} />
              <Small style={{ flex: 1 }}>
                <Text style={{ fontFamily: fonts.bold, color: colors.text }}>{ACTION_LABEL[l.action] ?? l.action}</Text>{' '}
                {new Date(l.at).toLocaleString('en-PH', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })}
                {l.note ? `. ${l.note}` : ''}
              </Small>
            </View>
          ))}
        </View>
      ) : null}
    </Card>
  );
}

function Meta({ icon, text }: { icon: keyof typeof Feather.glyphMap; text: string }) {
  return (
    <View style={styles.meta}>
      <Feather name={icon} size={12} color={colors.muted} />
      <Text style={styles.metaText}>{text}</Text>
    </View>
  );
}

export default function Moderation() {
  const { reports, surveys, resetDemo, online } = useStore();
  const [filter, setFilter] = useState<Status>('pending');
  const count = (s: Status) => reports.filter((r) => r.status === s).length;
  const list = reports.filter((r) => r.status === filter);
  const EMPTY: Record<Status, string> = {
    pending: 'All caught up. New reports will appear here.',
    approved: 'No approved reports yet.',
    rejected: 'No rejected reports.',
    flagged: 'Nothing flagged for follow-up.',
  };

  return (
    <>
      <View style={{ gap: 4 }}>
        <H2>Reports</H2>
        <Small>Only approved reports reach the public map. Flag anything that needs a referral to CSWDO, PNP WCPD or the VAW desk.</Small>
      </View>
      <Segmented<Status>
        value={filter}
        onChange={(f) => {
          animateLayout();
          setFilter(f);
        }}
        options={(['pending', 'approved', 'rejected', 'flagged'] as Status[]).map((s) => ({
          id: s,
          label: STATUS[s].label === 'Waiting for review' ? 'Pending' : STATUS[s].label,
          badge: count(s),
        }))}
      />
      {list.length === 0 ? (
        <EmptyState icon={filter === 'pending' ? 'check-circle' : 'inbox'} title={EMPTY[filter]} />
      ) : (
        list.map((r) => <ReportCard key={r.id} r={r} />)
      )}

      <View style={{ gap: 4, marginTop: 12 }}>
        <H2>Youth survey answers</H2>
        <Small>
          {surveys.length} anonymous {surveys.length === 1 ? 'answer' : 'answers'}
          {surveys.length > 15 ? ', showing the latest 15' : ''}.
        </Small>
      </View>
      {surveys.slice(0, 15).map((s) => {
        const feeling = FEELINGS.find((f) => f.id === s.feeling)!;
        return (
          <Card key={s.id}>
            <View style={[styles.row, { flexWrap: 'wrap' }]}>
              <Badge label={feeling.label.en} color="#fff" soft={FEELING_COLOR[s.feeling]} />
              <Text style={styles.surveyPlace}>{s.barangay}</Text>
            </View>
            {s.comment ? <Body>“{s.comment}”</Body> : null}
            <View style={[styles.row, { flexWrap: 'wrap' }]}>
              <Meta icon="clock" text={TIMES.find((t) => t.id === s.timeOfDay)!.label.en} />
              {s.group !== 'everyone' ? <Meta icon="users" text={GROUPS.find((g) => g.id === s.group)!.label.en} /> : null}
              {s.wants.map((w) => (
                <Meta key={w} icon="plus" text={WANTS.find((x) => x.id === w)?.label.en ?? w} />
              ))}
            </View>
          </Card>
        );
      })}
      {!online ? (
        <Button
          title="Reset demo data"
          variant="ghost"
          icon="rotate-ccw"
          onPress={() =>
            Alert.alert('Reset demo data?', 'This deletes new reports and survey answers on this phone and restores the samples.', [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Reset', style: 'destructive', onPress: resetDemo },
            ])
          }
        />
      ) : null}
    </>
  );
}

const FEELING_COLOR: Record<string, string> = {
  safe: severityColors[0],
  mostly_safe: severityColors[1],
  sometimes_unsafe: severityColors[3],
  unsafe: severityColors[4],
};

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title: { fontFamily: fonts.heading, fontSize: 17, lineHeight: 22, color: colors.text, flexShrink: 1 },
  sev: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999 },
  sevText: { fontFamily: fonts.bold, fontSize: 12, color: '#fff' },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.sunken, borderRadius: 999, paddingHorizontal: 9, paddingVertical: 4 },
  metaText: { fontFamily: fonts.medium, fontSize: 12, color: colors.muted },
  log: { gap: 6, paddingTop: 10, borderTopWidth: 1, borderTopColor: colors.border },
  logDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.faint, marginTop: 7 },
  surveyPlace: { fontFamily: fonts.bold, fontSize: 14, color: colors.text },
});
