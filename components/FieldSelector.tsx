import { useEffect, useState } from 'react';
import {
  Dimensions,
  FlatList,
  Modal,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';

import { typography } from '@/constants/Typography';

import ModalButton from './buttons/ModalButtons';
import CustomText from './CustomText';
import Ionicons from '@expo/vector-icons/Ionicons';

const { width } = Dimensions.get('window');
const DEFAULT_COLUMNS = 5; // Number of columns in the grid
const blockSize = (width * 0.8 - 60) / DEFAULT_COLUMNS; // Calculate block size based on screen width

export interface FieldOption {
  id: number;
  name: string;
  isDisabled?: boolean;
}

interface FieldGridProps {
  fields: FieldOption[];
  selectedFieldId?: number;
  onSelectField: (field: FieldOption) => void;
  numColumns?: number;
}

/**
 * Grid of tappable field blocks. Disabled fields (e.g. on cooldown) are dimmed and inert.
 */
export const FieldGrid = ({ fields, selectedFieldId, onSelectField, numColumns = DEFAULT_COLUMNS }: FieldGridProps) => {
  const renderFieldBlock = ({ item }: { item: FieldOption }) => (
    <TouchableOpacity
      style={[
        styles.fieldBlock,
        selectedFieldId === item.id && styles.selectedFieldBlock,
        item.isDisabled && styles.disabledFieldBlock,
      ]}
      onPress={() => !item.isDisabled && onSelectField(item)}
      activeOpacity={item.isDisabled ? 1 : 0.7}
      disabled={item.isDisabled}>
      <CustomText
        style={[
          styles.fieldBlockText,
          selectedFieldId === item.id && styles.selectedFieldText,
          item.isDisabled && styles.disabledFieldText,
        ]}
        allowFontScaling
        maxFontSizeMultiplier={1.2}>
        {item.name}
      </CustomText>
    </TouchableOpacity>
  );

  return (
    <View style={styles.fieldGridContainer}>
      <FlatList
        data={fields}
        numColumns={numColumns}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderFieldBlock}
        contentContainerStyle={styles.gridContent}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

interface FieldSelectorProps {
  fields: FieldOption[];
  selectedFieldId?: number;
  onSelect: (field: FieldOption) => void;
  /** Placeholder shown on the trigger button when nothing is selected. */
  label?: string;
  /** Title shown at the top of the picker. */
  title?: string;
  /** Note shown when the currently selected field is disabled. */
  disabledNote?: string;
  error?: boolean;
  /** Called when the picker opens, e.g. to refresh field availability. */
  onOpen?: () => void;
}

/**
 * Drop-in replacement for the field <Dropdown />: a trigger button that opens a
 * grid of field blocks to pick from, mirroring the water request field picker.
 */
export const FieldSelector = ({
  fields,
  selectedFieldId,
  onSelect,
  label = 'Select Field',
  title = 'Select Field',
  disabledNote,
  error,
  onOpen,
}: FieldSelectorProps) => {
  const [isVisible, setIsVisible] = useState(false);
  // Draft selection so cancelling leaves the committed value untouched
  const [pendingFieldId, setPendingFieldId] = useState<number | undefined>(selectedFieldId);

  useEffect(() => {
    setPendingFieldId(selectedFieldId);
  }, [selectedFieldId]);

  const selectedFieldName = fields.find((field) => field.id === selectedFieldId)?.name;
  const pendingField = fields.find((field) => field.id === pendingFieldId);

  const showPicker = () => {
    setPendingFieldId(selectedFieldId);
    setIsVisible(true);
    onOpen?.();
  };

  const hidePicker = () => {
    setIsVisible(false);
  };

  const handleConfirm = () => {
    if (pendingField && !pendingField.isDisabled) {
      onSelect(pendingField);
    }
    hidePicker();
  };

  return (
    <View>
      <TouchableOpacity style={[styles.triggerButton, error && styles.triggerButtonError]} onPress={showPicker}>
        <CustomText
          style={[styles.triggerText, !selectedFieldName && styles.triggerPlaceholder]}
          allowFontScaling
          maxFontSizeMultiplier={1.1}
          numberOfLines={1}>
          {selectedFieldName || label}
        </CustomText>
        <Ionicons name="grid-outline" size={18} color="#333" />
      </TouchableOpacity>

      <Modal visible={isVisible} transparent={true} animationType="fade" onRequestClose={hidePicker}>
        <TouchableWithoutFeedback onPress={hidePicker}>
          <View style={styles.modalContainer}>
            <TouchableWithoutFeedback>
              <View style={styles.pickerContainer}>
                <CustomText style={styles.pickerTitle}>{title}</CustomText>
                {disabledNote && pendingField?.isDisabled && (
                  <View style={styles.disabledNoteContainer}>
                    <CustomText style={styles.disabledNote}>{disabledNote}</CustomText>
                  </View>
                )}

                <FieldGrid
                  fields={fields}
                  selectedFieldId={pendingFieldId}
                  onSelectField={(field) => setPendingFieldId(field.id)}
                />

                <View style={styles.selectionInfo}>
                  <CustomText style={styles.selectionText}>
                    {pendingField ? `Selected: Field ${pendingField.name}` : 'No field selected'}
                  </CustomText>
                </View>

                <ModalButton onCancel={hidePicker} onConfirm={handleConfirm} confirmText="Confirm" />
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  fieldBlock: {
    alignItems: 'center',
    backgroundColor: '#F0F0F0',
    borderColor: '#E0E0E0',
    borderWidth: 1,
    height: blockSize,
    justifyContent: 'center',
    width: blockSize,
  },
  selectedFieldBlock: {
    backgroundColor: '#E74C3C',
    borderColor: '#C0392B',
  },
  disabledFieldBlock: {
    backgroundColor: '#D0D0D0',
    borderColor: '#B0B0B0',
    opacity: 0.5,
  },
  fieldBlockText: {
    ...typography.labelBold,
    textAlign: 'center',
  },
  selectedFieldText: {
    color: '#fff',
  },
  disabledFieldText: {
    color: '#999',
  },
  fieldGridContainer: {
    maxHeight: 300,
  },
  gridContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  triggerButton: {
    alignItems: 'center',
    borderColor: '#ccc',
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 4,
    justifyContent: 'space-between',
    padding: 10,
  },
  triggerButtonError: {
    borderColor: '#EA1D25',
  },
  triggerText: {
    ...typography.textMedium,
    flexShrink: 1,
  },
  triggerPlaceholder: {
    color: '#666',
  },
  modalContainer: {
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    flex: 1,
    paddingTop: 100,
  },
  pickerContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    width: '80%',
  },
  pickerTitle: {
    ...typography.heading4,
    marginBottom: 15,
    textAlign: 'center',
  },
  disabledNoteContainer: {
    backgroundColor: '#FFEBEE',
    borderColor: '#FFCDD2',
    borderRadius: 8,
    borderWidth: 1,
    marginVertical: 10,
    padding: 10,
  },
  disabledNote: {
    ...typography.label,
    color: '#E74C3C',
    textAlign: 'center',
  },
  selectionInfo: {
    backgroundColor: '#F9F9F9',
    borderColor: '#E0E0E0',
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 10,
    padding: 10,
  },
  selectionText: {
    ...typography.text,
    textAlign: 'center',
  },
});

export default FieldSelector;
