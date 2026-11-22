import Feather from '@expo/vector-icons/Feather';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { FlatList, KeyboardAvoidingView, Linking, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FadeIn, TypingDots } from '@/components/motion';
import { Chip } from '@/components/ui';
import { haptic } from '@/lib/motion';
import { CONTACTS } from '@/lib/data';
import { colors, fonts, radius } from '@/lib/theme';

interface Msg {
  id: string;
  from: 'bot' | 'me';
  text: string;
  contacts?: string[]; // contact names to show as call buttons
  action?: 'report' | 'route' | 'survey';
}

const WELCOME: Msg = {
  id: 'w',
  from: 'bot',
  text: "Hi! I'm the BayaniHan assistant. I can point you to the right office or hotline, or help you report an unsafe place. I'm not a counselor or the police — if you're in danger right now, call 911.",
  contacts: ['Emergency Hotline'],
};

const SUGGESTIONS = ['I was harassed on the street', 'Someone is bullying me', 'I feel really down', 'How do I report a dark street?', 'Safe way home', 'Hotlines'];

function reply(text: string): Omit<Msg, 'id' | 'from'> {
  const q = ` ${text.toLowerCase().replace(/[^\p{L}\p{N}\s'-]/gu, ' ').replace(/\s+/g, ' ')} `;
  // Match keywords at word starts so "lot" doesn't match "a lot of" and "call" doesn't match "recall".
  // Single words also match common suffixes (harass → harassed, harassment).
  const has = (...w: string[]) => w.some((x) => (x.includes(' ') ? q.includes(` ${x} `) : new RegExp(`\\s${x}`).test(q)));

  // Self-harm / suicide is checked FIRST so it is never shadowed by another topic
  // (e.g. "I want to kill myself because of bullying" must get the crisis line).
  if (
    has('suicide', 'suicidal', 'kill myself', 'end my life', 'want to die', 'self-harm', 'self harm', 'hurt myself', 'cut myself',
      'magpakamatay', 'magpapakamatay', 'mamatay na', 'ayoko nang mabuhay', 'ayoko na mabuhay', 'saktan ang sarili', 'patayin ang sarili')
  )
    return {
      text: "I'm really glad you told me. You matter, and you don't have to face this alone. Please call the NCMH Crisis Hotline (1553) now — it's free and open 24/7. If you might act on these thoughts or are in danger, call 911 or go to the nearest hospital, and stay with someone you trust.",
      contacts: ['NCMH Crisis Hotline', 'Emergency Hotline'],
    };
  if (has('danger', 'emergency', 'help me', 'saklolo', 'tulong', 'sinusundan', 'following me', 'followed'))
    return { text: 'If you are in immediate danger, go to a well-lit place with people (store, barangay hall, police station) and call 911 now.', contacts: ['Emergency Hotline', 'PNP Women & Children Protection Desk'] };
  if (has('harass', 'bastos', 'catcall', 'hipo', 'touched', 'manyak', 'stalk'))
    return {
      text: "I'm sorry that happened. Gender-based street harassment is punishable under RA 11313 (Safe Spaces Act) and Naga City Ordinance 2023-107. You can report to the City's Bawal Bastos hotline, the PNP Women & Children Protection Desk, or your Barangay VAW Desk. You can also mark the place on the map (no personal details) so it can be addressed.",
      contacts: ['Naga City Bawal Bastos hotline', 'PNP Women & Children Protection Desk', 'Barangay VAW Desk / BCPC'],
      action: 'report',
    };
  if (has('bully', 'bullied', 'binubully', 'binu-bully', 'classmate', 'kaklase'))
    return { text: "Bullying is never your fault. Talk to your school's guidance counselor or a teacher you trust — DepEd schools must act on bullying reports (RA 10627). For abuse involving minors, Bantay Bata 163 can help.", contacts: ['Bantay Bata 163', 'CSWDO Naga City'] };
  if (has('sad', 'feel down', 'feeling down', 'really down', 'depress', 'malungkot', 'anxious', 'anxiety', 'mental', 'lonely', 'hopeless'))
    return { text: "Thank you for telling me. You don't have to go through this alone. The NCMH Crisis Hotline (1553) is free and open 24/7. Please also reach out to someone you trust today.", contacts: ['NCMH Crisis Hotline', 'Emergency Hotline'] };
  if (has('abuse', 'violence', 'vawc', 'karahasan', 'traffick', 'inaabuso'))
    return { text: 'Violence and abuse can be reported confidentially. These offices handle such cases according to their mandates:', contacts: ['1343 Actionline', 'Bantay Bata 163', 'CSWDO Naga City', 'Barangay VAW Desk / BCPC'] };
  if (has('route', 'way home', 'get home', 'go home', 'walk home', 'pauwi', 'uuwi', 'walk', 'lakad', 'daan'))
    return { text: 'Try the Safer route tool: pick a start and end point and it compares walking routes against reported concerns. It is informational only — not a guarantee of safety. Walk with a buddy at night when you can.', action: 'route' };
  if (has('report', 'dark', 'madilim', 'ilaw', 'streetlight', 'lighting', 'flood', 'baha', 'abandoned', 'empty lot', 'vacant lot', 'iulat'))
    return { text: 'You can report it in under a minute: choose your barangay, the type of concern, how serious it is, and tap the map. Reports are anonymous and reviewed by a youth coordinator before they appear.', action: 'report' };
  if (has('survey'))
    return { text: 'The youth survey takes about 2 minutes and is anonymous. Thank you for helping your barangay plan!', action: 'survey' };
  if (has('hotline', 'number', 'contact', 'call', 'tawag'))
    return { text: 'Here are the hotlines in the BayaniHan directory. Local numbers marked "to be confirmed" are still being verified with the offices.', contacts: CONTACTS.map((c) => c.name) };
  if (has('privacy', 'anonymous', 'data'))
    return { text: "BayaniHan doesn't ask for your name, number, or address. Reports are anonymous by default and only approved reports (places, not people) are shown on the map." };
  return { text: "I'm not sure I understood. I can help with: harassment, bullying, feeling down, reporting an unsafe place, a safer way home, or hotlines. Try one of the buttons below." };
}

