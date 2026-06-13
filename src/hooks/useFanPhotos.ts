import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_KEY = 'cid_fan_photos';

export interface FanPhoto {
  uid: string;
  uri: string;
  caption: string;
  author: string;
  date: string;
}

export function useFanPhotos(concertId: string) {
  const key = `${BASE_KEY}_${concertId}`;
  const [photos, setPhotos] = useState<FanPhoto[]>([]);

  useEffect(() => {
    AsyncStorage.getItem(key).then(v => {
      if (v) { try { setPhotos(JSON.parse(v)); } catch {} }
    });
  }, [concertId]);

  const addPhoto = useCallback(async (uri: string, caption: string, author: string) => {
    const item: FanPhoto = {
      uid: Date.now().toString(),
      uri,
      caption: caption.trim().slice(0, 100),
      author: (author.trim() || 'Anonymous').slice(0, 30),
      date: new Date().toISOString(),
    };
    const next = [item, ...photos].slice(0, 30);
    setPhotos(next);
    await AsyncStorage.setItem(key, JSON.stringify(next));
    return true;
  }, [photos, key]);

  return { photos, addPhoto };
}
