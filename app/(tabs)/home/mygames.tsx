// src/screens/MyGames.tsx
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Alert
} from 'react-native';
import { supabase } from '@/lib/supabase';
import { Database } from '@/database.types';
import { useAuth } from '@/hooks/AuthProvider';
import { formatDate } from '@/utils/formatDate';
import { formatTime } from '@/utils/formatTime';

type GamesRow = Database['public']['Tables']['games']['Row'];
type DatetimeRow = Database['public']['Tables']['datetime']['Row'];
type TeamRow = Database['public']['Tables']['teams']['Row'];

interface Games extends GamesRow {
  datetime: DatetimeRow | null;
  team1: TeamRow;
  team2: TeamRow;
}

const MyGames = () => {
  const [games, setGames] = useState<Games[]>([]);
  const [favoriteTeamIds, setFavoriteTeamIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { session } = useAuth()

  useEffect(() => {
    // Get current session
      if (session) {
        fetchFavoriteGames(session.user.id);
      }
    }, []);

  const fetchFavoriteGames = async (userId: string) => {
    try {
      setLoading(true);
      
      // First, get the user's favorite team IDs
      const { data: favoriteTeams, error } = await supabase
        .from('favorite_teams')
        .select('team_id')
        .eq('user_id', userId);

      if (error) throw error;
      
      if (!favoriteTeams?.length) {
        setGames([]);
        setFavoriteTeamIds([]);
        setLoading(false);
        return;
      }

      const teamIds = favoriteTeams.map(team => team.team_id);
      setFavoriteTeamIds(teamIds);

      // Then fetch all games where either team1 or team2 is in the favorite teams
      const { data, error: gamesError } = await supabase
        .from('games')
        .select(`
          *, 
          datetime: datetime_id (id, time, date),
          team1:team1_id (*),
          team2:team2_id (*)
        `)
        .or(`team1_id.in.(${teamIds.join(',')}),team2_id.in.(${teamIds.join(',')})`)
        .order('datetime_id', { ascending: true });

      if (gamesError) throw gamesError;

      setGames(data as unknown as Games[]);
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch favorite games');
      console.error('Error fetching favorite games:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    if (session) {
      fetchFavoriteGames(session.user.id).finally(() => setRefreshing(false));
    } else {
      setRefreshing(false);
    }
  }, [session]);

  const renderGame = ({ item }: { item: Games }) => (
    <View style={styles.gameCard}>
      <Text style={styles.dateText}>{formatDate(item.datetime?.date)}</Text>
      <Text style={styles.timeText}>{formatTime(item.datetime?.time)}</Text>
      <Text style={styles.gameText}>Field {item.field_id}</Text>
      <View style={styles.teamsContainer}>
        <Text 
          style={[
            styles.teamTextLeft, 
            favoriteTeamIds.includes(item.team1.id) && styles.highlightedTeam
          ]}
        >
          {item.team1.name}
        </Text>
        <Text style={styles.vsText}>vs</Text>
        <Text 
          style={[
            styles.teamTextRight,
            favoriteTeamIds.includes(item.team2.id) && styles.highlightedTeam
          ]}
        >
          {item.team2.name}
        </Text>
      </View>
    </View>
  );

  if (!session) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.messageText}>Please log in to view your favorite games</Text>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {games.length > 0 ? (
        <FlatList
          data={games}
          renderItem={renderGame}
          keyExtractor={(item) => item.id.toString()}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          contentContainerStyle={styles.listContainer}
        />
      ) : (
        <View style={styles.centerContainer}>
          <Text style={styles.messageText}>
            No games found for your favorite teams. Add some teams to your favorites!
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  listContainer: {
    padding: 16,
  },
  gameCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  dateText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  timeText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  gameText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  teamsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  teamTextLeft: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: '#444',
    textAlign: 'left',
  },
  teamTextRight: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: '#444',
    textAlign: 'right',
  },
  vsText: {
    fontSize: 14,
    color: '#666',
    marginHorizontal: 8,
  },
  highlightedTeam: {
    color: '#2196F3',
    fontWeight: '700',
  },
  messageText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
});

export default MyGames;