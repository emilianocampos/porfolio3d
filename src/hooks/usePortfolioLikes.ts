import { useCallback, useEffect, useState } from 'react';
import { isSupabaseConfigured, supabase } from '../lib/supabase';

const LOCAL_LIKED_KEY = 'portfolio_3d_has_liked_v1';
const LOCAL_COUNT_KEY = 'portfolio_3d_likes_fallback_v1';

function readLocalLiked(): boolean {
  try {
    return window.localStorage.getItem(LOCAL_LIKED_KEY) === '1';
  } catch {
    return false;
  }
}

function readLocalCount(): number {
  try {
    const raw = window.localStorage.getItem(LOCAL_COUNT_KEY);
    const parsed = raw ? Number.parseInt(raw, 10) : 0;
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
  } catch {
    return 0;
  }
}

export function usePortfolioLikes() {
  const [likesCount, setLikesCount] = useState<number>(() => readLocalCount());
  const [hasLiked, setHasLiked] = useState<boolean>(() => readLocalLiked());
  const [liking, setLiking] = useState(false);

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return;

    let cancelled = false;

    const loadLikes = async () => {
      const { data, error } = await supabase!
        .from('site_stats')
        .select('likes')
        .eq('id', 'portfolio')
        .maybeSingle();

      if (!cancelled && !error && data && typeof data.likes === 'number') {
        setLikesCount(data.likes);
        try {
          window.localStorage.setItem(LOCAL_COUNT_KEY, String(data.likes));
        } catch {
          // ignore storage errors
        }
      }
    };

    loadLikes();

    const channel = supabase
      .channel('site-stats-live')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'site_stats', filter: 'id=eq.portfolio' },
        (payload) => {
          const next = (payload.new as { likes?: number } | null)?.likes;
          if (typeof next === 'number') {
            setLikesCount(next);
            try {
              window.localStorage.setItem(LOCAL_COUNT_KEY, String(next));
            } catch {
              // ignore storage errors
            }
          }
        }
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase?.removeChannel(channel);
    };
  }, []);

  const giveLike = useCallback(async () => {
    if (hasLiked || liking) return;
    setLiking(true);

    // Optimistic update so the 3D LED wall counter ticks up instantaneously!
    setHasLiked(true);
    setLikesCount((prev) => {
      const next = prev + 1;
      try {
        window.localStorage.setItem(LOCAL_LIKED_KEY, '1');
        window.localStorage.setItem(LOCAL_COUNT_KEY, String(next));
      } catch {
        // ignore storage errors
      }
      return next;
    });

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.rpc('increment_portfolio_likes');
      if (!error && typeof data === 'number') {
        setLikesCount(data);
        try {
          window.localStorage.setItem(LOCAL_COUNT_KEY, String(data));
        } catch {
          // ignore storage errors
        }
      }
    }

    setLiking(false);
  }, [hasLiked, liking]);

  return { likesCount, hasLiked, liking, giveLike };
}
