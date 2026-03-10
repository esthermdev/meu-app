import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

export function useWaterRequestsSubscription(onUpdate: () => void) {
  const realtimeRefreshTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scheduleRealtimeRefresh = useCallback(() => {
    if (realtimeRefreshTimeoutRef.current) {
      clearTimeout(realtimeRefreshTimeoutRef.current);
    }

    realtimeRefreshTimeoutRef.current = setTimeout(() => {
      onUpdate();
    }, 250);
  }, [onUpdate]);

  useEffect(() => {
    const subscription = supabase
      .channel('water_requests_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'water_requests' }, scheduleRealtimeRefresh)
      .subscribe();

    return () => {
      subscription.unsubscribe();
      if (realtimeRefreshTimeoutRef.current) {
        clearTimeout(realtimeRefreshTimeoutRef.current);
      }
    };
  }, [scheduleRealtimeRefresh]);
}

export function useTrainerRequestsSubscription(onUpdate: () => void) {
  const realtimeRefreshTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scheduleRealtimeRefresh = useCallback(() => {
    if (realtimeRefreshTimeoutRef.current) {
      clearTimeout(realtimeRefreshTimeoutRef.current);
    }

    realtimeRefreshTimeoutRef.current = setTimeout(() => {
      onUpdate();
    }, 250);
  }, [onUpdate]);

  useEffect(() => {
    // Set up real-time subscription
    const subscription = supabase
      .channel('trainer_requests_channel')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'medical_requests',
        },
        scheduleRealtimeRefresh,
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
      if (realtimeRefreshTimeoutRef.current) {
        clearTimeout(realtimeRefreshTimeoutRef.current);
      }
    };
  }, [scheduleRealtimeRefresh]);
}
