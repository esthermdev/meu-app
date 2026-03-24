import { useCallback, useEffect, useRef } from 'react';

import { supabase } from '@/lib/supabase';

import { RealtimePostgresChangesPayload } from '@supabase/supabase-js';

type RequestRealtimeRow = {
  id: number;
  status: string | null;
};

type RequestSubscriptionConfig = {
  channelName: string;
  table: 'water_requests' | 'medical_requests' | 'cart_requests';
  logLabel: string;
  onUpdate: () => void;
  onPayload?: (payload: RealtimePostgresChangesPayload<RequestRealtimeRow>) => boolean | void;
  debounceMs?: number;
};

function useRequestSubscription({
  channelName,
  table,
  logLabel,
  onUpdate,
  onPayload,
  debounceMs = 250,
}: RequestSubscriptionConfig) {
  const onUpdateRef = useRef(onUpdate);
  const onPayloadRef = useRef(onPayload);
  const realtimeRefreshTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const subscriptionTopicRef = useRef(`${channelName}-${Math.random().toString(36).slice(2, 10)}`);

  useEffect(() => {
    onUpdateRef.current = onUpdate;
  }, [onUpdate]);

  useEffect(() => {
    onPayloadRef.current = onPayload;
  }, [onPayload]);

  const scheduleRealtimeRefresh = useCallback(() => {
    if (realtimeRefreshTimeoutRef.current) {
      clearTimeout(realtimeRefreshTimeoutRef.current);
    }

    realtimeRefreshTimeoutRef.current = setTimeout(() => {
      onUpdateRef.current();
      realtimeRefreshTimeoutRef.current = null;
    }, debounceMs);
  }, [debounceMs]);

  useEffect(() => {
    const subscription = supabase
      .channel(subscriptionTopicRef.current)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table,
        },
        (payload: RealtimePostgresChangesPayload<RequestRealtimeRow>) => {
          console.log(`${logLabel} real-time update:`, payload);
          const shouldScheduleRefresh = onPayloadRef.current?.(payload);

          if (shouldScheduleRefresh !== false) {
            scheduleRealtimeRefresh();
          }
        },
      )
      .subscribe((status) => {
        console.log(`${logLabel} subscription status:`, status);
      });

    return () => {
      if (realtimeRefreshTimeoutRef.current) {
        clearTimeout(realtimeRefreshTimeoutRef.current);
        realtimeRefreshTimeoutRef.current = null;
      }

      void supabase.removeChannel(subscription);
    };
  }, [logLabel, scheduleRealtimeRefresh, table]);
}

export function useWaterRequestsSubscription(
  onUpdate: () => void,
  options?: Pick<RequestSubscriptionConfig, 'onPayload' | 'debounceMs'>,
) {
  useRequestSubscription({
    channelName: 'water_management_channel',
    table: 'water_requests',
    logLabel: 'Water management',
    onUpdate,
    ...options,
  });
}

export function useTrainerRequestsSubscription(
  onUpdate: () => void,
  options?: Pick<RequestSubscriptionConfig, 'onPayload' | 'debounceMs'>,
) {
  useRequestSubscription({
    channelName: 'trainer_management_channel',
    table: 'medical_requests',
    logLabel: 'Trainer management',
    onUpdate,
    ...options,
  });
}

export function useCartRequestsSubscription(
  onUpdate: () => void,
  options?: Pick<RequestSubscriptionConfig, 'onPayload' | 'debounceMs'>,
) {
  useRequestSubscription({
    channelName: 'cart_management_channel',
    table: 'cart_requests',
    logLabel: 'Cart management',
    onUpdate,
    ...options,
  });
}
