import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

export function useTeamGamesSubscription(gameIds: number[], onUpdate: () => void) {
  const subscriptionRef = useRef<any>(null);

  const debouncedUpdate = useCallback(() => {
    // Simple debounce for team games
    setTimeout(() => {
      onUpdate();
    }, 300);
  }, [onUpdate]);

  useEffect(() => {
    if (gameIds.length === 0) return;

    // Clean up any existing subscription first
    if (subscriptionRef.current) {
      subscriptionRef.current.unsubscribe();
    }

    // Create a new subscription for score changes
    subscriptionRef.current = supabase
      .channel('team-games-score-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'scores',
          filter: gameIds.length > 0 ? `game_id=in.(${gameIds.join(',')})` : undefined,
        },
        (payload) => {
          console.log('Real-time score update for team game:', payload);
          debouncedUpdate();
        },
      )
      .subscribe();

    // Cleanup subscription on unmount
    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
        subscriptionRef.current = null;
      }
    };
  }, [gameIds, debouncedUpdate]);
}
