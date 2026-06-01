import React, { useState } from 'react';
import { Modal, StyleSheet, TouchableOpacity, View } from 'react-native';

import CustomText from '@/components/CustomText';
import { typography } from '@/constants/Typography';

interface ScorePickerModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (team1Score: string, team2Score: string) => void;
  initialTeam1Score: string;
  initialTeam2Score: string;
  team1Name: string;
  team2Name: string;
  isLoading: boolean;
}

const SCORES = Array.from({ length: 16 }, (_, i) => i);
const COLUMNS = 4;

const ScorePickerModal: React.FC<ScorePickerModalProps> = ({
  visible,
  onClose,
  onSave,
  initialTeam1Score,
  initialTeam2Score,
  team1Name,
  team2Name,
  isLoading,
}) => {
  const [team1Score, setTeam1Score] = useState(initialTeam1Score);
  const [team2Score, setTeam2Score] = useState(initialTeam2Score);

  // Reset local state when modal opens
  React.useEffect(() => {
    if (visible) {
      setTeam1Score(initialTeam1Score);
      setTeam2Score(initialTeam2Score);
    }
  }, [visible, initialTeam1Score, initialTeam2Score]);

  const renderGrid = (selectedScore: string, onSelect: (score: string) => void) => {
    const rows: number[][] = [];
    for (let i = 0; i < SCORES.length; i += COLUMNS) {
      rows.push(SCORES.slice(i, i + COLUMNS));
    }

    return (
      <View style={styles.grid}>
        {rows.map((row, rowIndex) => (
          <View key={rowIndex} style={styles.gridRow}>
            {row.map((score) => {
              const isSelected = score.toString() === selectedScore;
              return (
                <TouchableOpacity
                  key={score}
                  style={[styles.gridCell, isSelected && styles.gridCellSelected]}
                  onPress={() => onSelect(score.toString())}>
                  <CustomText style={[styles.gridCellText, isSelected && styles.gridCellTextSelected]}>
                    {score}
                  </CustomText>
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </View>
    );
  };

  return (
    <Modal animationType="fade" transparent={true} visible={visible} onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.content}>
          <CustomText style={styles.teamLabel}>{team1Name}</CustomText>
          {renderGrid(team1Score, setTeam1Score)}

          <CustomText style={styles.teamLabel}>{team2Name}</CustomText>
          {renderGrid(team2Score, setTeam2Score)}

          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.cancelButton} onPress={onClose} disabled={isLoading}>
              <CustomText style={styles.cancelButtonText}>Cancel</CustomText>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.saveButton}
              onPress={() => onSave(team1Score, team2Score)}
              disabled={isLoading}>
              <CustomText style={styles.saveButtonText}>Save</CustomText>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  grid: {
    gap: 8,
  },
  gridRow: {
    flexDirection: 'row',
    gap: 8,
  },
  gridCell: {
    flex: 1,
    aspectRatio: 2 / 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0F0F0',
    borderRadius: 8,
  },
  gridCellSelected: {
    backgroundColor: '#EA1D25',
  },
  gridCellText: {
    ...typography.textLargeBold,
    color: '#242424',
  },
  gridCellTextSelected: {
    color: '#fff',
  },
  overlay: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
  },
  content: {
    backgroundColor: '#fff',
    borderRadius: 12,
    elevation: 5,
    padding: 20,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    width: '80%',
  },
  teamLabel: {
    ...typography.textSemiBold,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  cancelButton: {
    backgroundColor: '#000000',
    borderRadius: 6,
    justifyContent: 'center',
    padding: 12,
    width: '48%',
  },
  cancelButtonText: {
    color: 'white',
    textAlign: 'center',
    ...typography.textMedium,
  },
  saveButton: {
    backgroundColor: '#EA1D25',
    borderRadius: 6,
    justifyContent: 'center',
    padding: 12,
    width: '48%',
  },
  saveButtonText: {
    color: 'white',
    textAlign: 'center',
    ...typography.textMedium,
  },
  title: {
    ...typography.heading4,
    textAlign: 'center',
  },
});

export default ScorePickerModal;
