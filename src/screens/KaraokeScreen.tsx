/**
 * KaraokeScreen — Lyrics / Setlist Karaoke Mode
 * Tampilkan lirik lagu dari setlist, navigasi per lagu, fullscreen mode
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

const { width, height } = Dimensions.get('window');

interface Props {
  route: any;
  navigation: any;
}

export function KaraokeScreen({ route, navigation }: Props) {
  const { concertId, concertArtist } = route.params;
  const { colors, isDark }            = useTheme();

  const songs: SongLyrics[] = LYRICS[concertId] || [];
  const setlist              = SETLISTS[concertId] || { actual: [], predicted: [] };

  // Combine setlist songs with lyrics if available
  const allSetlist = [
    ...(setlist.actual    || []).map((s: string) => ({ title: s, actual: true })),
    ...(setlist.predicted || []).map((s: string) => ({ title: s, actual: false })),
  ];

  const [currentSongIdx, setCurrentSongIdx] = useState(0);
  const [isPlaying, setIsPlaying]            = useState(false);
  const [autoScroll, setAutoScroll]          = useState(false);
  const scrollRef       = useRef<ScrollView>(null);
  const pulseAnim       = useRef(new Animated.Value(1)).current;
  const scrollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const currentLyric = songs[currentSongIdx] || null;

  // Pulse animation saat playing
  useEffect(() => {
    if (isPlaying) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.03, duration: 800, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1,    duration: 800, useNativeDriver: true }),
        ]),
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isPlaying, pulseAnim]);

  // Auto-scroll
  useEffect(() => {
    if (autoScroll && isPlaying) {
      let offset = 0;
      scrollIntervalRef.current = setInterval(() => {
        offset += 2;
        scrollRef.current?.scrollTo({ y: offset, animated: true });
      }, 100);
    } else {
      if (scrollIntervalRef.current) clearInterval(scrollIntervalRef.current);
    }
    return () => { if (scrollIntervalRef.current) clearInterval(scrollIntervalRef.current); };
  }, [autoScroll, isPlaying]);

  const prevSong = useCallback(() => {
    setCurrentSongIdx(p => Math.max(0, p - 1));
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  }, []);

  const nextSong = useCallback(() => {
    setCurrentSongIdx(p => Math.min(songs.length - 1, p + 1));
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  }, [songs.length]);

  const bg = isDark ? '#0f0a1a' : '#f8f5ff';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: bg }]} edges={['top']}>
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
        <TouchableOpacity
          onPress={() => setAutoScroll(p => !p)}
          style={[styles.autoScrollBtn, { backgroundColor: autoScroll ? colors.accent + '33' : colors.surfaceElevated }]}
        >
          <Ionicons name="reorder-three-outline" size={18} color={autoScroll ? colors.accent : colors.textMuted} />
          <Text style={[styles.autoScrollText, { color: autoScroll ? colors.accent : colors.textMuted }]}>Auto</Text>
        </TouchableOpacity>
      </View>

      {/* Song Selector */}
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
              onPress={() => { setCurrentSongIdx(i); scrollRef.current?.scrollTo({ y: 0, animated: false }); }}
            >
              <Text style={[styles.songTabText, { color: i === currentSongIdx ? '#fff' : colors.textMuted }]} numberOfLines={1}>
                {i + 1}. {s.title}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* Lyrics Area */}
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={styles.lyricsContainer}
        showsVerticalScrollIndicator={false}
      >
        {currentLyric ? (
          <>
            {/* Song title */}
            <Animated.View style={[styles.songTitleWrap, { transform: [{ scale: pulseAnim }] }]}>
              <Text style={[styles.songTitle, { color: colors.accent }]}>{currentLyric.title}</Text>
              <Text style={[styles.songArtist, { color: colors.textMuted }]}>{currentLyric.artist}</Text>
            </Animated.View>

            {/* Lyrics lines */}
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
          /* Setlist mode — no lyrics available */
          <View style={styles.setlistMode}>
            <Text style={[styles.setlistModeTitle, { color: colors.text }]}>
              🎵 Setlist Mode
            </Text>
            <Text style={[styles.setlistModeSub, { color: colors.textMuted }]}>
              Lirik belum tersedia untuk artis ini.{'\n'}Berikut daftar lagu yang diprediksi:
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
              <Text style={[styles.noData, { color: colors.textSubtle }]}>
                Setlist belum tersedia
              </Text>
            )}
          </View>
        )}
      </ScrollView>

      {/* Controls */}
      {songs.length > 0 && (
        <View style={[styles.controls, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
          <TouchableOpacity
            onPress={prevSong}
            disabled={currentSongIdx === 0}
            style={[styles.controlBtn, { opacity: currentSongIdx === 0 ? 0.3 : 1 }]}
          >
            <Ionicons name="play-skip-back" size={24} color={colors.text} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setIsPlaying(p => !p)}
            style={[styles.playBtn, { backgroundColor: colors.accent }]}
          >
            <Ionicons name={isPlaying ? 'pause' : 'play'} size={26} color="#fff" />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={nextSong}
            disabled={currentSongIdx === songs.length - 1}
            style={[styles.controlBtn, { opacity: currentSongIdx === songs.length - 1 ? 0.3 : 1 }]}
          >
            <Ionicons name="play-skip-forward" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:    { flex: 1 },
  header:       { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1 },
  backBtn:      { padding: 4 },
  headerTitle:  { fontSize: 16, fontWeight: '800' },
  headerSub:    { fontSize: 12, marginTop: 1 },
  autoScrollBtn:{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10 },
  autoScrollText:{ fontSize: 11, fontWeight: '600' },
  songTabs:     { paddingHorizontal: 16, paddingVertical: 10, gap: 8 },
  songTab:      { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, maxWidth: 160 },
  songTabText:  { fontSize: 12, fontWeight: '600' },
  lyricsContainer: { paddingHorizontal: 24, paddingBottom: 120, paddingTop: 20 },
  songTitleWrap: { alignItems: 'center', marginBottom: 32 },
  songTitle:    { fontSize: 24, fontWeight: '800', textAlign: 'center', marginBottom: 6 },
  songArtist:   { fontSize: 14 },
  lyricsBlock:  { gap: 8 },
  lyricLine:    { textAlign: 'center', lineHeight: 32, letterSpacing: 0.3 },
  setlistMode:  { alignItems: 'center', paddingTop: 20, gap: 12, width: '100%' },
  setlistModeTitle: { fontSize: 20, fontWeight: '800' },
  setlistModeSub: { fontSize: 14, textAlign: 'center', lineHeight: 22 },
  setlistItem:  { flexDirection: 'row', alignItems: 'center', gap: 12, width: '100%', padding: 14, borderRadius: 12, borderWidth: 1 },
  setlistNum:   { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  setlistNumText: { fontSize: 14, fontWeight: '800' },
  setlistTitle: { fontSize: 15, fontWeight: '600', marginBottom: 2 },
  setlistType:  { fontSize: 11 },
  noData:       { fontSize: 14, marginTop: 20 },
  controls:     { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 32, paddingVertical: 16, paddingBottom: 24, borderTopWidth: 1 },
  controlBtn:   { padding: 8 },
  playBtn:      { width: 60, height: 60, borderRadius: 30, alignItems: 'center', justifyContent: 'center', shadowColor: '#a855f7', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.5, shadowRadius: 12, elevation: 8 },
});
