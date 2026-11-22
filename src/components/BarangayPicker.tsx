import Feather from '@expo/vector-icons/Feather';
import { useState } from 'react';
import { FlatList, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BARANGAYS, PILOT_BARANGAY } from '@/lib/data';
import { useT } from '@/lib/i18n';
import { haptic } from '@/lib/motion';
import { colors, fonts, radius } from '@/lib/theme';
import { Field } from './ui';

interface Props {
  value: string | null;
  onChange: (v: string | null) => void;
  allowAll?: boolean;
  compact?: boolean;
}

export default function BarangayPicker({ value, onChange, allowAll, compact }: Props) {
  const { t } = useT();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const items = [...(allowAll ? [null] : []), ...BARANGAYS.map((b) => b.name)].filter(
    (n) => !q || (n ?? t('allCity')).toLowerCase().includes(q.toLowerCase()),
  );

  return (
    <>
      <Pressable onPress={() => setOpen(true)} style={[styles.trigger, compact && styles.compact]}>
        <Feather name="map-pin" size={15} color={colors.primary} />
        <Text style={styles.triggerText} numberOfLines={1}>
          {value ?? (allowAll ? t('allCity') : t('chooseBarangay'))}
        </Text>
        <Feather name="chevron-down" size={16} color={colors.muted} />
      </Pressable>
      <Modal visible={open} animationType="slide" onRequestClose={() => setOpen(false)}>
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
          <View style={styles.header}>
            <Text style={styles.title}>{t('chooseBarangay')}</Text>
            <Pressable onPress={() => setOpen(false)} hitSlop={10}>
              <Feather name="x" size={24} color={colors.text} />
            </Pressable>
          </View>
          <View style={{ paddingHorizontal: 20, paddingBottom: 10 }}>
            <Field placeholder="Search…" value={q} onChangeText={setQ} />
          </View>
          <FlatList
            data={items}
            keyExtractor={(i) => i ?? '__all'}
            contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
            renderItem={({ item }) => {
              const active = item === value;
              return (
                <Pressable
                  style={[styles.row, active && { backgroundColor: colors.primarySoft }]}
                  onPress={() => {
                    haptic.select();
                    onChange(item);
                    setOpen(false);
                    setQ('');
                  }}
                >
                  <Text style={[styles.rowText, active && { fontFamily: fonts.bold }]}>{item ?? t('allCity')}</Text>
                  {item === PILOT_BARANGAY ? (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>{t('pilot')}</Text>
                    </View>
                  ) : null}
                  {active ? <Feather name="check" size={18} color={colors.primary} /> : null}
                </Pressable>
              );
            }}
          />
        </SafeAreaView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  compact: { borderRadius: radius.pill, paddingVertical: 8 },
  triggerText: { flex: 1, fontFamily: fonts.medium, fontSize: 14, color: colors.text },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20 },
  title: { fontFamily: fonts.heading, fontSize: 22, color: colors.text },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 14, paddingHorizontal: 12, borderRadius: radius.sm },
  rowText: { flex: 1, fontFamily: fonts.body, fontSize: 16, color: colors.text },
  badge: { backgroundColor: colors.accentSoft, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2 },
  badgeText: { fontFamily: fonts.bold, fontSize: 11, color: colors.accent },
});
