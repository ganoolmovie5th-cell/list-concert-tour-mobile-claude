import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { SortOption } from '../types';

interface SortPickerProps {
  value: SortOption;
  onChange: (s: SortOption) => void;
}

const SORTS: SortOption[] = ['date-asc','date-desc','price-asc','price-desc','name-asc'];

export function SortPicker({ value, onChange }: SortPickerProps) {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);

  const labels: Record<SortOption, string> = {
    'date-asc': t('sortDateAsc'), 'date-desc': t('sortDateDesc'),
    'price-asc': t('sortPriceAsc'), 'price-desc': t('sortPriceDesc'),
    'name-asc': t('sortNameAsc'),
  };

  return (
    <>
      <TouchableOpacity
        onPress={() => setOpen(true)}
        style={[styles.btn, { borderColor: colors.border, backgroundColor: colors.inputBg }]}
      >
        <Ionicons name="funnel-outline" size={14} color={colors.accent} />
        <Text style={[styles.label, { color: colors.text }]} numberOfLines={1}>{labels[value]}</Text>
        <Ionicons name="chevron-down" size={14} color={colors.textMuted} />
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <Pressable style={[styles.overlay, { backgroundColor: colors.overlay }]} onPress={() => setOpen(false)}>
          <Pressable style={[styles.sheet, { backgroundColor: colors.surface }]} onPress={e => e.stopPropagation()}>
            <Text style={[styles.title, { color: colors.text }]}>{t('sortLabel')}</Text>
            {SORTS.map(s => (
              <TouchableOpacity
                key={s}
                onPress={() => { onChange(s); setOpen(false); }}
                style={[styles.option, { borderBottomColor: colors.border, backgroundColor: s === value ? colors.surfaceElevated : 'transparent' }]}
              >
                <Text style={[styles.optionText, { color: s === value ? colors.accent : colors.text }]}>{labels[s]}</Text>
                {s === value && <Ionicons name="checkmark" size={18} color={colors.accent} />}
              </TouchableOpacity>
            ))}
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  btn: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 10, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 8, maxWidth: 160 },
  label: { flex: 1, fontSize: 12, fontWeight: '500' },
  overlay: { flex: 1, justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingBottom: 36 },
  title: { fontSize: 16, fontWeight: '700', padding: 20, paddingBottom: 10 },
  option: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 16, paddingHorizontal: 20, borderBottomWidth: 1 },
  optionText: { fontSize: 15 },
});
