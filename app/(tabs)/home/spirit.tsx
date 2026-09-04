import React, { useState } from 'react';
import { Image, RefreshControl, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { router } from 'expo-router';

import PrimaryButton from '@/components/buttons/PrimaryButton';
import CustomText from '@/components/CustomText';
import SpiritScoreModal from '@/components/features/modals/SpiritScoreModal';
import SpiritPodium, { SpiritPodiumEntry } from '@/components/features/spirit/SpiritPodium';
import LoadingIndicator from '@/components/LoadingIndicator';
import { typography } from '@/constants/Typography';
import { useAuth } from '@/context/AuthProvider';
import { hasRole } from '@/context/profileRoles';
import { useDivisions } from '@/hooks/useScheduleConfig';
import { useSpiritScoring } from '@/hooks/useSpiritScoring';
import { TeamSpiritRankingRow } from '@/types/database';
import { SpiritGame } from '@/types/spirit';
import { formatDate } from '@/utils/formatDate';
import { formatTime } from '@/utils/formatTime';

import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';

const PLACEHOLDER = require('@/assets/images/avatar-placeholder.png');

const ORANGE = '#ED8C22';

type SpiritTab = 'submit' | 'rankings';

export default function SpiritPage() {
  const { session, profile } = useAuth();
  const { teamId, teams, games, rankings, loading, submitting, selectTeam, submitScore, refresh } = useSpiritScoring();
  // A saved team is locked for regular users; only admins can switch it afterwards.
  const canChangeTeam = hasRole(profile, 'admin');
  const { divisions, loading: divisionsLoading } = useDivisions();

  const [tab, setTab] = useState<SpiritTab>('submit');
  const [divisionId, setDivisionId] = useState<number | null>(null);
  const [chosenRankingsDivisionId, setChosenRankingsDivisionId] = useState<number | null>(null);
  const [changingTeam, setChangingTeam] = useState(false);
  const [activeGame, setActiveGame] = useState<SpiritGame | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const selectedTeam = teams.find((team) => team.id === teamId) ?? null;
  // The division/team picker runs before a team is saved, and again when an admin taps "Change".
  const isPickingTeam = !teamId || (changingTeam && canChangeTeam);
  // Rankings default to the user's own division until they tap a different chip.
  const rankingsDivisionId = chosenRankingsDivisionId ?? selectedTeam?.division_id ?? divisions[0]?.id ?? null;

  const onRefresh = () => {
    setRefreshing(true);
    refresh().finally(() => setRefreshing(false));
  };

  const startChangingTeam = () => {
    if (!canChangeTeam) return;
    setChangingTeam(true);
    setDivisionId(null);
  };

  // Tapping "Submit Scores" always lands on the main page, abandoning any in-progress team change.
  const showSubmitTab = () => {
    setTab('submit');
    setChangingTeam(false);
    setDivisionId(null);
  };

  const handleSelectTeam = async (newTeamId: number) => {
    const saved = await selectTeam(newTeamId);
    if (saved) {
      setChangingTeam(false);
      setDivisionId(null);
    }
  };

  const handleSubmitScore = async (score: number, comments: string) => {
    if (!activeGame?.opponent) return;
    const submitted = await submitScore(activeGame.id, activeGame.opponent.id, score, comments);
    if (submitted) setActiveGame(null);
  };

  const renderGame = (game: SpiritGame) => {
    const isScored = game.submittedScore !== null;

    return (
      <View key={game.id} style={styles.gameCard}>
        <View style={styles.gameInfo}>
          <View style={styles.gameHeader}>
            <CustomText style={styles.gameDate}>{formatDate(game.datetime?.date, 'short')}</CustomText>
            <CustomText style={styles.gameTime}>{formatTime(game.datetime?.time)}</CustomText>
          </View>
          <View style={styles.gameTeamRow}>
            <Image
              source={game.opponent?.avatar_uri ? { uri: game.opponent.avatar_uri } : PLACEHOLDER}
              style={styles.gameAvatar}
            />
            <CustomText style={[styles.opponentName, isScored && styles.opponentNameScored]} numberOfLines={2}>
              {game.opponent?.name}
            </CustomText>
          </View>
        </View>

        {isScored ? (
          <View style={styles.scoredBadge}>
            <MaterialCommunityIcons name="lock-check" size={16} color="#276B5D" />
            <CustomText style={styles.scoredText}>{game.submittedScore}/5</CustomText>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.rateButton}
            onPress={() => setActiveGame(game)}
            accessibilityRole="button"
            accessibilityLabel={`Rate spirit for ${game.opponent?.name}`}
            hitSlop={8}>
            <MaterialCommunityIcons name="star-outline" size={26} color="#fff" />
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const renderTeamPicker = () => {
    const divisionTeams = teams.filter((team) => team.division_id === divisionId);

    return (
      <View>
        <CustomText style={styles.stepTitle}>Which division are you in?</CustomText>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipRow}
          style={styles.chipScroll}>
          {divisions.map((division) => {
            const isSelected = division.id === divisionId;
            return (
              <TouchableOpacity
                key={division.id}
                style={[styles.chip, isSelected && styles.chipSelected]}
                onPress={() => setDivisionId(division.id)}>
                <CustomText style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                  {division.title.toUpperCase()}
                </CustomText>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {divisionId && (
          <>
            <CustomText style={styles.stepTitle}>Which team are you on?</CustomText>

            {divisionTeams.length === 0 ? (
              <CustomText style={styles.emptyMessage}>No teams in this division yet.</CustomText>
            ) : (
              divisionTeams.map((team) => (
                <TouchableOpacity
                  key={team.id}
                  style={[styles.teamRow, team.id === teamId && styles.teamRowSelected]}
                  onPress={() => handleSelectTeam(team.id)}>
                  <CustomText style={styles.teamRowName}>{team.name}</CustomText>
                  <MaterialCommunityIcons
                    name={team.id === teamId ? 'check-circle' : 'chevron-right'}
                    size={22}
                    color={team.id === teamId ? ORANGE : '#CCC'}
                  />
                </TouchableOpacity>
              ))
            )}
          </>
        )}
      </View>
    );
  };

  const renderToggleRow = () => (
    <View style={styles.toggleRow}>
      <TouchableOpacity style={[styles.toggle, tab === 'submit' && styles.toggleSelected]} onPress={showSubmitTab}>
        <MaterialIcons name="auto-awesome" size={20} color={tab === 'submit' ? '#fff' : ORANGE} />
        <CustomText style={[styles.toggleText, tab === 'submit' && styles.toggleTextSelected]} numberOfLines={1}>
          Submit Scores
        </CustomText>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.toggle, tab === 'rankings' && styles.toggleSelected]}
        onPress={() => setTab('rankings')}>
        <MaterialCommunityIcons name="podium" size={20} color={tab === 'rankings' ? '#fff' : ORANGE} />
        <CustomText style={[styles.toggleText, tab === 'rankings' && styles.toggleTextSelected]} numberOfLines={1}>
          Spirit Rankings
        </CustomText>
      </TouchableOpacity>
    </View>
  );

  const renderSubmitTab = () => {
    if (!session) {
      return (
        <>
          <View style={styles.headerCard}>{renderToggleRow()}</View>
          <View style={styles.listArea}>
            <View style={styles.emptyState}>
              <CustomText style={styles.emptyTitle}>Want to score spirit?</CustomText>
              <CustomText style={styles.emptyMessage}>
                Sign in to report spirit scores for the teams you played against.
              </CustomText>
              <PrimaryButton
                title="Sign In"
                onPress={() => router.push('/(tabs)/profile')}
                style={{ height: 35, paddingHorizontal: 15 }}
                textStyle={{ ...typography.buttonLarge }}
              />
            </View>
          </View>
        </>
      );
    }

    if (loading || divisionsLoading) {
      return (
        <>
          <View style={styles.headerCard}>{renderToggleRow()}</View>
          <View style={styles.listArea}>
            <LoadingIndicator message="Loading your games..." fullscreen={false} transparent={false} />
          </View>
        </>
      );
    }

    if (isPickingTeam) {
      return (
        <View style={styles.headerCard}>
          {renderToggleRow()}
          {renderTeamPicker()}
        </View>
      );
    }

    return (
      <>
        <View style={styles.headerCard}>
          {renderToggleRow()}

          <View style={styles.teamBar}>
            <View style={styles.teamBarText}>
              <CustomText style={styles.teamBarLabel}>Your team</CustomText>
              <CustomText style={styles.teamBarName}>{selectedTeam?.name ?? '—'}</CustomText>
              {!canChangeTeam ? (
                <CustomText style={styles.teamBarHint}>Contact an admin to change your team.</CustomText>
              ) : null}
            </View>
            {canChangeTeam ? (
              <TouchableOpacity onPress={startChangingTeam} hitSlop={8}>
                <CustomText style={styles.changeTeamText}>Change</CustomText>
              </TouchableOpacity>
            ) : (
              <MaterialCommunityIcons name="lock-outline" size={20} color="#8A7A63" />
            )}
          </View>
        </View>

        <View style={styles.listArea}>
          {games.length === 0 ? (
            <View style={styles.emptyState}>
              <CustomText style={styles.emptyTitle}>No games to score yet.</CustomText>
              <CustomText style={styles.emptyMessage}>
                Your games appear here once they have been marked as finished.
              </CustomText>
            </View>
          ) : (
            games.map(renderGame)
          )}
        </View>
      </>
    );
  };

  const renderRankingCard = (row: TeamSpiritRankingRow, rank: number, avatarUri: string | null) => (
    <View key={row.team_id} style={styles.rankCard}>
      <CustomText style={styles.rankCardPosition}>{rank}</CustomText>
      <Image source={avatarUri ? { uri: avatarUri } : PLACEHOLDER} style={styles.rankCardAvatar} />
      <CustomText style={styles.rankCardName} numberOfLines={1}>
        {row.name}
      </CustomText>
      <View style={styles.rankCardScores}>
        <View style={styles.rankCardBadge}>
          <CustomText style={styles.rankCardBadgeText}>
            {row.avg_score === null ? '—' : row.avg_score.toFixed(1)}
          </CustomText>
        </View>
        <CustomText style={styles.rankCardCount}>
          {row.scores_received} {row.scores_received === 1 ? 'score' : 'scores'}
        </CustomText>
      </View>
    </View>
  );

  const renderRankingsTab = () => {
    if (loading || divisionsLoading) {
      return (
        <>
          <View style={styles.headerCard}>{renderToggleRow()}</View>
          <View style={styles.listArea}>
            <LoadingIndicator message="Loading rankings..." fullscreen={false} transparent={false} />
          </View>
        </>
      );
    }

    const avatarByTeam = new Map(teams.map((team) => [team.id, team.avatar_uri]));
    const divisionRankings = rankings.filter((row) => row.division_id === rankingsDivisionId);
    // A team with no scores has no standing, so it never takes a podium place.
    const scored = divisionRankings.filter((row) => row.avg_score !== null);
    const unscored = divisionRankings.filter((row) => row.avg_score === null);
    const podiumRows = scored.slice(0, 3);
    const restRows = [...scored.slice(3), ...unscored];

    const podiumEntries: SpiritPodiumEntry[] = podiumRows.map((row) => ({
      teamId: row.team_id ?? 0,
      name: row.name ?? '',
      avatarUri: avatarByTeam.get(row.team_id ?? 0) ?? null,
      avgScore: row.avg_score,
      scoresReceived: row.scores_received ?? 0,
    }));

    return (
      <>
        <View style={styles.headerCard}>
          {renderToggleRow()}

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipRow}
            style={styles.chipScroll}>
            {divisions.map((division) => {
              const isSelected = division.id === rankingsDivisionId;
              return (
                <TouchableOpacity
                  key={division.id}
                  style={[styles.chip, isSelected && styles.chipSelected]}
                  onPress={() => setChosenRankingsDivisionId(division.id)}>
                  <CustomText style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                    {division.title.toUpperCase()}
                  </CustomText>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {scored.length > 0 ? <SpiritPodium entries={podiumEntries} /> : null}
        </View>

        <View style={styles.listArea}>
          {scored.length === 0 ? (
            <View style={styles.emptyState}>
              <CustomText style={styles.emptyTitle}>No spirit scores yet.</CustomText>
              <CustomText style={styles.emptyMessage}>
                Rankings appear here once teams start reporting scores.
              </CustomText>
            </View>
          ) : (
            restRows.map((row, index) =>
              renderRankingCard(row, index + podiumRows.length + 1, avatarByTeam.get(row.team_id ?? 0) ?? null),
            )
          )}
        </View>
      </>
    );
  };

  return (
    <>
      <View style={styles.screen}>
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.content}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
          {tab === 'submit' ? renderSubmitTab() : renderRankingsTab()}
        </ScrollView>

        {/* Spirit Points & Games stays anchored while the rest scrolls */}
        {/* <View style={styles.footer}>
          <TouchableOpacity style={styles.pdfButton} onPress={openPDF}>
            <MaterialCommunityIcons name="file-pdf-box" size={24} color={ORANGE} />
            <View style={styles.buttonTextContainer}>
              <CustomText variant="textMedium" style={styles.pdfButtonText}>
                Spirit Points & Games
              </CustomText>
              <CustomText variant="textXSmall" style={styles.pdfButtonSubtext}>
                View the full document
              </CustomText>
            </View>
            <MaterialCommunityIcons name="open-in-new" size={20} color="#666" />
          </TouchableOpacity>
        </View> */}
      </View>

      <SpiritScoreModal
        visible={activeGame !== null}
        opponentName={activeGame?.opponent?.name ?? ''}
        submitting={submitting}
        onSubmit={handleSubmitScore}
        onClose={() => setActiveGame(null)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  gameCard: {
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 15,
  },
  gameInfo: {
    flex: 1,
    gap: 6,
  },
  gameHeader: {
    flexDirection: 'row',
    gap: 10,
  },
  gameDate: {
    ...typography.textXSmallBold,
    color: '#999',
  },
  gameTime: {
    ...typography.textXSmall,
    color: '#999',
  },
  gameTeamRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  gameAvatar: {
    borderRadius: 16,
    height: 27,
    width: 27,
  },
  opponentName: {
    ...typography.textSemiBold,
    color: '#242424',
    flex: 1,
  },
  opponentNameScored: {
    color: '#888',
  },
  scoredBadge: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 4,
  },
  scoredText: {
    ...typography.textSmallMedium,
    color: '#276B5D',
  },
  rateButton: {
    alignItems: 'center',
    backgroundColor: ORANGE,
    borderRadius: 8,
    height: 52,
    justifyContent: 'center',
    width: 52,
  },
  stepTitle: {
    ...typography.textSemiBold,
    color: '#ED8C22',
    marginBottom: 8,
  },
  divisionCard: {
    alignItems: 'center',
    backgroundColor: '#fff',
    borderBottomWidth: 4,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    padding: 16,
  },
  divisionCardTitle: {
    ...typography.heading4,
    textDecorationLine: 'underline',
  },
  emptyMessage: {
    ...typography.text,
    color: '#00000066',
    textAlign: 'center',
  },
  teamRow: {
    alignItems: 'center',
    borderBottomColor: '#EEE',
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 10,
  },
  teamRowSelected: {
    backgroundColor: '#FDF3E7',
  },
  teamRowName: {
    ...typography.textMedium,
    color: '#242424',
  },
  emptyState: {
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  emptyTitle: {
    ...typography.textLargeBold,
    color: '#838383',
    textAlign: 'center',
  },
  teamBar: {
    alignItems: 'center',
    backgroundColor: 'rgb(237, 139, 33, 0.15)',
    borderRadius: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  teamBarText: {
    flex: 1,
    gap: 2,
  },
  teamBarLabel: {
    ...typography.textXSmall,
    color: '#8A7A63',
  },
  teamBarName: {
    ...typography.textLargeBold,
    color: '#242424',
  },
  teamBarHint: {
    ...typography.textXSmall,
    color: '#8A7A63',
    marginTop: 2,
  },
  changeTeamText: {
    ...typography.textSmallBold,
    color: ORANGE,
    textDecorationLine: 'underline',
  },
  listArea: {
    backgroundColor: '#F2F2F2',
    gap: 10,
    padding: 15,
  },
  rankCard: {
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 15,
    paddingVertical: 12,
  },
  rankCardPosition: {
    ...typography.textSmallBold,
    color: '#555',
  },
  rankCardAvatar: {
    borderRadius: 16,
    height: 32,
    width: 32,
  },
  rankCardName: {
    ...typography.textSemiBold,
    color: '#000',
    flex: 1,
  },
  rankCardScores: {
    alignItems: 'center',
    gap: 2,
  },
  rankCardBadge: {
    backgroundColor: '#5B6472',
    borderRadius: 16,
    minWidth: 46,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  rankCardBadgeText: {
    ...typography.textBold,
    color: '#fff',
    textAlign: 'center',
  },
  rankCardCount: {
    ...typography.textXSmall,
    color: '#000',
  },
  chipRow: {
    gap: 7,
    paddingHorizontal: 15,
  },
  chipScroll: {
    marginHorizontal: -15,
  },
  chip: {
    backgroundColor: '#fff',
    borderColor: '#242424',
    borderRadius: 100,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 8,
  },
  chipSelected: {
    backgroundColor: '#000',
    borderColor: '#000',
  },
  chipText: {
    ...typography.textMedium,
    color: '#242424',
  },
  chipTextSelected: {
    color: '#fff',
  },
  screen: {
    backgroundColor: '#F2F2F2',
    flex: 1,
  },
  container: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
  },
  headerCard: {
    backgroundColor: '#fff',
    paddingHorizontal: 15,
    paddingTop: 20,
    paddingBottom: 15,
  },
  toggleRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  toggle: {
    backgroundColor: '#fff',
    borderColor: ORANGE,
    borderRadius: 12,
    borderWidth: 1,
    flex: 1,
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    boxShadow: '0px 2px 0px #ED8C22',
  },
  toggleSelected: {
    backgroundColor: ORANGE,
    boxShadow: '0px 0px 0px #ED8C22',
  },
  toggleText: {
    ...typography.heading5,
    color: '#242424',
  },
  toggleTextSelected: {
    color: '#fff',
    ...typography.textLargeBold,
  },
  footer: {
    backgroundColor: '#fff',
    borderTopColor: '#EEE',
    borderTopWidth: 1,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  pdfButton: {
    alignItems: 'center',
    backgroundColor: '#fff',
    borderColor: ORANGE,
    borderRadius: 12,
    borderWidth: 2,
    flexDirection: 'row',
    gap: 12,
    padding: 18,
  },
  buttonTextContainer: {
    flex: 1,
  },
  pdfButtonText: {
    color: '#333',
    marginBottom: 2,
  },
  pdfButtonSubtext: {
    color: '#666',
  },
  card: {
    backgroundColor: '#f8f8f8',
    borderLeftColor: ORANGE,
    borderLeftWidth: 4,
    borderRadius: 12,
    marginBottom: 20,
    padding: 20,
  },
  message: {
    color: '#333',
    lineHeight: 24,
  },
  name: {
    color: ORANGE,
  },
});
