import Feather from '@expo/vector-icons/Feather';
import { Linking, Text, View } from 'react-native';
import { Body, Card, Notice } from '@/components/ui';
import { CONTACTS } from '@/lib/data';
import { colors, fonts } from '@/lib/theme';

export default function Resources() {
  return (
    <>
      <Body muted>Referral directory used by the Ask BayaniHan chatbot.</Body>
      <Notice tone="warn">Local numbers marked “to be confirmed” must be verified with CSWDO, PNP WCPD and the City before public launch. Re-check all numbers regularly.</Notice>
      {CONTACTS.map((c) => {
        const callable = /^\d+$/.test(c.number);
        return (
          <Card key={c.name} onPress={callable ? () => Linking.openURL(`tel:${c.number}`) : undefined} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Feather name={callable ? 'phone' : 'help-circle'} size={20} color={callable ? colors.primary : colors.muted} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: fonts.bold, fontSize: 15, color: colors.text }}>{c.name}</Text>
              <Body muted style={{ fontSize: 13 }}>{c.detail.en}</Body>
            </View>
            <Text style={{ fontFamily: fonts.bold, color: callable ? colors.primary : colors.accent }}>{c.number}</Text>
          </Card>
        );
      })}
    </>
  );
}
