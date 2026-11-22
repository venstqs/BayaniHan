import Feather from '@expo/vector-icons/Feather';
import { Text, View } from 'react-native';
import { Body, Card, PageHeader, Screen } from '@/components/ui';
import { colors, fonts } from '@/lib/theme';

const SECTIONS: { icon: keyof typeof Feather.glyphMap; title: string; body: string }[] = [
  {
    icon: 'map',
    title: 'What BayaniHan is',
    body: "A youth-led safety platform for Naga City. Young people map public spaces that feel unsafe (poor lighting, abandoned lots, unsafe routes, harassment hotspots, flooding) so barangays and the City can act on real evidence. We start in Concepción Pequeña and roll out to all 27 barangays.",
  },
  {
    icon: 'eye-off',
    title: 'Anonymous by default',
    body: "We never ask for your name, phone number, email, school, or home address. Please describe places, not people. Don't include names or photos of anyone in your report.",
  },
  {
    icon: 'check-circle',
    title: 'Every report is reviewed',
    body: 'New reports stay pending until a trained barangay youth coordinator reviews them. Only approved reports appear on the public map. Fake or harmful reports are rejected or flagged.',
  },
  {
    icon: 'cpu',
    title: 'AI is a helper, not a decider',
    body: 'Summaries and policy drafts produced by the app are always labelled as drafts. A person reviews every output before it is used in a report or shared with officials.',
  },
  {
    icon: 'database',
    title: 'Where your data goes',
    body: 'Data is used only to produce barangay snapshots, a city-wide findings report, and youth-drafted action plans aligned with Naga City Ordinance No. 2023-107 (Safe Spaces Ordinance) and RA 11313. Access to the review dashboard is restricted. Data handling follows the Data Privacy Act of 2012 (RA 10173).',
  },
  {
    icon: 'alert-octagon',
    title: 'Not an emergency service',
    body: 'BayaniHan does not dispatch help. If you or someone else is in danger, call 911 immediately. Sensitive concerns are referred to the proper offices (CSWDO, PNP WCPD, Barangay VAW Desk, BCPC).',
  },
  {
    icon: 'users',
    title: 'The team',
    body: 'Project BayaniHan, Camarines Sur National High School. Paul Eli John B. Badong (Leader), Chan Laurence M. Agor, Vincent G. Reyes, Sabrina Zaine B. Alonzo, Ma. Czarina Kirsten V. Bedural. Adviser: John Roy V. Galvez.',
  },
];

export default function AboutScreen() {
  return (
    <Screen edges={[]}>
      <PageHeader context="Safe Spaces Project Challenge" title="How BayaniHan protects you" />
      {SECTIONS.map((s) => (
        <Card key={s.title} style={{ flexDirection: 'row', gap: 14, alignItems: 'flex-start' }}>
          <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' }}>
            <Feather name={s.icon} size={18} color={colors.primary} />
          </View>
          <View style={{ flex: 1, gap: 4 }}>
            <Text style={{ fontFamily: fonts.heading, fontSize: 17, lineHeight: 22, color: colors.text }}>{s.title}</Text>
            <Body>{s.body}</Body>
          </View>
        </Card>
      ))}
    </Screen>
  );
}
