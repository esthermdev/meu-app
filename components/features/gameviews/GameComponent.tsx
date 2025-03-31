import React from 'react';
import {
  View,
  StyleSheet,
  Image,
} from 'react-native';
import { Database } from '@/database.types';
import { formatDate } from '@/utils/formatDate';
import { formatTime } from '@/utils/formatTime';
import { typography } from '@/constants/Typography';
import CustomText from '@/components/CustomText';

type GamesRow = Database['public']['Tables']['games']['Row'];
type DatetimeRow = Database['public']['Tables']['datetime']['Row'];
type TeamRow = Database['public']['Tables']['teams']['Row'];
type ScoresRow = Database['public']['Tables']['scores']['Row'];

// Define the interface that matches what useRoundIds returns
interface FetchedGame extends GamesRow {
  team1: TeamRow | null;
  team2: TeamRow | null;
  datetime: DatetimeRow | null;
  scores: ScoresRow[] | null;
}

interface GameComponentProps {
  game: FetchedGame;
}

const GameComponent: React.FC<GameComponentProps> = ({ game }) => {

  const renderGame = ({ item }: { item: FetchedGame }) => (
    <View style={styles.gameCard}>
      <View style={styles.gameHeader}>
        <CustomText style={styles.dateText}>{formatDate(item.datetime?.date, 'short')}</CustomText>
        <View style={styles.timeContainer}>
          <CustomText style={styles.timeText}>{formatTime(item.datetime?.time)}</CustomText>
        </View>
        <CustomText style={styles.fieldText}>Field {item.field_id}</CustomText>
      </View>

      {/* Teams and Score Container - New Layout */}
      <View style={styles.matchupContainer}>
        {/* Left side: Teams */}
        <View style={styles.teamsSection}>
          {/* Team 1 */}
          <View style={styles.teamRow}>
            <Image
              source={item.team1?.avatar_uri ? { uri: item.team1.avatar_uri } : require('@/assets/images/avatar-placeholder.png')}
              style={styles.teamLogo}
            />
            <CustomText style={styles.teamText}>{item.team1?.name}</CustomText>
          </View>

          {/* Team 2 */}
          <View style={styles.teamRow}>
            <Image
              source={item.team2?.avatar_uri ? { uri: item.team2.avatar_uri } : require('@/assets/images/avatar-placeholder.png')}
              style={styles.teamLogo}
            />
            <CustomText style={styles.teamText}>{item.team2?.name}</CustomText>
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
      <View key={game.id.toString()}>
        {renderGame({ item: game as FetchedGame })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  // Game Card Styles
  gameCard: {
    backgroundColor: 'white',
    padding: 10,
    borderRadius: 12,
    gap: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    marginTop: 10
  },
  gameHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateText: {
    ...typography.textBold,
    color: '#999',
    width: 100,
  },
  timeContainer: {
    backgroundColor: '#999',
    paddingHorizontal: 8,
    borderRadius: 20,
  },
  timeText: {
    ...typography.text,
    color: '#fff'
  },
  fieldText: {
    ...typography.textBold,
    color: '#276B5D',
    width: 100,
    textAlign: 'right',
  },
  // New layout styles
  matchupContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  teamsSection: {
    flex: 3,
    justifyContent: 'space-between',
    gap: 10,
  },
  teamRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  teamLogo: {
    width: 27,
    height: 27,
    borderRadius: 18,
  },
  teamText: {
    ...typography.textSemiBold,
    color: '#444',
  },
  scoresSection: {
    flex: 1,
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 10,
  },
  scoreText: {
    ...typography.textLargeBold,
    color: '#333',
    textAlign: 'center',
  },
});

export default GameComponent;