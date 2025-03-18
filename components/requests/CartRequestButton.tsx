import React, { useState, useEffect } from 'react';
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
import Dropdown from '../Dropdown';
import usePushNotifications from '@/hooks/usePushNotifications';
import { ms } from 'react-native-size-matters';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { typography } from '@/constants/Typography';

const { height } = Dimensions.get('window');
const modalHeight = height * 0.7; // 80% of screen height

// Import the location_type enum directly from the database types
type LocationType = Database['public']['Enums']['location_type'];
type RequestStatus = Database['public']['Enums']['request_status'];

// Define locations as a const array of valid LocationType values
const LOCATIONS: LocationType[] = ['Field', 'Tourney Central', 'Lot 1', 'Lot 2', 'Entrance'];

const CartRequestButton = () => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [fromLocation, setFromLocation] = useState<LocationType>('Field');
  const [toLocation, setToLocation] = useState<LocationType>('Field');
  const [fromFieldNumber, setFromFieldNumber] = useState<string>('');
  const [toFieldNumber, setToFieldNumber] = useState<string>('');
  const [fields, setFields] = useState<string[]>([]);
  const [passengerCount, setPassengerCount] = useState(1);
  const [specialRequest, setSpecialRequest] = useState('');

  const { expoPushToken } = usePushNotifications();

  useEffect(() => {
    fetchFields();
  }, []);

  const fetchFields = async () => {
    const { data, error } = await supabase
      .from('fields')
      .select('id');
    if (error) {
      console.error('Error fetching fields:', error);
    } else {
      setFields(data.map(field => field.id.toString()));
    }
  };

  const handleRequestCart = async () => {
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
        <Text style={styles.passengerCountText}>{value}</Text>
        <TouchableOpacity onPress={increment} style={styles.passengerCountButton}>
          <Ionicons name="add" size={24} color="#EA1D25" />
        </TouchableOpacity>
      </View>
    );
  };

  const isFormValid = () => {
    if (!fromLocation || !toLocation) return false;
    if (fromLocation === 'Field' && !fromFieldNumber) return false;
    if (toLocation === 'Field' && !toFieldNumber) return false;
    if (fromLocation === toLocation && fromFieldNumber === toFieldNumber) return false;
    return true;
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
  };

  return (
    <View>
      <TouchableOpacity
        style={styles.circleButton}
        onPress={() => setIsModalVisible(true)}
      >
        <MaterialCommunityIcons name="car" size={28} color="#347764" />
      </TouchableOpacity>
      <Text style={styles.label}>Cart</Text>

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
            <KeyboardAwareScrollView
              enableOnAndroid={true}
              enableAutomaticScroll={Platform.OS === 'ios'}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                <View>
                  <Text style={styles.noteText} maxFontSizeMultiplier={1.2}>
                    Note: Our volunteer drivers are dedicated to assisting you as quickly as possible. To help us serve everyone efficiently:
                    {'\n\n'}
                    • If you're in a group, please submit only one request.{'\n'}
                    • Allow up to 5 minutes for a driver to reach you.{'\n'}
                    • If no driver arrives after 5 minutes, feel free to submit another request.
                    {'\n\n'}
                    Thank you for your patience and understanding as we work to accommodate everyone's transportation needs.
                  </Text>

                  <Text style={styles.labelHeader} maxFontSizeMultiplier={1.2}>Number of Passengers:</Text>
                  <PassengerCountInput
                    value={passengerCount}
                    onValueChange={setPassengerCount}
                  />

                  <Text style={styles.labelHeader} maxFontSizeMultiplier={1.2}>From:</Text>
                  <Dropdown
                    label="From Location"
                    data={LOCATIONS}
                    onSelect={(item) => setFromLocation(item as LocationType)}
                    selectedValue={fromLocation}
                  />

                  {fromLocation === 'Field' && (
                    <Dropdown
                      label="From Field Number"
                      data={fields}
                      onSelect={(item: string) => setFromFieldNumber(item)}
                      selectedValue={fromFieldNumber}
                    />
                  )}

                  <Text style={styles.labelHeader} maxFontSizeMultiplier={1.2}>To:</Text>
                  <Dropdown
                    label="To Location"
                    data={LOCATIONS}
                    onSelect={(item: string) => setToLocation(item as LocationType)}
                    selectedValue={toLocation}
                  />

                  {toLocation === 'Field' && (
                    <Dropdown
                      label="To Field Number"
                      data={fields}
                      onSelect={(item: string) => setToFieldNumber(item)}
                      selectedValue={toFieldNumber}
                    />
                  )}

                  <Text style={styles.labelHeader} maxFontSizeMultiplier={1.2}>Special Request:</Text>
                  <TextInput
                    style={styles.specialRequestInput}
                    placeholder="e.g., Wheelchair needed, carrying large items..."
                    value={specialRequest}
                    onChangeText={setSpecialRequest}
                    multiline
                    numberOfLines={3}
                    maxLength={200}
                  />

                  <View style={styles.buttonContainer}>
                    <TouchableOpacity style={styles.cancelButton} onPress={handleCloseModal}>
                      <Text style={styles.buttonText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.confirmButton} onPress={handleRequestCart}>
                      <Text style={styles.buttonText}>Request Cart</Text>
                    </TouchableOpacity>
                  </View>
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
    ...typography.bodyBold
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
    ...typography.bodyMedium,
    marginVertical: 8
  },
  noteText: {
    ...typography.bodySmall,
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
    fontFamily: 'Outfit-Bold',
    fontSize: ms(18),
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
    marginTop: 20,
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
  buttonText: {
    color: 'white',
    textAlign: 'center',
    ...typography.bodyMedium
  },
  closeButton: {
    alignSelf: 'flex-end',
    zIndex: 1,
  },
});

export default CartRequestButton;