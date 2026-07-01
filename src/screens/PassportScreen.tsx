import React, { useMemo } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Image, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { useBeenThere } from '../hooks/useBeenThere';
import { CONCERTS, ARTIST_IMAGES } from '../data/concerts';
import { isPast } from '../utils/helpers';

const { width } = Dimensions.get('window');
const STAMP_SIZE = (width - 48) / 2;

const ACHIEVEMENTS = [
  { min: 1,  icon: '🎫', label: 'Concert Rookie',      color: '#a855f7' },
  { min: 3,  icon: '🎵', label: 'Music Enthusiast',    color: '#06b6d4' },
  { min: 5,  icon: '🎸', label: 'Gig Veteran',         color: '#f59e0b' },
  { min: 10, icon: '🏆', label: 'Concert Champion',    color: '#22c55e' },
  { min: 15, icon: '👑', label: 'ConcertID Legend',    color: '#ec4899' },
];

function getAchievement(count: number) {
  let best = null;
  for (const a of ACHIEVEMENTS) if (count >= a.min) best = a;
  return best;
}

export function PassportScreen({ navigation }: any) {
  const { colors } = useApp();
  const { hasAttended } = useBeenThere();

  const attendedConcerts = useMemo(
    () => CONCERTS.filter(c => hasAttended(c.id) && isPast(c)),
    [hasAttended],
  );

  const achievement = getAchievement(attendedConcerts.length);

  const genreCount = useMemo(() => {
    const map: Record<string, number> = {};
    attendedConcerts.forEach(c => { map[c.genre] = (map[c.genre] || 0) + 1; });
    return map;
  }, [attendedConcerts]);

  const GENRE_LABEL: Record<string, string> = {
    kpop: 'K-Pop', pop: 'Pop/R&B', rock: 'Rock/Metal', jazz: 'Jazz', indie: 'Indie',
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>🎟️ Concert Passport</Text>
          <View style={{ width: 36 }} />
        </View>

        {/* Passport cover */}
        <View style={[styles.passportCover, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={[styles.passportBadge, { backgroundColor: colors.accent + '22', borderColor: colors.accent + '44' }]}>
            <Text style={styles.passportEmoji}>🎵</Text>
            <Text style={[styles.passportTitle, { color: colors.accent }]}>ConcertID</Text>
            <Text style={[styles.passportSub, { color: colors.textMuted }]}>CONCERT PASSPORT</Text>
          </View>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={[styles.statNum, { color: colors.accent }]}>{attendedConcerts.length}</Text>
              <Text style={[styles.statLabel, { color: colors.textMuted }]}>Konser Dihadiri</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
            <View style={styles.statItem}>
              <Text style={[styles.statNum, { color: colors.accent }]}>{Object.keys(genreCount).length}</Text>
              <Text style={[styles.statLabel, { color: colors.textMuted }]}>Genre</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
            <View style={styles.statItem}>
              <Text style={[styles.statNum, { color: colors.accent }]}>
                {attendedConcerts.length > 0 ? Math.max(...attendedConcerts.map(c => c.rawDate.getFullYear())) : '—'}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textMuted }]}>Tahun Terakhir</Text>
            </View>
          </View>
        </View>

        {/* Achievement badge */}
        {achievement && (
          <View style={[styles.achieveCard, { backgroundColor: achievement.color + '18', borderColor: achievement.color + '44' }]}>
            <Text style={styles.achieveIcon}>{achievement.icon}</Text>
            <View>
              <Text style={[styles.achieveLabel, { color: achievement.color }]}>{achievement.label}</Text>
              <Text style={[styles.achieveSub, { color: colors.textMuted }]}>
                {attendedConcerts.length} konser dihadiri
              </Text>
            </View>
          </View>
        )}

        {/* Genre breakdown */}
        {Object.keys(genreCount).length > 0 && (
          <View style={[styles.section, { paddingHorizontal: 16 }]}>
            <Text style={[styles.sectionTitle, { color: colors.textSubtle }]}>GENRE FAVORIT</Text>
            <View style={styles.genreRow}>
              {Object.entries(genreCount).sort((a, b) => b[1] - a[1]).map(([genre, count]) => (
                <View key={genre} style={[styles.genreChip, { backgroundColor: colors.accent + '22', borderColor: colors.accent + '44' }]}>
                  <Text style={[styles.genreChipText, { color: colors.accent }]}>
                    {GENRE_LABEL[genre] || genre} · {count}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Progress to next achievement */}
        {(() => {
          const next = ACHIEVEMENTS.find(a => a.min > attendedConcerts.length);
          if (!next) return null;
          const prev = ACHIEVEMENTS.slice().reverse().find(a => a.min <= attendedConcerts.length);
          const from = prev ? prev.min : 0;
          const progress = (attendedConcerts.length - from) / (next.min - from);
          return (
            <View style={[styles.section, { paddingHorizontal: 16 }]}>
              <Text style={[styles.sectionTitle, { color: colors.textSubtle }]}>PROGRESS BERIKUTNYA</Text>
              <View style={[styles.progressCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <View style={styles.progressHeader}>
                  <Text style={styles.progressIcon}>{next.icon}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.progressLabel, { color: colors.text }]}>{next.label}</Text>
                    <Text style={[styles.progressSub, { color: colors.textMuted }]}>
                      {next.min - attendedConcerts.length} konser lagi
                    </Text>
                  </View>
                </View>
                <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
                  <View style={[styles.progressFill, { backgroundColor: next.color, width: `${Math.min(progress * 100, 100)}%` as any }]} />
                </View>
              </View>
            </View>
          );
        })()}

        {/* Stamps grid */}
        <View style={[styles.section, { paddingHorizontal: 16 }]}>
          <Text style={[styles.sectionTitle, { color: colors.textSubtle }]}>
            STAMPS — {attendedConcerts.length} KONSER
          </Text>

          {attendedConcerts.length === 0 ? (
            <View style={[styles.emptyState, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={styles.emptyEmoji}>🎫</Text>
              <Text style={[styles.emptyTitle, { color: colors.text }]}>Passport Masih Kosong</Text>
              <Text style={[styles.emptyDesc, { color: colors.textMuted }]}>
                Tandai konser past yang sudah kamu hadiri dengan tombol "Mark Been There" di halaman detail konser.
              </Text>
            </View>
          ) : (
            <View style={styles.stampsGrid}>
              {attendedConcerts
                .sort((a, b) => b.rawDate.getTime() - a.rawDate.getTime())
                .map(concert => {
                  const img = ARTIST_IMAGES[concert.id];
                  return (
                    <View
                      key={concert.id}
                      style={[styles.stamp, { backgroundColor: colors.surface, borderColor: colors.accent + '55' }]}
                    >
                      {/* Stamp perforations */}
                      <View style={[styles.stampPerf, { borderColor: colors.accent + '33' }]}>
                        {img ? (
                          <Image
                            source={{ uri: img }}
                            style={styles.stampImg}
                            resizeMode="cover"
                          />
                        ) : (
                          <View style={[styles.stampImgPlaceholder, { backgroundColor: colors.accent + '22' }]}>
                            <Text style={styles.stampEmoji}>{concert.emoji}</Text>
                          </View>
                        )}
                        <View style={[styles.stampOverlay, { backgroundColor: 'rgba(0,0,0,0.48)' }]} />

                        {/* Stamp mark */}
                        <View style={[styles.stampMark, { borderColor: colors.accent + 'aa' }]}>
                          <Text style={[styles.stampMarkText, { color: colors.accent }]}>✓ HADIR</Text>
                        </View>
                      </View>

                      <View style={styles.stampInfo}>
                        <Text style={[styles.stampArtist, { color: colors.text }]} numberOfLines={1}>
                          {concert.artist}
                        </Text>
                        <Text style={[styles.stampDate, { color: colors.textMuted }]} numberOfLines={1}>
                          {concert.dates[0]}
                        </Text>
                        <View style={[styles.stampGenreChip, { backgroundColor: colors.accent + '22' }]}>
                          <Text style={[styles.stampGenreText, { color: colors.accent }]}>
                            {GENRE_LABEL[concert.genre] || concert.genre}
                          </Text>
                        </View>
                      </View>
                    </View>
                  );
                })}
            </View>
          )}
        </View>

        {/* Tip */}
        <Text style={[styles.footerTip, { color: colors.textSubtle }]}>
          💡 Tandai kehadiran di halaman detail konser (tab Info → "Mark Been There")
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}


const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1 },
  backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '800' },

  passportCover: { margin: 16, borderRadius: 18, borderWidth: 1, padding: 20, alignItems: 'center', gap: 16 },
  passportBadge: { alignItems: 'center', borderWidth: 1, borderRadius: 14, paddingHorizontal: 24, paddingVertical: 16, gap: 4 },
  passportEmoji: { fontSize: 36 },
  passportTitle: { fontSize: 22, fontWeight: '900', letterSpacing: 2 },
  passportSub: { fontSize: 11, letterSpacing: 3, fontWeight: '600' },

  statsRow: { flexDirection: 'row', alignItems: 'center', width: '100%', justifyContent: 'center', gap: 0 },
  statItem: { flex: 1, alignItems: 'center', gap: 4 },
  statNum: { fontSize: 26, fontWeight: '800' },
  statLabel: { fontSize: 11, textAlign: 'center' },
  statDivider: { width: 1, height: 36 },

  achieveCard: { marginHorizontal: 16, marginBottom: 8, borderRadius: 14, borderWidth: 1, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12 },
  achieveIcon: { fontSize: 28 },
  achieveLabel: { fontSize: 15, fontWeight: '700' },
  achieveSub: { fontSize: 12, marginTop: 2 },

  section: { marginTop: 20 },
  sectionTitle: { fontSize: 11, fontWeight: '700', letterSpacing: 1, marginBottom: 10 },

  genreRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  genreChip: { borderRadius: 20, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 5 },
  genreChipText: { fontSize: 12, fontWeight: '600' },

  progressCard: { borderRadius: 14, borderWidth: 1, padding: 14, gap: 10 },
  progressHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  progressIcon: { fontSize: 24 },
  progressLabel: { fontSize: 14, fontWeight: '700' },
  progressSub: { fontSize: 12, marginTop: 2 },
  progressBar: { height: 6, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3 },

  stampsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  stamp: { width: STAMP_SIZE, borderRadius: 14, borderWidth: 1.5, overflow: 'hidden' },
  stampPerf: { position: 'relative', height: STAMP_SIZE * 0.75, borderBottomWidth: 1, borderStyle: 'dashed' },
  stampImg: { width: '100%', height: '100%' },
  stampImgPlaceholder: { width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' },
  stampEmoji: { fontSize: 36 },
  stampOverlay: { ...StyleSheet.absoluteFillObject },
  stampMark: { position: 'absolute', top: 8, right: 8, borderWidth: 2, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 3, transform: [{ rotate: '-12deg' }] },
  stampMarkText: { fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },
  stampInfo: { padding: 10, gap: 4 },
  stampArtist: { fontSize: 12, fontWeight: '700' },
  stampDate: { fontSize: 10 },
  stampGenreChip: { borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2, alignSelf: 'flex-start' },
  stampGenreText: { fontSize: 9, fontWeight: '600' },

  emptyState: { borderRadius: 16, borderWidth: 1, padding: 28, alignItems: 'center', gap: 10 },
  emptyEmoji: { fontSize: 40 },
  emptyTitle: { fontSize: 16, fontWeight: '700' },
  emptyDesc: { fontSize: 13, textAlign: 'center', lineHeight: 20 },

  footerTip: { fontSize: 12, textAlign: 'center', marginTop: 24, marginBottom: 16, paddingHorizontal: 24 },
});
