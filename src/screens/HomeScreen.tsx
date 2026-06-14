import React, { useState, useCallback, useMemo, useRef } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, ScrollView, Image,
  StyleSheet, StatusBar, RefreshControl, TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { useWishlist } from '../context/WishlistContext';
import { FilterBar } from '../components/FilterBar';
import { SortPicker } from '../components/SortPicker';
import { ConcertCard } from '../components/ConcertCard';
import { ShareSheet } from '../components/ShareSheet';
import { Toast } from '../components/Toast';
import { CONCERTS } from '../data/concerts';
import { filterConcerts, sortConcerts, isUpcoming } from '../utils/helpers';
import { FilterType, SortOption, Concert } from '../types';

export function HomeScreen({ navigation }: any) {
  const { colors, isDark, toggle } = useTheme();
  const { lang, toggleLang, t } = useLanguage();
  const { wishlist, toggle: toggleWishlist, isWishlisted } = useWishlist();

  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterType>('all');
  const [sort, setSort] = useState<SortOption>('date-asc');
  const [refreshing, setRefreshing] = useState(false);
  const [shareTarget, setShareTarget] = useState<Concert | null>(null);
  const [toast, setToast] = useState({ message: '', visible: false, type: 'success' as 'success' | 'error' | 'info' });

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, visible: true, type });
    setTimeout(() => setToast(p => ({ ...p, visible: false })), 2800);
  }, []);

  const filtered = useMemo(
    () => sortConcerts(filterConcerts(CONCERTS, filter, search, wishlist), sort),
    [filter, search, wishlist, sort],
  );
  const hotConcerts = useMemo(() => CONCERTS.filter(c => c.hot && isUpcoming(c)).slice(0, 5), []);
  const confirmedCount = useMemo(() => CONCERTS.filter(c => c.confirmStatus === 'confirmed').length, []);
  const rumorCount = useMemo(() => CONCERTS.filter(c => c.confirmStatus === 'rumor').length, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 800);
  }, []);

  const handleWishlist = useCallback(async (concert: Concert) => {
    const added = await toggleWishlist(concert.id);
    showToast(added ? t('addedToWishlist') : t('removedFromWishlist'), added ? 'success' : 'info');
  }, [toggleWishlist, showToast, t]);

  // ─── Search inline tanpa SearchBar component ─────────────────────────────
  // Pakai TextInput langsung di sini agar tidak ada remount issue
  const searchDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [searchLocal, setSearchLocal] = useState('');

  const handleSearchChange = useCallback((text: string) => {
    setSearchLocal(text);
    if (searchDebounce.current) clearTimeout(searchDebounce.current);
    searchDebounce.current = setTimeout(() => setSearch(text), 200);
  }, []);

  const handleSearchClear = useCallback(() => {
    setSearchLocal('');
    setSearch('');
  }, []);
  // ─────────────────────────────────────────────────────────────────────────

  // ListHeader sebagai komponen stabil di luar render tree FlatList
  // Menggunakan renderListHeader callback agar tidak di-remount setiap render
  const renderListHeader = useCallback(() => (
    <View>
      {/* Hero Stats */}
      <View style={[styles.statsRow, { backgroundColor: colors.surface }]}>
        {[
          { label: t('totalConcerts'), value: CONCERTS.length, color: colors.accent },
          { label: t('confirmed'), value: confirmedCount, color: colors.confirmed },
          { label: t('rumor'), value: rumorCount, color: colors.rumor },
        ].map(s => (
          <View key={s.label} style={styles.statItem}>
            <Text style={[styles.statValue, { color: s.color }]}>{s.value}</Text>
            <Text style={[styles.statLabel, { color: colors.textMuted }]}>{s.label}</Text>
          </View>
        ))}
      </View>

      {/* Hot Carousel */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('hotSection')}</Text>
        <Text style={[styles.sectionSub, { color: colors.textMuted }]}>{t('hotSubtitle')}</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hotScroll}>
          {hotConcerts.map(c => (
            <TouchableOpacity
              key={c.id}
              style={[styles.hotCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
              onPress={() => navigation.navigate('Detail', { concertId: c.id })}
              activeOpacity={0.85}
            >
              <Image
                source={{ uri: `https://www.list-concert-tour.web.id/images/${c.id}.jpeg` }}
                style={styles.hotImage}
                resizeMode="cover"
              />
              <View style={styles.hotInfo}>
                <Text style={[styles.hotArtist, { color: colors.text }]} numberOfLines={1}>{c.emoji} {c.artist}</Text>
                <Text style={[styles.hotDate, { color: colors.textMuted }]} numberOfLines={1}>{c.dates[0]}</Text>
                <Text style={[styles.hotPrice, { color: colors.accent }]} numberOfLines={1}>{c.priceRange}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Search — TextInput langsung, bukan komponen terpisah */}
      <View style={[styles.searchContainer, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder }]}>
        <Ionicons name="search" size={18} color={colors.textMuted} style={{ marginRight: 8 }} />
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          placeholder={t('searchPlaceholder')}
          placeholderTextColor={colors.textSubtle}
          value={searchLocal}
          onChangeText={handleSearchChange}
          returnKeyType="search"
          autoCorrect={false}
          autoCapitalize="none"
        />
        {searchLocal.length > 0 && (
          <TouchableOpacity onPress={handleSearchClear} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="close-circle" size={18} color={colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {/* Filter + Sort */}
      <View style={styles.filterRow}>
        <FilterBar active={filter} onSelect={setFilter} wishlistCount={wishlist.size} />
      </View>
      <View style={styles.sortRow}>
        <Text style={[styles.resultCount, { color: colors.textMuted }]}>{filtered.length} konser</Text>
        <SortPicker value={sort} onChange={setSort} />
      </View>

      <Text style={[styles.sectionTitle, { color: colors.text, paddingHorizontal: 16, marginBottom: 4 }]}>
        {t('concertsSection')}
      </Text>
    </View>
  ), [
    colors, t, confirmedCount, rumorCount, hotConcerts, navigation,
    searchLocal, handleSearchChange, handleSearchClear,
    filter, setFilter, wishlist.size, sort, setSort, filtered.length,
  ]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.background} />

      {/* TopBar */}
      <View style={[styles.topBar, { borderBottomColor: colors.border }]}>
        <Text style={[styles.logo, { color: colors.text }]}>🎵 <Text style={{ color: colors.accent }}>Concert</Text>ID</Text>
        <View style={styles.topActions}>
          <TouchableOpacity onPress={toggleLang} style={[styles.iconBtn, { backgroundColor: colors.surfaceElevated }]}>
            <Text style={[styles.langText, { color: colors.text }]}>{lang.toUpperCase()}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={toggle} style={[styles.iconBtn, { backgroundColor: colors.surfaceElevated }]}>
            <Ionicons name={isDark ? 'sunny-outline' : 'moon-outline'} size={18} color={colors.text} />
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={c => c.id}
        renderItem={({ item }) => (
          <ConcertCard
            concert={item}
            isWishlisted={isWishlisted(item.id)}
            onPress={() => navigation.navigate('Detail', { concertId: item.id })}
            onWishlist={() => handleWishlist(item)}
          />
        )}
        ListHeaderComponent={renderListHeader}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>🔍</Text>
            <Text style={[styles.emptyText, { color: colors.textMuted }]}>{t('noResult')}</Text>
            <Text style={[styles.emptySub, { color: colors.textSubtle }]}>{t('noResultSub')}</Text>
          </View>
        }
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />}
        contentContainerStyle={{ paddingBottom: 100 }}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="none"
      />

      {shareTarget && (
        <ShareSheet
          visible={!!shareTarget}
          concert={shareTarget}
          onClose={() => setShareTarget(null)}
          onCopied={() => showToast(t('linkCopied'))}
        />
      )}

      <Toast message={toast.message} visible={toast.visible} type={toast.type} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1 },
  logo: { fontSize: 20, fontWeight: '800' },
  topActions: { flexDirection: 'row', gap: 8 },
  iconBtn: { borderRadius: 10, padding: 8, alignItems: 'center', justifyContent: 'center' },
  langText: { fontSize: 12, fontWeight: '700' },
  statsRow: { flexDirection: 'row', marginHorizontal: 16, marginTop: 16, marginBottom: 8, borderRadius: 14, padding: 16 },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 22, fontWeight: '800' },
  statLabel: { fontSize: 11, marginTop: 2 },
  section: { marginTop: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '700', paddingHorizontal: 16, marginBottom: 4 },
  sectionSub: { fontSize: 12, paddingHorizontal: 16, marginBottom: 10 },
  hotScroll: { paddingHorizontal: 16, gap: 12 },
  hotCard: { width: 160, borderRadius: 12, borderWidth: 1, overflow: 'hidden' },
  hotImage: { width: '100%', height: 100, backgroundColor: '#1a1025' },
  hotInfo: { padding: 10 },
  hotArtist: { fontSize: 13, fontWeight: '700', marginBottom: 3 },
  hotDate: { fontSize: 11, marginBottom: 3 },
  hotPrice: { fontSize: 11, fontWeight: '600' },
  searchContainer: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 12, borderWidth: 1,
    paddingHorizontal: 12, paddingVertical: 10,
    marginHorizontal: 16, marginVertical: 8,
  },
  searchInput: { flex: 1, fontSize: 15, padding: 0 },
  filterRow: {},
  sortRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, marginBottom: 8 },
  resultCount: { fontSize: 12 },
  empty: { alignItems: 'center', paddingTop: 60, paddingHorizontal: 40 },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 16, fontWeight: '600', marginBottom: 6, textAlign: 'center' },
  emptySub: { fontSize: 13, textAlign: 'center' },
});
