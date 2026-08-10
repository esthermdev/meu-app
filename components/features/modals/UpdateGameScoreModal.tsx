import React from 'react';
import { Dimensions, Modal, StyleSheet, TouchableOpacity, View } from 'react-native';

import { CounterInput } from '@/components/CounterInput';
import CustomText from '@/components/CustomText';
import { typography } from '@/constants/Typography';

interface UpdateGameScoreModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (team1Score: string, team2Score: string) => void | Promise<void>;
  team1Name: string;
  team2Name: string;
  team1Score: string;
  team2Score: string;
  setTeam1Score: (score: string) => void;
  setTeam2Score: (score: string) => void;
  isLoading?: boolean;
}

const { height } = Dimensions.get('window');
const modalHeight = height * 0.45;

const MIN_SCORE = 0;
const MAX_SCORE = 15;

const parseScore = (score: string) => {
  const parsed = parseInt(score, 10);
  return isNaN(parsed) ? MIN_SCORE : Math.min(Math.max(parsed, MIN_SCORE), MAX_SCORE);
};

const UpdateGameScoreModal: React.FC<UpdateGameScoreModalProps> = ({
  visible,
  onClose,
  onSubmit,
  team1Name,
  team2Name,
  team1Score,
  team2Score,
  setTeam1Score,
  setTeam2Score,
  isLoading = false,
}) => {
  return (
    <Modal animationType="fade" transparent={true} visible={visible} onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <CustomText style={styles.modalTitle}>Update Score</CustomText>

          <View style={styles.modalTeamContainer}>
            <CustomText style={styles.modalTeamName}>{team1Name || 'Team 1'}</CustomText>
            <CounterInput
              value={parseScore(team1Score)}
              onValueChange={(score) => setTeam1Score(score.toString())}
              min={MIN_SCORE}
              max={MAX_SCORE}
              label={`${team1Name || 'Team 1'} score`}
            />
          </View>

          <View style={styles.modalTeamContainer}>
            <CustomText style={styles.modalTeamName}>{team2Name || 'Team 2'}</CustomText>
            <CounterInput
              value={parseScore(team2Score)}
              onValueChange={(score) => setTeam2Score(score.toString())}
              min={MIN_SCORE}
              max={MAX_SCORE}
              label={`${team2Name || 'Team 2'} score`}
            />
          </View>

          <View style={styles.modalButtonContainer}>
            <TouchableOpacity style={styles.modalCancelButton} onPress={onClose} disabled={isLoading}>
              <CustomText style={styles.modalCancelButtonText}>Cancel</CustomText>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalUpdateButton}
              onPress={() => onSubmit(parseScore(team1Score).toString(), parseScore(team2Score).toString())}
              disabled={isLoading}>
              <CustomText style={styles.modalUpdateButtonText}>Update Score</CustomText>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    flex: 1,
    justifyContent: 'center',
    width: '100%',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    elevation: 5,
    maxHeight: modalHeight,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    width: '90%',
  },
  modalTitle: {
    ...typography.heading4,
    marginBottom: 15,
  },
  modalTeamContainer: {
    gap: 10,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  modalTeamName: {
    ...typography.textMedium,
    flex: 1,
  },
  modalButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  modalCancelButton: {
    backgroundColor: '#000000',
    borderRadius: 6,
    justifyContent: 'center',
    padding: 12,
    width: '48%',
  },
  modalCancelButtonText: {
    color: 'white',
    textAlign: 'center',
    ...typography.textSemiBold,
  },
  modalUpdateButton: {
    backgroundColor: '#EA1D25',
    borderRadius: 6,
    justifyContent: 'center',
    padding: 12,
    width: '48%',
  },
  modalUpdateButtonText: {
    color: 'white',
    textAlign: 'center',
    ...typography.textSemiBold,
  },
});

export default UpdateGameScoreModal;
