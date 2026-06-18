/**
 * StoryCard — Social Share Story Template
 * Komponen untuk membuat "story card" konser (Instagram / WhatsApp Story style)
 * User bisa screenshot atau share via native share
 */
import React, { useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Share, Linking, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Concert } from '../types';
import { isPast } from '../utils/helpers';

interface StoryCardProps {
  concert: Concert;
  going?: number;
  interested?: number;
  onClose: () => void;
}

const GENRE_EMOJI: Record<string, string> = {
  kpop: '🎤', pop: '🎵', rock: '🎸', jazz: '🎷', indie: '🌈',
};

export function StoryCard({ concert, going = 0, interested = 0, onClose }: StoryCardProps) {
  const past   = isPast(concert);
  const isRumor = concert.confirmStatus === 'rumor';

  const statusLabel = past ? '⏰ Sudah Selesai' : isRumor ? '🔮 Rumor' : '✅ Confirmed';
  const genreEmoji  = GENRE_EMOJI[concert.genre] || '🎵';

  // Teks story untuk WhatsApp / Telegram / copy
  const storyText = [
    `${genreEmoji} ${concert.artist}`,
    `🎪 ${concert.tour}`,
    ``,
    `📅 ${concert.dates.join(' & ')}`,
    `⏰ ${concert.time}`,
    `📍 ${concert.venue}`,
    `🏙️ ${concert.city}`,
    ``,
    `💰 ${concert.priceRange}`,
    `🎟️ ${concert.ticketPlatform}`,
    ``,
    `${statusLabel}`,
    ...(going > 0 ? [`🙋 ${going} orang going · ⭐ ${interested} interested`] : []),
    ``,
    `🌐 list-concert-tour.web.id`,
    `#ConcertID #KonserJakarta #${concert.artist.replace(/\s+/g, '')}`,
  ].join('\n');

  const handleNativeShare = useCallback(async () => {
    try {
      await Share.share({
        message: storyText,
        title:   `${concert.artist} — ConcertID`,
      });
    } catch {}
  }, [storyText, concert.artist]);

  const handleWhatsApp = useCallback(() => {
    const encoded = encodeURIComponent(storyText);
    Linking.openURL(`whatsapp://send?text=${encoded}`).catch(() => {
      Alert.alert('WhatsApp tidak terinstall', 'Gunakan tombol Share lainnya.');
    });
  }, [storyText]);

  const handleTelegram = useCallback(() => {
    const encoded = encodeURIComponent(storyText);
    Linking.openURL(`tg://msg?text=${encoded}`).catch(() => {
      Alert.alert('Telegram tidak terinstall', 'Gunakan tombol Share lainnya.');
    });
  }, [storyText]);

  const handleInstagram = useCallback(() => {
    // Instagram tidak support pre-fill teks — arahkan ke app
    Linking.openURL('instagram://').catch(() => {
      Alert.alert(
        'Instagram Story',
        'Screenshot tampilan ini lalu bagikan ke Instagram Story kamu!',
      );
    });
  }, []);

  return (
    <View style={styles.overlay}>
      <View style={styles.container}>
        {/* Preview Card — "screenshot this" */}
        <View style={styles.previewCard}>
          {/* Header */}
          <View style={styles.cardHeader}>
            <Text style={styles.headerLogo}>🎵 ConcertID</Text>
            <View style={[styles.statusBadge, { backgroundColor: isRumor ? '#f59e0b22' : past ? '#64748b22' : '#10b98122' }]}>
              <Text style={[styles.statusText, { color: isRumor ? '#f59e0b' : past ? '#64748b' : '#10b981' }]}>
                {statusLabel}
              </Text>
            </View>
          </View>

          {/* Artist */}
          <Text style={styles.artistName}>{concert.emoji} {concert.artist}</Text>
          <Text style={styles.tourName}>{concert.tour}</Text>

          {/* Divider */}
          <View style={styles.divider} />

          {/* Info rows */}
          <InfoRow icon="calendar" text={concert.dates.join(' & ')} />
          <InfoRow icon="time"     text={concert.time} />
          <InfoRow icon="location" text={`${concert.venue}, ${concert.city}`} />
          <InfoRow icon="cash"     text={concert.priceRange} />

          {/* Going stats */}
          {going > 0 && (
            <View style={styles.statsRow}>
              <Text style={styles.statText}>🙋 {going} going</Text>
              <Text style={styles.statDot}>·</Text>
              <Text style={styles.statText}>⭐ {interested} interested</Text>
            </View>
          )}

          {/* Footer */}
          <View style={styles.cardFooter}>
            <Text style={styles.footerUrl}>list-concert-tour.web.id</Text>
            <Text style={styles.footerGenre}>{genreEmoji} {concert.genre.toUpperCase()}</Text>
          </View>
        </View>

        <Text style={styles.screenshotHint}>
          📸 Screenshot bagian atas untuk story Instagram
        </Text>

        {/* Share buttons */}
        <View style={styles.shareButtons}>
          <ShareBtn icon="logo-whatsapp"  color="#25D366" label="WhatsApp"  onPress={handleWhatsApp} />
          <ShareBtn icon="paper-plane"    color="#2AABEE" label="Telegram"  onPress={handleTelegram} />
          <ShareBtn icon="logo-instagram" color="#E1306C" label="Instagram" onPress={handleInstagram} />
          <ShareBtn icon="share-outline"  color="#a855f7" label="Lainnya"   onPress={handleNativeShare} />
        </View>

        <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
          <Text style={styles.closeBtnText}>Tutup</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function InfoRow({ icon, text }: { icon: string; text: string }) {
  return (
    <View style={styles.infoRow}>
      <Ionicons name={`${icon}-outline` as any} size={14} color="#a855f7" />
      <Text style={styles.infoText} numberOfLines={1}>{text}</Text>
    </View>
  );
}

function ShareBtn({ icon, color, label, onPress }: { icon: any; color: string; label: string; onPress: () => void }) {
  return (
    <TouchableOpacity style={[styles.shareBtn, { borderColor: color + '44' }]} onPress={onPress}>
      <Ionicons name={icon} size={22} color={color} />
      <Text style={[styles.shareBtnLabel, { color }]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center', zIndex: 100,
  },
  container: { width: '88%', maxWidth: 380 },
  previewCard: {
    backgroundColor: '#0f0a1a', borderRadius: 20, padding: 20,
    borderWidth: 1, borderColor: 'rgba(168,85,247,0.4)',
    shadowColor: '#a855f7', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.5, shadowRadius: 20, elevation: 10,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  headerLogo: { color: '#a855f7', fontWeight: '800', fontSize: 14 },
  statusBadge: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  statusText: { fontSize: 11, fontWeight: '700' },
  artistName: { color: '#f1f5f9', fontSize: 22, fontWeight: '800', marginBottom: 4 },
  tourName:   { color: '#94a3b8', fontSize: 12, marginBottom: 14 },
  divider:    { height: 1, backgroundColor: 'rgba(168,85,247,0.2)', marginBottom: 14 },
  infoRow:    { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  infoText:   { color: '#e2e8f0', fontSize: 13, flex: 1 },
  statsRow:   { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8, padding: 10, backgroundColor: 'rgba(168,85,247,0.1)', borderRadius: 10 },
  statText:   { color: '#c084fc', fontSize: 13 },
  statDot:    { color: '#64748b' },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, paddingTop: 12, borderTopWidth: 1, borderTopColor: 'rgba(168,85,247,0.2)' },
  footerUrl:  { color: '#64748b', fontSize: 11 },
  footerGenre:{ color: '#a855f7', fontSize: 11, fontWeight: '700' },
  screenshotHint: { color: '#94a3b8', textAlign: 'center', marginVertical: 12, fontSize: 12 },
  shareButtons: { flexDirection: 'row', gap: 8, justifyContent: 'center', marginBottom: 12 },
  shareBtn:   { flex: 1, alignItems: 'center', gap: 4, paddingVertical: 10, borderRadius: 12, borderWidth: 1, backgroundColor: 'rgba(255,255,255,0.05)' },
  shareBtnLabel: { fontSize: 10, fontWeight: '600' },
  closeBtn:   { alignItems: 'center', paddingVertical: 12, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 12 },
  closeBtnText: { color: '#94a3b8', fontWeight: '600' },
});
