// src/hooks/useFavorites.ts
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Session } from '@supabase/supabase-js';
import { Alert } from 'react-native';
import { Database } from '@/database.types';
import { debounce } from 'lodash';

type TeamRow = Database['public']['Tables']['teams']['Row'];
type PoolRow = Database['public']['Tables']['pools']['Row'];

export interface TeamWithPool extends TeamRow {
  pool: PoolRow | null;
  is_favorited?: boolean;
}

const MAX_FAVORITES = 5;

export const useFavorites = (session: Session | null) => {
  const [teams, setTeams] = useState<TeamWithPool[]>([]);
  const [favorites, setFavorites] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);

  // src/hooks/useFavorites.ts
// src/hooks/useFavorites.ts
  const toggleFavorite = useCallback(async (teamId: number) => {
    if (!session?.user) return { success: false, isFavorited: false };

    const currentIsFavorited = favorites.has(teamId);

    try {
      // Check if we're trying to add a new favorite
      if (!currentIsFavorited) {
        // Check max favorites limit before making the request
        if (favorites.size >= MAX_FAVORITES) {
          Alert.alert(
            'Maximum Favorites Reached',
            'You can only favorite up to 5 teams. Please remove a team before adding a new one.'
          );
          return { success: false, isFavorited: false };
        }

        // First check if the record already exists
        const { data: existingFavorite } = await supabase
          .from('favorite_teams')
          .select()
          .eq('team_id', teamId)
          .eq('user_id', session.user.id)
          .single();

        // If it exists, we don't need to insert it again
        if (!existingFavorite) {
          const { error: insertError } = await supabase
            .from('favorite_teams')
            .insert([{ 
              team_id: teamId,
              user_id: session.user.id 
            }]);

          if (insertError) throw insertError;
        }
      } else {
        // If we're removing a favorite
        const { error: deleteError } = await supabase
          .from('favorite_teams')
          .delete()
          .eq('team_id', teamId)
          .eq('user_id', session.user.id);

        if (deleteError) throw deleteError;
      }

      // Update local state after successful database operation
      setFavorites(prev => {
        const newFavorites = new Set(prev);
        if (currentIsFavorited) {
          newFavorites.delete(teamId);
        } else {
          newFavorites.add(teamId);
        }
        return newFavorites;
      });

      return { success: true, isFavorited: !currentIsFavorited };
    } catch (error: any) {
      console.error('Error toggling favorite:', error);
      
      // Don't show error for duplicate entries
      if (error.code !== '23505') {
        Alert.alert('Error', 'Failed to update favorites. Please try again.');
      }
      
      return { success: false, isFavorited: currentIsFavorited };
    }
  }, [session, favorites]);

  const fetchTeams = async () => {
    try {
      const { data, error } = await supabase
        .from('teams')
        .select(`*, pool: pool_id (id, name, division)`)
        .order('name');

      if (error) throw error;
      setTeams(data as unknown as TeamWithPool[]);
    } catch (error) {
      console.error('Error fetching teams:', error);
      Alert.alert('Error', 'Failed to fetch teams. Please try again.');
    }
  };

  const fetchFavorites = async () => {
    if (!session?.user) return;

    try {
      const { data, error } = await supabase
        .from('favorite_teams')
        .select('team_id')
        .eq('user_id', session.user.id);

      if (error) throw error;
      setFavorites(new Set(data.map(fav => fav.team_id)));
    } catch (error) {
      console.error('Error fetching favorites:', error);
      Alert.alert('Error', 'Failed to fetch favorites. Please try again.');
    }
  };

  const debouncedLoadData = useCallback(
    debounce(async () => {
      setLoading(true);
      await Promise.all([fetchTeams(), fetchFavorites()]);
      setLoading(false);
    }, 300), // 300ms debounce
    [session]
  );

  const loadData = useCallback(async () => {
    setLoading(true);
    await Promise.all([fetchTeams(), fetchFavorites()]);
    setLoading(false);
  }, [session]);

  useEffect(() => {
    if (session) {
      loadData();
    }
  }, [session]);

  return {
    teams,
    favorites,
    loading,
    toggleFavorite,
    loadData,
    remainingFavorites: MAX_FAVORITES - favorites.size
  };
};