import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, Linking, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';

const CATEGORIES = [
  { value: 'data-salah', label: 'Info Salah / Data Tidak Akurat' },
  { value: 'saran-fitur', label: 'Saran Fitur Baru' },
  { value: 'bug', label: 'Laporan Bug' },
  { value: 'lainnya', label: 'Lainnya' },
];

export function NewsletterScreen() {
  const { colors } = useTheme();
  const { t } = useLanguage();

  // Newsletter state
  const [email, setEmail] = useState('');
  const [nlSent, setNlSent] = useState(false);
  const [nlLoading, setNlLoading] = useState(false);

  // Feedback state
  const [fbName, setFbName] = useState('');
  const [fbEmail, setFbEmail] = useState('');
  const [fbCategory, setFbCategory] = useState('saran-fitur');
  const [fbMessage, setFbMessage] = useState('');
  const [fbSent, setFbSent] = useState(false);
  const [fbLoading, setFbLoading] = useState(false);

  const handleSubscribe = async () => {
    if (!email.trim() || !email.includes('@')) {
      Alert.alert('Email tidak valid', 'Masukkan alamat email yang benar.');
      return;
    }
    setNlLoading(true);
    try {
      // Kirim ke Mailchimp via fetch (no redirect)
      const formData = new FormData();
      formData.append('EMAIL', email.trim());
      formData.append('u', '6e07748f7ad9c994e90d82a5f');
      formData.append('id', '19bdc664b2');
      formData.append('f_id', '007f7ee0f0');

      await fetch(
        'https://web.us20.list-manage.com/subscribe/post?u=6e07748f7ad9c994e90d82a5f&id=19bdc664b2',
        { method: 'POST', body: formData, headers: { Accept: 'application/json' } }
      );
      // Mailchimp tidak return JSON dari endpoint ini, anggap sukses jika tidak error
      setNlSent(true);
      setEmail('');
    } catch {
      Alert.alert('Gagal', 'Tidak bisa terhubung. Coba lagi nanti.');
    } finally {
      setNlLoading(false);
    }
  };

  const handleFeedback = async () => {
    if (!fbMessage.trim() || fbMessage.trim().length < 10) {
      Alert.alert('Pesan terlalu pendek', 'Tulis pesan minimal 10 karakter.');
      return;
    }
    setFbLoading(true);
    try {
      // Kirim via EmailJS REST API — sama seperti di website
      const categoryLabel = CATEGORIES.find(c => c.value === fbCategory)?.label || fbCategory;
      const res = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          service_id: 'service_lq3pvsq',
          template_id: 'template_w8grsoa',
          user_id: 'Ph1AuCpm4gbC6zMw6',
          template_params: {
            from_name: fbName || 'Anonim',
            from_email: fbEmail || 'tidak dicantumkan',
            type: categoryLabel,
            message: fbMessage,
            sent_at: new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' }),
            has_photo: false,
          },
        }),
      });

      if (res.ok) {
        setFbSent(true);
        setFbName(''); setFbEmail(''); setFbMessage(''); setFbCategory('saran-fitur');
      } else {
        const text = await res.text();
        Alert.alert('Gagal', text || 'Pesan tidak terkirim. Coba lagi nanti.');
      }
    } catch {
      Alert.alert('Gagal', 'Tidak bisa terhubung. Coba lagi nanti.');
    } finally {
      setFbLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <Text style={[styles.title, { color: colors.text }]}>📩 Newsletter & Saran</Text>
        </View>

        {/* Newsletter */}
        <View style={styles.section}>
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>📬 {t('newsletterTitle')}</Text>
            <Text style={[styles.cardSub, { color: colors.textMuted }]}>{t('newsletterSub')}</Text>

            {nlSent ? (
              <View style={[styles.successBox, { backgroundColor: colors.confirmedBg }]}>
                <Ionicons name="checkmark-circle" size={22} color={colors.confirmed} />
                <Text style={[styles.successText, { color: colors.confirmed }]}>🎉 Berhasil!</Text>
              </View>
            ) : (
              <>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.text }]}
                  placeholder={t('newsletterPlaceholder')}
                  placeholderTextColor={colors.textSubtle}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  editable={!nlLoading}
                />
                <TouchableOpacity
                  style={[styles.primaryBtn, { backgroundColor: nlLoading ? colors.textSubtle : colors.accent }]}
                  onPress={handleSubscribe}
                  disabled={nlLoading}
                >
                  <Ionicons name="mail-outline" size={18} color="#fff" />
                  <Text style={styles.primaryBtnText}>{nlLoading ? 'Mendaftar...' : t('newsletterBtn')}</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>

        {/* Feedback */}
        <View style={styles.section}>
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>💌 {t('feedbackTitle')}</Text>
            <Text style={[styles.cardSub, { color: colors.textMuted }]}>{t('feedbackSub')}</Text>

            {fbSent ? (
              <View style={[styles.successBox, { backgroundColor: colors.confirmedBg }]}>
                <Ionicons name="checkmark-circle" size={22} color={colors.confirmed} />
                <Text style={[styles.successText, { color: colors.confirmed }]}>
                  ✅ Terima kasih! Pesanmu sudah terkirim.
                </Text>
              </View>
            ) : (
              <>
                {/* Category */}
                <Text style={[styles.label, { color: colors.textMuted }]}>Kategori</Text>
                <View style={styles.categoryWrap}>
                  {CATEGORIES.map(cat => (
                    <TouchableOpacity
                      key={cat.value}
                      style={[
                        styles.catChip,
                        {
                          borderColor: fbCategory === cat.value ? colors.accent : colors.border,
                          backgroundColor: fbCategory === cat.value ? colors.accent + '22' : 'transparent',
                        },
                      ]}
                      onPress={() => setFbCategory(cat.value)}
                    >
                      <Text style={[styles.catChipText, { color: fbCategory === cat.value ? colors.accent : colors.textMuted }]}>
                        {cat.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={[styles.label, { color: colors.textMuted }]}>Nama (opsional)</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.text }]}
                  placeholder="Nama kamu"
                  placeholderTextColor={colors.textSubtle}
                  value={fbName}
                  onChangeText={setFbName}
                />

                <Text style={[styles.label, { color: colors.textMuted }]}>Email balasan (opsional)</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.text }]}
                  placeholder="email@kamu.com"
                  placeholderTextColor={colors.textSubtle}
                  value={fbEmail}
                  onChangeText={setFbEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />

                <Text style={[styles.label, { color: colors.textMuted }]}>Pesan *</Text>
                <TextInput
                  style={[styles.input, styles.textarea, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.text }]}
                  placeholder="Tulis pesanmu di sini..."
                  placeholderTextColor={colors.textSubtle}
                  value={fbMessage}
                  onChangeText={setFbMessage}
                  multiline
                />

                <TouchableOpacity
                  style={[styles.primaryBtn, { backgroundColor: fbLoading ? colors.textSubtle : colors.accent }]}
                  onPress={handleFeedback}
                  disabled={fbLoading}
                >
                  <Ionicons name="send-outline" size={16} color="#fff" />
                  <Text style={styles.primaryBtnText}>{fbLoading ? 'Mengirim...' : t('sendFeedback')}</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>

        {/* Social links */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSubtle }]}>IKUTI KAMI</Text>
          <View style={styles.socialRow}>
            <TouchableOpacity
              style={[styles.socialBtn, { backgroundColor: '#E1306C22', borderColor: '#E1306C44' }]}
              onPress={() => Linking.openURL('https://instagram.com/listconcerttour')}
            >
              <Ionicons name="logo-instagram" size={22} color="#E1306C" />
              <Text style={[styles.socialText, { color: '#E1306C' }]}>Instagram</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.socialBtn, { backgroundColor: '#1DA1F222', borderColor: '#1DA1F244' }]}
              onPress={() => Linking.openURL('https://twitter.com/listconcerttour')}
            >
              <Ionicons name="logo-twitter" size={22} color="#1DA1F2" />
              <Text style={[styles.socialText, { color: '#1DA1F2' }]}>Twitter/X</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Website */}
        <View style={{ paddingHorizontal: 16, marginTop: 12 }}>
          <TouchableOpacity
            style={[styles.websiteBtn, { borderColor: colors.accent }]}
            onPress={() => Linking.openURL('https://www.list-concert-tour.web.id')}
          >
            <Ionicons name="globe-outline" size={18} color={colors.accent} />
            <Text style={[styles.websiteBtnText, { color: colors.accent }]}>Website</Text>
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
  successBox: { borderRadius: 12, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 10 },
  successText: { fontSize: 14, fontWeight: '600', flex: 1 },
  socialRow: { flexDirection: 'row', gap: 12 },
  socialBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, borderRadius: 14, borderWidth: 1, paddingVertical: 14 },
  socialText: { fontSize: 14, fontWeight: '600' },
  websiteBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 14, borderWidth: 1.5, paddingVertical: 14 },
  websiteBtnText: { fontSize: 14, fontWeight: '700' },
});
