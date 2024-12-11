import { View, Text, StyleSheet } from 'react-native'
import { useLocalSearchParams } from 'expo-router';
import { Card, Avatar } from '@rneui/base';
import { useRoundIds } from '@/hooks/useGamesFilter';
import { FlashList } from '@shopify/flash-list';
import { Database } from '@/database.types';

type GamesRow = Database['public']['Tables']['games']['Row'];
type TeamsRow = Database['public']['Tables']['teams']['Row'];

interface Games extends GamesRow {
  team1: TeamsRow | null;
  team2: TeamsRow | null;
}

interface GameComponentProps {
  divisionId: number;
  roundId: number;
}

const GameComponent: React.FC<GameComponentProps> = ({ divisionId, roundId }) => {

  const { games, loading, error } = useRoundIds(Number(divisionId), roundId);
  console.log(games)
  
  const renderItem = ({ item }: {item: Games}) => (
    <Card containerStyle={styles.card}>
      <Text>{item.pool_id}</Text>
      <Text>{item.team1?.name}</Text>
      <Text>vs</Text>
      <Text>{item.team2?.name}</Text>
    </Card>
  );

  const renderPlaceholder = () => (
    <View style={styles.placeholderContainer}>
      <Text style={styles.placeholderTitle}>Games Coming Soon!</Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>

        {games.length > 0 ? (
          <FlashList 
            data={games}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderItem}
            estimatedItemSize={50}
          />
        ) : renderPlaceholder()}

    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#D9D9D9',
    paddingTop: 10
  },
  card: {
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#CBCAD8',
    marginTop: 0,
    marginBottom: 12,
    padding: 12,
  },
  placeholderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  placeholderTitle: {
    fontFamily: 'Outfit-Bold',
    fontSize: 24,
    color: '#EA1D25',
    marginTop: 20,
    marginBottom: 10,
    textAlign: 'center',
  },
  loadingText: {
    fontFamily: 'Outfit-Regular',
    fontSize: 18,
    color: '#8F8DAA',
    textAlign: 'center',
    marginTop: 20,
  },
})

export default GameComponent;