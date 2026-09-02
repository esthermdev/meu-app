import { useMemo } from 'react';

import { supabase } from '@/lib/supabase';

const BUCKET = 'tournament_logos';

// The logo lives at a fixed key so the app never has to list the bucket. Listing
// requires a broad SELECT policy on storage.objects (which lets any client enumerate
// every file), while public object URLs are served without any RLS check. Swapping the
// artwork between tournaments means replacing the object at this path — no new build.
const LOGO_PATH = 'current.png';

// Public URLs are cached by the storage CDN and again on-device by expo-image's disk
// cache. Because the path never changes, a coarse daily version param is what lets a
// replaced logo actually reach users (within 24h) instead of being pinned forever.
const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Resolves the current tournament logo from Supabase storage so the artwork can be
 * swapped between tournaments without shipping a new build. The URL is built locally,
 * so there is no network round-trip and no failure state here — callers show the
 * bundled asset as a placeholder until the image loads (or if it is missing).
 */
export const useTournamentLogo = () => {
  const logoUrl = useMemo(() => {
    const { data } = supabase.storage.from(BUCKET).getPublicUrl(LOGO_PATH);

    return `${data.publicUrl}?v=${Math.floor(Date.now() / DAY_MS)}`;
  }, []);

  return { logoUrl, loading: false };
};
