import React from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp } from '../context/AppContext';
import { ConcertCard } from '../components/ConcertCard';
import { Toast } from '../components/Toast';
import { CONCERTS } from '../data/concerts';
import { useState } from 'react';

export function WishlistScreen({ navigation }: any) {
  const { colors, t, wishlist, toggleWishlist, isWishlisted } = useApp();
  const [toast, setToast] = useState({ message: '', visible: false, type: 'info' as 'success' | 'error' | 'info' });

  const wishlisted = CONCERTS.filter(c => wishlist.has(c.id));

  const showToast = (msg: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ message: msg, visible: true, type });
    setTimeout(() => setToast(p => ({ ...p, visible: false })), 2800);
  };

  const handleWishlist = async (id: string) => {
    const added = await toggleWishlist(id);
    showToast(added ? t('addedToWishlist') : t('removedFromWishlist'), added ? 'success' : 'info');
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.text }]}>❤️ {t('wishlist')}</Text>
        <Text style={[styles.count, { color: colors.textMuted }]}>{wishlisted.length} konser</Text>
      </View>

      {wishlisted.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyEmoji}>💔</Text>
          <Text style={[styles.emptyText, { color: colors.textMuted }]}>{t('emptyWishlist')}</Text>
          <Text style={[styles.emptySub, { color: colors.textSubtle }]}>{t('emptyWishlistSub')}</Text>
          <TouchableOpacity
            style={[styles.exploreBtn, { backgroundColor: colors.accent }]}
            onPress={() => navigation.getParent()?.navigate('HomeTab')}
          >
            <Text style={styles.exploreBtnText}>{t('exploreConcer')}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={wishlisted}
          keyExtractor={c => c.id}
          renderItem={({ item }) => (
            <ConcertCard
              concert={item}
              isWishlisted={isWishlisted(item.id)}
              onPress={() => navigation.navigate('Detail', { concertId: item.id })}
              onWishlist={() => handleWishlist(item.id)}
            />
          )}
          contentContainerStyle={{ paddingBottom: 100 }}
        />
      )}

      <Toast message={toast.message} visible={toast.visible} type={toast.type} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 16, borderBottomWidth: 1 },
  title: { fontSize: 20, fontWeight: '800' },
  count: { fontSize: 13 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 },
  emptyEmoji: { fontSize: 56, marginBottom: 16 },
  emptyText: { fontSize: 18, fontWeight: '700', marginBottom: 8, textAlign: 'center' },
  emptySub: { fontSize: 13, textAlign: 'center', marginBottom: 24 },
  exploreBtn: { borderRadius: 12, paddingHorizontal: 24, paddingVertical: 12 },
  exploreBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
