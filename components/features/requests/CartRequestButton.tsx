import { useState, useEffect } from 'react';
import { Database } from '@/database.types';
import {
  StyleSheet,
  Text,
  Alert,
  View,
  Modal,
  TouchableOpacity,
  TextInput,
  Keyboard,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Platform,
  Dimensions
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { supabase } from '@/lib/supabase';
import Ionicons from '@expo/vector-icons/Ionicons';
import Dropdown from '../../Dropdown';
import usePushNotifications from '@/hooks/usePushNotifications';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { typography } from '@/constants/Typography';
import ModalButton from '../../buttons/ModalButtons';
import ErrorMessage from '../../ErrorMessage';
import CustomText from '../../CustomText';

const { height } = Dimensions.get('window');
const modalHeight = height * 0.7; // 80% of screen height

// Import the location_type enum directly from the database types
type LocationType = Database['public']['Enums']['location_type'];
type RequestStatus = Database['public']['Enums']['request_status'];

// Define locations as a const array of valid LocationType values
const LOCATIONS: LocationType[] = ['Field', 'Tourney Central', 'Lot 1 (Grass)', 'Lot 2 (Pavement)', 'Entrance'];

type Field = {
  id: number;
  name: string;
};

const CartRequestButton = () => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [fromLocation, setFromLocation] = useState<LocationType>('Field');
  const [toLocation, setToLocation] = useState<LocationType>('Field');
  const [fromFieldNumber, setFromFieldNumber] = useState<string>('');
  const [toFieldNumber, setToFieldNumber] = useState<string>('');
  const [fields, setFields] = useState<Field[]>([]);
  const [fieldOptions, setFieldOptions] = useState<string[]>([]);
  const [fieldNameToIdMap, setFieldNameToIdMap] = useState<Record<string, number>>({});
  const [fieldIdToNameMap, setFieldIdToNameMap] = useState<Record<number, string>>({});
  const [passengerCount, setPassengerCount] = useState(1);
  const [specialRequest, setSpecialRequest] = useState('');
  // Error states
  const [errors, setErrors] = useState<{
    fromLocation?: string;
    toLocation?: string;
    fromFieldNumber?: string;
    toFieldNumber?: string;
    general?: string;
  }>({});

  const { expoPushToken } = usePushNotifications();

  useEffect(() => {
    fetchFields();
  }, []);

  const fetchFields = async () => {
    const { data, error } = await supabase
      .from('fields')
      .select('id, name')
      .order('name');
    
    if (error) {
      console.error('Error fetching fields:', error);
    } else if (data) {
      setFields(data);
      
      // Create the name-to-id and id-to-name mapping
      const nameToId: Record<string, number> = {};
      const idToName: Record<number, string> = {};
      data.forEach(field => {
        nameToId[field.name] = field.id;
        idToName[field.id] = field.name;
      });
      
      setFieldNameToIdMap(nameToId);
      setFieldIdToNameMap(idToName);
      
      // Set field names for the dropdown
      setFieldOptions(data.map(field => field.name));
    }
  };

  const handleRequestCart = async () => {
    if (!validateForm()) {
      return; // Stop if validation fails
    }

    try {
      // Create insert object with proper types
      const insertData: Database['public']['Tables']['cart_requests']['Insert'] = {
        from_location: fromLocation,
        to_location: toLocation,
        from_field_number: fromLocation === 'Field' ? parseInt(fromFieldNumber) : null,
        to_field_number: toLocation === 'Field' ? parseInt(toFieldNumber) : null,
        passenger_count: passengerCount,
        special_request: specialRequest,
        status: 'pending' as RequestStatus,
        requester_token: expoPushToken || null,
        created_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('cart_requests')
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;

      Alert.alert('Cart Requested', 'Please wait for a driver.');
      setIsModalVisible(false);
      resetInputs();
    } catch (error) {
      console.error('Error submitting cart request:', error);
      Alert.alert('Error', 'Failed to submit cart request');
    }
  };

  const PassengerCountInput = ({ value, onValueChange }: { value: number; onValueChange: (value: number) => void }) => {
    const increment = () => onValueChange(Math.min(value + 1, 6));
    const decrement = () => onValueChange(Math.max(value - 1, 1));

    return (
      <View style={styles.passengerCountContainer}>
        <TouchableOpacity onPress={decrement} style={styles.passengerCountButton}>
          <Ionicons name="remove" size={24} color="#EA1D25" />
        </TouchableOpacity>
        <CustomText style={styles.passengerCountText} allowFontScaling maxFontSizeMultiplier={1.3}>{value}</CustomText>
        <TouchableOpacity onPress={increment} style={styles.passengerCountButton}>
          <Ionicons name="add" size={24} color="#EA1D25" />
        </TouchableOpacity>
      </View>
    );
  };

  const validateForm = (): boolean => {
    const newErrors: {[key: string]: string} = {};
    
    // Validate locations
    if (fromLocation === toLocation) {
      if (fromLocation === 'Field') {
        // For fields, check if the field numbers are the same
        if (fromFieldNumber === toFieldNumber) {
          newErrors.toFieldNumber = "From and To field numbers cannot be the same";
        }
      } else {
        // For non-field locations (like 'Lot 1'), they can't be the same
        newErrors.toLocation = "From and To locations cannot be the same";
      }
    }
    
    // Validate field numbers
    if (fromLocation === 'Field' && !fromFieldNumber) {
      newErrors.fromFieldNumber = "Please select a field number";
    }
    
    if (toLocation === 'Field' && !toFieldNumber) {
      newErrors.toFieldNumber = "Please select a field number";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const resetInputs = () => {
    setFromLocation('Field');
    setToLocation('Field');
    setFromFieldNumber('');
    setToFieldNumber('');
    setPassengerCount(1);
    setSpecialRequest('');
  };

  const handleCloseModal = () => {
    setIsModalVisible(false);
    resetInputs();
    setErrors({});
  };

  return (
    <View>
      <TouchableOpacity
        style={styles.circleButton}
        onPress={() => setIsModalVisible(true)}
      >
        <MaterialCommunityIcons name="car" size={28} color="#777777ff" />
      </TouchableOpacity>
      <CustomText style={styles.label} allowFontScaling>Cart</CustomText>

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
          <View style={styles.modalContent}>
            <TouchableOpacity style={styles.closeButton} onPress={handleCloseModal}>
              <Ionicons name="close" size={20} color="#8F8DAA" />
            </TouchableOpacity>

            {errors.general && (
              <View style={styles.generalErrorContainer}>
                <Text style={styles.generalErrorText}>{errors.general}</Text>
              </View>
            )}

            <KeyboardAwareScrollView
              enableOnAndroid={true}
              enableAutomaticScroll={Platform.OS === 'ios'}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                <View>
                  <CustomText style={styles.noteText} allowFontScaling maxFontSizeMultiplier={1.3}>
                    Note: Our volunteer drivers are dedicated to assisting you as quickly as possible. To help us serve everyone efficiently:
                    {'\n\n'}
                    • If you're in a group, please submit only one request.{'\n'}
                    • Allow up to 5 minutes for a driver to reach you.{'\n'}
                    • If no driver arrives after 5 minutes, feel free to submit another request.
                    {'\n\n'}
                    Thank you for your patience and understanding as we work to accommodate everyone's transportation needs.
                  </CustomText>

                  <CustomText style={styles.labelHeader} allowFontScaling maxFontSizeMultiplier={1.2}>Number of Passengers:</CustomText>
                  <PassengerCountInput
                    value={passengerCount}
                    onValueChange={setPassengerCount}
                  />

                  <Text style={styles.labelHeader} maxFontSizeMultiplier={1.2}>From:</Text>
                  <Dropdown
                    label="From Location"
                    data={LOCATIONS}
                    onSelect={(item) => {
                      setFromLocation(item as LocationType);
                      // Clear error when user makes a selection
                      setErrors(prev => ({...prev, fromLocation: undefined}));
                    }}
                    selectedValue={fromLocation}
                    error={!!errors.fromLocation}
                  />
                  <ErrorMessage message={errors.fromLocation} />

                  {fromLocation === 'Field' && (
                    <Dropdown
                      label="From Field"
                      data={fieldOptions}
                      onSelect={(fieldName: string) => {
                        const fieldId = fieldNameToIdMap[fieldName]?.toString() || '';
                        setFromFieldNumber(fieldId)
                        // Clear error when user makes a selection
                        setErrors(prev => ({...prev, fromFieldNumber: undefined}));
                      }}
                      selectedValue={fromFieldNumber ? fieldIdToNameMap[parseInt(fromFieldNumber)] : ''}
                      error={!!errors.fromFieldNumber}
                    />
                  )}
                  <ErrorMessage message={errors.fromFieldNumber} />

                  <Text style={styles.labelHeader} maxFontSizeMultiplier={1.2}>To:</Text>
                  <Dropdown
                    label="To Location"
                    data={LOCATIONS}
                    onSelect={(item) => {
                      setToLocation(item as LocationType);
                      // Clear error when user makes a selection
                      setErrors(prev => ({...prev, toLocation: undefined}));
                    }}
                    selectedValue={toLocation}
                    error={!!errors.toLocation}
                  />
                  <ErrorMessage message={errors.toLocation} />

                  {toLocation === 'Field' && (
                    <Dropdown
                      label="To Field"
                      data={fieldOptions}
                      onSelect={(fieldName: string) => {
                        const fieldId = fieldNameToIdMap[fieldName]?.toString() || '';
                        setToFieldNumber(fieldId);
                        // Clear error when user makes a selection
                        setErrors(prev => ({...prev, toFieldNumber: undefined}));
                      }}
                      selectedValue={toFieldNumber ? fieldIdToNameMap[parseInt(toFieldNumber)] : ''}
                      error={!!errors.toFieldNumber}
                    />
                  )}
                  <ErrorMessage message={errors.toFieldNumber} />

                  <Text style={styles.labelHeader} maxFontSizeMultiplier={1.2}>Special Request:</Text>
                  <TextInput
                    style={styles.specialRequestInput}
                    placeholder="e.g., Wheelchair needed, carrying large items..."
                    value={specialRequest}
                    onChangeText={setSpecialRequest}
                    multiline
                    numberOfLines={3}
                    maxLength={200}
                    maxFontSizeMultiplier={1.2}
                  />

                  <ModalButton 
                    onCancel={handleCloseModal}
                    onConfirm={handleRequestCart}
                    confirmText="Request Cart"
                  />
                </View>
              </TouchableWithoutFeedback>
            </KeyboardAwareScrollView>
          </View>
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
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    width: '90%',
    height: modalHeight,
    overflow: 'hidden'
  },
  labelHeader: {
    ...typography.labelBold,
    marginVertical: 8
  },
  noteText: {
    ...typography.textXSmall,
    color: '#666',
  },
  passengerCountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  passengerCountButton: {
    backgroundColor: '#F0F0F0',
    borderRadius: 20,
    width: 35,
    height: 35,
    justifyContent: 'center',
    alignItems: 'center',
  },
  passengerCountText: {
    ...typography.textMedium,
    marginHorizontal: 20,
  },
  specialRequestInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 10,
    ...typography.body,
    textAlignVertical: 'top',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cancelButton: {
    backgroundColor: '#000000',
    padding: 12,
    borderRadius: 6,
    width: '48%',
    justifyContent: 'center',
  },
  confirmButton: {
    backgroundColor: '#E74C3C',
    padding: 12,
    borderRadius: 6,
    width: '48%',
    justifyContent: 'center',
  },
  closeButton: {
    alignSelf: 'flex-end',
    zIndex: 1,
  },
  generalErrorContainer: {
    backgroundColor: '#FFEEEE',
    padding: 10,
    borderRadius: 5,
    marginBottom: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#DD3333',
  },
  generalErrorText: {
    color: '#DD3333',
    ...typography.text
  },
});

export default CartRequestButton;