/**
 * KaraokeScreen v4 — Spotify-integrated karaoke experience
 * - Connect to Spotify → play audio in background
 * - Highlighted active lyric line, auto-advance per baris
 * - Tap baris untuk loncat, speed control
 * - Fallback: tanpa Spotify (timer only)
 */
import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, StatusBar, Animated, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { LYRICS, SongLyrics } from '../data/lyrics';
import { SETLISTS } from '../data/concerts';
import { useSpotifyPlayer } from '../hooks/useSpotifyPlayer';

interface Props { route: any; navigation: any; }

const SPEED_MS: Record<string, number> = { '0.5x': 5000, '1x': 3000, '1.5x': 2000, '2x': 1500 };
const SPEEDS = ['0.5x', '1x', '1.5x', '2x'] as const;
const LINE_H  = 42;
const TITLE_H = 160;


export function KaraokeScreen({ route, navigation }: Props) {
  const { concertId, concertArtist } = route.params;
  const { colors, isDark } = useTheme();

  const songs: SongLyrics[] = LYRICS[concertId] || [];
  const setlistData          = SETLISTS[concertId] || [];
  const allSetlist           = setlistData.map((s: { song: string; prediction?: boolean }) => ({
    title: s.song, actual: !s.prediction,
  }));

  const [songIdx,   setSongIdx]   = useState(0);
  const [lineIdx,   setLineIdx]   = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed,     setSpeed]     = useState<string>('1x');
  const [showHint,  setShowHint]  = useState(true);

  const scrollRef   = useRef<ScrollView>(null);
  const timerRef    = useRef<ReturnType<typeof setInterval> | null>(null);
  const pulseAnim   = useRef(new Animated.Value(1)).current;
  const scrollOff   = useRef(0);

  const currentSong = songs[songIdx] || null;
  const lines       = currentSong?.lines || [];
  const hasLyrics   = songs.length > 0;
  const hasSetlist  = allSetlist.length > 0;

  // ── Spotify player ────────────────────────────────────────────────
  const spotify = useSpotifyPlayer();


  // Auto-scroll ke baris aktif
  const scrollToLine = useCallback((idx: number) => {
    const y = Math.max(0, TITLE_H + idx * LINE_H - 200);
    scrollRef.current?.scrollTo({ y, animated: true });
  }, []);

  // Pulse animation saat playing
  useEffect(() => {
    if (isPlaying) {
      Animated.loop(Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.06, duration: 600, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1,    duration: 600, useNativeDriver: true }),
      ])).start();
    } else {
      pulseAnim.stopAnimation();
      Animated.timing(pulseAnim, { toValue: 1, duration: 150, useNativeDriver: true }).start();
    }
  }, [isPlaying]);

  // Auto-advance per baris
  useEffect(() => {
    if (isPlaying && hasLyrics) {
      timerRef.current = setInterval(() => {
        setLineIdx(prev => {
          const next = prev + 1;
          if (next >= lines.length) {
            setIsPlaying(false);
            return prev;
          }
          scrollToLine(next);
          return next;
        });
      }, SPEED_MS[speed]);
    } else {
      if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    }
    return () => { if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; } };
  }, [isPlaying, speed, lines.length, hasLyrics, scrollToLine]);

  // Auto-scroll setlist saat playing (tanpa lirik)
  useEffect(() => {
    if (isPlaying && !hasLyrics) {
      const iv = setInterval(() => {
        scrollOff.current += 2;
        scrollRef.current?.scrollTo({ y: scrollOff.current, animated: true });
      }, 100);
      return () => clearInterval(iv);
    }
  }, [isPlaying, hasLyrics]);

  // ── Sync lineIdx dgn Spotify progressMs ───────────────────────────
  // Ketika Spotify pause/play dari luar, sinkronkan state lokal
  useEffect(() => {
    if (spotify.isConnected && !spotify.isPlaying && isPlaying) {
      setIsPlaying(false);
    }
  }, [spotify.isPlaying, spotify.isConnected, isPlaying]);


  // Ganti lagu — reset state + pause Spotify
  const goToSong = useCallback((idx: number) => {
    setIsPlaying(false);
    if (spotify.isConnected && spotify.isPlaying) spotify.pause();
    setSongIdx(idx);
    setLineIdx(-1);
    setShowHint(true);
    scrollOff.current = 0;
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  }, [spotify]);

  // Tap baris — loncat ke baris & mulai (cek premium jika Spotify terhubung)
  const tapLine = useCallback(async (idx: number) => {
    setShowHint(false);
    if (spotify.isConnected && !spotify.isPremium) {
      spotify.setError('⭐ Fitur ini butuh Spotify Premium.');
      return;
    }
    if (spotify.isConnected) {
      if (currentSong?.spotifyId) {
        const ok = await spotify.playTrack(currentSong.spotifyId);
        if (!ok) return;
      } else if (spotify.progressMs > 0) {
        const ok = await spotify.resume();
        if (!ok) return;
      }
    }
    setLineIdx(idx);
    setIsPlaying(true);
    scrollToLine(idx);
  }, [scrollToLine, spotify, currentSong]);

  // Toggle play/pause — with Spotify if connected
  const togglePlay = useCallback(async () => {
    setShowHint(false);
    if (!isPlaying) {
      // Guard premium — cek dulu sebelum apapun
      if (spotify.isConnected && !spotify.isPremium) {
        spotify.setError('⭐ Fitur ini butuh Spotify Premium.');
        return;
      }
      // START
      if (spotify.isConnected) {
        if (currentSong?.spotifyId) {
          const ok = await spotify.playTrack(currentSong.spotifyId);
          if (!ok) return;
        } else if (spotify.progressMs > 0) {
          const ok = await spotify.resume();
          if (!ok) return;
        }
        // Tidak ada spotifyId dan tidak ada progress → timer only, lanjut
      }
      if (lineIdx < 0) setLineIdx(0);
      setIsPlaying(true);
    } else {
      // PAUSE
      setIsPlaying(false);
      if (spotify.isConnected) await spotify.pause();
    }
  }, [isPlaying, lineIdx, spotify, currentSong]);

  const cycleSpeed = () => {
    setSpeed(s => SPEEDS[(SPEEDS.indexOf(s as any) + 1) % SPEEDS.length]);
  };

  const bg = isDark ? '#0f0a1a' : '#f8f5ff';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: bg }]} edges={['top', 'bottom']}>
      <StatusBar barStyle="light-content" backgroundColor="#0f0a1a" />

      {/* ── Header ── */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>🎤 Karaoke Mode</Text>
          <Text style={[styles.headerSub, { color: colors.textMuted }]} numberOfLines={1}>{concertArtist}</Text>
        </View>
        {/* Speed control */}
        {hasLyrics && (
          <TouchableOpacity onPress={cycleSpeed}
            style={[styles.speedBtn, { backgroundColor: colors.accent + '22', borderColor: colors.accent + '44' }]}>
            <Text style={[styles.speedText, { color: colors.accent }]}>{speed}</Text>
          </TouchableOpacity>
        )}
      </View>


      {/* ── Spotify Connect Banner ── */}
      {!spotify.isConnected ? (
        <TouchableOpacity
          style={[styles.spConnectBanner, { backgroundColor: '#1DB95418', borderColor: '#1DB95444' }]}
          onPress={spotify.connect}
          disabled={spotify.connecting}
        >
          {spotify.connecting ? (
            <ActivityIndicator size="small" color="#1DB954" />
          ) : (
            <Ionicons name="musical-notes" size={18} color="#1DB954" />
          )}
          <View style={{ flex: 1 }}>
            <Text style={[styles.spConnectTitle, { color: '#1DB954' }]}>
              {spotify.connecting ? 'Menghubungkan ke Spotify...' : '🎵 Hubungkan ke Spotify'}
            </Text>
            <Text style={[styles.spConnectSub, { color: '#1DB95499' }]}>
              {spotify.connecting ? 'Selesaikan login di browser' : 'Login sekali → audio otomatis main saat Play'}
            </Text>
          </View>
          {!spotify.connecting && <Ionicons name="chevron-forward" size={16} color="#1DB95488" />}
        </TouchableOpacity>
      ) : (
        <View style={[styles.spConnectedBar, { backgroundColor: '#1DB95412', borderColor: '#1DB95433' }]}>
          <View style={styles.spConnectedRow}>
            <Ionicons name="checkmark-circle" size={14} color="#1DB954" />
            <Text style={[styles.spConnectedText, { color: '#1DB954' }]}>Spotify terhubung</Text>
            <TouchableOpacity onPress={spotify.disconnect} style={styles.spDisconnect}>
              <Text style={{ color: '#1DB95488', fontSize: 11 }}>Putuskan</Text>
            </TouchableOpacity>
          </View>
          {spotify.error && (
            <Text style={[styles.spError, { color: '#ef4444' }]}>⚠ {spotify.error}</Text>
          )}
        </View>
      )}

      {/* ── Song tabs ── */}
      {hasLyrics && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.songTabs} style={{ flexGrow: 0 }}>
          {songs.map((s, i) => (
            <TouchableOpacity key={i}
              style={[styles.songTab, {
                backgroundColor: i === songIdx ? colors.accent : colors.surfaceElevated,
                borderColor: i === songIdx ? colors.accent : colors.border,
              }]}
              onPress={() => goToSong(i)}>
              <Text style={[styles.songTabText, { color: i === songIdx ? '#fff' : colors.textMuted }]} numberOfLines={1}>
                {i + 1}. {s.title}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* ── Instruksi (muncul saat belum mulai) ── */}
      {showHint && hasLyrics && (
        <View style={[styles.hintBox, { backgroundColor: colors.accent + '15', borderColor: colors.accent + '33' }]}>
          <Text style={[styles.hintTitle, { color: colors.accent }]}>Cara pakai Karaoke Mode</Text>
          <Text style={[styles.hintStep, { color: colors.textMuted }]}>
            1️⃣  Tekan ▶ Play — lirik menyala &amp; bergerak otomatis{'\n'}
            2️⃣  Ketuk baris mana saja untuk loncat ke sana{'\n'}
            3️⃣  Atur kecepatan dengan tombol <Text style={{ color: colors.accent, fontWeight: '700' }}>{speed}</Text> di kanan atas{'\n'}
            4️⃣  Punya Spotify Premium? Hubungkan di atas untuk audio
          </Text>
        </View>
      )}

      {/* ── Lyrics / Setlist ── */}
      <ScrollView ref={scrollRef} contentContainerStyle={styles.lyricsContainer}
        showsVerticalScrollIndicator={false}
        onScroll={e => { scrollOff.current = e.nativeEvent.contentOffset.y; }}
        scrollEventThrottle={100}>

        {hasLyrics && currentSong ? (
          <>
            {/* Judul lagu + Spotify button */}
            <Animated.View style={[styles.songTitleWrap, { transform: [{ scale: isPlaying ? pulseAnim : 1 }] }]}>
              <Text style={[styles.songTitle, { color: colors.accent }]}>{currentSong.title}</Text>
              <Text style={[styles.songArtist, { color: colors.textMuted }]}>{currentSong.artist}</Text>
              {isPlaying && (
                <View style={[styles.nowBadge, { backgroundColor: colors.accent + '22' }]}>
                  <Text style={{ color: colors.accent, fontSize: 11, fontWeight: '800', letterSpacing: 1 }}>
                    ♪ NOW PLAYING ♪
                  </Text>
                </View>
              )}
            </Animated.View>


            {/* Baris lirik — baris aktif menonjol, lainnya redup */}
            <View style={styles.lyricsBlock}>
              {lines.map((line, i) => {
                const isActive  = i === lineIdx;
                const isPast    = i < lineIdx;
                const isSection = line.text.startsWith('—') || line.text.startsWith('🎸') || line.text.startsWith('✨');
                const isEmpty   = line.text === '';

                if (isEmpty) return <View key={i} style={{ height: 16 }} />;

                return (
                  <TouchableOpacity key={i} onPress={() => tapLine(i)} activeOpacity={0.7}>
                    {isActive ? (
                      /* Baris aktif — highlight penuh */
                      <Animated.View style={[styles.activeLineWrap, { backgroundColor: colors.accent + '22', transform: [{ scale: pulseAnim }] }]}>
                        <Text style={[styles.activeLine, { color: isSection ? '#fff' : colors.accent }]}>
                          {line.text}
                        </Text>
                      </Animated.View>
                    ) : (
                      /* Baris lain — redup */
                      <Text style={[styles.lyricLine, {
                        color: isSection ? colors.accent : colors.text,
                        opacity: isPast ? 0.35 : (lineIdx < 0 ? 0.75 : 0.5),
                        fontSize: isSection ? 13 : 17,
                      }]}>
                        {line.text}
                      </Text>
                    )}
                  </TouchableOpacity>
                );
              })}
              {/* Padding akhir + pesan selesai */}
              {lineIdx >= lines.length - 1 && lineIdx >= 0 && (
                <Text style={[styles.endMsg, { color: colors.accent }]}>🎤 Selesai!</Text>
              )}
            </View>
          </>
        ) : (
          /* ── Setlist Mode (tanpa lirik) ── */
          <View style={styles.setlistMode}>
            <Text style={[styles.setlistModeTitle, { color: colors.text }]}>🎵 Setlist Mode</Text>
            <Text style={[styles.setlistModeSub, { color: colors.textMuted }]}>
              Lirik belum tersedia untuk artis ini.
            </Text>
            {hasSetlist ? allSetlist.map((s, i) => (
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
            )) : (
              <Text style={[styles.noData, { color: colors.textSubtle }]}>Setlist belum tersedia</Text>
            )}
          </View>
        )}
      </ScrollView>


      {/* ── Controls ── */}
      <View style={[styles.controls, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
        {/* Prev song */}
        {hasLyrics ? (
          <TouchableOpacity onPress={() => goToSong(Math.max(0, songIdx - 1))}
            disabled={songIdx === 0}
            style={[styles.controlBtn, { opacity: songIdx === 0 ? 0.3 : 1 }]}>
            <Ionicons name="play-skip-back" size={22} color={colors.text} />
          </TouchableOpacity>
        ) : <View style={styles.controlBtn} />}

        {/* Play / Pause */}
        <TouchableOpacity onPress={togglePlay}
          style={[styles.playBtn, { backgroundColor: isPlaying ? colors.accent : colors.accent + 'dd' }]}>
          <Ionicons name={isPlaying ? 'pause' : 'play'} size={28} color="#fff" />
        </TouchableOpacity>

        {/* Next song */}
        {hasLyrics ? (
          <TouchableOpacity onPress={() => goToSong(Math.min(songs.length - 1, songIdx + 1))}
            disabled={songIdx === songs.length - 1}
            style={[styles.controlBtn, { opacity: songIdx === songs.length - 1 ? 0.3 : 1 }]}>
            <Ionicons name="play-skip-forward" size={22} color={colors.text} />
          </TouchableOpacity>
        ) : <View style={styles.controlBtn} />}
      </View>

    </SafeAreaView>
  );
}


const styles = StyleSheet.create({
  container:       { flex: 1 },
  header:          { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1 },
  backBtn:         { padding: 4 },
  headerTitle:     { fontSize: 16, fontWeight: '800' },
  headerSub:       { fontSize: 12, marginTop: 1 },
  speedBtn:        { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, borderWidth: 1 },
  speedText:       { fontSize: 12, fontWeight: '800' },
  songTabs:        { paddingHorizontal: 16, paddingVertical: 10, gap: 8 },
  songTab:         { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, maxWidth: 160 },
  songTabText:     { fontSize: 12, fontWeight: '600' },
  hintBox:         { marginHorizontal: 16, marginTop: 8, marginBottom: 4, padding: 14, borderRadius: 14, borderWidth: 1 },
  hintTitle:       { fontSize: 13, fontWeight: '800', marginBottom: 6 },
  hintStep:        { fontSize: 12, lineHeight: 22 },
  lyricsContainer: { paddingHorizontal: 20, paddingBottom: 100, paddingTop: 16 },
  songTitleWrap:   { alignItems: 'center', marginBottom: 28, gap: 4 },
  songTitle:       { fontSize: 22, fontWeight: '800', textAlign: 'center' },
  songArtist:      { fontSize: 13 },
  nowBadge:        { marginTop: 6, paddingHorizontal: 14, paddingVertical: 4, borderRadius: 99 },
  lyricsBlock:     { gap: 4 },
  activeLineWrap:  { borderRadius: 12, paddingVertical: 10, paddingHorizontal: 16, marginVertical: 4 },
  activeLine:      { fontSize: 22, fontWeight: '800', textAlign: 'center', lineHeight: 32 },
  lyricLine:       { textAlign: 'center', lineHeight: 30, fontSize: 17, paddingVertical: 4 },
  endMsg:          { textAlign: 'center', fontSize: 20, fontWeight: '800', marginTop: 24, paddingBottom: 20 },
  setlistMode:     { alignItems: 'center', paddingTop: 16, gap: 12, width: '100%' },
  setlistModeTitle:{ fontSize: 20, fontWeight: '800' },
  setlistModeSub:  { fontSize: 14, textAlign: 'center', lineHeight: 22 },
  setlistItem:     { flexDirection: 'row', alignItems: 'center', gap: 12, width: '100%', padding: 14, borderRadius: 12, borderWidth: 1 },
  setlistNum:      { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  setlistNumText:  { fontSize: 14, fontWeight: '800' },
  setlistTitle:    { fontSize: 15, fontWeight: '600', marginBottom: 2 },
  setlistType:     { fontSize: 11 },
  noData:          { fontSize: 14, marginTop: 20 },
  controls:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 32, paddingVertical: 14, borderTopWidth: 1 },
  controlBtn:      { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  playBtn:         { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center', shadowColor: '#a855f7', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.5, shadowRadius: 12, elevation: 8 },
  // Spotify
  spConnectBanner: { flexDirection: 'row', alignItems: 'center', gap: 10, marginHorizontal: 16, marginTop: 8, marginBottom: 2, padding: 12, borderRadius: 14, borderWidth: 1 },
  spConnectTitle:  { fontSize: 13, fontWeight: '700' },
  spConnectSub:    { fontSize: 11, marginTop: 1 },
  spConnectedBar:  { marginHorizontal: 16, marginTop: 8, marginBottom: 2, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, borderWidth: 1 },
  spConnectedRow:  { flexDirection: 'row', alignItems: 'center', gap: 6 },
  spConnectedText: { fontSize: 12, fontWeight: '600', flex: 1, color: '#1DB954' },
  spError:         { fontSize: 12, fontWeight: '600', marginTop: 4 },
  spDisconnect:    { paddingHorizontal: 8, paddingVertical: 4 },
});
