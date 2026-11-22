import Feather from '@expo/vector-icons/Feather';
import { Text, View } from 'react-native';
import { Body, Card, Eyebrow, H2, Notice } from '@/components/ui';
import { colors, fonts } from '@/lib/theme';

const LEGAL_REFS = [
  {
    code: 'Naga City Ordinance No. 2023-107',
    title: 'Naga City Safe Spaces Ordinance',
    summary:
      'Localizes RA 11313 against gender-based street and public-space harassment in Naga City, establishes the Bawal Bastos hotline and anti-sexual harassment desk, and involves the Sangguniang Kabataan and City Youth Councilor.',
  },
  {
    code: 'Republic Act No. 11313',
    title: 'Safe Spaces Act (Bawal Bastos Law)',
    summary:
      'Defines and penalizes gender-based sexual harassment in streets, public spaces, online, workplaces, and educational institutions. Mandates local government units to pass ordinances and set up anti-sexual harassment desks.',
  },
  {
    code: 'Republic Act No. 10627',
    title: 'Anti-Bullying Act of 2013',
    summary:
      'Requires elementary and secondary schools to adopt anti-bullying policies, clear reporting mechanisms, and student protection protocols in coordination with DepEd and guidance offices.',
  },
  {
    code: 'Republic Act No. 10173',
    title: 'Data Privacy Act of 2012',
    summary:
      'Governs ethical collection, informed consent/assent, anonymization, restricted administrative access, and secure retention/deletion of community reports and youth survey data.',
  },
];

const TEMPLATES = [
  {
    title: 'Barangay Youth Safety Action Plan Template',
    desc: 'Standardized sheet covering top mapped concerns, responsible barangay/city offices, SK & Barangay Council budget lines, and quarterly monitoring indicators.',
  },
  {
    title: 'City-Level Youth Safety Resolution Outline',
    desc: 'Draft structure for Sangguniang Panlungsod submission linking city-wide safety map findings to Ordinance No. 2023-107 enforcement and lighting/route upgrades.',
  },
  {
    title: 'Daytime Safety Walk-Through & Safeguarding Checklist',
    desc: 'Group-walk protocol with adult guides, buddy system, informed consent/assent reminders, and no-entry rule for isolated or hazardous sites.',
  },
];

export default function Ordinances() {
  return (
    <>
      <Body muted>Legal references and reusable templates aligned with Project BayaniHan and Naga City's Safe Spaces framework.</Body>
      <H2>Ordinances & laws</H2>
      {LEGAL_REFS.map((o) => (
        <Card key={o.code}>
          <Eyebrow>{o.code}</Eyebrow>
          <Text style={{ fontFamily: fonts.heading, fontSize: 17, color: colors.text }}>{o.title}</Text>
          <Body>{o.summary}</Body>
        </Card>
      ))}
      <H2 style={{ marginTop: 8 }}>Barangay templates</H2>
      {TEMPLATES.map((t) => (
        <Card key={t.title} style={{ flexDirection: 'row', gap: 12, alignItems: 'flex-start' }}>
          <View style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' }}>
            <Feather name="file-text" size={17} color={colors.primary} />
          </View>
          <View style={{ flex: 1, gap: 4 }}>
            <Text style={{ fontFamily: fonts.bold, fontSize: 14, color: colors.text }}>{t.title}</Text>
            <Body muted style={{ fontSize: 13 }}>{t.desc}</Body>
          </View>
        </Card>
      ))}
      <Notice>Use the Policy builder tab to generate a costed draft for any barangay or for the whole city.</Notice>
    </>
  );
}
