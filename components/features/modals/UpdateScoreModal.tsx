// components/modals/ScoreUpdateModal.tsx
import React from 'react';
import {
  View,
  StyleSheet,
  Modal,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { typography } from '@/constants/Typography';
import CustomText from '@/components/CustomText';

interface UpdateScoreModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (team1Score: string, team2Score: string) => void;
  team1Name: string;
  team2Name: string;
  team1Score: string;
  team2Score: string;
  setTeam1Score: (score: string) => void;
  setTeam2Score: (score: string) => void;
  isLoading?: boolean;
}

const UpdateScoreModal: React.FC<UpdateScoreModalProps> = ({
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
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <CustomText style={styles.modalTitle}>Update Score</CustomText>
          
          {/* Team 1 Score */}
          <View style={styles.modalTeamContainer}>
            <CustomText style={styles.modalTeamName}>{team1Name || 'Team 1'}</CustomText>
            <View style={styles.modalScoreInputContainer}>
              <TextInput
                style={styles.modalScoreInput}
                keyboardType="number-pad"
                value={team1Score}
                onChangeText={setTeam1Score}
                maxLength={3}
                allowFontScaling={false}
              />
            </View>
          </View>
          
          {/* Team 2 Score */}
          <View style={styles.modalTeamContainer}>
            <CustomText style={styles.modalTeamName}>{team2Name || 'Team 2'}</CustomText>
            <View style={styles.modalScoreInputContainer}>
              <TextInput
                style={styles.modalScoreInput}
                keyboardType="number-pad"
                value={team2Score}
                onChangeText={setTeam2Score}
                maxLength={3}
                allowFontScaling={false}
              />
            </View>
          </View>
          
          {/* Action Buttons */}
          <View style={styles.modalButtonContainer}>
            <TouchableOpacity 
              style={styles.modalCancelButton}
              onPress={onClose}
              disabled={isLoading}
            >
              <CustomText style={styles.modalCancelButtonText}>Cancel</CustomText>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.modalUpdateButton}
              onPress={() => onSubmit(team1Score, team2Score)}
              disabled={isLoading}
            >
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
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '80%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    ...typography.heading4,
    marginBottom: 15
  },
  modalTeamContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  modalTeamName: {
    ...typography.heading5,
    flex: 1,
  },
  modalScoreInputContainer: {
    width: 48,
    height: 40,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
  },
  modalScoreInput: {
    width: '100%',
    height: '100%',
    textAlign: 'center',
    ...typography.heading3,
  },
  modalButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalCancelButton: {
    backgroundColor: '#000000',
    padding: 12,
    borderRadius: 6,
    width: '48%',
    justifyContent: 'center',
  },
  modalCancelButtonText: {
    color: 'white',
    textAlign: 'center',
    ...typography.textMedium
  },
  modalUpdateButton: {
    backgroundColor: '#EA1D25',
    padding: 12,
    borderRadius: 6,
    width: '48%',
    justifyContent: 'center',
  },
  modalUpdateButtonText: {
    color: 'white',
    textAlign: 'center',
    ...typography.textMedium
  },
});

export default UpdateScoreModal;