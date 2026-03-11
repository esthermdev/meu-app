import { useState, useEffect, useRef } from 'react';
import { Database } from '@/database.types';
import {
  StyleSheet,
  Alert,
  View,
  Modal,
  TouchableOpacity,
  Dimensions,
  Platform,
  KeyboardAvoidingView,
  Keyboard,
  TextInput,
  Pressable,
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
const modalHeight = height * 0.8;

// Define types from your database schema
type RequestStatus = Database['public']['Enums']['request_status'];

// Define priority level type
type PriorityLevel = 'High' | 'Medium' | 'Low';

const FIELD_PLACEHOLDER = 'Select Field';

const TRAINER_REQUEST_NOTE =
  'Note: Medical staff will respond as quickly as possible based on priority level and availability.\n\n' +
  'Please ensure the field number is correct so trainers can locate you efficiently.';

const TrainerRequestButton = () => {
  const scrollViewRef = useRef<ScrollView | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isNoteVisible, setIsNoteVisible] = useState(false);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [priorityLevel, setPriorityLevel] = useState<PriorityLevel>('Medium');
  const [description, setDescription] = useState<string | undefined>('');
  const [fields, setFields] = useState<{ id: number; name: string }[]>([]);
  const [selectedField, setSelectedField] = useState<number | undefined>(undefined);
  const [selectedFieldLabel, setSelectedFieldLabel] = useState<string>(FIELD_PLACEHOLDER);
  const [teamName, setTeamName] = useState<string>('');
  // Error states
  const [errors, setErrors] = useState<{
    field?: string;
    description?: string;
    general?: string;
    teamName?: string;
  }>({});

  useEffect(() => {
    fetchFields();
  }, []);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSubscription = Keyboard.addListener(showEvent, () => setIsKeyboardVisible(true));
    const hideSubscription = Keyboard.addListener(hideEvent, () => setIsKeyboardVisible(false));

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  const fetchFields = async () => {
    const { data, error } = await supabase.from('fields').select('id, name').order('id', { ascending: true });

    if (error) {
      console.error('Error fetching fields:', error);
    } else if (data) {
      setFields(data);
      // The placeholder stays the same
      setSelectedFieldLabel(FIELD_PLACEHOLDER);
    }
  };

  const handleFieldSelect = (fieldLabel: string) => {
    if (fieldLabel === FIELD_PLACEHOLDER) return;

    // Find the field where the name matches the selected label
    const field = fields.find((f) => fieldLabel === f.name);
    if (field) {
      setSelectedField(field.id);
      setSelectedFieldLabel(fieldLabel); // Set the display label to field name

      // Clear the field error when a valid selection is made
      if (errors.field) {
        setErrors((prev) => ({ ...prev, field: undefined }));
      }
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
        team_name: teamName, // Add team name to the request
        created_at: new Date().toISOString(),
      };

      const { error: insertError } = await supabase.from('medical_requests').insert(insertData).select().single();

      if (insertError) throw insertError;

      const { data: medicStaff, error: staffError } = await supabase
        .from('profiles')
        .select('id, expo_push_token, profile_roles!inner(roles!inner(key))')
        .eq('profile_roles.roles.key', 'medic');

      if (staffError) throw staffError;

      if (!medicStaff || medicStaff.length === 0) {
        throw new Error('No medical staff available');
      }

      Alert.alert(
        'Trainer Requested',
        'Help is on the way. Please allow some time for a trainer to make their way to your location. If no trainer has arrived please try again later as trainers may be unavailable at the moment.',
      );
      setDescription('');
      setPriorityLevel('Medium');
      setIsModalVisible(false);
    } catch (error) {
      console.error('Error requesting medical assistance:', error);
      Alert.alert('Error', 'Failed to request medical assistance');
    }
  };

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (selectedField === undefined || selectedFieldLabel === FIELD_PLACEHOLDER) {
      newErrors.field = 'Please select a field';
    }

    // Optional: Add validation for team name
    // if (!teamName.trim()) {
    //   newErrors.teamName = "Please enter the team name";
    // }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCloseModal = () => {
    setIsModalVisible(false);
    setIsNoteVisible(false);
    setDescription('');
    setPriorityLevel('Medium');
    setTeamName('');
    setSelectedField(undefined);
    setSelectedFieldLabel(FIELD_PLACEHOLDER);
    setErrors({});
  };

  const handleDescriptionFocus = () => {
    // Delay until keyboard animation completes. Android takes longer, so use a longer delay.
    const delay = Platform.OS === 'android' ? 300 : 150;
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, delay);
  };

  const renderPriorityButton = (level: PriorityLevel, color: string) => (
    <TouchableOpacity
      style={[styles.priorityButton, { backgroundColor: color }, priorityLevel === level && styles.selected]}
      onPress={() => setPriorityLevel(level)}
      activeOpacity={1}>
      <CustomText style={styles.priorityButtonText}>{level}</CustomText>
    </TouchableOpacity>
  );

  // Prepare field labels for dropdown
  const fieldLabels = fields.map((field) => field.name);

  return (
    <View>
      <TouchableOpacity style={styles.circleButton} onPress={() => setIsModalVisible(true)}>
        <MaterialCommunityIcons name="medical-bag" size={28} color="#DF4646" />
      </TouchableOpacity>
      <CustomText style={styles.label}>Trainer</CustomText>

      <Modal visible={isModalVisible} transparent={true} animationType="fade" onRequestClose={handleCloseModal}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          enabled={true}
          keyboardVerticalOffset={Platform.OS === 'android' ? 1 : 0}
          style={styles.modalContainer}>
          <Pressable style={styles.backdropPressArea} onPress={handleCloseModal} />
          <View style={[styles.modalOverlay, isKeyboardVisible && styles.modalOverlayKeyboardOpen]}>
            <View style={styles.modalContent}>
              <ScrollView
                ref={scrollViewRef}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                keyboardDismissMode="none">
                <TouchableOpacity
                  style={styles.noteToggleButton}
                  onPress={() => setIsNoteVisible((prev) => !prev)}
                  activeOpacity={0.8}>
                  <Ionicons name="information-circle-outline" size={18} color="#4F628E" />
                  <CustomText style={styles.noteToggleText} allowFontScaling maxFontSizeMultiplier={1.2}>
                    {isNoteVisible ? 'Hide' : 'View'}
                  </CustomText>
                </TouchableOpacity>

                {isNoteVisible && (
                  <View style={styles.noteContainer}>
                    <View style={styles.noteHeaderRow}>
                      <CustomText style={styles.noteTitle} allowFontScaling maxFontSizeMultiplier={1.2}>
                        Important
                      </CustomText>
                      <TouchableOpacity onPress={() => setIsNoteVisible(false)} hitSlop={8}>
                        <Ionicons name="close" size={16} color="#4F628E" />
                      </TouchableOpacity>
                    </View>
                    <CustomText style={styles.noteText} allowFontScaling maxFontSizeMultiplier={1.3}>
                      {TRAINER_REQUEST_NOTE}
                    </CustomText>
                  </View>
                )}

                <CustomText style={styles.labelHeader} allowFontScaling maxFontSizeMultiplier={1.2}>
                  Team Name:
                </CustomText>
                <TextInput
                  style={styles.textInput}
                  placeholder="Enter team name"
                  placeholderTextColor={'#0000004D'}
                  value={teamName}
                  onChangeText={setTeamName}
                  maxFontSizeMultiplier={1.2}
                />
                {errors.teamName && <ErrorMessage message={errors.teamName} />}

                <CustomText style={styles.labelHeader} allowFontScaling maxFontSizeMultiplier={1.2}>
                  Level of Medical Emergency:
                </CustomText>
                <View style={styles.priorityButtonContainer}>
                  {renderPriorityButton('High', '#FE310D')}
                  {renderPriorityButton('Medium', '#ED8C22')}
                  {renderPriorityButton('Low', '#276B5D')}
                </View>

                <CustomText style={styles.labelHeader} allowFontScaling maxFontSizeMultiplier={1.2}>
                  Describe your emergency:
                </CustomText>
                <TextInput
                  style={styles.descriptionInput}
                  placeholder="e.g., Head injury, ACL tear, minor sprain, cramping..."
                  placeholderTextColor={'#0000004D'}
                  value={description}
                  onChangeText={(text) => setDescription(text)}
                  onFocus={handleDescriptionFocus}
                  multiline
                  numberOfLines={3}
                  maxLength={200}
                  maxFontSizeMultiplier={1.2}
                />
                <ErrorMessage message={errors.description} />

                <CustomText style={styles.labelHeader} allowFontScaling maxFontSizeMultiplier={1.2}>
                  Select Field Location:
                </CustomText>
                <Dropdown
                  label="Select Field"
                  data={[FIELD_PLACEHOLDER, ...fieldLabels]}
                  onSelect={handleFieldSelect}
                  selectedValue={selectedFieldLabel}
                  error={!!errors.field}
                />
                <ErrorMessage message={errors.field} />

                <ModalButton onCancel={handleCloseModal} onConfirm={requestTrainer} confirmText="Request Trainer" />
              </ScrollView>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  backdropPressArea: {
    ...StyleSheet.absoluteFill,
  },
  circleButton: {
    alignItems: 'center',
    backgroundColor: '#edebebff',
    borderRadius: 35,
    height: 70,
    justifyContent: 'center',
    width: 70,
  },
  descriptionInput: {
    borderColor: '#ccc',
    borderRadius: 5,
    borderWidth: 1,
    padding: 10,
    ...typography.textSmall,
    marginBottom: 5,
    textAlignVertical: 'top',
  },
  errorText: {
    color: '#DD3333',
    ...typography.textXSmall,
  },
  inputError: {
    borderColor: '#DD3333',
    borderWidth: 1,
  },
  label: {
    marginTop: 5,
    textAlign: 'center',
    ...typography.textSmallBold,
  },
  labelHeader: {
    ...typography.labelBold,
    marginVertical: 4,
  },
  modalContainer: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  modalContainerKeyboardOpen: {
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 12,
    maxHeight: modalHeight,
    padding: 20,
    width: '90%',
  },
  modalOverlay: {
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    flex: 1,
    justifyContent: 'center',
    width: '100%',
  },
  modalOverlayKeyboardOpen: {
    justifyContent: 'flex-end',
  },
  noteContainer: {
    backgroundColor: '#F5F8FF',
    borderColor: '#D8E3FF',
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 8,
    padding: 10,
  },
  noteHeaderRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  noteText: {
    ...typography.textXSmall,
    color: '#666',
  },
  noteTitle: {
    ...typography.textSmallBold,
    color: '#4F628E',
  },
  noteToggleButton: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    flexDirection: 'row',
    gap: 4,
    marginBottom: 8,
  },
  noteToggleText: {
    ...typography.textSmallBold,
    color: '#4F628E',
  },
  priorityButton: {
    borderRadius: 8,
    padding: 10,
    width: '30%',
  },
  priorityButtonContainer: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  priorityButtonText: {
    color: 'white',
    textAlign: 'center',
    ...typography.textSmallBold,
  },
  selected: {
    borderColor: '#000',
    borderRadius: 8,
    borderWidth: 2,
  },
  textInput: {
    borderColor: '#ccc',
    borderRadius: 5,
    borderWidth: 1,
    padding: 10,
    ...typography.textSmall,
    marginBottom: 5,
  },
});

export default TrainerRequestButton;
