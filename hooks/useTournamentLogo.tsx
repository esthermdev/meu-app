import { useEffect, useState } from 'react';

import { supabase } from '@/lib/supabase';

const BUCKET = 'tournament_logos';
const IMAGE_EXTENSIONS = /\.(png|jpe?g|webp|gif|svg)$/i;

/**
 * Resolves the current tournament logo from Supabase storage so the artwork can be
 * swapped between tournaments without shipping a new build. A new file is uploaded to
 * the bucket each time, so the most recently created image wins. Callers fall back to
 * the bundled asset while this resolves (or if the fetch fails offline).
 */
export const useTournamentLogo = () => {
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isActive = true;

    const fetchLogo = async () => {
      try {
        const { data, error } = await supabase.storage.from(BUCKET).list('', {
          limit: 100,
          sortBy: { column: 'created_at', order: 'desc' },
        });

        if (error) {
          console.error('Error fetching tournament logo:', error);
          return;
        }

        const latest = data.find((item) => item.id && IMAGE_EXTENSIONS.test(item.name));

        if (!latest) {
          console.warn(`No image files found in "${BUCKET}".`);
          return;
        }

        const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(latest.name);

        if (isActive) setLogoUrl(urlData.publicUrl);
      } catch (error) {
        console.error('Error fetching tournament logo:', error);
      } finally {
        if (isActive) setLoading(false);
      }
    };

    fetchLogo();

    return () => {
      isActive = false;
    };
  }, []);

  return { logoUrl, loading };
};
