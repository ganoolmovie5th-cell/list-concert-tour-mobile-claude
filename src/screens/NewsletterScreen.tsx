import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, Linking, Alert, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';

const CATEGORIES = [
  { value: 'kritik',   label: '🔴 Kritik' },
  { value: 'saran',    label: '💡 Saran' },
  { value: 'data',     label: '📋 Data Salah' },
  { value: 'lainnya',  label: '💬 Lainnya' },
];

// EmailJS config — sama persis dengan website
const EMAILJS_SERVICE_ID  = 'service_lq3pvsq';
const EMAILJS_TEMPLATE_ID = 'template_w8grsoa';
const EMAILJS_PUBLIC_KEY  = 'Ph1AuCpm4gbC6zMw6';

// Mailchimp subscribe via Vercel proxy (sama dengan website)
const MAILCHIMP_ENDPOINT = 'https://www.list-concert-tour.web.id/api/subscribe';

export function NewsletterScreen() {
  const { colors } = useTheme();
  const { t } = useLanguage();

  // Newsletter state
  const [email, setEmail]       = useState('');
  const [nlSent, setNlSent]     = useState(false);
  const [nlLoading, setNlLoading] = useState(false);

  // Feedback state
  const [fbName, setFbName]         = useState('');
  const [fbEmail, setFbEmail]       = useState('');
  const [fbCategory, setFbCategory] = useState('saran');
  const [fbMessage, setFbMessage]   = useState('');
  const [fbSent, setFbSent]         = useState(false);
  const [fbLoading, setFbLoading]   = useState(false);
  const [fbPhoto, setFbPhoto]       = useState<string | null>(null); // base64 murni

  // ─── Newsletter subscribe via Vercel proxy (Mailchimp) ───
  const handleSubscribe = async () => {
    if (!email.trim() || !email.includes('@')) {
      Alert.alert('Email tidak valid', 'Masukkan alamat email yang benar.');
      return;
    }
    setNlLoading(true);
    try {
      const res = await fetch(MAILCHIMP_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();
      if (res.ok && data.result === 'success') {
        setNlSent(true);
        setEmail('');
      } else {
        const msg = data.error || data.message || 'Gagal mendaftar. Coba lagi nanti.';
        Alert.alert('Gagal', msg);
      }
    } catch {
      Alert.alert('Gagal', 'Tidak bisa terhubung. Coba lagi nanti.');
    } finally {
      setNlLoading(false);
    }
  };

  // ─── Pilih foto untuk lampiran feedback ───
  const handlePickPhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Izin diperlukan', 'Izinkan akses galeri untuk melampirkan foto.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.7,
      base64: true, // minta base64 langsung dari ImagePicker
    });
    if (!result.canceled && result.assets[0]) {
      // base64 murni tanpa prefix — sesuai dengan web (canvas.toDataURL().split(',')[1])
      setFbPhoto(result.assets[0].base64 || null);
    }
  };

  // ─── Kirim feedback via EmailJS REST API ───
  const handleFeedback = async () => {
    if (!fbMessage.trim() || fbMessage.trim().length < 10) {
      Alert.alert('Pesan terlalu pendek', 'Tulis pesan minimal 10 karakter.');
      return;
    }
    setFbLoading(true);
    try {
      const categoryLabel = CATEGORIES.find(c => c.value === fbCategory)?.label?.replace(/^[^\s]+\s/, '') || fbCategory;
      const payload = {
        service_id:    EMAILJS_SERVICE_ID,
        template_id:   EMAILJS_TEMPLATE_ID,
        // Gunakan accessToken (bukan user_id) sesuai EmailJS v4 API
        accessToken:   EMAILJS_PUBLIC_KEY,
        template_params: {
          from_name:  fbName.trim()  || 'Anonim',
          from_email: fbEmail.trim() || 'Tidak dicantumkan',
          type:       categoryLabel.charAt(0).toUpperCase() + categoryLabel.slice(1),
          message:    fbMessage.trim(),
          sent_at:    new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' }),
          // Kirim base64 murni — template EmailJS: <img src="data:image/jpeg;base64,{{photo_data}}" />
          photo_data: fbPhoto || '',
          has_photo:  fbPhoto ? 'ya' : 'tidak',
        },
      };

      const res = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setFbSent(true);
        setFbName(''); setFbEmail(''); setFbMessage('');
        setFbCategory('saran'); setFbPhoto(null);
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

        {/* ── Newsletter ── */}
        <View style={styles.section}>
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>📬 {t('newsletterTitle')}</Text>
            <Text style={[styles.cardSub, { color: colors.textMuted }]}>{t('newsletterSub')}</Text>

            {nlSent ? (
              <View style={[styles.successBox, { backgroundColor: colors.confirmedBg }]}>
                <Ionicons name="checkmark-circle" size={22} color={colors.confirmed} />
                <Text style={[styles.successText, { color: colors.confirmed }]}>
                  🎉 Berhasil didaftarkan!
                </Text>
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
                  <Text style={styles.primaryBtnText}>
                    {nlLoading ? 'Mendaftar...' : t('newsletterBtn')}
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>

        {/* ── Kritik & Saran ── */}
        <View style={styles.section}>
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>📬 Kritik &amp; Saran</Text>
            <Text style={[styles.cardSub, { color: colors.textMuted }]}>
              Punya masukan, laporan data salah, atau saran fitur baru? Kirim ke kami!
            </Text>

            {fbSent ? (
              <View style={[styles.successBox, { backgroundColor: colors.confirmedBg }]}>
                <Ionicons name="checkmark-circle" size={22} color={colors.confirmed} />
                <Text style={[styles.successText, { color: colors.confirmed }]}>
                  🎉 Terima kasih! Pesanmu sudah kami terima.
                </Text>
              </View>
            ) : (
              <>
                {/* Kategori */}
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

                {/* Nama */}
                <Text style={[styles.label, { color: colors.textMuted }]}>Nama kamu (opsional)</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.text }]}
                  placeholder="Nama kamu"
                  placeholderTextColor={colors.textSubtle}
                  value={fbName}
                  onChangeText={setFbName}
                />

                {/* Email */}
                <Text style={[styles.label, { color: colors.textMuted }]}>Email (opsional)</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.text }]}
                  placeholder="email@kamu.com"
                  placeholderTextColor={colors.textSubtle}
                  value={fbEmail}
                  onChangeText={setFbEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />

                {/* Pesan */}
                <Text style={[styles.label, { color: colors.textMuted }]}>Pesan *</Text>
                <TextInput
                  style={[styles.input, styles.textarea, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.text }]}
                  placeholder="Tuliskan pesan kamu di sini... (min 10 karakter)"
                  placeholderTextColor={colors.textSubtle}
                  value={fbMessage}
                  onChangeText={setFbMessage}
                  multiline
                  maxLength={1000}
                />

                {/* Lampiran foto */}
                <Text style={[styles.label, { color: colors.textMuted }]}>Lampiran foto (opsional)</Text>
                {fbPhoto ? (
                  <View style={styles.photoPreviewWrap}>
                    <Image
                      source={{ uri: `data:image/jpeg;base64,${fbPhoto}` }}
                      style={styles.photoPreview}
                      resizeMode="cover"
                    />
                    <TouchableOpacity
                      style={[styles.removePhotoBtn, { backgroundColor: colors.rumorBg }]}
                      onPress={() => setFbPhoto(null)}
                    >
                      <Ionicons name="close" size={16} color={colors.rumor} />
                      <Text style={[styles.removePhotoText, { color: colors.rumor }]}>Hapus foto</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={[styles.attachBtn, { borderColor: colors.border, backgroundColor: colors.surfaceElevated }]}
                    onPress={handlePickPhoto}
                  >
                    <Ionicons name="attach-outline" size={18} color={colors.textMuted} />
                    <Text style={[styles.attachBtnText, { color: colors.textMuted }]}>
                      📎 Lampirkan foto (JPG/PNG · maks 5MB)
                    </Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  style={[styles.primaryBtn, { backgroundColor: fbLoading ? colors.textSubtle : colors.accent }]}
                  onPress={handleFeedback}
                  disabled={fbLoading}
                >
                  <Ionicons name="send-outline" size={16} color="#fff" />
                  <Text style={styles.primaryBtnText}>
                    {fbLoading ? 'Mengirim...' : '📬 Kirim Pesan'}
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>

        {/* ── Sosial Media — disabled (belum ada akun) ── */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSubtle }]}>IKUTI KAMI</Text>
          <View style={styles.socialRow}>
            {/* Instagram — disabled, belum ada akun */}
            <View style={[styles.socialBtn, { backgroundColor: colors.surfaceElevated, borderColor: colors.border, opacity: 0.4 }]}>
              <Ionicons name="logo-instagram" size={22} color={colors.textMuted} />
              <Text style={[styles.socialText, { color: colors.textMuted }]}>Instagram</Text>
              <Text style={[styles.comingSoon, { color: colors.textSubtle }]}>Segera</Text>
            </View>
            {/* Twitter — disabled, belum ada akun */}
            <View style={[styles.socialBtn, { backgroundColor: colors.surfaceElevated, borderColor: colors.border, opacity: 0.4 }]}>
              <Ionicons name="logo-twitter" size={22} color={colors.textMuted} />
              <Text style={[styles.socialText, { color: colors.textMuted }]}>Twitter/X</Text>
              <Text style={[styles.comingSoon, { color: colors.textSubtle }]}>Segera</Text>
            </View>
          </View>
        </View>

        {/* Website */}
        <View style={{ paddingHorizontal: 16, marginTop: 12 }}>
          <TouchableOpacity
            style={[styles.websiteBtn, { borderColor: colors.accent }]}
            onPress={() => Linking.openURL('https://www.list-concert-tour.web.id')}
          >
            <Ionicons name="globe-outline" size={18} color={colors.accent} />
            <Text style={[styles.websiteBtnText, { color: colors.accent }]}>Buka Website</Text>
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
  // Sosial
  socialRow: { flexDirection: 'row', gap: 12 },
  socialBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 14, borderWidth: 1, paddingVertical: 14, flexWrap: 'wrap' },
  socialText: { fontSize: 14, fontWeight: '600' },
  comingSoon: { fontSize: 10, fontWeight: '500' },
  // Website
  websiteBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 14, borderWidth: 1.5, paddingVertical: 14 },
  websiteBtnText: { fontSize: 14, fontWeight: '700' },
  // Foto lampiran
  attachBtn: { borderRadius: 10, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', gap: 8 },
  attachBtnText: { fontSize: 13, flex: 1 },
  photoPreviewWrap: { gap: 8 },
  photoPreview: { width: '100%', height: 160, borderRadius: 10, backgroundColor: '#333' },
  removePhotoBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, alignSelf: 'flex-start' },
  removePhotoText: { fontSize: 13, fontWeight: '600' },
});
