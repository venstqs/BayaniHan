import Feather from '@expo/vector-icons/Feather';
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import BarangayPicker from '@/components/BarangayPicker';
import { Button, Checkbox, Chip, ChipRow, Field, PageHeader, Screen, Section, Small } from '@/components/ui';
import { FEELINGS, GROUPS, TIMES, WANTS } from '@/lib/data';
import { FadeIn, PopIn } from '@/components/motion';
import { useT } from '@/lib/i18n';
import { haptic } from '@/lib/motion';
import { useStore } from '@/lib/store';
import { colors, fonts, radius, severityColors, type } from '@/lib/theme';
import type { Feeling, GroupId, TimeOfDay } from '@/lib/types';

// safe → unsafe, reusing the severity ramp so "how safe" reads the same way everywhere.
const FEELING_COLOR: Record<Feeling, string> = {
  safe: severityColors[0],
  mostly_safe: severityColors[1],
  sometimes_unsafe: severityColors[3],
  unsafe: severityColors[4],
};

export default function SurveyScreen() {
  const { addSurvey, barangay: current } = useStore();
  const { t, L } = useT();
  const [barangay, setBarangay] = useState<string | null>(current);
  const [feeling, setFeeling] = useState<Feeling | null>(null);
  const [timeOfDay, setTime] = useState<TimeOfDay>('night');
  const [group, setGroup] = useState<GroupId>('everyone');
  const [wants, setWants] = useState<string[]>([]);
  const [comment, setComment] = useState('');
  const [consent, setConsent] = useState(false);
  const [sent, setSent] = useState(false);
  const [queued, setQueued] = useState(false);
  const [sending, setSending] = useState(false);

  const toggle = (id: string) => setWants((w) => (w.includes(id) ? w.filter((x) => x !== id) : [...w, id]));
  const missing = [!barangay && 'barangay', !feeling && 'how safe you feel', !consent && 'the consent box'].filter(Boolean) as string[];
  const ok = missing.length === 0;

  const submit = async () => {
    if (!ok || sending) return;
    setSending(true);
    try {
      const res = await addSurvey({ barangay: barangay!, feeling: feeling!, timeOfDay, group, wants, comment: comment.trim() });
      setQueued(res.queued);
      haptic.success();
      setSent(true);
    } catch (e) {
      haptic.warn();
      Alert.alert('Answers not sent', e instanceof Error ? e.message : 'Please try again.');
    } finally {
      setSending(false);
    }
  };

  const reset = () => {
    setFeeling(null);
    setWants([]);
    setComment('');
    setConsent(false);
    setSent(false);
  };

  if (sent) {
    return (
      <Screen tabBarSpace>
        <View style={styles.done}>
          <PopIn>
            <View style={styles.doneIcon}>
              <Feather name="heart" size={40} color="#fff" />
            </View>
          </PopIn>
          <FadeIn delay={150}>
            <Text style={styles.doneTitle}>{t('surveySentTitle')}</Text>
          </FadeIn>
          <FadeIn delay={250}>
            <Text style={styles.doneBody}>
              {queued ? 'You’re offline right now. Your answers are saved and will be sent automatically when you’re back online.' : t('surveySentBody')}
            </Text>
          </FadeIn>
          <FadeIn delay={350} style={{ alignSelf: 'stretch', gap: 10, marginTop: 12 }}>
            <Button title="See the findings" icon="bar-chart-2" onPress={() => { reset(); router.navigate('/findings'); }} />
            <Button title="Done" variant="ghost" onPress={reset} />
          </FadeIn>
        </View>
      </Screen>
    );
  }

  return (
    <Screen tabBarSpace>
      <PageHeader context="Anonymous, for youth aged 15–30" title={t('surveyTitle')} intro={t('surveyIntro')} />

      <Section step={1} title="Barangay" done={!!barangay}>
        <BarangayPicker value={barangay} onChange={setBarangay} />
      </Section>

      <Section step={2} title={t('feeling')} done={!!feeling}>
        <View style={{ gap: 8 }} accessibilityRole="radiogroup">
          {FEELINGS.map((f) => {
            const active = feeling === f.id;
            const c = FEELING_COLOR[f.id];
            return (
              <Pressable
                key={f.id}
                onPress={() => {
                  haptic.select();
                  setFeeling(f.id);
                }}
                accessibilityRole="radio"
                accessibilityState={{ selected: active }}
                style={[styles.feel, active && { borderColor: c, backgroundColor: `${c}1A` }]}
              >
                <View style={[styles.radio, active && { borderColor: c }]}>{active ? <View style={[styles.radioDot, { backgroundColor: c }]} /> : null}</View>
                <Text style={[styles.feelText, active && { fontFamily: fonts.bold }]}>{L(f.label)}</Text>
                <View style={[styles.feelSwatch, { backgroundColor: c }]} />
              </Pressable>
            );
          })}
        </View>
      </Section>

      <Section step={3} title={t('timeOfDay')} done>
        <ChipRow>
          {TIMES.map((x) => (
            <Chip
              key={x.id}
              icon={x.id === 'day' ? 'sun' : x.id === 'evening' ? 'sunset' : 'moon'}
              label={L(x.label)}
              selected={timeOfDay === x.id}
              onPress={() => setTime(x.id)}
            />
          ))}
        </ChipRow>
      </Section>

      <Section step={4} title={t('identify')} done>
        <ChipRow>
          {GROUPS.map((g) => (
            <Chip key={g.id} label={g.id === 'everyone' ? 'Prefer not to say' : L(g.label)} selected={group === g.id} onPress={() => setGroup(g.id)} />
          ))}
        </ChipRow>
      </Section>

      <Section step={5} title={t('wants')} hint="Pick as many as you like." done={wants.length > 0} optional>
        <ChipRow>
          {WANTS.map((w) => (
            <Chip key={w.id} icon={wants.includes(w.id) ? 'check' : undefined} label={L(w.label)} selected={wants.includes(w.id)} onPress={() => toggle(w.id)} />
          ))}
        </ChipRow>
      </Section>

      <Section step={6} title={t('whereUnsafe')} done={comment.trim().length > 0} optional>
        <Field multiline counter value={comment} onChangeText={setComment} placeholder="Describe places, not people. No names please." maxLength={400} />
      </Section>

      <Checkbox
        checked={consent}
        onChange={setConsent}
        label="I agree to share these answers anonymously for the BayaniHan youth safety study. If I am under 18, a parent or guardian knows I am taking part."
      />
      <Button title={sending ? 'Sending…' : t('sendAnswers')} variant="accent" icon="send" onPress={submit} disabled={!ok || sending} />
      {!ok ? (
        <Small style={{ textAlign: 'center' }}>
          {t('stillNeeded')} {missing.join(', ')}.
        </Small>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  feel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 50,
    paddingHorizontal: 14,
    borderRadius: radius.sm,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  feelText: { flex: 1, fontFamily: fonts.medium, fontSize: 15, color: colors.text },
  feelSwatch: { width: 26, height: 6, borderRadius: 3 },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 1.5, borderColor: colors.faint, alignItems: 'center', justifyContent: 'center' },
  radioDot: { width: 10, height: 10, borderRadius: 5 },
  done: { alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 60 },
  doneIcon: {
    width: 96,
    height: 96,
    borderRadius: 32,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    transform: [{ rotate: '6deg' }],
  },
  doneTitle: { fontFamily: fonts.headingBold, ...type.display, color: colors.text, textAlign: 'center' },
  doneBody: { fontFamily: fonts.body, ...type.body, color: colors.muted, textAlign: 'center', maxWidth: 320 },
});
