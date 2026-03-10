// components/modals/ScoreUpdateModal.tsx
import React, { useMemo } from 'react';
import { View, StyleSheet, Modal, TextInput, TouchableOpacity } from 'react-native';
import { typography } from '@/constants/Typography';
import CustomText from '@/components/CustomText';
import { Dropdown } from '@/components/Dropdown';
import { DateTimeFilteredDropdown } from '@/components/DateTimeFilteredDropdown';
import { useDatetimeOptions } from '@/hooks/useDatetimeOptions';
import { useFieldOptions } from '@/hooks/useFieldOptions';
import { useTeamOptions } from '@/hooks/useTeamOptions';

interface UpdateScoreModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (
    team1Score: string,
    team2Score: string,
    datetimeId: number | null,
    fieldId: number | null,
    team1Id?: number | null,
    team2Id?: number | null,
  ) => void | Promise<void>;
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
  team1Id?: number | null;
  team2Id?: number | null;
  setTeam1Id?: (id: number | null) => void;
  setTeam2Id?: (id: number | null) => void;
  readOnlyDateTimeField?: boolean;
  showAdminFields?: boolean;
  divisionId?: number | null;
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
  team1Id,
  team2Id,
  setTeam1Id,
  setTeam2Id,
  readOnlyDateTimeField = false,
  showAdminFields = false,
  divisionId,
  isLoading = false,
}) => {
  const { datetimeOptions } = useDatetimeOptions();
  const { fieldOptions } = useFieldOptions();
  const { teamOptions } = useTeamOptions(divisionId);

  // Find selected datetime option for display
  const selectedDatetime = useMemo(() => {
    return datetimeOptions.find((option) => option.id === datetimeId);
  }, [datetimeOptions, datetimeId]);

  const handleDatetimeSelect = (selectedLabel: string) => {
    const selectedOption = datetimeOptions.find((option) => option.label === selectedLabel);
    if (selectedOption) {
      setDatetimeId(selectedOption.id);
    }
  };

  // Find selected field option for display
  const selectedField = useMemo(() => {
    return fieldOptions.find((option) => option.id === fieldId);
  }, [fieldOptions, fieldId]);

  const fieldLabels = useMemo(() => {
    return fieldOptions.map((option) => option.label);
  }, [fieldOptions]);

  const handleFieldSelect = (selectedLabel: string) => {
    const selectedOption = fieldOptions.find((option) => option.label === selectedLabel);
    if (selectedOption) {
      setFieldId(selectedOption.id);
    }
  };

  // Find selected team options for display
  const selectedTeam1 = useMemo(() => {
    return teamOptions.find((option) => option.id === team1Id);
  }, [teamOptions, team1Id]);

  const selectedTeam2 = useMemo(() => {
    return teamOptions.find((option) => option.id === team2Id);
  }, [teamOptions, team2Id]);

  const teamLabels = useMemo(() => {
    return teamOptions.map((option) => option.label);
  }, [teamOptions]);

  const handleTeam1Select = (selectedLabel: string) => {
    const selectedOption = teamOptions.find((option) => option.label === selectedLabel);
    if (selectedOption && setTeam1Id) {
      setTeam1Id(selectedOption.id);
    }
  };

  const handleTeam2Select = (selectedLabel: string) => {
    const selectedOption = teamOptions.find((option) => option.label === selectedLabel);
    if (selectedOption && setTeam2Id) {
      setTeam2Id(selectedOption.id);
    }
  };
  return (
    <Modal animationType="fade" transparent={true} visible={visible} onRequestClose={onClose}>
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

          {showAdminFields && (
            <>
              {/* Team Selection */}
              <View style={styles.modalFieldContainer}>
                <CustomText style={styles.modalFieldLabel}>Team 1</CustomText>
                <Dropdown
                  label="Select team 1"
                  data={teamLabels}
                  selectedValue={selectedTeam1?.label}
                  onSelect={handleTeam1Select}
                />
              </View>

              <View style={styles.modalFieldContainer}>
                <CustomText style={styles.modalFieldLabel}>Team 2</CustomText>
                <Dropdown
                  label="Select team 2"
                  data={teamLabels}
                  selectedValue={selectedTeam2?.label}
                  onSelect={handleTeam2Select}
                />
              </View>

              {/* Date & Time and Field */}
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
              disabled={isLoading}>
              <CustomText style={styles.modalCancelButtonText}>Cancel</CustomText>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalUpdateButton}
              onPress={() =>
                onSubmit(team1Score, team2Score, datetimeId, fieldId, team1Id, team2Id)
              }
              disabled={isLoading}>
              <CustomText style={styles.modalUpdateButtonText}>Update Game</CustomText>
            </TouchableOpacity>
          </View>
        </View>
      </View>
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
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    elevation: 5,
    marginTop: 70,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    width: '80%',
  },
  modalFieldContainer: {
    marginBottom: 15,
  },
  modalFieldInput: {
    borderColor: '#E0E0E0',
    borderRadius: 8,
    borderWidth: 1,
    padding: 12,
    ...typography.textMedium,
  },
  modalFieldLabel: {
    ...typography.textMedium,
    marginBottom: 5,
  },
  modalOverlay: {
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    flex: 1,
  },
  modalScoreInput: {
    height: '100%',
    textAlign: 'center',
    width: '100%',
    ...typography.heading3,
  },
  modalScoreInputContainer: {
    borderColor: '#E0E0E0',
    borderRadius: 8,
    borderWidth: 1,
    height: 40,
    width: 48,
  },
  modalTeamContainer: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
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
  readOnlyInput: {
    backgroundColor: '#F5F5F5',
    color: '#666',
  },
});

export default UpdateScoreModal;
