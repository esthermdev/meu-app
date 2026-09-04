// context/ServerTimeProvider.tsx
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';

import { supabase } from '@/lib/supabase';

// One shared, ticking clock anchored to the server. We fetch the server's
// `now()` once, remember how far the device clock is from it, and then tick
// locally so every game card agrees on the current time without polling.
// The offset is re-synced whenever the app returns to the foreground, which
// also catches the user changing their device clock while backgrounded.

const TICK_MS = 10_000;

type ServerTimeContextType = {
  /** Current time according to the server (device time until the first sync). */
  now: Date;
  /** True once we've successfully read the server clock at least once. */
  isSynced: boolean;
};

const ServerTimeContext = createContext<ServerTimeContextType | undefined>(undefined);

export function ServerTimeProvider({ children }: { children: React.ReactNode }) {
  const offsetRef = useRef(0); // serverNow - deviceNow, in ms
  const [now, setNow] = useState(() => new Date());
  const [isSynced, setIsSynced] = useState(false);

  const serverNow = useCallback(() => new Date(Date.now() + offsetRef.current), []);

  const sync = useCallback(async () => {
    try {
      const { data, error } = await supabase.rpc('get_server_time');
      if (error) throw error;
      if (!data) return;

      const serverMs = new Date(data).getTime();
      if (Number.isNaN(serverMs)) return;

      offsetRef.current = serverMs - Date.now();
      setIsSynced(true);
      setNow(serverNow());
    } catch (error) {
      console.warn('Error syncing server time, falling back to device clock:', error);
    }
  }, [serverNow]);

  useEffect(() => {
    sync();

    const interval = setInterval(() => setNow(serverNow()), TICK_MS);

    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') sync();
    });

    return () => {
      clearInterval(interval);
      subscription.remove();
    };
  }, [sync, serverNow]);

  return <ServerTimeContext.Provider value={{ now, isSynced }}>{children}</ServerTimeContext.Provider>;
}

export function useServerTime(): ServerTimeContextType {
  const context = useContext(ServerTimeContext);
  if (context === undefined) {
    throw new Error('useServerTime must be used within a ServerTimeProvider');
  }
  return context;
}
