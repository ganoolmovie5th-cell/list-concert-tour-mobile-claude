import React from 'react';
import { View, Text, ScrollView, Switch, TouchableOpacity, StyleSheet, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';

const VENUES = [
  { name: 'Gelora Bung Karno (GBK)', cap: '~80.000', area: 'Senayan, Jakarta Pusat' },
  { name: 'Jakarta International Stadium (JIS)', cap: '~82.000', area: 'Tanjung Priok, Jakarta Utara' },
  { name: 'NICE PIK2', cap: 'Indoor Convention', area: 'Pantai Indah Kapuk 2, Tangerang' },
  { name: 'ICE BSD City', cap: 'Multi-Hall Expo', area: 'BSD City, Tangerang Selatan' },
  { name: 'Beach City International Stadium', cap: '~30.000', area: 'Ancol, Jakarta Utara' },
  { name: 'Pantai Carnaval Ancol', cap: 'Festival Outdoor', area: 'Ancol, Jakarta Utara' },
];

const PLATFORMS = [
  { name: 'Loket.com', url: 'https://www.loket.com', color: '#f97316' },
  { name: 'tiket.com', url: 'https://www.tiket.com', color: '#e11d48' },
  { name: 'TIX.ID', url: 'https://www.tix.id', color: '#6d28d9' },
];

export function MoreScreen() {
  const { colors, isDark, toggle } = useTheme();
  const { lang, toggleLang, t } = useLanguage();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <Text style={[styles.title, { color: colors.text }]}>⚙️ {t('more')}</Text>
        </View>

        {/* Settings */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSubtle }]}>PENGATURAN</Text>

          <View style={[styles.row, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Ionicons name={isDark ? 'moon' : 'sunny'} size={20} color={colors.accent} />
            <Text style={[styles.rowLabel, { color: colors.text }]}>{t('darkMode')}</Text>
            <Switch
              value={isDark}
              onValueChange={toggle}
              trackColor={{ false: colors.border, true: colors.accent }}
              thumbColor="#fff"
            />
          </View>

          <View style={[styles.row, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Ionicons name="language-outline" size={20} color={colors.accent} />
            <Text style={[styles.rowLabel, { color: colors.text }]}>{t('language')}</Text>
            <TouchableOpacity onPress={toggleLang} style={[styles.langToggle, { backgroundColor: colors.accent }]}>
              <Text style={styles.langToggleText}>{lang === 'id' ? '🇮🇩 ID' : '🇬🇧 EN'}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Status guide */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSubtle }]}>{t('statusGuide').toUpperCase()}</Text>
          {[
            { text: t('confirmed_desc'), bg: colors.confirmedBg, color: colors.confirmed },
            { text: t('rumor_desc'), bg: colors.rumorBg, color: colors.rumor },
            { text: t('past_desc'), bg: colors.pastBg, color: colors.past },
          ].map((item, i) => (
            <View key={i} style={[styles.legendItem, { backgroundColor: item.bg, borderColor: item.color + '44' }]}>
              <Text style={[styles.legendText, { color: item.color }]}>{item.text}</Text>
            </View>
          ))}
        </View>

        {/* Venues */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSubtle }]}>{t('venues').toUpperCase()}</Text>
          {VENUES.map((v, i) => (
            <View key={i} style={[styles.venueCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Ionicons name="location" size={16} color={colors.accent} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.venueName, { color: colors.text }]}>{v.name}</Text>
                <Text style={[styles.venueInfo, { color: colors.textMuted }]}>{v.area} · Kapasitas {v.cap}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Ticket platforms */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSubtle }]}>{t('ticketPlatforms').toUpperCase()}</Text>
          <View style={styles.platformRow}>
            {PLATFORMS.map(p => (
              <TouchableOpacity key={p.name} style={[styles.platformBtn, { backgroundColor: p.color + '22', borderColor: p.color + '44' }]} onPress={() => Linking.openURL(p.url)}>
                <Text style={[styles.platformName, { color: p.color }]}>{p.name}</Text>
                <Ionicons name="open-outline" size={14} color={p.color} />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* About */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSubtle }]}>{t('aboutTitle').toUpperCase()}</Text>
          <View style={[styles.aboutCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.aboutText, { color: colors.textMuted }]}>{t('aboutDesc')}</Text>
            <TouchableOpacity style={[styles.websiteBtn, { backgroundColor: colors.accent }]} onPress={() => Linking.openURL('https://www.list-concert-tour.web.id')}>
              <Ionicons name="globe-outline" size={16} color="#fff" />
              <Text style={styles.websiteBtnText}>Website</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Footer */}
        <Text style={[styles.footer, { color: colors.textSubtle }]}>{t('footerCopy')}</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 16, paddingVertical: 16, borderBottomWidth: 1 },
  title: { fontSize: 20, fontWeight: '800' },
  section: { marginTop: 24, paddingHorizontal: 16, gap: 8 },
  sectionTitle: { fontSize: 11, fontWeight: '700', letterSpacing: 1, marginBottom: 4 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 12, borderWidth: 1 },
  rowLabel: { flex: 1, fontSize: 15 },
  langToggle: { borderRadius: 8, paddingHorizontal: 14, paddingVertical: 6 },
  langToggleText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  legendItem: { borderRadius: 10, borderWidth: 1, padding: 12 },
  legendText: { fontSize: 13, fontWeight: '500' },
  venueCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, borderRadius: 12, borderWidth: 1, padding: 12 },
  venueName: { fontSize: 13, fontWeight: '600', marginBottom: 2 },
  venueInfo: { fontSize: 11 },
  platformRow: { gap: 8 },
  platformBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderRadius: 12, borderWidth: 1, paddingHorizontal: 16, paddingVertical: 14 },
  platformName: { fontSize: 15, fontWeight: '700' },
  aboutCard: { borderRadius: 14, borderWidth: 1, padding: 16, gap: 14 },
  aboutText: { fontSize: 13, lineHeight: 20 },
  websiteBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 12, paddingVertical: 12 },
  websiteBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  footer: { textAlign: 'center', fontSize: 12, marginTop: 32, marginBottom: 16 },
});
