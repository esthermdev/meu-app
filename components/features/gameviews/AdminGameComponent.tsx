// components/AdminGameComponent.tsx
import React, { useEffect, useState } from 'react';
import { Alert, Image, Platform, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';

import CustomText from '@/components/CustomText';
import { typography } from '@/constants/Typography';
import { useAuth } from '@/context/AuthProvider';
import { hasPermission } from '@/context/profileRoles';
import { supabase } from '@/lib/supabase';
import { GameWithRelations } from '@/types/games';
import { formatDate } from '@/utils/formatDate';
import { formatTime } from '@/utils/formatTime';
import { updateGameScore } from '@/utils/updateGameScore';

import UpdateGameDetailsModal from '../modals/UpdateGameDetailsModal';
import { Feather } from '@expo/vector-icons';

interface AdminGameComponentProps {
  game: GameWithRelations;
  onGameStatusChange: () => void;
}

const AdminGameComponent: React.FC<AdminGameComponentProps> = ({ game, onGameStatusChange }) => {
  const { profile } = useAuth();
  const [team1Score, setTeam1Score] = useState<string>('0');
  const [team2Score, setTeam2Score] = useState<string>('0');
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [datetimeId, setDatetimeId] = useState<number | null>(null);
  const [fieldId, setFieldId] = useState<number | null>(null);
  const [team1Id, setTeam1Id] = useState<number | null>(null);
  const [team2Id, setTeam2Id] = useState<number | null>(null);
  const [isEditingScores, setIsEditingScores] = useState<boolean>(false);

  // Update the local state when the game prop changes
  useEffect(() => {
    if (game.scores && game.scores.length > 0) {
      setTeam1Score(game.scores[0].team1_score.toString());
      setTeam2Score(game.scores[0].team2_score.toString());
      setIsCompleted(game.scores[0].is_finished || false);
    } else {
      setTeam1Score('0');
      setTeam2Score('0');
      setIsCompleted(false);
    }

    // Update datetime, field, and team state
    setDatetimeId(game.datetime?.id || null);
    setFieldId(game.field?.id || null);
    setTeam1Id(game.team1?.id || -1); // -1 represents TBD
    setTeam2Id(game.team2?.id || -1); // -1 represents TBD
  }, [game]);

  const openScoreModal = () => {
    setModalVisible(true);
  };

  const handleStartScoreEdit = () => {
    if (isLoading) return;
    setIsEditingScores(true);
  };

  const handleSaveInlineScores = async () => {
    setIsLoading(true);

    const success = await updateGameScore({
      gameId: game.id,
      team1Score,
      team2Score,
      scoreId: game.scores && game.scores.length > 0 ? game.scores[0].id : null,
      datetimeId,
      fieldId,
      team1Id,
      team2Id,
      onSuccess: () => {
        setIsEditingScores(false);
        onGameStatusChange();
      },
    });

    setIsLoading(false);

    if (!success) {
      return;
    }
  };

  const submitDetails = async (
    selectedDatetimeId: number | null,
    selectedFieldId: number | null,
    selectedTeam1Id?: number | null,
    selectedTeam2Id?: number | null,
  ) => {
    setIsLoading(true);

    // Update local state immediately for UI feedback for non-score fields.
    setDatetimeId(selectedDatetimeId);
    setFieldId(selectedFieldId);
    if (selectedTeam1Id !== undefined) setTeam1Id(selectedTeam1Id);
    if (selectedTeam2Id !== undefined) setTeam2Id(selectedTeam2Id);

    const success = await updateGameScore({
      gameId: game.id,
      team1Score,
      team2Score,
      scoreId: game.scores && game.scores.length > 0 ? game.scores[0].id : null,
      datetimeId: selectedDatetimeId,
      fieldId: selectedFieldId,
      team1Id: selectedTeam1Id,
      team2Id: selectedTeam2Id,
      onSuccess: () => {
        setModalVisible(false);
        onGameStatusChange();
      },
    });

    setIsLoading(false);

    // Close modal on failure too (UI already has user's input values)
    if (!success) {
      setModalVisible(false);
    }
  };

  const handleMarkCompleted = async () => {
    setIsLoading(true);

    try {
      if (game) {
        // Check if the game already has a score record
        if (game.scores && game.scores.length > 0) {
          // Update existing score record
          const { error } = await supabase
            .from('scores')
            .update({
              is_finished: true,
            })
            .eq('id', game.scores[0].id);

          if (error) throw error;
        } else {
          // Create a new score record if none exists
          const { error } = await supabase.from('scores').insert({
            game_id: game.id,
            team1_score: parseInt(team1Score),
            team2_score: parseInt(team2Score),
            is_finished: true,
            round_id: game.round_id,
          });

          if (error) throw error;
        }

        // Update local state
        setIsCompleted(true);
        setIsEditingScores(false);

        // Notify parent component to refresh
        onGameStatusChange();
      }
    } catch (error) {
      console.error('Error marking game as completed:', error);
      Alert.alert('Error', 'Failed to mark game as completed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.gameCard}>
      <View style={styles.gameHeader}>
        <CustomText style={styles.dateText}>{formatDate(game.datetime?.date, 'short')}</CustomText>
        <View style={styles.timeContainer}>
          <CustomText style={styles.timeText}>{formatTime(game.datetime?.time)}</CustomText>
        </View>
        <CustomText style={styles.fieldText}>Field {game.field?.name}</CustomText>
      </View>

      {/* Teams and Score Container */}
      <View style={styles.matchupContainer}>
        {/* Left side: Teams */}
        <View style={styles.teamsSection}>
          {/* Team 1 */}
          <View style={styles.teamRow}>
            <Image
              source={
                game.team1?.avatar_uri
                  ? { uri: game.team1.avatar_uri }
                  : require('@/assets/images/avatar-placeholder.png')
              }
              style={styles.teamLogo}
            />
            <CustomText style={styles.teamText}>{game.team1?.name || 'TBD'}</CustomText>
            <View style={styles.scoresSection}>
              <View style={styles.scoreSlot}>
                {isEditingScores ? (
                  <TextInput
                    style={[styles.scoreInput, styles.scoreInputEditing]}
                    value={team1Score}
                    onChangeText={setTeam1Score}
                    keyboardType="number-pad"
                    allowFontScaling={false}
                    maxLength={3}
                  />
                ) : (
                  <CustomText style={styles.scoreInput}>{team1Score}</CustomText>
                )}
              </View>
            </View>
          </View>

          {/* Team 2 */}
          <View style={styles.teamRow}>
            <Image
              source={
                game.team2?.avatar_uri
                  ? { uri: game.team2.avatar_uri }
                  : require('@/assets/images/avatar-placeholder.png')
              }
              style={styles.teamLogo}
            />
            <CustomText style={styles.teamText}>{game.team2?.name || 'TBD'}</CustomText>
            <View style={styles.scoresSection}>
              <View style={styles.scoreSlot}>
                {isEditingScores ? (
                  <TextInput
                    style={[styles.scoreInput, styles.scoreInputEditing]}
                    value={team2Score}
                    onChangeText={setTeam2Score}
                    keyboardType="number-pad"
                    allowFontScaling={false}
                    maxLength={3}
                  />
                ) : (
                  <CustomText style={styles.scoreInput}>{team2Score}</CustomText>
                )}
              </View>
            </View>
          </View>
        </View>
      </View>

      {/* Action buttons */}
      <View style={styles.actionContainer}>
        <TouchableOpacity
          style={[styles.actionButton, styles.markCompletedButton, isCompleted && styles.completedButton]}
          onPress={handleMarkCompleted}
          disabled={isCompleted || isLoading}>
          <CustomText style={[styles.buttonText, isCompleted ? { color: '#ED8C22' } : { color: '#242424' }]}>
            {isCompleted ? 'Game Ended' : 'End Game'}
          </CustomText>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.actionButton, styles.updateScoreButton]} onPress={openScoreModal}>
          <CustomText style={styles.buttonText}>Edit Details</CustomText>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.editActionButton, styles.editScoresButton, isEditingScores && styles.saveScoresButton]}
          onPress={isEditingScores ? handleSaveInlineScores : handleStartScoreEdit}
          disabled={isLoading}
          accessibilityLabel={isEditingScores ? 'Save scores' : 'Edit scores'}>
          <Feather name={isEditingScores ? 'check' : 'edit'} size={20} color="#242424" />
        </TouchableOpacity>
      </View>

      <UpdateGameDetailsModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSubmit={submitDetails}
        datetimeId={datetimeId}
        fieldId={fieldId}
        setDatetimeId={setDatetimeId}
        setFieldId={setFieldId}
        team1Id={team1Id}
        team2Id={team2Id}
        setTeam1Id={setTeam1Id}
        setTeam2Id={setTeam2Id}
        showAdminFields={hasPermission(profile, 'manage_games')}
        divisionId={game.division_id}
        isLoading={isLoading}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  actionButton: {
    alignItems: 'center',
    borderRadius: 8,
    flex: 1,
    justifyContent: 'center',
    paddingVertical: 10,
  },
  editActionButton: {
    alignItems: 'center',
    borderRadius: 8,
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  actionContainer: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'space-between',
  },
  buttonText: {
    color: '#242424',
    ...typography.textSemiBold,
  },
  completedButton: {
    backgroundColor: '#242424',
    borderColor: '#ED8C22',
    borderWidth: 1,
  },
  dateText: {
    ...typography.textBold,
    color: '#CCCCCC',
    width: 100,
  },
  editScoresButton: {
    backgroundColor: '#BFBFBF',
    borderColor: '#BFBFBF',
    borderWidth: 1,
  },
  fieldText: {
    ...typography.textBold,
    color: '#CCCCCC',
    textAlign: 'right',
    width: 100,
  },
  gameCard: {
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    gap: 12,
    marginTop: 12,
    padding: 15,
  },
  gameHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  markCompletedButton: {
    backgroundColor: '#ED8C22',
    borderColor: '#ED8C22',
    borderWidth: 1,
  },
  matchupContainer: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  scoreInput: {
    color: '#FFF',
    height: 32,
    lineHeight: 28,
    minWidth: 32,
    paddingVertical: 0,
    ...typography.heading3,
    textAlign: 'right',
    ...(Platform.OS === 'android'
      ? { includeFontPadding: false as const, textAlignVertical: 'center' as const }
      : null),
  },
  scoreInputEditing: {
    color: '#ED8C22',
  },
  scoreSlot: {
    alignItems: 'flex-end',
    height: 32,
    justifyContent: 'center',
  },
  saveScoresButton: {
    backgroundColor: '#ED8C22',
    borderColor: '#ED8C22',
    borderWidth: 1,
  },
  scoresSection: {
    alignItems: 'flex-end',
    flex: 2,
    justifyContent: 'space-between',
  },
  teamLogo: {
    borderRadius: 14,
    height: 30,
    marginRight: 8,
    width: 30,
  },
  teamRow: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  teamText: {
    height: 32,
    ...typography.textLargeSemiBold,
    color: '#FFF',
  },
  teamsSection: {
    flex: 1,
    gap: 15,
    justifyContent: 'space-between',
  },
  timeContainer: {
    backgroundColor: '#EA1D253D',
    borderColor: '#EA1D25',
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 8,
  },
  timeText: {
    ...typography.text,
    color: '#fff',
  },
  updateScoreButton: {
    backgroundColor: '#CCCCCC',
    borderColor: '#CCCCCC',
    borderWidth: 1,
  },
});

export default AdminGameComponent;
