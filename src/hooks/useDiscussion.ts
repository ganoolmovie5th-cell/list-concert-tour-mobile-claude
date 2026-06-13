import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Comment } from '../types';

const BASE_KEY = 'cid_discussions';

export function useDiscussion(concertId: string) {
  const key = `${BASE_KEY}_${concertId}`;
  const [comments, setComments] = useState<Comment[]>([]);

  useEffect(() => {
    AsyncStorage.getItem(key).then(v => {
      if (v) { try { setComments(JSON.parse(v)); } catch {} }
    });
  }, [concertId]);

  const save = async (list: Comment[]) => {
    setComments(list);
    await AsyncStorage.setItem(key, JSON.stringify(list));
  };

  const addComment = useCallback(async (
    author: string,
    text: string,
    replyTo: { author: string; text: string } | null = null
  ) => {
    const comment: Comment = {
      uid: Date.now().toString(),
      author: author || 'Penonton',
      text,
      date: new Date().toISOString(),
      likes: 0,
      replyTo,
    };
    await save([comment, ...comments]);
  }, [comments]);

  const likeComment = useCallback(async (idx: number) => {
    const list = [...comments];
    list[idx] = { ...list[idx], likes: list[idx].likes + 1 };
    await save(list);
  }, [comments]);

  return { comments, addComment, likeComment };
}
