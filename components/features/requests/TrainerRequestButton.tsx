import { useState, useEffect } from 'react';
import { Database } from '@/database.types';
import {
  StyleSheet,
  Text,
  Alert,
  View,
  Modal,
  TouchableOpacity,
  Dimensions,
  TouchableWithoutFeedback,
  Platform,
  KeyboardAvoidingView,
  TextInput
} from 'react-native';
import { supabase } from '@/lib/supabase';
import { ScrollView } from 'react-native-gesture-handler';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { typography } from '@/constants/Typography';
import Ionicons from '@expo/vector-icons/Ionicons';
import ModalButton from '../../buttons/ModalButtons';
import Dropdown from '../../Dropdown';
import ErrorMessage from '../../ErrorMessage';
import CustomText from '../../CustomText';

const { height } = Dimensions.get('window');
const modalHeight = height * 0.8; // 80% of screen height

// Define types from your database schema
type RequestStatus = Database['public']['Enums']['request_status'];

// Define priority level type
type PriorityLevel = 'High' | 'Medium' | 'Low';

const FIELD_PLACEHOLDER = "Select Field";

const TrainerRequestButton = () => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [priorityLevel, setPriorityLevel] = useState<PriorityLevel>('Medium');
  const [description, setDescription] = useState<string | undefined>('')
  const [fields, setFields] = useState<{ id: number; name: string }[]>([]);
  const [selectedField, setSelectedField] = useState<number | undefined>(undefined);
  const [selectedFieldLabel, setSelectedFieldLabel] = useState<string>(FIELD_PLACEHOLDER);
  // Error states
  const [errors, setErrors] = useState<{
    field?: string;
    description?: string;
    general?: string;
  }>({});

  useEffect(() => {
    fetchFields();
  }, []);

  const fetchFields = async () => {
    const { data, error } = await supabase
      .from('fields')
      .select('id, name');

    if (error) {
      console.error('Error fetching fields:', error);
    } else if (data) {
      setFields(data);
      if (data.length > 0) {
        setSelectedField(data[0].id);
        setSelectedFieldLabel(FIELD_PLACEHOLDER);
      }
    }
  };

  const handleFieldSelect = (fieldLabel: string) => {
    if (fieldLabel === FIELD_PLACEHOLDER) return;

    // Extract the field ID from the label (e.g., "Field 1" -> 1)
    const fieldId = parseInt(fieldLabel.replace('Field ', ''), 10);
    setSelectedField(fieldId);
    setSelectedFieldLabel(fieldLabel);

    // Clear the field error when a valid selection is made
    if (errors.field) {
      setErrors(prev => ({ ...prev, field: undefined }));
    }
  };

  const requestTrainer = async () => {
    if (!validateForm()) {
      return; // Stop if validation fails
    }

    try {
      if (selectedField === undefined) {
        Alert.alert('Error', 'Please select a field');
        return;
      }

      // Create medical request with proper types
      const insertData: Database['public']['Tables']['medical_requests']['Insert'] = {
        field_number: selectedField,
        status: 'pending' as RequestStatus,
        priority_level: priorityLevel,
        description_of_emergency: description,
        created_at: new Date().toISOString()
      };

      const { error: insertError } = await supabase
        .from('medical_requests')
        .insert(insertData)
        .select()
        .single();

      if (insertError) throw insertError;

      const { data: medicStaff, error: staffError } = await supabase
        .from('profiles')
        .select('id, expo_push_token')
        .eq('is_medical_staff', true);

      if (staffError) throw staffError;

      if (!medicStaff || medicStaff.length === 0) {
        throw new Error('No medical staff available');
      }

      Alert.alert(
        'Trainer Requested',
        'Help is on the way. Please allow some time for a trainer to make their way to your location. If no trainer has arrived please try again later as trainers may be unavailable at the moment.'
      );
      setDescription('')
      setPriorityLevel('Medium')
      setIsModalVisible(false);

    } catch (error) {
      console.error('Error requesting medical assistance:', error);
      Alert.alert('Error', 'Failed to request medical assistance');
    }
  };

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    // More specific validation for field selection
    if (selectedField === undefined || selectedFieldLabel === 'Select Field' || selectedFieldLabel === '') {
      newErrors.field = "Please select a field number";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCloseModal = () => {
    setIsModalVisible(false);
    setDescription('');
    setPriorityLevel('Medium')
    setSelectedField(undefined);
    setSelectedFieldLabel(FIELD_PLACEHOLDER);
    setErrors({});
  };

  const renderPriorityButton = (level: PriorityLevel, color: string) => (
    <TouchableOpacity
      style={[styles.priorityButton, { backgroundColor: color }, priorityLevel === level && styles.selected]}
      onPress={() => setPriorityLevel(level)}
      activeOpacity={1}
    >
      <CustomText style={styles.priorityButtonText}>{level}</CustomText>
    </TouchableOpacity>
  );

  // Prepare field labels for dropdown
  const fieldLabels = fields.map(field => `Field ${field.id}`);

  return (
    <View>
      <TouchableOpacity
        style={styles.circleButton}
        onPress={() => setIsModalVisible(true)}
      >
        <MaterialCommunityIcons name="medical-bag" size={28} color="#347764" />
      </TouchableOpacity>
      <CustomText style={styles.label}>Trainer</CustomText>

      <Modal
        visible={isModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={handleCloseModal}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalContainer}
        >
          <TouchableWithoutFeedback onPress={handleCloseModal}>
            <View style={styles.modalOverlay}>
              <TouchableWithoutFeedback>
                <View style={styles.modalContent}>
                  <TouchableOpacity style={styles.closeButton} onPress={handleCloseModal}>
                    <Ionicons name="close" size={20} color="#8F8DAA" />
                  </TouchableOpacity>

                  <ScrollView showsVerticalScrollIndicator={false}>
                    <CustomText style={styles.noteText} allowFontScaling maxFontSizeMultiplier={1.3}>
                      Note: Medical staff will respond as quickly as possible based on priority level and availability.
                      Please ensure the field number is correct so trainers can locate you efficiently.
                    </CustomText>

                    <CustomText style={styles.labelHeader} allowFontScaling maxFontSizeMultiplier={1.2}>Level of Medical Emergency:</CustomText>
                    <View style={styles.priorityButtonContainer}>
                      {renderPriorityButton('High', '#FF6347')}
                      {renderPriorityButton('Medium', '#FFA500')}
                      {renderPriorityButton('Low', '#32CD32')}
                    </View>

                    <CustomText style={styles.labelHeader} allowFontScaling maxFontSizeMultiplier={1.2}>Describe your emergency:</CustomText>
                    <TextInput
                      style={styles.descriptionInput}
                      placeholder="e.g., Head injury, ACL tear, minor sprain, cramping..."
                      value={description}
                      onChangeText={(text) => setDescription(text)}
                      multiline
                      numberOfLines={3}
                      maxLength={200}
                      maxFontSizeMultiplier={1.2}
                    />
                    <ErrorMessage message={errors.description} />

                    <CustomText style={styles.labelHeader} allowFontScaling maxFontSizeMultiplier={1.2}>Select Field Location:</CustomText>
                    <Dropdown
                      label="Select Field"
                      data={[FIELD_PLACEHOLDER, ...fieldLabels]}
                      onSelect={handleFieldSelect}
                      selectedValue={selectedFieldLabel}
                      error={!!errors.field}
                    />
                    <ErrorMessage message={errors.field} />

                    <ModalButton
                      onCancel={handleCloseModal}
                      onConfirm={requestTrainer}
                      confirmText="Request Trainer"
                    />
                  </ScrollView>
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  circleButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  label: {
    textAlign: 'center',
    marginTop: 5,
    ...typography.textSmallBold
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    width: '100%',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    width: '90%',
    maxHeight: modalHeight,
  },
  noteText: {
    ...typography.textXSmall,
    color: '#666',
    marginBottom: 10,
  },
  labelHeader: {
    ...typography.labelBold,
    marginVertical: 5
  },
  priorityButtonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  priorityButton: {
    padding: 10,
    borderRadius: 8,
    width: '30%',
  },
  priorityButtonText: {
    color: 'white',
    textAlign: 'center',
    ...typography.bodyBold,
  },
  selected: {
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#000',
  },
  descriptionInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 10,
    ...typography.body,
    textAlignVertical: 'top',
    marginBottom: 10,
  },
  closeButton: {
    alignSelf: 'flex-end',
    zIndex: 1,
  },
  errorText: {
    color: '#DD3333',
    ...typography.bodySmall,
  },
  inputError: {
    borderColor: '#DD3333',
    borderWidth: 1,
  },
});

export default TrainerRequestButton;