import React, { useMemo } from 'react';
import { Dimensions, KeyboardAvoidingView, Modal, Platform, StyleSheet, TouchableOpacity, View } from 'react-native';

import CustomText from '@/components/CustomText';
import { DateTimeFilteredDropdown } from '@/components/DateTimeFilteredDropdown';
import { Dropdown } from '@/components/Dropdown';
import { typography } from '@/constants/Typography';
import { useDatetimeOptions } from '@/hooks/useDatetimeOptions';
import { useFieldOptions } from '@/hooks/useFieldOptions';
import { useTeamOptionsByDivision } from '@/hooks/useTeamOptionsByDivision';

interface UpdateGameDetailsModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (
    datetimeId: number | null,
    fieldId: number | null,
    team1Id?: number | null,
    team2Id?: number | null,
  ) => void | Promise<void>;
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

const { height } = Dimensions.get('window');
const modalHeight = height * 0.6;

const UpdateGameDetailsModal: React.FC<UpdateGameDetailsModalProps> = ({
  visible,
  onClose,
  onSubmit,
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
  const { teamOptions } = useTeamOptionsByDivision(divisionId);

  const selectedDatetime = useMemo(() => {
    return datetimeOptions.find((option) => option.id === datetimeId);
  }, [datetimeOptions, datetimeId]);

  const handleDatetimeSelect = (selectedLabel: string) => {
    const selectedOption = datetimeOptions.find((option) => option.label === selectedLabel);
    if (selectedOption) {
      setDatetimeId(selectedOption.id);
    }
  };

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
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        enabled={true}
        keyboardVerticalOffset={Platform.OS === 'android' ? 1 : 0}
        style={styles.modalContainer}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <CustomText style={styles.modalTitle}>Update Game Details</CustomText>

            <View>
              <CustomText style={styles.modalFieldLabel}>Team 1</CustomText>
              <Dropdown
                label="Select team 1"
                data={teamLabels}
                selectedValue={selectedTeam1?.label}
                onSelect={handleTeam1Select}
              />
            </View>

            <View>
              <CustomText style={styles.modalFieldLabel}>Team 2</CustomText>
              <Dropdown
                label="Select team 2"
                data={teamLabels}
                selectedValue={selectedTeam2?.label}
                onSelect={handleTeam2Select}
              />
            </View>

            <View>
              <CustomText style={styles.modalFieldLabel}>Date & Time</CustomText>
              <DateTimeFilteredDropdown
                label="Select date and time"
                datetimeOptions={datetimeOptions}
                selectedValue={selectedDatetime?.label}
                onSelect={handleDatetimeSelect}
              />
            </View>

            <View>
              <CustomText style={styles.modalFieldLabel}>Field</CustomText>
              <Dropdown
                label="Select field"
                data={fieldLabels}
                selectedValue={selectedField?.label}
                onSelect={handleFieldSelect}
              />
            </View>

            <View style={styles.modalButtonContainer}>
              <TouchableOpacity style={styles.modalCancelButton} onPress={onClose} disabled={isLoading}>
                <CustomText style={styles.modalCancelButtonText}>Cancel</CustomText>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalUpdateButton}
                onPress={() => onSubmit(datetimeId, fieldId, team1Id, team2Id)}
                disabled={isLoading}>
                <CustomText style={styles.modalUpdateButtonText}>Save</CustomText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    alignItems: 'center',
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    width: '100%',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    elevation: 5,
    maxHeight: modalHeight,
    padding: 20,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    width: '80%',
  },
  modalTitle: {
    ...typography.heading4,
    marginBottom: 5,
  },
  modalFieldLabel: {
    ...typography.textMedium,
    marginBottom: 3,
  },
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
  modalFieldContainer: {
    flex: 1,
  },
  modalFieldInput: {
    borderColor: '#E0E0E0',
    borderRadius: 8,
    borderWidth: 1,
    padding: 12,
    ...typography.textMedium,
  },
  readOnlyInput: {
    backgroundColor: '#F5F5F5',
    color: '#666',
  },
});

export default UpdateGameDetailsModal;
