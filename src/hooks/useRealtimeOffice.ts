import { useCallback, useEffect, useRef, useState } from 'react';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { isSupabaseConfigured, supabase } from '../lib/supabase';
import {
  characterState,
  type DroneSmashEvent,
  type PropKickEvent,
  realtimeEvents,
  remotePlayersMap,
} from '../state/inputState';
import { ROBOT_PALETTE } from '../components/3d/RobotModel';

export function useRealtimeOffice() {
  const [onlineCount, setOnlineCount] = useState(1);
  const [localColor, setLocalColor] = useState<string>(ROBOT_PALETTE[0].torso);
  const [remoteIds, setRemoteIds] = useState<string[]>([]);
  const [remoteColors, setRemoteColors] = useState<Record<string, string>>({});
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
  const myJoinedAtRef = useRef<number>(Date.now());
  const myColorRef = useRef<string>(ROBOT_PALETTE[0].torso);
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

      // Sort all connected users deterministically by join timestamp (then ID)
      // so Player #1 is always Robot #1 (Blue) on EVERY screen, Player #2 is Red, etc.
      const orderedEntries = keys
        .map((key) => {
          const meta =
            (state[key]?.[0] as
              | { name?: string; joinedAt?: number }
              | undefined) ?? {};
          return {
            id: key,
            name: meta.name ?? 'Visitante',
            joinedAt: typeof meta.joinedAt === 'number' ? meta.joinedAt : Number.MAX_SAFE_INTEGER,
          };
        })
        .sort((a, b) => a.joinedAt - b.joinedAt || a.id.localeCompare(b.id));

      const nextRemoteColors: Record<string, string> = {};

      orderedEntries.forEach((entry, index) => {
        const assignedColor =
          ROBOT_PALETTE[index % ROBOT_PALETTE.length].torso;

        if (entry.id === myId) {
          if (myColorRef.current !== assignedColor) {
            myColorRef.current = assignedColor;
            setLocalColor(assignedColor);
          }
          return;
        }

        nextRemoteColors[entry.id] = assignedColor;
        const existing = remotePlayersMap.get(entry.id);
        if (existing) {
          existing.color = assignedColor;
          existing.name = entry.name;
        } else {
          remotePlayersMap.set(entry.id, {
            id: entry.id,
            name: entry.name,
            color: assignedColor,
            x: 0,
            y: 0,
            z: -5.4,
            rotY: 0,
          });
        }
      });

      // Remove disconnected players
      for (const existingId of Array.from(remotePlayersMap.keys())) {
        if (!keys.includes(existingId)) {
          remotePlayersMap.delete(existingId);
        }
      }

      setRemoteColors(nextRemoteColors);
      setRemoteIds(Array.from(remotePlayersMap.keys()));
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
        } else {
          remotePlayersMap.set(pid, {
            id: pid,
            name: String(payload.name ?? 'Visitante'),
            color: String(payload.color ?? '#ef4444'),
            x: 0,
            y: 0,
            z: -5.4,
            rotY: 0,
            emote: emoji,
            emoteUntil: Date.now() + 2600,
          });
          setRemoteIds(Array.from(remotePlayersMap.keys()));
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
      .on('broadcast', { event: 'drone_smash' }, ({ payload }) => {
        if (!payload || payload.sender === myId) return;
        realtimeEvents.pendingDroneSmash = {
          x: Number(payload.x ?? 0),
          y: Number(payload.y ?? 2.85),
          z: Number(payload.z ?? 0),
          vx: Number(payload.vx ?? 0),
          vz: Number(payload.vz ?? 0),
        };
      })
      .on('broadcast', { event: 'rack_smash' }, ({ payload }) => {
        if (!payload || payload.sender === myId) return;
        realtimeEvents.pendingRackSmash = Number(payload.vx ?? 0);
      })
      .on('broadcast', { event: 'prop_kick' }, ({ payload }) => {
        if (!payload || payload.sender === myId) return;
        realtimeEvents.pendingPropKicks.push({
          idx: Number(payload.idx),
          x: Number(payload.x),
          y: Number(payload.y),
          z: Number(payload.z),
          vx: Number(payload.vx),
          vy: Number(payload.vy),
          vz: Number(payload.vz),
          avx: Number(payload.avx ?? 0),
          avy: Number(payload.avy ?? 0),
          avz: Number(payload.avz ?? 0),
        });
      })
      .on('broadcast', { event: 'world_reset' }, ({ payload }) => {
        if (!payload || payload.sender === myId) return;
        realtimeEvents.onRemoteReset?.();
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            name: myNameRef.current,
            joinedAt: myJoinedAtRef.current,
          });
        }
      });

    // Expose low-latency world-event broadcasters for PatrolDrone, PhysicsProps & Reset
    realtimeEvents.sendDroneSmash = (ev: DroneSmashEvent) => {
      channel.send({
        type: 'broadcast',
        event: 'drone_smash',
        payload: { sender: myId, ...ev },
      });
    };
    realtimeEvents.sendRackSmash = (vx: number) => {
      channel.send({
        type: 'broadcast',
        event: 'rack_smash',
        payload: { sender: myId, vx },
      });
    };
    realtimeEvents.sendPropKick = (ev: PropKickEvent) => {
      channel.send({
        type: 'broadcast',
        event: 'prop_kick',
        payload: { sender: myId, ...ev },
      });
    };
    realtimeEvents.sendWorldReset = () => {
      channel.send({
        type: 'broadcast',
        event: 'world_reset',
        payload: { sender: myId },
      });
    };

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
    }, 120);

    return () => {
      window.clearInterval(intervalId);
      realtimeEvents.sendDroneSmash = null;
      realtimeEvents.sendRackSmash = null;
      realtimeEvents.sendPropKick = null;
      realtimeEvents.sendWorldReset = null;
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
        color: myColorRef.current,
        emoji,
      },
    });
  }, []);

  return {
    onlineCount,
    localColor,
    remoteIds,
    remoteColors,
    localEmote,
    remoteEmotes,
    sendEmote,
    isRealtimeLive: isSupabaseConfigured,
  };
}
