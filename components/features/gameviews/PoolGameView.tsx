import React from 'react';
import { Image, StyleSheet, View } from 'react-native';

import CustomText from '@/components/CustomText';
import { typography } from '@/constants/Typography';
import { useGamesByRound } from '@/hooks/useGamesData';
import { GameWithRelations } from '@/types/games';
import { formatDate } from '@/utils/formatDate';
import { formatTime } from '@/utils/formatTime';

import { FlashList } from '@shopify/flash-list';

type PoolProps = {
  poolId: number;
  divisionId: number;
};

const PoolGameView: React.FC<PoolProps> = ({ poolId, divisionId }) => {
  const { games, refreshData } = useGamesByRound(divisionId, 1);

  const poolGames = games.filter((game) => game.pool_id === poolId) as GameWithRelations[];

  const renderGame = ({ item }: { item: GameWithRelations }) => (
    <View style={styles.gameCard}>
      <View style={styles.gameHeader}>
        <CustomText style={styles.dateText}>{formatDate(item.datetime?.date, 'short')}</CustomText>
        <View style={styles.timeContainer}>
          <CustomText style={styles.timeText}>{formatTime(item.datetime?.time)}</CustomText>
        </View>
        <CustomText style={styles.fieldText}>Field {item.field?.name}</CustomText>
      </View>

      {/* Teams and Score Container - New Layout */}
      <View style={styles.matchupContainer}>
        {/* Left side: Teams */}
        <View style={styles.teamsSection}>
          {/* Team 1 */}
          <View style={styles.teamRow}>
            <Image
              source={
                item.team1?.avatar_uri
                  ? { uri: item.team1.avatar_uri }
                  : require('@/assets/images/avatar-placeholder.png')
              }
              style={styles.teamLogo}
            />
            <CustomText style={styles.teamText}>{item.team1 ? item.team1?.name : 'TBD'}</CustomText>
          </View>

          {/* Team 2 */}
          <View style={styles.teamRow}>
            <Image
              source={
                item.team2?.avatar_uri
                  ? { uri: item.team2.avatar_uri }
                  : require('@/assets/images/avatar-placeholder.png')
              }
              style={styles.teamLogo}
            />
            <CustomText style={styles.teamText}>{item.team2 ? item.team2?.name : 'TBD'}</CustomText>
          </View>
        </View>

        {/* Right side: Scores */}
        <View style={styles.scoresSection}>
          <CustomText style={styles.scoreText}>
            {item.scores && item.scores[0] ? item.scores[0].team1_score : 0}
          </CustomText>
          <CustomText style={styles.scoreText}>
            {item.scores && item.scores[0] ? item.scores[0].team2_score : 0}
          </CustomText>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlashList
        data={poolGames}
        renderItem={renderGame}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.gameList}
        onRefresh={refreshData}
        refreshing={false}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  gameCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    elevation: 2,
    gap: 15,
    marginBottom: 10,
    padding: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  gameHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dateText: {
    ...typography.textBold,
    color: '#999',
    width: 100,
  },
  timeContainer: {
    backgroundColor: '#999',
    borderRadius: 20,
    paddingHorizontal: 8,
  },
  timeText: {
    ...typography.text,
    color: '#fff',
  },
  fieldText: {
    ...typography.textBold,
    color: '#276B5D',
    textAlign: 'right',
    width: 100,
  },
  matchupContainer: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  teamsSection: {
    flex: 3,
    gap: 10,
    justifyContent: 'space-between',
  },
  teamRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  teamLogo: {
    borderRadius: 18,
    height: 27,
    width: 27,
  },
  teamText: {
    ...typography.textSemiBold,
    color: '#444',
  },
  scoresSection: {
    alignItems: 'flex-end',
    flex: 1,
    gap: 10,
    justifyContent: 'space-between',
  },
  scoreText: {
    ...typography.textLargeBold,
    color: '#333',
    textAlign: 'center',
  },
  container: {
    flex: 1,
  },
  gameList: {
    paddingBottom: 10,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  infoText: {
    ...typography.text,
    justifyContent: 'center',
  },
});

export default PoolGameView;
