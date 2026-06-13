import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Review } from '../types';

const BASE_KEY = 'cid_reviews';

export function useReviews(concertId: string) {
  const key = `${BASE_KEY}_${concertId}`;
  const [reviews, setReviews] = useState<Review[]>([]);
  const [hasReviewed, setHasReviewed] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(key).then(v => {
      if (v) { try { setReviews(JSON.parse(v)); } catch {} }
    });
    AsyncStorage.getItem(`${key}_reviewed`).then(v => {
      if (v === '1') setHasReviewed(true);
    });
  }, [concertId]);

  const avgRating = reviews.length > 0
    ? Math.round((reviews.reduce((s, r) => s + r.rating, 0) / reviews.length) * 10) / 10
    : 0;

  const save = async (list: Review[]) => {
    setReviews(list);
    await AsyncStorage.setItem(key, JSON.stringify(list));
  };

  const addReview = useCallback(async (author: string, rating: number, comment: string) => {
    if (hasReviewed) return;
    const review: Review = {
      uid: Date.now().toString(),
      author: author || 'Penonton',
      rating,
      comment,
      date: new Date().toISOString(),
      likes: 0,
    };
    await save([review, ...reviews]);
    setHasReviewed(true);
    await AsyncStorage.setItem(`${key}_reviewed`, '1');
  }, [reviews, hasReviewed]);

  const likeReview = useCallback(async (idx: number) => {
    const list = [...reviews];
    list[idx] = { ...list[idx], likes: list[idx].likes + 1 };
    await save(list);
  }, [reviews]);

  return { reviews, hasReviewed, avgRating, addReview, likeReview };
}
