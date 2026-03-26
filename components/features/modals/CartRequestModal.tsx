import { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Dimensions,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { typography } from '@/constants/Typography';
import usePushNotifications from '@/hooks/usePushNotifications';
import { supabase } from '@/lib/supabase';
import { CartRequestInsert, LocationType, RequestStatus } from '@/types/requests';

import ModalButton from '../../buttons/ModalButtons';
import CustomText from '../../CustomText';
import { Dropdown } from '../../Dropdown';
import ErrorMessage from '../../ErrorMessage';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Ionicons from '@expo/vector-icons/Ionicons';
import { ScrollView } from 'react-native-gesture-handler';

const { height } = Dimensions.get('window');
const modalHeight = height * 0.8;

// Define locations as a const array of valid LocationType values
const LOCATIONS: LocationType[] = ['Field', 'Tourney Central', 'Lot 1 (Grass)', 'Lot 2 (Pavement)', 'Entrance'];

const CART_REQUEST_NOTE =
  'Our volunteer drivers are dedicated to assisting you as quickly as possible. To help us serve everyone efficiently:\n\n' +
  "• If you're in a group, please submit only one request.\n" +
  '• Allow up to 5 minutes for a driver to reach you.\n' +
  '• If no driver arrives after 5 minutes, feel free to submit another request.\n\n' +
  "Thank you for your patience and understanding as we work to accommodate everyone's transportation needs.";

const CartRequestButton = () => {
  const scrollViewRef = useRef<ScrollView | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isNoteVisible, setIsNoteVisible] = useState(false);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [fromLocation, setFromLocation] = useState<LocationType>('Field');
  const [toLocation, setToLocation] = useState<LocationType>('Field');
  const [fromFieldNumber, setFromFieldNumber] = useState<string>('');
  const [toFieldNumber, setToFieldNumber] = useState<string>('');
  const [fieldOptions, setFieldOptions] = useState<string[]>([]);
  const [fieldNameToIdMap, setFieldNameToIdMap] = useState<Record<string, number>>({});
  const [fieldIdToNameMap, setFieldIdToNameMap] = useState<Record<number, string>>({});
  const [passengerCount, setPassengerCount] = useState(1);
  const [requesterName, setRequesterName] = useState('');
  const [specialRequest, setSpecialRequest] = useState('');
  // Error states
  const [errors, setErrors] = useState<{
    fromLocation?: string;
    toLocation?: string;
    fromFieldNumber?: string;
    toFieldNumber?: string;
    requesterName?: string;
    general?: string;
  }>({});

  const { expoPushToken } = usePushNotifications();

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
    const { data, error } = await supabase.from('fields').select('id, name').order('name');

    if (error) {
      console.error('Error fetching fields:', error);
    } else if (data) {
      // Create the name-to-id and id-to-name mapping
      const nameToId: Record<string, number> = {};
      const idToName: Record<number, string> = {};
      data.forEach((field) => {
        nameToId[field.name] = field.id;
        idToName[field.id] = field.name;
      });

      setFieldNameToIdMap(nameToId);
      setFieldIdToNameMap(idToName);

      // Set field names for the dropdown
      setFieldOptions(data.map((field) => field.name));
    }
  };

  const handleRequestCart = async () => {
    if (!validateForm()) {
      return; // Stop if validation fails
    }

    try {
      // Create insert object with proper types
      const insertData: CartRequestInsert = {
        from_location: fromLocation,
        to_location: toLocation,
        from_field_number: fromLocation === 'Field' ? parseInt(fromFieldNumber) : null,
        to_field_number: toLocation === 'Field' ? parseInt(toFieldNumber) : null,
        passenger_count: passengerCount,
        requester: requesterName || null,
        special_request: specialRequest,
        status: 'pending' as RequestStatus,
        requester_token: expoPushToken || null,
        created_at: new Date().toISOString(),
      };

      const { error } = await supabase.from('cart_requests').insert(insertData).select().single();

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
        <CustomText style={styles.passengerCountText} allowFontScaling maxFontSizeMultiplier={1.3}>
          {value}
        </CustomText>
        <TouchableOpacity onPress={increment} style={styles.passengerCountButton}>
          <Ionicons name="add" size={24} color="#EA1D25" />
        </TouchableOpacity>
      </View>
    );
  };

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    // Validate requester name
    if (!requesterName.trim()) {
      newErrors.requesterName = 'Please enter your name so our drivers can locate you.';
    }

    // Validate locations
    if (fromLocation === toLocation) {
      if (fromLocation === 'Field') {
        // For fields, check if the field numbers are the same
        if (fromFieldNumber === toFieldNumber) {
          newErrors.toFieldNumber = 'From and To field numbers cannot be the same';
        }
      } else {
        // For non-field locations (like 'Lot 1'), they can't be the same
        newErrors.toLocation = 'From and To locations cannot be the same';
      }
    }

    // Validate field numbers
    if (fromLocation === 'Field' && !fromFieldNumber) {
      newErrors.fromFieldNumber = 'Please select a field number';
    }

    if (toLocation === 'Field' && !toFieldNumber) {
      newErrors.toFieldNumber = 'Please select a field number';
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
    setRequesterName('');
    setSpecialRequest('');
  };

  const handleCloseModal = () => {
    setIsModalVisible(false);
    setIsNoteVisible(false);
    setErrors({});
    resetInputs();
  };

  const handleSpecialRequestFocus = () => {
    // Delay until keyboard animation completes. Android takes longer, so use a longer delay.
    const delay = Platform.OS === 'android' ? 300 : 150;
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, delay);
  };

  return (
    <View>
      <TouchableOpacity style={styles.circleButton} onPress={() => setIsModalVisible(true)}>
        <MaterialCommunityIcons name="car" size={28} color="#5C5C5C" />
      </TouchableOpacity>
      <CustomText style={styles.label} allowFontScaling>
        Cart
      </CustomText>

      <Modal visible={isModalVisible} transparent={true} animationType="fade" onRequestClose={handleCloseModal}>
        <KeyboardAvoidingView
          behavior={'padding'}
          keyboardVerticalOffset={Platform.OS === 'android' ? 1 : 0}
          style={styles.modalContainer}>
          <View style={[styles.modalOverlay, isKeyboardVisible && styles.modalOverlayKeyboardOpen]}>
            <View style={styles.modalContent}>
              <ScrollView
                ref={scrollViewRef}
                keyboardDismissMode="none"
                keyboardShouldPersistTaps="always"
                showsVerticalScrollIndicator={false}>
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
                    <CustomText style={styles.noteText} allowFontScaling maxFontSizeMultiplier={1.2}>
                      {CART_REQUEST_NOTE}
                    </CustomText>
                  </View>
                )}

                <CustomText style={styles.labelHeader} allowFontScaling maxFontSizeMultiplier={1.2}>
                  Your Name:
                </CustomText>
                <TextInput
                  style={[styles.nameInput, errors.requesterName && styles.inputError]}
                  placeholder="Enter your name"
                  placeholderTextColor={'lightgrey'}
                  value={requesterName}
                  onChangeText={(text) => {
                    setRequesterName(text);
                    setErrors((prev) => ({
                      ...prev,
                      requesterName: undefined,
                    }));
                  }}
                  maxLength={50}
                  maxFontSizeMultiplier={1.2}
                />
                <ErrorMessage message={errors.requesterName} />

                <View
                  style={{
                    marginBottom: 5,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexDirection: 'row',
                  }}>
                  <CustomText style={styles.labelHeader} allowFontScaling maxFontSizeMultiplier={1.2}>
                    Number of Pax:
                  </CustomText>
                  <PassengerCountInput value={passengerCount} onValueChange={setPassengerCount} />
                </View>

                <Text style={styles.labelHeader} maxFontSizeMultiplier={1.2}>
                  From:
                </Text>
                <View style={{ flexDirection: 'row', gap: 5 }}>
                  <View style={{ flex: 1, flexDirection: 'column' }}>
                    <Dropdown
                      label="From Location"
                      data={LOCATIONS}
                      onSelect={(item) => {
                        setFromLocation(item as LocationType);
                        // Clear error when user makes a selection
                        setErrors((prev) => ({
                          ...prev,
                          fromLocation: undefined,
                        }));
                      }}
                      selectedValue={fromLocation}
                      error={!!errors.fromLocation}
                    />
                    <ErrorMessage message={errors.fromLocation} />
                  </View>
                  {fromLocation === 'Field' && (
                    <View style={{ flex: 1, flexDirection: 'column', width: 165 }}>
                      <Dropdown
                        label="From Field"
                        data={fieldOptions}
                        onSelect={(fieldName: string) => {
                          const fieldId = fieldNameToIdMap[fieldName]?.toString() || '';
                          setFromFieldNumber(fieldId);
                          // Clear error when user makes a selection
                          setErrors((prev) => ({
                            ...prev,
                            fromFieldNumber: undefined,
                          }));
                        }}
                        selectedValue={fromFieldNumber ? fieldIdToNameMap[parseInt(fromFieldNumber)] : ''}
                        error={!!errors.fromFieldNumber}
                      />
                      <ErrorMessage message={errors.fromFieldNumber} />
                    </View>
                  )}
                </View>

                <Text style={styles.labelHeader} maxFontSizeMultiplier={1.2}>
                  To:
                </Text>
                <View style={{ flexDirection: 'row', gap: 5 }}>
                  <View style={{ flex: 1, flexDirection: 'column' }}>
                    <Dropdown
                      label="To Location"
                      data={LOCATIONS}
                      onSelect={(item) => {
                        setToLocation(item as LocationType);
                        // Clear error when user makes a selection
                        setErrors((prev) => ({ ...prev, toLocation: undefined }));
                      }}
                      selectedValue={toLocation}
                      error={!!errors.toLocation}
                    />
                    <ErrorMessage message={errors.toLocation} />
                  </View>
                  {toLocation === 'Field' && (
                    <View style={{ flex: 1, flexDirection: 'column', width: 165 }}>
                      <Dropdown
                        label="To Field"
                        data={fieldOptions}
                        onSelect={(fieldName: string) => {
                          const fieldId = fieldNameToIdMap[fieldName]?.toString() || '';
                          setToFieldNumber(fieldId);
                          // Clear error when user makes a selection
                          setErrors((prev) => ({
                            ...prev,
                            toFieldNumber: undefined,
                          }));
                        }}
                        selectedValue={toFieldNumber ? fieldIdToNameMap[parseInt(toFieldNumber)] : ''}
                        error={!!errors.toFieldNumber}
                      />
                      <ErrorMessage message={errors.toFieldNumber} />
                    </View>
                  )}
                </View>

                <Text style={styles.labelHeader} maxFontSizeMultiplier={1.2}>
                  Special Request:
                </Text>
                <TextInput
                  style={styles.specialRequestInput}
                  placeholder="e.g., Wheelchair needed, carrying large items..."
                  placeholderTextColor={'#0000004D'}
                  value={specialRequest}
                  onChangeText={setSpecialRequest}
                  onFocus={handleSpecialRequestFocus}
                  multiline
                  numberOfLines={3}
                  maxLength={200}
                  maxFontSizeMultiplier={1.2}
                />

                <ModalButton onCancel={handleCloseModal} onConfirm={handleRequestCart} confirmText="Request Cart" />
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
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cancelButton: {
    backgroundColor: '#000000',
    borderRadius: 6,
    justifyContent: 'center',
    padding: 12,
    width: '48%',
  },
  circleButton: {
    alignItems: 'center',
    backgroundColor: '#edebebff',
    borderRadius: 35,
    height: 70,
    justifyContent: 'center',
    width: 70,
  },
  closeButton: {
    alignSelf: 'flex-end',
    marginBottom: 5,
  },
  confirmButton: {
    backgroundColor: '#E74C3C',
    borderRadius: 6,
    justifyContent: 'center',
    padding: 12,
    width: '48%',
  },
  generalErrorContainer: {
    backgroundColor: '#FFEEEE',
    borderLeftColor: '#DD3333',
    borderLeftWidth: 4,
    borderRadius: 5,
    marginTop: 5,
    padding: 5,
  },
  generalErrorText: {
    color: '#DD3333',
    ...typography.text,
  },
  inputError: {
    borderColor: '#DD3333',
  },
  label: {
    marginTop: 5,
    textAlign: 'center',
    ...typography.textSmallBold,
  },
  labelHeader: {
    ...typography.textBold,
    marginBottom: 5,
  },
  modalContainer: {
    flex: 1,
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
    justifyContent: Platform.OS === 'android' ? 'flex-start' : 'flex-end',
    paddingTop: 52,
  },
  nameInput: {
    borderColor: '#ccc',
    borderRadius: 8,
    borderWidth: 1,
    padding: 12,
    ...typography.textSmall,
    marginBottom: 10,
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
  passengerCountButton: {
    alignItems: 'center',
    backgroundColor: '#F0F0F0',
    borderRadius: 20,
    height: 35,
    justifyContent: 'center',
    width: 35,
  },
  passengerCountContainer: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  passengerCountText: {
    ...typography.textBold,
    paddingHorizontal: 20,
  },
  specialRequestInput: {
    borderColor: '#ccc',
    borderRadius: 8,
    borderWidth: 1,
    padding: 10,
    ...typography.textSmall,
    textAlignVertical: 'top',
  },
});

export default CartRequestButton;
