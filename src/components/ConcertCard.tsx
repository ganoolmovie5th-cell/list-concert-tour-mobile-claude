import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { Concert } from '../types';
import { genreColor, isPast } from '../utils/helpers';

interface ConcertCardProps {
  concert: Concert;
  isWishlisted: boolean;
  onPress: () => void;
  onWishlist: () => void;
}

export function ConcertCard({ concert, isWishlisted, onPress, onWishlist }: ConcertCardProps) {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const past = isPast(concert);
  const gColor = genreColor(concert.genre, colors as unknown as Record<string, string>);

  const statusColor = concert.confirmStatus === 'confirmed'
    ? (past ? colors.past : colors.confirmed)
    : colors.rumor;
  const statusBg = concert.confirmStatus === 'confirmed'
    ? (past ? colors.pastBg : colors.confirmedBg)
    : colors.rumorBg;
  const statusLabel = concert.confirmStatus === 'confirmed'
    ? (past ? '⏰ Past' : '✅ Confirmed') : '🔮 Rumor';

  return (
    <TouchableOpacity style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]} onPress={onPress} activeOpacity={0.85}>
      <View style={styles.imageWrap}>
        <Image
          source={{ uri: `https://www.list-concert-tour.web.id/images/${concert.id}.jpeg` }}
          style={styles.image}
          resizeMode="cover"
        />
        {concert.hot && !past && (
          <View style={[styles.hotBadge, { backgroundColor: colors.hot }]}>
            <Text style={styles.hotText}>🔥 HOT</Text>
          </View>
        )}
        <TouchableOpacity style={styles.heartBtn} onPress={onWishlist} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name={isWishlisted ? 'heart' : 'heart-outline'} size={22} color={isWishlisted ? colors.wishlistActive : '#fff'} />
        </TouchableOpacity>
      </View>

      <View style={styles.body}>
        <View style={styles.topRow}>
          <View style={[styles.dot, { backgroundColor: gColor }]} />
          <Text style={[styles.genre, { color: gColor }]}>{concert.genre.toUpperCase()}</Text>
          <View style={[styles.statusBadge, { backgroundColor: statusBg }]}>
            <Text style={[styles.statusText, { color: statusColor }]}>{statusLabel}</Text>
          </View>
        </View>

        <Text style={[styles.artist, { color: colors.text }]} numberOfLines={1}>{concert.artist}</Text>
        <Text style={[styles.tour, { color: colors.textMuted }]} numberOfLines={1}>{concert.tour}</Text>

        <View style={styles.infoRow}>
          <Ionicons name="calendar-outline" size={13} color={colors.textSubtle} />
          <Text style={[styles.infoText, { color: colors.textSubtle }]}>{concert.dates[0]}</Text>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="location-outline" size={13} color={colors.textSubtle} />
          <Text style={[styles.infoText, { color: colors.textSubtle }]} numberOfLines={1}>{concert.venue}, {concert.city}</Text>
        </View>

        <View style={styles.footer}>
          <Text style={[styles.price, { color: colors.accent }]} numberOfLines={1}>{concert.priceRange}</Text>
          {!past && concert.confirmStatus === 'confirmed' && (
            <View style={[styles.ctaBtn, { backgroundColor: colors.accent }]}>
              <Text style={styles.ctaText}>{t('buyTicket')}</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 16, borderWidth: 1, overflow: 'hidden', marginHorizontal: 16, marginVertical: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 6, elevation: 4 },
  imageWrap: { position: 'relative', height: 180 },
  image: { width: '100%', height: '100%', backgroundColor: '#1a1025' },
  hotBadge: { position: 'absolute', top: 10, left: 10, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  hotText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  heartBtn: { position: 'absolute', top: 10, right: 10, backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: 20, padding: 6 },
  body: { padding: 14 },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  genre: { fontSize: 10, fontWeight: '700', letterSpacing: 0.5, flex: 1 },
  statusBadge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  statusText: { fontSize: 11, fontWeight: '600' },
  artist: { fontSize: 17, fontWeight: '700', marginBottom: 2 },
  tour: { fontSize: 12, marginBottom: 10 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 4 },
  infoText: { fontSize: 12 },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 },
  price: { fontSize: 12, fontWeight: '600', flex: 1 },
  ctaBtn: { borderRadius: 8, paddingHorizontal: 14, paddingVertical: 7 },
  ctaText: { color: '#fff', fontSize: 12, fontWeight: '700' },
});