export default function ChatScreen() {
  const [msgs, setMsgs] = useState<Msg[]>([WELCOME]);
  const [input, setInput] = useState('');
  const list = useRef<FlatList<Msg>>(null);
  const [typing, setTyping] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => void (timer.current && clearTimeout(timer.current)), []);

  const send = (text: string) => {
    const t = text.trim();
    if (!t || typing) return;
    haptic.tap();
    const now = Date.now();
    const answer = reply(t);
    setMsgs((m) => [...m, { id: `${now}-me`, from: 'me', text: t }]);
    setInput('');
    setTyping(true);
    // A short pause reads as "thinking" and lets the person see their message land first.
    // Crisis answers come faster: no one should wait for those.
    const urgent = answer.contacts?.includes('Emergency Hotline') || answer.contacts?.includes('NCMH Crisis Hotline');
    timer.current = setTimeout(
      () => {
        setTyping(false);
        setMsgs((m) => [...m, { id: `${now}-bot`, from: 'bot', ...answer }]);
        haptic.select();
      },
      urgent ? 350 : 700 + Math.min(600, answer.text.length * 3),
    );
  };

  const go = (a: NonNullable<Msg['action']>) => {
    router.back();
    setTimeout(() => router.push(a === 'report' ? '/report' : a === 'route' ? '/route' : '/survey'), 50);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['bottom']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
      >
        <FlatList
          ref={list}
          data={msgs}
          keyExtractor={(m) => m.id}
          contentContainerStyle={{ padding: 16, gap: 12 }}
          onContentSizeChange={() => list.current?.scrollToEnd({ animated: true })}
          ListFooterComponent={
            typing ? (
              <FadeIn from={6} style={styles.botRow}>
                <View style={styles.avatar}>
                  <Feather name="map-pin" size={14} color="#fff" />
                </View>
                <View style={[styles.bubble, styles.bot, { flex: 0, paddingHorizontal: 16 }]}>
                  <TypingDots />
                </View>
              </FadeIn>
            ) : undefined
          }
          renderItem={({ item }) =>
            item.from === 'me' ? (
              <FadeIn from={10} duration={200} style={[styles.bubble, styles.me]}>
                <Text style={[styles.text, { color: '#fff' }]}>{item.text}</Text>
              </FadeIn>
            ) : (
              <FadeIn from={10} style={styles.botRow}>
                <View style={styles.avatar}>
                  <Feather name="map-pin" size={14} color="#fff" />
                </View>
                <View style={[styles.bubble, styles.bot]}>
                  <Text style={styles.text}>{item.text}</Text>
                  {item.contacts?.map((name) => {
                    const c = CONTACTS.find((x) => x.name === name);
                    if (!c) return null;
                    const callable = /^\d+$/.test(c.number);
                    return (
                      <Pressable
                        key={name}
                        disabled={!callable}
                        onPress={() => Linking.openURL(`tel:${c.number}`).catch(() => {})}
                        accessibilityRole={callable ? 'button' : undefined}
                        accessibilityLabel={callable ? `Call ${c.name}, ${c.number}` : `${c.name}, number not yet confirmed`}
                        style={({ pressed }) => [styles.contact, !callable && styles.contactOff, pressed && { backgroundColor: '#DCD2FF' }]}
                      >
                        <View style={[styles.contactIcon, !callable && { backgroundColor: colors.sunken }]}>
                          <Feather name={callable ? 'phone' : 'info'} size={14} color={callable ? '#fff' : colors.muted} />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.cName}>{c.name}</Text>
                          <Text style={styles.cNum}>{callable ? c.number : 'Number still being confirmed'}</Text>
                        </View>
                        {callable ? <Text style={styles.callText}>Call</Text> : null}
                      </Pressable>
                    );
                  })}
                  {item.action ? (
                    <Pressable
                      onPress={() => go(item.action!)}
                      style={({ pressed }) => [styles.actionBtn, pressed && { backgroundColor: '#FFD3D4' }]}
                    >
                      <Feather
                        name={item.action === 'report' ? 'plus-circle' : item.action === 'route' ? 'navigation' : 'clipboard'}
                        size={14}
                        color={colors.accentDeep}
                      />
                      <Text style={styles.actionText}>
                        {item.action === 'report' ? 'Report a concern' : item.action === 'route' ? 'Open Safer route' : 'Take the survey'}
                      </Text>
                    </Pressable>
                  ) : null}
                </View>
              </FadeIn>
            )
          }
        />
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          style={{ flexGrow: 0 }}
          contentContainerStyle={{ gap: 8, paddingHorizontal: 12, paddingBottom: 10 }}
        >
          {SUGGESTIONS.map((s) => (
            <Chip key={s} small label={s} onPress={() => send(s)} />
          ))}
        </ScrollView>
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder="Type a message…"
            placeholderTextColor={colors.faint}
            onSubmitEditing={() => send(input)}
            returnKeyType="send"
            accessibilityLabel="Message"
          />
          <Pressable
            style={({ pressed }) => [styles.send, !input.trim() && { opacity: 0.4 }, pressed && { backgroundColor: colors.accentDeep }]}
            onPress={() => send(input)}
            disabled={!input.trim() || typing}
            accessibilityRole="button"
            accessibilityLabel="Send"
          >
            <Feather name="send" size={18} color="#fff" />
          </Pressable>
        </View>
        <Text style={styles.disclaimer}>Automated assistant. Your messages are not saved.</Text>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  bubble: { borderRadius: radius.md, padding: 12, gap: 10 },
  botRow: { flexDirection: 'row', gap: 8, alignItems: 'flex-start', maxWidth: '92%' },
  avatar: { width: 28, height: 28, borderRadius: 9, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  bot: { flex: 1, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderTopLeftRadius: 4 },
  me: { alignSelf: 'flex-end', maxWidth: '82%', backgroundColor: colors.primary, borderTopRightRadius: 4 },
  text: { fontFamily: fonts.body, fontSize: 15, color: colors.text, lineHeight: 22 },
  contact: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.primarySoft, borderRadius: radius.sm, padding: 10 },
  contactOff: { backgroundColor: colors.bg },
  contactIcon: { width: 28, height: 28, borderRadius: 14, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  cName: { fontFamily: fonts.bold, fontSize: 13, color: colors.text },
  cNum: { fontFamily: fonts.body, fontSize: 12, color: colors.muted },
  callText: { fontFamily: fonts.bold, fontSize: 13, color: colors.primary },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    backgroundColor: colors.accentSoft,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  actionText: { fontFamily: fonts.bold, fontSize: 13, color: colors.accentDeep },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.card },
  input: {
    flex: 1,
    backgroundColor: colors.bg,
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 11,
    fontFamily: fonts.body,
    fontSize: 15,
    color: colors.text,
  },
  send: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' },
  disclaimer: { textAlign: 'center', fontFamily: fonts.body, fontSize: 11, color: colors.faint, paddingBottom: 6, backgroundColor: colors.card },
});
