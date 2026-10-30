import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, ScrollView } from 'react-native';
import { DB } from '../lib/supabase';

interface Props {
  concertId: string;
  concertName: string;
}

interface SummaryData {
  reviewCount: number;
  avgRating: number;
  photoCount: number;
  goingCount: number;
  topReviews: { text: string; rating: number; author: string }[];
  setlist: string[];
}

export function PostConcertSummary({ concertId, concertName }: Props) {
  const [data, setData] = useState<SummaryData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSummary();
  }, [concertId]);

  async function loadSummary() {
    try {
      const cid = encodeURIComponent(concertId);

      // Fetch reviews (3 terbaru)
      const reviews = await DB.select('reviews',
        `concert_id=eq.${cid}&select=text,rating,author&order=created_at.desc&limit=3`);

      // Fetch photo count
      const photos = await DB.select('fan_photos', `concert_id=eq.${cid}&select=id`);

      // Fetch going count
      const votes = await DB.select('concert_votes',
        `concert_id=eq.${cid}&type=eq.going&select=type`);

      // Fetch setlist
      const setlistData = await DB.select('live_setlist',
        `concert_id=eq.${cid}&select=song_name,song_number&order=song_number.asc&limit=10`);

      const revs = reviews || [];
      const avgRating = revs.length > 0
        ? revs.reduce((sum: number, r: any) => sum + (r.rating || 0), 0) / revs.length
        : 0;

      setData({
        reviewCount: revs.length,
        avgRating,
        photoCount: (photos || []).length,
        goingCount: (votes || []).length,
        topReviews: revs.map((r: any) => ({ text: r.text || '', rating: r.rating || 0, author: r.author || 'Anonim' })),
        setlist: (setlistData || []).map((s: any) => s.song_name),
      });
    } catch {
      // ponytail: non-critical, show empty state
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loading}>Memuat ringkasan...</Text>
      </View>
    );
  }

  if (!data) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>📋 Ringkasan Konser</Text>

      {/* Stats row */}
      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Text style={styles.statNum}>{data.goingCount}</Text>
          <Text style={styles.statLabel}>Hadir</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statNum}>{data.avgRating > 0 ? data.avgRating.toFixed(1) : '-'}</Text>
          <Text style={styles.statLabel}>Rating</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statNum}>{data.photoCount}</Text>
          <Text style={styles.statLabel}>Foto</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statNum}>{data.reviewCount}</Text>
          <Text style={styles.statLabel}>Review</Text>
        </View>
      </View>

      {/* Setlist */}
      {data.setlist.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🎵 Setlist</Text>
          {data.setlist.map((song, i) => (
            <Text key={i} style={styles.setlistItem}>
              {i + 1}. {song}
            </Text>
          ))}
        </View>
      )}

      {/* Top reviews */}
      {data.topReviews.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>⭐ Review Terbaru</Text>
          {data.topReviews.map((r, i) => (
            <View key={i} style={styles.reviewCard}>
              <Text style={styles.reviewRating}>{'⭐'.repeat(Math.round(r.rating))}</Text>
              <Text style={styles.reviewText} numberOfLines={2}>{r.text}</Text>
              <Text style={styles.reviewAuthor}>— {r.author}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginTop: 16, padding: 16, backgroundColor: '#1e293b', borderRadius: 16 },
  loading: { color: '#94a3b8', textAlign: 'center', fontSize: 13 },
  title: { fontSize: 18, fontWeight: '800', color: '#fff', marginBottom: 12 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  statBox: { alignItems: 'center', flex: 1 },
  statNum: { fontSize: 20, fontWeight: '800', color: '#a855f7' },
  statLabel: { fontSize: 11, color: '#94a3b8', marginTop: 2 },
  section: { marginTop: 12 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#fff', marginBottom: 8 },
  setlistItem: { color: '#cbd5e1', fontSize: 13, marginBottom: 3 },
  reviewCard: { backgroundColor: '#334155', borderRadius: 10, padding: 10, marginBottom: 8 },
  reviewRating: { fontSize: 12, marginBottom: 3 },
  reviewText: { color: '#e2e8f0', fontSize: 13 },
  reviewAuthor: { color: '#64748b', fontSize: 11, marginTop: 4 },
});
