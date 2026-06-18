/**
 * useInAppChat — Real-time Chat per Group Buying Post
 * Polling setiap 10 detik (Supabase REST, no WebSocket needed)
 * Table: gb_chat (post_uid, sender_uid, message, created_at)
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DB, getDeviceUID } from '../lib/supabase';

export interface ChatMessage {
  uid: string;
  postUid: string;
  senderUid: string;
  senderName: string;
  message: string;
  createdAt: string;
  isOwn: boolean;
}

const LS_PREFIX = 'cid_gb_chat_';

function lsKey(postUid: string) { return `${LS_PREFIX}${postUid}`; }
function genUID() { return 'cm_' + Math.random().toString(36).slice(2) + Date.now().toString(36); }

function mapRow(r: any, myUid: string): ChatMessage {
  return {
    uid:        r.msg_uid   || r.uid || genUID(),
    postUid:    r.post_uid,
    senderUid:  r.sender_uid,
    senderName: r.sender_name || 'Anonim',
    message:    r.message,
    createdAt:  r.created_at,
    isOwn:      r.sender_uid === myUid,
  };
}

export function useInAppChat(postUid: string | null) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [myUid, setMyUid]       = useState('');
  const pollerRef               = useRef<ReturnType<typeof setInterval> | null>(null);
  const enabled                 = !!postUid;

  const fetchMessages = useCallback(async () => {
    if (!postUid) return;
    const uid = myUid || await getDeviceUID();
    try {
      const rows = await DB.select('gb_chat',
        `post_uid=eq.${encodeURIComponent(postUid)}&order=created_at.asc&limit=100`);
      const msgs = rows.map((r: any) => mapRow(r, uid));
      setMessages(msgs);
      await AsyncStorage.setItem(lsKey(postUid), JSON.stringify(msgs));
    } catch {
      // fallback local
      try {
        const v = await AsyncStorage.getItem(lsKey(postUid));
        if (v) setMessages(JSON.parse(v));
      } catch {}
    }
  }, [postUid, myUid]);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    (async () => {
      const uid = await getDeviceUID();
      if (!cancelled) setMyUid(uid);

      // Load from cache first
      try {
        const v = await AsyncStorage.getItem(lsKey(postUid!));
        if (v && !cancelled) setMessages(JSON.parse(v));
      } catch {}

      await fetchMessages();

      // Start polling
      pollerRef.current = setInterval(fetchMessages, 10_000);
    })();
    return () => {
      cancelled = true;
      if (pollerRef.current) clearInterval(pollerRef.current);
    };
  }, [postUid, enabled, fetchMessages]);

  const sendMessage = useCallback(async (
    text: string, senderName: string,
  ): Promise<boolean> => {
    if (!postUid || !text.trim()) return false;
    const uid    = await getDeviceUID();
    const msgUid = genUID();
    const msg: ChatMessage = {
      uid:        msgUid,
      postUid,
      senderUid:  uid,
      senderName: senderName.trim().slice(0, 20) || 'Anonim',
      message:    text.trim().slice(0, 300),
      createdAt:  new Date().toISOString(),
      isOwn:      true,
    };

    // Optimistic update
    setMessages(prev => [...prev, msg]);

    try {
      await DB.insert('gb_chat', {
        msg_uid:     msgUid,
        post_uid:    postUid,
        sender_uid:  uid,
        sender_name: msg.senderName,
        message:     msg.message,
      });
      return true;
    } catch {
      // Keep optimistic even if DB fails
      return true;
    }
  }, [postUid]);

  const clearChat = useCallback(() => {
    if (!postUid) return;
    setMessages([]);
    AsyncStorage.removeItem(lsKey(postUid));
    if (pollerRef.current) clearInterval(pollerRef.current);
  }, [postUid]);

  return { messages, myUid, sendMessage, clearChat, fetchMessages };
}
