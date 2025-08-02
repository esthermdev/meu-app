// components/modals/ScoreUpdateModal.tsx
import React, { useMemo } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { typography } from '@/constants/Typography';
import CustomText from '@/components/CustomText';
import { Dropdown } from '@/components/Dropdown';
import { DateTimeFilteredDropdown } from '@/components/DateTimeFilteredDropdown';
import { useDatetimeOptions } from '@/hooks/useDatetimeOptions';
import { useFieldOptions } from '@/hooks/useFieldOptions';
import { useAuth } from '@/context/AuthProvider';

interface UpdateScoreModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (team1Score: string, team2Score: string, datetimeId: number | null, fieldId: number | null) => void | Promise<void>;
  team1Name: string;
  team2Name: string;
  team1Score: string;
  team2Score: string;
  setTeam1Score: (score: string) => void;
  setTeam2Score: (score: string) => void;
  datetimeId: number | null;
  fieldId: number | null;
  setDatetimeId: (id: number | null) => void;
  setFieldId: (id: number | null) => void;
  readOnlyDateTimeField?: boolean;
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
  datetimeId,
  fieldId,
  setDatetimeId,
  setFieldId,
  readOnlyDateTimeField = false,
  isLoading = false,
}) => {
  const { datetimeOptions } = useDatetimeOptions();
  const { fieldOptions } = useFieldOptions();
  const { profile } = useAuth()
  
  // Find selected datetime option for display
  const selectedDatetime = useMemo(() => {
    return datetimeOptions.find(option => option.id === datetimeId);
  }, [datetimeOptions, datetimeId]);
  
  
  const handleDatetimeSelect = (selectedLabel: string) => {
    const selectedOption = datetimeOptions.find(option => option.label === selectedLabel);
    if (selectedOption) {
      setDatetimeId(selectedOption.id);
    }
  };
  
  // Find selected field option for display
  const selectedField = useMemo(() => {
    return fieldOptions.find(option => option.id === fieldId);
  }, [fieldOptions, fieldId]);
  
  const fieldLabels = useMemo(() => {
    return fieldOptions.map(option => option.label);
  }, [fieldOptions]);
  
  const handleFieldSelect = (selectedLabel: string) => {
    const selectedOption = fieldOptions.find(option => option.label === selectedLabel);
    if (selectedOption) {
      setFieldId(selectedOption.id);
    }
  };
  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <CustomText style={styles.modalTitle}>Update Game</CustomText>
          
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
          
          {profile?.is_admin && (
            <>
              <View style={styles.modalFieldContainer}>
                <CustomText style={styles.modalFieldLabel}>Date & Time</CustomText>
                {readOnlyDateTimeField ? (
                  <TextInput
                    style={[styles.modalFieldInput, styles.readOnlyInput]}
                    value={selectedDatetime?.label || ''}
                    editable={false}
                    allowFontScaling={false}
                  />
                ) : (
                  <DateTimeFilteredDropdown
                    label="Select date and time"
                    datetimeOptions={datetimeOptions}
                    selectedValue={selectedDatetime?.label}
                    onSelect={handleDatetimeSelect}
                  />
                )}
              </View>
              
              <View style={styles.modalFieldContainer}>
                <CustomText style={styles.modalFieldLabel}>Field</CustomText>
                {readOnlyDateTimeField ? (
                  <TextInput
                    style={[styles.modalFieldInput, styles.readOnlyInput]}
                    value={selectedField?.label || ''}
                    editable={false}
                    allowFontScaling={false}
                  />
                ) : (
                  <Dropdown
                    label="Select field"
                    data={fieldLabels}
                    selectedValue={selectedField?.label}
                    onSelect={handleFieldSelect}
                  />
                )}
              </View>
            </>
          )}
          
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
              onPress={() => onSubmit(team1Score, team2Score, datetimeId, fieldId)}
              disabled={isLoading}
            >
              <CustomText style={styles.modalUpdateButtonText}>Update Game</CustomText>
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
    alignItems: 'center',
  },
  modalContent: {
    marginTop: 70,
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
  modalFieldContainer: {
    marginBottom: 15,
  },
  modalFieldLabel: {
    ...typography.textMedium,
    marginBottom: 5,
  },
  modalFieldInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    ...typography.textMedium,
  },
  readOnlyInput: {
    backgroundColor: '#F5F5F5',
    color: '#666',
  },
});

export default UpdateScoreModal;