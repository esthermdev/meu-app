import React, { useRef } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  TextInput,
  TouchableOpacity,
  Platform,
  Dimensions,
  KeyboardAvoidingView,
} from 'react-native';
import { typography } from '@/constants/Typography';
import CustomText from '@/components/CustomText';

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
  const viewRef = useRef<View | null>(null);

  const handleInputFocus = () => {
    // Delay until keyboard animation completes. Android takes longer, so use a longer delay.
    const delay = Platform.OS === 'android' ? 300 : 150;
    setTimeout(() => {
      viewRef.current?.measure((x, y, width, inputHeight, pageX, pageY) => {
        const keyboardHeight = 300;
        const screenHeight = Dimensions.get('window').height;
        const inputBottomY = pageY + inputHeight;
        const overlap = inputBottomY + keyboardHeight - screenHeight;

        if (overlap > 0) {
          viewRef.current?.setNativeProps({ style: { transform: [{ translateY: -overlap }] } });
        }
      });
    }, delay);
  };

  return (
    <Modal animationType="fade" transparent={true} visible={visible} onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        enabled={true}
        keyboardVerticalOffset={Platform.OS === 'android' ? 1 : 0}
        style={styles.modalContainer}>
        <View style={styles.modalOverlay}>
          <View ref={viewRef} style={styles.modalContent}>
            <CustomText style={styles.modalTitle}>Update Score</CustomText>

            <View style={styles.modalTeamContainer}>
              <CustomText style={styles.modalTeamName}>{team1Name || 'Team 1'}</CustomText>
              <View style={styles.modalScoreInputContainer}>
                <TextInput
                  style={styles.modalScoreInput}
                  keyboardType="number-pad"
                  value={team1Score}
                  onChangeText={setTeam1Score}
                  onFocus={handleInputFocus}
                  maxLength={3}
                  allowFontScaling={false}
                />
              </View>
            </View>

            <View style={styles.modalTeamContainer}>
              <CustomText style={styles.modalTeamName}>{team2Name || 'Team 2'}</CustomText>
              <View style={styles.modalScoreInputContainer}>
                <TextInput
                  style={styles.modalScoreInput}
                  keyboardType="number-pad"
                  value={team2Score}
                  onChangeText={setTeam2Score}
                  onFocus={handleInputFocus}
                  maxLength={3}
                  allowFontScaling={false}
                />
              </View>
            </View>

            <View style={styles.modalButtonContainer}>
              <TouchableOpacity style={styles.modalCancelButton} onPress={onClose} disabled={isLoading}>
                <CustomText style={styles.modalCancelButtonText}>Cancel</CustomText>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalUpdateButton}
                onPress={() => onSubmit(team1Score, team2Score)}
                disabled={isLoading}>
                <CustomText style={styles.modalUpdateButtonText}>Update Score</CustomText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
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
    ...typography.textMedium,
  },
  modalContainer: {
    alignItems: 'center',
    flex: 1,
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
    width: '80%',
  },
  modalOverlay: {
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    flex: 1,
    justifyContent: 'center',
    width: '100%',
  },
  modalScoreInput: {
    flex: 1,
    ...typography.heading4,
    ...(Platform.OS === 'android'
      ? { includeFontPadding: false as const, textAlignVertical: 'center' as const }
      : null),
  },
  modalScoreInputContainer: {
    alignItems: 'center',
    borderColor: '#E0E0E0',
    borderRadius: 8,
    borderWidth: 1,
    height: 50,
    justifyContent: 'center',
    width: 50,
  },
  modalTeamContainer: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  modalTeamName: {
    ...typography.heading5,
    flex: 1,
  },
  modalTitle: {
    ...typography.heading4,
    marginBottom: 15,
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
    ...typography.textMedium,
  },
});

export default UpdateGameScoreModal;
