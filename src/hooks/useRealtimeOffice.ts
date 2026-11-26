import { useCallback, useEffect, useRef, useState } from 'react';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { isSupabaseConfigured, supabase } from '../lib/supabase';
import { characterState, remotePlayersMap } from '../state/inputState';

const VISITOR_COLORS = [
  '#ef4444',
  '#10b981',
  '#f59e0b',
  '#a855f7',
  '#ec4899',
  '#06b6d4',
];

export function useRealtimeOffice() {
  const [onlineCount, setOnlineCount] = useState(1);
  const [remoteIds, setRemoteIds] = useState<string[]>([]);
  const [localEmote, setLocalEmote] = useState<{ emoji: string; key: number } | null>(null);
  const [remoteEmotes, setRemoteEmotes] = useState<Record<string, { emoji: string; key: number }>>({});

  const channelRef = useRef<RealtimeChannel | null>(null);
  const localEmoteTimerRef = useRef<number | null>(null);
  const remoteEmoteTimersRef = useRef<Record<string, number>>({});
  const myIdRef = useRef<string>(
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `v-${Math.random().toString(36).slice(2, 9)}`
  );
  const myColorRef = useRef<string>(
    VISITOR_COLORS[Math.floor(Math.random() * VISITOR_COLORS.length)]
  );
  const myNameRef = useRef<string>(
    `Visitante #${Math.floor(10 + Math.random() * 89)}`
  );

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return;

    const myId = myIdRef.current;
    const channel = supabase.channel('office-3d-room', {
      config: {
        presence: { key: myId },
        broadcast: { self: false },
      },
    });
    channelRef.current = channel;

    const syncPresenceList = () => {
      const state = channel.presenceState();
      const keys = Object.keys(state);
      setOnlineCount(Math.max(1, keys.length));

      // Remove disconnected players
      let changed = false;
      for (const existingId of Array.from(remotePlayersMap.keys())) {
        if (!keys.includes(existingId)) {
          remotePlayersMap.delete(existingId);
          changed = true;
        }
      }

      // Ensure new players appear immediately at spawn
      for (const key of keys) {
        if (key === myId) continue;
        if (!remotePlayersMap.has(key)) {
          const meta = (state[key]?.[0] as { name?: string; color?: string } | undefined) ?? {};
          remotePlayersMap.set(key, {
            id: key,
            name: meta.name ?? 'Visitante',
            color: meta.color ?? '#10b981',
            x: 0,
            y: 0,
            z: 2.2,
            rotY: 0,
          });
          changed = true;
        }
      }

      if (changed) {
        setRemoteIds(Array.from(remotePlayersMap.keys()));
      }
    };

    channel
      .on('presence', { event: 'sync' }, syncPresenceList)
      .on('broadcast', { event: 'move' }, ({ payload }) => {
        if (!payload || payload.id === myId) return;
        const existing = remotePlayersMap.get(payload.id);
        if (existing) {
          existing.x = payload.x;
          existing.y = payload.y;
          existing.z = payload.z;
          existing.rotY = payload.rotY;
        } else {
          remotePlayersMap.set(payload.id, {
            id: payload.id,
            name: payload.name ?? 'Visitante',
            color: payload.color ?? '#10b981',
            x: payload.x,
            y: payload.y,
            z: payload.z,
            rotY: payload.rotY,
          });
          setRemoteIds(Array.from(remotePlayersMap.keys()));
        }
      })
      .on('broadcast', { event: 'emote' }, ({ payload }) => {
        if (!payload || payload.id === myId) return;
        const pid = String(payload.id);
        const emoji = String(payload.emoji ?? '👋');
        const existing = remotePlayersMap.get(pid);
        if (existing) {
          existing.emote = emoji;
          existing.emoteUntil = Date.now() + 2600;
        }
        setRemoteEmotes((prev) => ({
          ...prev,
          [pid]: { emoji, key: Date.now() },
        }));
        if (remoteEmoteTimersRef.current[pid]) {
          window.clearTimeout(remoteEmoteTimersRef.current[pid]);
        }
        remoteEmoteTimersRef.current[pid] = window.setTimeout(() => {
          setRemoteEmotes((prev) => {
            const next = { ...prev };
            delete next[pid];
            return next;
          });
        }, 2600);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            name: myNameRef.current,
            color: myColorRef.current,
          });
        }
      });

    // Broadcast local character position ~10 times/sec when moving
    let lastSentX = characterState.x;
    let lastSentY = characterState.y;
    let lastSentZ = characterState.z;
    const intervalId = window.setInterval(() => {
      const moved =
        Math.abs(characterState.x - lastSentX) > 0.03 ||
        Math.abs(characterState.y - lastSentY) > 0.03 ||
        Math.abs(characterState.z - lastSentZ) > 0.03;

      if (!moved) return;
      lastSentX = characterState.x;
      lastSentY = characterState.y;
      lastSentZ = characterState.z;

      channel.send({
        type: 'broadcast',
        event: 'move',
        payload: {
          id: myId,
          name: myNameRef.current,
          color: myColorRef.current,
          x: characterState.x,
          y: characterState.y,
          z: characterState.z,
          rotY: characterState.rotY,
        },
      });
    }, 95);

    return () => {
      window.clearInterval(intervalId);
      remotePlayersMap.clear();
      setRemoteIds([]);
      supabase?.removeChannel(channel);
      channelRef.current = null;
    };
  }, []);

  const sendEmote = useCallback((emoji: string) => {
    setLocalEmote({ emoji, key: Date.now() });
    if (localEmoteTimerRef.current) {
      window.clearTimeout(localEmoteTimerRef.current);
    }
    localEmoteTimerRef.current = window.setTimeout(() => {
      setLocalEmote(null);
    }, 2600);

    if (!channelRef.current) return;
    channelRef.current.send({
      type: 'broadcast',
      event: 'emote',
      payload: {
        id: myIdRef.current,
        name: myNameRef.current,
        emoji,
      },
    });
  }, []);

  return {
    onlineCount,
    remoteIds,
    localEmote,
    remoteEmotes,
    sendEmote,
    isRealtimeLive: isSupabaseConfigured,
  };
}
