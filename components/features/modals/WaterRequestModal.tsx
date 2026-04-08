import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Dimensions,
  FlatList,
  Modal,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';

import { typography } from '@/constants/Typography';
import { Tables } from '@/database.types';
import { supabase } from '@/lib/supabase';

import ModalButton from '../../buttons/ModalButtons';
import CustomText from '../../CustomText';
import { MaterialIcons } from '@expo/vector-icons';

type Field = Tables<'fields'>;

const { width } = Dimensions.get('window');
const numColumns = 5; // Number of columns in the grid
const blockSize = (width * 0.8 - 60) / numColumns; // Calculate block size based on screen width

type FieldWithCooldown = Field & {
  isDisabled: boolean;
  lastRequestTime?: string;
};

const WaterRequestButton = () => {
  const [selectedField, setSelectedField] = useState<number | undefined>(undefined);
  const [selectedFieldName, setSelectedFieldName] = useState<string>('');
  const [fields, setFields] = useState<FieldWithCooldown[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);

  const fetchFields = useCallback(async () => {
    // Fetch all fields
    const { data: fieldsData, error: fieldsError } = await supabase.from('fields').select('*').order('name');

    if (fieldsError) {
      console.error('Error fetching fields:', {
        code: fieldsError.code,
        details: fieldsError.details,
        hint: fieldsError.hint,
        message: fieldsError.message,
      });
      return;
    }

    // Fetch the most recent pending water request for each field
    const { data: requestsData, error: requestsError } = await supabase
      .from('water_requests')
      .select('field_number, created_at')
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (requestsError) {
      console.error('Error fetching water requests:', {
        code: requestsError.code,
        details: requestsError.details,
        hint: requestsError.hint,
        message: requestsError.message,
      });
    }

    // Create a map of field_number to most recent request time
    const fieldRequestMap = new Map<number, string>();
    requestsData?.forEach((request) => {
      if (request.field_number && !fieldRequestMap.has(request.field_number)) {
        fieldRequestMap.set(request.field_number, request.created_at!);
      }
    });

    // Add cooldown status to each field
    const now = new Date();
    const fieldsWithCooldown: FieldWithCooldown[] = (fieldsData || []).map((field) => {
      const lastRequestTime = fieldRequestMap.get(field.id);
      let isDisabled = false;

      if (lastRequestTime) {
        const requestTime = new Date(lastRequestTime);
        const timeDiffMinutes = (now.getTime() - requestTime.getTime()) / (1000 * 60);
        isDisabled = timeDiffMinutes < 2; // Disable if less than 2 minutes have passed
      }

      return {
        ...field,
        isDisabled,
        lastRequestTime,
      };
    });

    setFields(fieldsWithCooldown);
  }, []);

  useEffect(() => {
    if (!isModalVisible) {
      return;
    }

    fetchFields();

    // Refresh fields every 10 seconds to update cooldown status
    const interval = setInterval(fetchFields, 10000);
    return () => clearInterval(interval);
  }, [fetchFields, isModalVisible]);

  const showModal = () => {
    setIsModalVisible(true);
  };

  const hideModal = () => {
    setIsModalVisible(false);
  };

  const selectField = (id: number, name: string) => {
    setSelectedField(id);
    setSelectedFieldName(name);
  };

  const requestWater = async () => {
    if (selectedField === undefined) {
      Alert.alert('Error', 'Please select a field');
      return;
    }

    // Check if the selected field is disabled
    const selectedFieldData = fields.find((f) => f.id === selectedField);
    if (selectedFieldData?.isDisabled) {
      Alert.alert('Error', 'This field has a pending water request. Please wait 2 minutes before requesting again.');
      return;
    }

    try {
      // Create a single water refill request
      const { error: insertError } = await supabase
        .from('water_requests')
        .insert({
          field_number: selectedField,
          status: 'pending',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (insertError) throw insertError;

      const { data: volunteers, error: volunteerError } = await supabase
        .from('profiles')
        .select('id, expo_push_token, profile_roles!inner(roles!inner(key))')
        .eq('profile_roles.roles.key', 'volunteer');

      if (volunteerError) throw volunteerError;

      if (!volunteers || volunteers.length === 0) {
        throw new Error('No volunteers available');
      }
      hideModal();
      Alert.alert('Water Requested', 'Volunteers will attend to your request shortly.');
    } catch (error) {
      console.error('Error requesting water:', error);
      Alert.alert('Error', 'Failed to request water jug refill');
    }
  };

  const renderFieldBlock = ({ item }: { item: FieldWithCooldown }) => (
    <TouchableOpacity
      style={[
        styles.fieldBlock,
        selectedField === item.id && styles.selectedFieldBlock,
        item.isDisabled && styles.disabledFieldBlock,
      ]}
      onPress={() => !item.isDisabled && selectField(item.id, item.name)}
      activeOpacity={item.isDisabled ? 1 : 0.7}
      disabled={item.isDisabled}>
      <CustomText
        style={[
          styles.fieldBlockText,
          selectedField === item.id && styles.selectedFieldText,
          item.isDisabled && styles.disabledFieldText,
        ]}
        allowFontScaling
        maxFontSizeMultiplier={1.2}>
        {item.name}
      </CustomText>
    </TouchableOpacity>
  );

  return (
    <View>
      <TouchableOpacity style={styles.circleButton} onPress={showModal}>
        <MaterialIcons name="water-drop" size={28} color="#4357AD" />
      </TouchableOpacity>
      <CustomText style={styles.label}>Water</CustomText>

      <Modal visible={isModalVisible} transparent={true} animationType="fade" onRequestClose={hideModal}>
        <TouchableWithoutFeedback onPress={hideModal}>
          <View style={styles.modalContainer}>
            <TouchableWithoutFeedback>
              <View style={styles.pickerContainer}>
                <CustomText style={styles.pickerTitle}>Select Field</CustomText>
                {selectedField && fields.find((f) => f.id === selectedField)?.isDisabled && (
                  <View style={styles.disabledNoteContainer}>
                    <CustomText style={styles.disabledNote}>
                      Water has already been requested for this field. Try again in 2 minutes.
                    </CustomText>
                  </View>
                )}
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

                <View style={styles.selectionInfo}>
                  <CustomText style={styles.selectionText}>Selected: Field {selectedFieldName}</CustomText>
                </View>

                <ModalButton onCancel={hideModal} onConfirm={requestWater} confirmText="Confirm" />
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
};

export default WaterRequestButton;

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
  circleButton: {
    alignItems: 'center',
    backgroundColor: '#edebebff',
    borderRadius: 35,
    height: 70,
    justifyContent: 'center',
    width: 70,
  },
  label: {
    marginTop: 5,
    textAlign: 'center',
    ...typography.labelBold,
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
  fieldGridContainer: {
    maxHeight: 300,
  },
  gridContent: {
    alignItems: 'center',
    justifyContent: 'center',
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
