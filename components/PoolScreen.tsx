import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useRoundIds } from '@/hooks/useGamesFilter';

type Props = {
  poolId: number;
  divisionId: number;
}

const PoolScreen: React.FC<Props> = ({ poolId, divisionId }) => {
  const { games, loading, error } = useRoundIds(divisionId, 1); // Assuming round_id 1 is for pool play
  
  const poolGames = games.filter(game => game.pool_id === poolId);

  if (loading) {
    return (
      <View style={styles.container}>
        <Text>Loading games...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text>Error: {error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlashList
        data={poolGames}
        estimatedItemSize={100}
        renderItem={({ item }) => (
          <View style={styles.gameItem}>
            <Text style={styles.teamText}>{item.team1?.name || 'TBD'}</Text>
            <Text style={styles.vsText}>vs</Text>
            <Text style={styles.teamText}>{item.team2?.name || 'TBD'}</Text>
          </View>
        )}
        keyExtractor={(item) => item.id.toString()}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  gameItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  teamText: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Outfit-Medium',
  },
  vsText: {
    marginHorizontal: 12,
    color: '#8F8DAA',
    fontFamily: 'Outfit-Regular',
  },
});

export default PoolScreen;