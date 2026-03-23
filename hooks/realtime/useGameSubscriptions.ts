import { useCallback, useEffect, useRef } from 'react';

import { Database } from '@/database.types';
import { supabase } from '@/lib/supabase';

import { RealtimePostgresChangesPayload } from '@supabase/supabase-js';

type GamesRow = Database['public']['Tables']['games']['Row'];
type ScoresRow = Database['public']['Tables']['scores']['Row'];

export function useGameSubscription(divisionId: number, roundId: number, onUpdate: () => void) {
  const debounceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const debouncedUpdate = useCallback(() => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    debounceTimeoutRef.current = setTimeout(() => {
      onUpdate();
      debounceTimeoutRef.current = null;
    }, 300); // 300ms debounce
  }, [onUpdate]);

  useEffect(() => {
    if (!divisionId || !roundId) return;

    console.log('Setting up realtime subscriptions for division:', divisionId, 'round:', roundId);

    // Create a subscription channel for both games and scores
    const subscription = supabase
      .channel(`games-and-scores-${divisionId}-${roundId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'games',
          filter: `division_id=eq.${divisionId}`,
        },
        (payload: RealtimePostgresChangesPayload<GamesRow>) => {
          // Check if this game belongs to our round
          const updatedGame = payload.new as GamesRow;
          if (updatedGame && updatedGame.round_id === roundId) {
            debouncedUpdate();
          }
        },
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'scores',
        },
        (payload: RealtimePostgresChangesPayload<ScoresRow>) => {
          console.log('Received score update:', payload);
          debouncedUpdate();
        },
      )
      .subscribe();

    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
      subscription.unsubscribe();
    };
  }, [divisionId, roundId, debouncedUpdate]);
}

export function useScheduleSubscription(
  divisionId: number,
  scheduleId: number,
  gameIds: number[],
  onUpdate: () => void,
) {
  const debounceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const gameIdsRef = useRef<number[]>([]);

  // Update the ref when gameIds change
  useEffect(() => {
    gameIdsRef.current = gameIds;
  }, [gameIds]);

  const debouncedUpdate = useCallback(() => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    debounceTimeoutRef.current = setTimeout(() => {
      onUpdate();
      debounceTimeoutRef.current = null;
    }, 300); // 300ms debounce
  }, [onUpdate]);

  useEffect(() => {
    if (!divisionId || !scheduleId) return;

    console.log('Setting up real-time subscription for division:', divisionId, 'schedule:', scheduleId);

    // Subscribe to score changes for this schedule
    const subscription = supabase
      .channel(`schedule-scores-${divisionId}-${scheduleId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'scores',
        },
        (payload: RealtimePostgresChangesPayload<ScoresRow>) => {
          const updatedScore = payload.new as ScoresRow;
          const currentGameIds = gameIdsRef.current;

          // Check if this score update is relevant to our current schedule
          if (updatedScore && updatedScore.game_id && currentGameIds.includes(updatedScore.game_id)) {
            console.log('Score updated for game in current schedule:', updatedScore.game_id);
            debouncedUpdate();
          }
        },
      )
      .subscribe();

    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
      subscription.unsubscribe();
    };
  }, [divisionId, scheduleId, debouncedUpdate]);
}

export function useScoreSubscription(gameIds: number[], onUpdate: (updatedGameId?: number) => void) {
  const previousGameIdsRef = useRef<number[]>([]);

  // We'll use a debounce mechanism to avoid too frequent updates
  const debounceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const debouncedUpdate = useCallback(
    (gameId?: number) => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }

      debounceTimeoutRef.current = setTimeout(() => {
        onUpdate(gameId);
        debounceTimeoutRef.current = null;
      }, 300); // 300ms debounce
    },
    [onUpdate],
  );

  useEffect(() => {
    if (!gameIds || gameIds.length === 0) return;

    // Only resubscribe if game IDs have changed
    const gameIdsChanged =
      gameIds.length !== previousGameIdsRef.current.length ||
      gameIds.some((id, index) => previousGameIdsRef.current[index] !== id);

    if (!gameIdsChanged && previousGameIdsRef.current.length > 0) {
      return; // Skip resubscription if game IDs haven't changed
    }

    previousGameIdsRef.current = [...gameIds];

    console.log('Setting up score subscription for game IDs:', gameIds);

    // Create a subscription channel
    const subscription = supabase
      .channel('game-scores-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'scores',
        },
        (payload: RealtimePostgresChangesPayload<ScoresRow>) => {
          console.log('Received score update:', payload);

          // Check if this update is relevant to our games
          const updatedGameId = payload.new && 'game_id' in payload.new ? payload.new.game_id : undefined;
          if (updatedGameId && gameIds.includes(updatedGameId)) {
            debouncedUpdate(updatedGameId);
          }
        },
      )
      .subscribe();

    return () => {
      console.log('Cleaning up score subscription');
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
      subscription.unsubscribe();
    };
  }, [gameIds, debouncedUpdate]);
}

export function useFavoriteGamesSubscription(gameIds: number[], onUpdate: () => void) {
  const debounceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const gameIdsRef = useRef<number[]>([]);
  const lastLoggedGameIdsRef = useRef<string>('');

  // Update the ref when gameIds change
  useEffect(() => {
    gameIdsRef.current = gameIds;
  }, [gameIds]);

  const debouncedUpdate = useCallback(() => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    debounceTimeoutRef.current = setTimeout(() => {
      onUpdate();
      debounceTimeoutRef.current = null;
    }, 300); // 300ms debounce
  }, [onUpdate]);

  useEffect(() => {
    if (!gameIds || gameIds.length === 0) return;

    // Only log if the set of gameIds has actually changed
    const currentIdsString = JSON.stringify([...gameIds].sort());
    if (lastLoggedGameIdsRef.current !== currentIdsString) {
      console.log('Setting up real-time subscription for favorite games:', gameIds);
      lastLoggedGameIdsRef.current = currentIdsString;
    }

    // Subscribe to score changes for favorite games
    const subscription = supabase
      .channel('favorite-games-scores')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'scores',
        },
        (payload: RealtimePostgresChangesPayload<ScoresRow>) => {
          const updatedScore = payload.new as ScoresRow;
          const currentGameIds = gameIdsRef.current;

          // Check if this score update is relevant to favorite games
          if (updatedScore && updatedScore.game_id && currentGameIds.includes(updatedScore.game_id)) {
            console.log('Score updated for favorite game:', updatedScore.game_id, updatedScore);
            debouncedUpdate();
          }
        },
      )
      .subscribe();

    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
      subscription.unsubscribe();
    };
  }, [gameIds, debouncedUpdate]);
}
