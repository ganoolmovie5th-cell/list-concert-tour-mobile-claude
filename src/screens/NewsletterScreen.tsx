import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';

const MAILCHIMP_URL = 'https://mailchimp.com/'; // Replace with actual Mailchimp signup URL
const CATEGORIES = [
  { value: 'data-salah', label: 'Info Salah / Data Tidak Akurat' },
  { value: 'saran-fitur', label: 'Saran Fitur Baru' },
  { value: 'bug', label: 'Laporan Bug' },
  { value: 'lainnya', label: 'Lainnya' },
];

export function NewsletterScreen() {
  const { colors } = useTheme();
  const { t } = useLanguage();

  const [email, setEmail] = useState('');
  const [fbName, setFbName] = useState('');
  const [fbEmail, setFbEmail] = useState('');
  const [fbCategory, setFbCategory] = useState('');
  const [fbMessage, setFbMessage] = useState('');

  const handleSubscribe = () => {
    const url = fbEmail
      ? `${MAILCHIMP_URL}?EMAIL=${encodeURIComponent(email)}`
      : MAILCHIMP_URL;
    Linking.openURL(url);
  };

  const handleFeedback = () => {
    if (!fbMessage.trim()) return;
    const subject = encodeURIComponent(`[ConcertID Feedback] ${CATEGORIES.find(c => c.value === fbCategory)?.label || 'Feedback'}`);
    const body = encodeURIComponent(`Nama: ${fbName}\nEmail: ${fbEmail}\nKategori: ${fbCategory}\n\nPesan:\n${fbMessage}`);
    Linking.openURL(`mailto:hello@list-concert-tour.web.id?subject=${subject}&body=${body}`);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <Text style={[styles.title, { color: colors.text }]}>📩 {t('newsletter')}</Text>
        </View>

        {/* Newsletter */}
        <View style={styles.section}>
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>📬 {t('newsletterTitle')}</Text>
            <Text style={[styles.cardSub, { color: colors.textMuted }]}>{t('newsletterSub')}</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.text }]}
              placeholder={t('newsletterPlaceholder')}
              placeholderTextColor={colors.textSubtle}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <TouchableOpacity style={[styles.primaryBtn, { backgroundColor: colors.accent }]} onPress={handleSubscribe}>
              <Ionicons name="mail-outline" size={18} color="#fff" />
              <Text style={styles.primaryBtnText}>{t('newsletterBtn')}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Feedback */}
        <View style={styles.section}>
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>💌 {t('feedbackTitle')}</Text>
            <Text style={[styles.cardSub, { color: colors.textMuted }]}>{t('feedbackSub')}</Text>

            {/* Category picker */}
            <Text style={[styles.label, { color: colors.textMuted }]}>{t('category')}</Text>
            <View style={styles.categoryWrap}>
              {CATEGORIES.map(cat => (
                <TouchableOpacity
                  key={cat.value}
                  style={[styles.catChip, { borderColor: fbCategory === cat.value ? colors.accent : colors.border, backgroundColor: fbCategory === cat.value ? colors.accent + '22' : 'transparent' }]}
                  onPress={() => setFbCategory(cat.value)}
                >
                  <Text style={[styles.catChipText, { color: fbCategory === cat.value ? colors.accent : colors.textMuted }]}>{cat.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.label, { color: colors.textMuted }]}>{t('name')}</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.text }]}
              placeholder="Nama kamu (opsional)"
              placeholderTextColor={colors.textSubtle}
              value={fbName}
              onChangeText={setFbName}
            />

            <Text style={[styles.label, { color: colors.textMuted }]}>{t('email')}</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.text }]}
              placeholder="email@kamu.com (opsional)"
              placeholderTextColor={colors.textSubtle}
              value={fbEmail}
              onChangeText={setFbEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <Text style={[styles.label, { color: colors.textMuted }]}>{t('message')}</Text>
            <TextInput
              style={[styles.input, styles.textarea, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.text }]}
              placeholder="Tulis pesanmu di sini..."
              placeholderTextColor={colors.textSubtle}
              value={fbMessage}
              onChangeText={setFbMessage}
              multiline
            />

            <TouchableOpacity style={[styles.primaryBtn, { backgroundColor: colors.accent }]} onPress={handleFeedback}>
              <Ionicons name="send-outline" size={16} color="#fff" />
              <Text style={styles.primaryBtnText}>{t('sendFeedback')}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Social links */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSubtle }]}>IKUTI KAMI</Text>
          <View style={styles.socialRow}>
            <TouchableOpacity style={[styles.socialBtn, { backgroundColor: '#E1306C22', borderColor: '#E1306C44' }]} onPress={() => Linking.openURL('https://instagram.com/listconcerttour')}>
              <Ionicons name="logo-instagram" size={22} color="#E1306C" />
              <Text style={[styles.socialText, { color: '#E1306C' }]}>Instagram</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.socialBtn, { backgroundColor: '#1DA1F222', borderColor: '#1DA1F244' }]} onPress={() => Linking.openURL('https://twitter.com/listconcerttour')}>
              <Ionicons name="logo-twitter" size={22} color="#1DA1F2" />
              <Text style={[styles.socialText, { color: '#1DA1F2' }]}>Twitter/X</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Website */}
        <View style={{ paddingHorizontal: 16, marginTop: 12 }}>
          <TouchableOpacity style={[styles.websiteBtn, { borderColor: colors.accent }]} onPress={() => Linking.openURL('https://www.list-concert-tour.web.id')}>
            <Ionicons name="globe-outline" size={18} color={colors.accent} />
            <Text style={[styles.websiteBtnText, { color: colors.accent }]}>Kunjungi list-concert-tour.web.id</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 16, paddingVertical: 16, borderBottomWidth: 1 },
  title: { fontSize: 20, fontWeight: '800' },
  section: { marginTop: 20, paddingHorizontal: 16, gap: 8 },
  sectionTitle: { fontSize: 11, fontWeight: '700', letterSpacing: 1, marginBottom: 4 },
  card: { borderRadius: 16, borderWidth: 1, padding: 18, gap: 12 },
  cardTitle: { fontSize: 16, fontWeight: '700' },
  cardSub: { fontSize: 13, lineHeight: 20 },
  label: { fontSize: 12, fontWeight: '600', marginBottom: -4 },
  input: { borderRadius: 10, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 11, fontSize: 14 },
  textarea: { minHeight: 100, textAlignVertical: 'top' },
  primaryBtn: { borderRadius: 12, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  primaryBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  categoryWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  catChip: { borderRadius: 20, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 7 },
  catChipText: { fontSize: 12, fontWeight: '500' },
  socialRow: { flexDirection: 'row', gap: 12 },
  socialBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, borderRadius: 14, borderWidth: 1, paddingVertical: 14 },
  socialText: { fontSize: 14, fontWeight: '600' },
  websiteBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 14, borderWidth: 1.5, paddingVertical: 14 },
  websiteBtnText: { fontSize: 14, fontWeight: '700' },
});
