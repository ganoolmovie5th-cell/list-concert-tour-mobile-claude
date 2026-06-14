import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useCountdown } from '../hooks/useCountdown';

interface CountdownTimerProps {
  rawDate: Date;
}

export function CountdownTimer({ rawDate }: CountdownTimerProps) {
  const { colors } = useTheme();
  const cd = useCountdown(rawDate);

  if (!cd) {
    return (
      <View style={[styles.wrap, { backgroundColor: colors.confirmedBg }]}>
        <Text style={[styles.soon, { color: colors.confirmed }]}>🎵 Konser segera dimulai!</Text>
      </View>
    );
  }

  const boxes = [
    { value: String(cd.d),              label: 'Hari' },
    { value: String(cd.h).padStart(2, '0'), label: 'Jam' },
    { value: String(cd.m).padStart(2, '0'), label: 'Menit' },
    { value: String(cd.s).padStart(2, '0'), label: 'Detik' },
  ];

  return (
    <View style={[styles.wrap, { backgroundColor: colors.surfaceElevated }]}>
      <Text style={[styles.label, { color: colors.textMuted }]}>⏳ Menuju hari konser</Text>
      <View style={styles.row}>
        {boxes.map((b, i) => (
          <React.Fragment key={b.label}>
            <View style={[styles.box, { backgroundColor: colors.accent + '18', borderColor: colors.accent + '33' }]}>
              <Text style={[styles.num, { color: colors.accent }]}>{b.value}</Text>
              <Text style={[styles.unit, { color: colors.textSubtle }]}>{b.label}</Text>
            </View>
            {i < boxes.length - 1 && (
              <Text style={[styles.sep, { color: colors.accent }]}>:</Text>
            )}
          </React.Fragment>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap:  { borderRadius: 14, padding: 16, alignItems: 'center', gap: 10 },
  label: { fontSize: 12, fontWeight: '600' },
  row:   { flexDirection: 'row', alignItems: 'center', gap: 6 },
  box:   { borderRadius: 10, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 8, alignItems: 'center', minWidth: 58 },
  num:   { fontSize: 26, fontWeight: '800', lineHeight: 30 },
  unit:  { fontSize: 10, fontWeight: '600', marginTop: 2 },
  sep:   { fontSize: 22, fontWeight: '800', marginBottom: 14 },
  soon:  { fontSize: 14, fontWeight: '700' },
});
