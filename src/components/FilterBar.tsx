import React from 'react';
import { ScrollView, TouchableOpacity, Text, View, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { FilterType } from '../types';

interface FilterBarProps {
  active: FilterType;
  onSelect: (f: FilterType) => void;
  wishlistCount?: number;
}

const FILTERS: FilterType[] = ['all','confirmed','rumor','kpop','pop','rock','jazz','indie','upcoming','past','wishlist'];

export function FilterBar({ active, onSelect, wishlistCount = 0 }: FilterBarProps) {
  const { colors } = useTheme();
  const { t } = useLanguage();

  const labels: Record<FilterType, string> = {
    all: t('filterAll'), confirmed: t('filterConfirmed'), rumor: t('filterRumor'),
    kpop: t('filterKpop'), pop: t('filterPop'), rock: t('filterRock'),
    jazz: t('filterJazz'), indie: t('filterIndie'), upcoming: t('filterUpcoming'),
    past: t('filterPast'), wishlist: t('filterWishlist'),
  };

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.container}>
      {FILTERS.map(f => {
        const isActive = active === f;
        return (
          <TouchableOpacity
            key={f}
            onPress={() => onSelect(f)}
            style={[
              styles.chip,
              { borderColor: isActive ? colors.accent : colors.border,
                backgroundColor: isActive ? colors.accent : 'transparent' }
            ]}
          >
            <Text style={[styles.label, { color: isActive ? '#fff' : colors.textMuted }]}>
              {labels[f]}
            </Text>
            {f === 'wishlist' && wishlistCount > 0 && (
              <View style={[styles.badge, { backgroundColor: isActive ? '#fff3' : colors.accent }]}>
                <Text style={[styles.badgeText, { color: isActive ? '#fff' : '#fff' }]}>{wishlistCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 16, paddingVertical: 8, gap: 8, flexDirection: 'row', alignItems: 'center' },
  chip: { flexDirection: 'row', alignItems: 'center', borderRadius: 20, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 7, gap: 4 },
  label: { fontSize: 13, fontWeight: '500' },
  badge: { borderRadius: 10, paddingHorizontal: 6, paddingVertical: 1 },
  badgeText: { fontSize: 11, fontWeight: '700' },
});
