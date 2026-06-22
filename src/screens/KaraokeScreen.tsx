/**
 * KaraokeScreen — Lyrics / Setlist Karaoke Mode
 *
 * Fixes:
 * - Play button langsung kontrol auto-scroll (tidak perlu tombol Auto terpisah)
 * - Scroll resume dari posisi saat ini, bukan reset ke 0 saat pause/play
 * - Controls muncul juga di Setlist Mode (tanpa lirik)
 * - edges={['top','bottom']} agar controls tidak tertutup home indicator
 */
import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Dimensions, StatusBar, Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { LYRICS, SongLyrics } from '../data/lyrics';
import { SETLISTS } from '../data/concerts';

const { width } = Dimensions.get('window');

interface Props {
  route: any;
  navigation: any;
}

export function KaraokeScreen({ route, navigation }: Props) {
  const { concertId, concertArtist } = route.params;
  const { colors, isDark }            = useTheme();

  const songs: SongLyrics[] = LYRICS[concertId] || [];
  const setlistData          = SETLISTS[concertId] || [];

  // Build allSetlist dari format { song, prediction? }
  const allSetlist = setlistData.map((s: { song: string; prediction?: boolean }) => ({
    title: s.song,
    actual: !s.prediction,
  }));

  const [currentSongIdx, setCurrentSongIdx] = useState(0);
  const [isPlaying, setIsPlaying]            = useState(false);

  const scrollRef         = useRef<ScrollView>(null);
  const pulseAnim         = useRef(new Animated.Value(1)).current;
  const scrollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // Track posisi scroll saat ini — tidak reset saat pause/play
  const currentOffsetRef  = useRef(0);

  const currentLyric = songs[currentSongIdx] || null;
  const hasContent   = currentLyric !== null || allSetlist.length > 0;


  // Track scroll position — resume dari posisi saat ini saat play lagi
  const handleScroll = useCallback((e: any) => {
    currentOffsetRef.current = e.nativeEvent.contentOffset.y;
  }, []);

  // Pulse animation
  useEffect(() => {
    if (isPlaying) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.04, duration: 700, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1,    duration: 700, useNativeDriver: true }),
        ]),
      ).start();
    } else {
      pulseAnim.stopAnimation();
      Animated.timing(pulseAnim, { toValue: 1, duration: 200, useNativeDriver: true }).start();
    }
  }, [isPlaying]);

  // Auto-scroll — mulai dari currentOffsetRef (bukan 0)
  useEffect(() => {
    if (isPlaying) {
      scrollIntervalRef.current = setInterval(() => {
        currentOffsetRef.current += 2;
        scrollRef.current?.scrollTo({ y: currentOffsetRef.current, animated: true });
      }, 100);
    } else {
      if (scrollIntervalRef.current) {
        clearInterval(scrollIntervalRef.current);
        scrollIntervalRef.current = null;
      }
    }
    return () => {
      if (scrollIntervalRef.current) {
        clearInterval(scrollIntervalRef.current);
        scrollIntervalRef.current = null;
      }
    };
  }, [isPlaying]);

  // Ganti lagu — pause + scroll ke atas
  const goToSong = useCallback((idx: number) => {
    setIsPlaying(false);
    setCurrentSongIdx(idx);
    currentOffsetRef.current = 0;
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  }, []);

  const prevSong = useCallback(() => goToSong(Math.max(0, currentSongIdx - 1)), [currentSongIdx, goToSong]);
  const nextSong = useCallback(() => goToSong(Math.min(songs.length - 1, currentSongIdx + 1)), [currentSongIdx, songs.length, goToSong]);

  const bg = isDark ? '#0f0a1a' : '#f8f5ff';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: bg }]} edges={['top', 'bottom']}>
      <StatusBar barStyle="light-content" backgroundColor="#0f0a1a" />

      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>🎤 Karaoke Mode</Text>
          <Text style={[styles.headerSub, { color: colors.textMuted }]} numberOfLines={1}>
            {concertArtist}
          </Text>
        </View>
        {/* Status badge — menggantikan tombol Auto yang membingungkan */}
        <View style={[styles.statusBadge, { backgroundColor: isPlaying ? colors.accent + '22' : colors.surfaceElevated }]}>
          <Ionicons
            name={isPlaying ? 'musical-notes' : 'musical-notes-outline'}
            size={13}
            color={isPlaying ? colors.accent : colors.textMuted}
          />
          <Text style={[styles.statusText, { color: isPlaying ? colors.accent : colors.textMuted }]}>
            {isPlaying ? 'Playing' : 'Paused'}
          </Text>
        </View>
      </View>


      {/* Song tabs — hanya untuk mode lirik */}
      {songs.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.songTabs}
          style={{ flexGrow: 0 }}
        >
          {songs.map((s, i) => (
            <TouchableOpacity
              key={i}
              style={[
                styles.songTab,
                {
                  backgroundColor: i === currentSongIdx ? colors.accent : colors.surfaceElevated,
                  borderColor: i === currentSongIdx ? colors.accent : colors.border,
                },
              ]}
              onPress={() => goToSong(i)}
            >
              <Text style={[styles.songTabText, { color: i === currentSongIdx ? '#fff' : colors.textMuted }]} numberOfLines={1}>
                {i + 1}. {s.title}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* Lyrics / Setlist area */}
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={styles.lyricsContainer}
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={100}
      >
        {currentLyric ? (
          /* ── MODE LIRIK ── */
          <>
            <Animated.View style={[styles.songTitleWrap, { transform: [{ scale: pulseAnim }] }]}>
              <Text style={[styles.songTitle, { color: colors.accent }]}>{currentLyric.title}</Text>
              <Text style={[styles.songArtist, { color: colors.textMuted }]}>{currentLyric.artist}</Text>
              {isPlaying && (
                <View style={[styles.nowPlayingBadge, { backgroundColor: colors.accent + '22' }]}>
                  <Text style={{ fontSize: 11, color: colors.accent, fontWeight: '700', letterSpacing: 1 }}>
                    ♪  NOW PLAYING  ♪
                  </Text>
                </View>
              )}
            </Animated.View>

            <View style={styles.lyricsBlock}>
              {currentLyric.lines.map((line, i) => (
                <Text
                  key={i}
                  style={[
                    styles.lyricLine,
                    {
                      color: line.text.startsWith('—') || line.text.startsWith('🎸') || line.text.startsWith('✨')
                        ? colors.accent
                        : colors.text,
                      fontSize: line.text === '' ? 8 : 18,
                      opacity: line.text === '' ? 0 : 1,
                    },
                  ]}
                >
                  {line.text}
                </Text>
              ))}
            </View>
          </>
        ) : (
          /* ── SETLIST MODE (tanpa lirik) ── */
          <View style={styles.setlistMode}>
            <Text style={[styles.setlistModeTitle, { color: colors.text }]}>🎵 Setlist Mode</Text>
            <Text style={[styles.setlistModeSub, { color: colors.textMuted }]}>
              Lirik belum tersedia untuk artis ini.{'\n'}
              {isPlaying ? '▶ Auto-scroll aktif — tekan pause untuk berhenti.' : 'Tekan ▶ Play untuk auto-scroll setlist.'}
            </Text>

            {allSetlist.length > 0 ? (
              allSetlist.map((s, i) => (
                <View key={i} style={[styles.setlistItem, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
                  <View style={[styles.setlistNum, { backgroundColor: s.actual ? colors.confirmed + '22' : colors.rumor + '22' }]}>
                    <Text style={[styles.setlistNumText, { color: s.actual ? colors.confirmed : colors.rumor }]}>{i + 1}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.setlistTitle, { color: colors.text }]}>{s.title}</Text>
                    <Text style={[styles.setlistType, { color: s.actual ? colors.confirmed : colors.rumor }]}>
                      {s.actual ? '✅ Aktual' : '🔮 Prediksi'}
                    </Text>
                  </View>
                </View>
              ))
            ) : (
              <Text style={[styles.noData, { color: colors.textSubtle }]}>Setlist belum tersedia</Text>
            )}
          </View>
        )}
      </ScrollView>


      {/* Controls — tampil untuk lirik DAN setlist mode (selama ada konten) */}
      {hasContent && (
        <View style={[styles.controls, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
          {/* Prev — hanya untuk mode lirik */}
          {songs.length > 0 ? (
            <TouchableOpacity
              onPress={prevSong}
              disabled={currentSongIdx === 0}
              style={[styles.controlBtn, { opacity: currentSongIdx === 0 ? 0.3 : 1 }]}
            >
              <Ionicons name="play-skip-back" size={24} color={colors.text} />
            </TouchableOpacity>
          ) : (
            <View style={styles.controlBtn} />
          )}

          {/* Play / Pause — kontrol auto-scroll langsung */}
          <TouchableOpacity
            onPress={() => setIsPlaying(p => !p)}
            style={[styles.playBtn, { backgroundColor: colors.accent }]}
          >
            <Ionicons name={isPlaying ? 'pause' : 'play'} size={28} color="#fff" />
          </TouchableOpacity>

          {/* Next — hanya untuk mode lirik */}
          {songs.length > 0 ? (
            <TouchableOpacity
              onPress={nextSong}
              disabled={currentSongIdx === songs.length - 1}
              style={[styles.controlBtn, { opacity: currentSongIdx === songs.length - 1 ? 0.3 : 1 }]}
            >
              <Ionicons name="play-skip-forward" size={24} color={colors.text} />
            </TouchableOpacity>
          ) : (
            <View style={styles.controlBtn} />
          )}
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:        { flex: 1 },
  header:           { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1 },
  backBtn:          { padding: 4 },
  headerTitle:      { fontSize: 16, fontWeight: '800' },
  headerSub:        { fontSize: 12, marginTop: 1 },
  statusBadge:      { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10 },
  statusText:       { fontSize: 11, fontWeight: '600' },
  songTabs:         { paddingHorizontal: 16, paddingVertical: 10, gap: 8 },
  songTab:          { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, maxWidth: 160 },
  songTabText:      { fontSize: 12, fontWeight: '600' },
  lyricsContainer:  { paddingHorizontal: 24, paddingBottom: 120, paddingTop: 20 },
  songTitleWrap:    { alignItems: 'center', marginBottom: 32 },
  songTitle:        { fontSize: 24, fontWeight: '800', textAlign: 'center', marginBottom: 6 },
  songArtist:       { fontSize: 14 },
  nowPlayingBadge:  { marginTop: 8, paddingHorizontal: 14, paddingVertical: 5, borderRadius: 99 },
  lyricsBlock:      { gap: 8 },
  lyricLine:        { textAlign: 'center', lineHeight: 32, letterSpacing: 0.3 },
  setlistMode:      { alignItems: 'center', paddingTop: 20, gap: 12, width: '100%' },
  setlistModeTitle: { fontSize: 20, fontWeight: '800' },
  setlistModeSub:   { fontSize: 14, textAlign: 'center', lineHeight: 22 },
  setlistItem:      { flexDirection: 'row', alignItems: 'center', gap: 12, width: '100%', padding: 14, borderRadius: 12, borderWidth: 1 },
  setlistNum:       { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  setlistNumText:   { fontSize: 14, fontWeight: '800' },
  setlistTitle:     { fontSize: 15, fontWeight: '600', marginBottom: 2 },
  setlistType:      { fontSize: 11 },
  noData:           { fontSize: 14, marginTop: 20 },
  controls:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 32, paddingVertical: 16, borderTopWidth: 1 },
  controlBtn:       { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  playBtn:          { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center', shadowColor: '#a855f7', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.5, shadowRadius: 12, elevation: 8 },
});
