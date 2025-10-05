import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import {
  StyleSheet,
  Alert,
  View,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Dimensions,
  FlatList
} from 'react-native';
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { Tables } from '@/database.types';
import { typography } from '@/constants/Typography';
import ModalButton from '../../buttons/ModalButtons';
import CustomText from '../../CustomText';

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

  useEffect(() => {
    fetchFields();

    // Refresh fields every 10 seconds to update cooldown status
    const interval = setInterval(fetchFields, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchFields = async () => {
    // Fetch all fields
    const { data: fieldsData, error: fieldsError } = await supabase
      .from('fields')
      .select('*')
      .order('name');

    if (fieldsError) {
      console.error('Error fetching fields:', fieldsError);
      return;
    }

    // Fetch the most recent pending water request for each field
    const { data: requestsData, error: requestsError } = await supabase
      .from('water_requests')
      .select('field_number, created_at')
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (requestsError) {
      console.error('Error fetching water requests:', requestsError);
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
  };

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
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (insertError) throw insertError;

      const { data: volunteers, error: volunteerError } = await supabase
        .from('profiles')
        .select('id, expo_push_token')
        .eq('is_volunteer', true);

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
        item.isDisabled && styles.disabledFieldBlock
      ]}
      onPress={() => !item.isDisabled && selectField(item.id, item.name)}
      activeOpacity={item.isDisabled ? 1 : 0.7}
      disabled={item.isDisabled}
    >
      <CustomText
        style={[
          styles.fieldBlockText,
          selectedField === item.id && styles.selectedFieldText,
          item.isDisabled && styles.disabledFieldText
        ]}
        allowFontScaling
        maxFontSizeMultiplier={1.2}
      >
        {item.name}
      </CustomText>
    </TouchableOpacity>
  );

  return (
    <View>
      <TouchableOpacity
        style={styles.circleButton}
        onPress={showModal}
      >
        <MaterialIcons name="water-drop" size={28} color="#52B0BA" />
      </TouchableOpacity>
      <CustomText style={styles.label}>Water</CustomText>

      <Modal
        visible={isModalVisible}
        transparent={true}
        animationType='fade'
        onRequestClose={hideModal}
      >
        <TouchableWithoutFeedback onPress={hideModal}>
          <View style={styles.modalContainer}>
            <View style={styles.pickerContainer}>
              <CustomText style={styles.pickerTitle}>Select Field</CustomText>
              {selectedField && fields.find(f => f.id === selectedField)?.isDisabled && (
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
                <CustomText style={styles.selectionText}>
                  Selected: Field {selectedFieldName}
                </CustomText>
              </View>
              
              <ModalButton 
                onCancel={hideModal}
                onConfirm={requestWater}
                confirmText="Confirm"
              />
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
};

export default WaterRequestButton;

const styles = StyleSheet.create({
  circleButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#edebebff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  label: {
    textAlign: 'center',
    marginTop: 5,
    ...typography.labelBold
  },
  modalContainer: {
    flex: 1,
    paddingTop: 100,
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  pickerContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    width: '80%',
  },
  pickerTitle: {
    ...typography.heading4,
    textAlign: 'center',
    marginBottom: 15,
  },
  fieldGridContainer: {
    maxHeight: 300,
  },
  gridContent: {
    alignItems: 'center',
    justifyContent: 'center'
  },
  fieldBlock: {
    width: blockSize,
    height: blockSize,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F0F0F0',
    borderWidth: 1,
    borderColor: '#E0E0E0',
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
  selectionInfo: {
    marginTop: 10,
    padding: 10,
    backgroundColor: '#F9F9F9',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  selectionText: {
    ...typography.text,
    textAlign: 'center',
  },
  disabledNoteContainer: {
    marginVertical: 10,
    padding: 10,
    backgroundColor: '#FFEBEE',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FFCDD2',
  },
  disabledNote: {
    ...typography.label,
    textAlign: 'center',
    color: '#E74C3C',
  },
});