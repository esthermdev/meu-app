import React, { useState, useEffect } from 'react';
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
import { Picker } from '@react-native-picker/picker';
import { supabase } from '@/lib/supabase';
import { ScrollView } from 'react-native-gesture-handler';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { typography } from '@/constants/Typography';
import Ionicons from '@expo/vector-icons/Ionicons';

const { height } = Dimensions.get('window');
const modalHeight = height * 0.8; // 80% of screen height

// Define types from your database schema
type RequestStatus = Database['public']['Enums']['request_status'];

// Define priority level type
type PriorityLevel = 'High' | 'Medium' | 'Low';

const TrainerRequestButton = () => {
  const [selectedField, setSelectedField] = useState<number | undefined>(undefined);
  const [priorityLevel, setPriorityLevel] = useState<PriorityLevel>('Medium');
  const [description, setDescription] = useState<string | undefined>('')
  const [fields, setFields] = useState<{ id: number; name: string }[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);

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
      }
    }
  };

  const requestTrainer = async () => {
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

  const handleCloseModal = () => {
    setIsModalVisible(false);
    setDescription('');
    setPriorityLevel('Medium')
  };

  const renderPriorityButton = (level: PriorityLevel, color: string) => (
    <TouchableOpacity
      style={[styles.priorityButton, { backgroundColor: color }, priorityLevel === level && styles.selected]}
      onPress={() => setPriorityLevel(level)}
      activeOpacity={1}
    >
      <Text style={styles.priorityButtonText} maxFontSizeMultiplier={1.2}>{level}</Text>
    </TouchableOpacity>
  );

  return (
    <View>
      <TouchableOpacity
        style={styles.circleButton}
        onPress={() => setIsModalVisible(true)}
      >
        <MaterialCommunityIcons name="medical-bag" size={28} color="#347764" />
      </TouchableOpacity>
      <Text style={styles.label}>Trainer</Text>

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
                    <Text style={styles.noteText} maxFontSizeMultiplier={1.2}>
                      Note: Medical staff will respond as quickly as possible based on priority level and availability. 
                      Please ensure the field number is correct so trainers can locate you efficiently.
                    </Text>

                    <Text style={styles.labelHeader} maxFontSizeMultiplier={1.2}>Level of Medical Emergency:</Text>
                    <View style={styles.priorityButtonContainer}>
                      {renderPriorityButton('High', '#FF6347')}
                      {renderPriorityButton('Medium', '#FFA500')}
                      {renderPriorityButton('Low', '#32CD32')}
                    </View>

                    <Text style={styles.labelHeader} maxFontSizeMultiplier={1.2}>Describe your emergency:</Text>
                    <TextInput
                      style={styles.descriptionInput}
                      placeholder="e.g., Head injury, ACL tear, minor sprain, cramping..."
                      value={description}
                      onChangeText={setDescription}
                      multiline
                      numberOfLines={3}
                      maxLength={200}
                    />

                    <Text style={styles.labelHeader} maxFontSizeMultiplier={1.2}>Select Field Location:</Text>
                    
                    {Platform.OS === 'ios' ? (
                      <View>
                        <Picker
                          selectedValue={selectedField}
                          onValueChange={(itemValue: number) => setSelectedField(itemValue)}
                          itemStyle={styles.pickerItemStyle}
                        >
                          {fields.map((field) => (
                            <Picker.Item key={field.id} label={`Field ${field.id}`} value={field.id} />
                          ))}
                        </Picker>
                      </View>
                    ) : (
                      <View style={styles.androidPickerContainer}>
                        <Picker
                          selectedValue={selectedField}
                          onValueChange={(itemValue: number) => setSelectedField(itemValue)}
                          style={styles.picker}
                          mode="dropdown"
                        >
                          {fields.map((field) => (
                            <Picker.Item key={field.id} label={`Field ${field.id}`} value={field.id} />
                          ))}
                        </Picker>
                      </View>
                    )}

                    <View style={styles.buttonContainer}>
                      <TouchableOpacity style={styles.cancelButton} onPress={handleCloseModal}>
                        <Text style={styles.buttonText} maxFontSizeMultiplier={1.2}>Cancel</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.confirmButton} onPress={requestTrainer}>
                        <Text style={styles.buttonText} maxFontSizeMultiplier={1.2}>Request Trainer</Text>
                      </TouchableOpacity>
                    </View>
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
    ...typography.bodyBold
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
    ...typography.bodySmall,
    color: '#666',
  },
  labelHeader: {
    ...typography.bodyMedium,
    marginVertical: 10
  },
  androidPickerContainer: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    overflow: 'hidden',
  },
  priorityButtonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  },
  picker: {
    width: '80%',
  },
  pickerItemStyle: {
    ...typography.body,
    height: 150
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
  buttonText: {
    color: 'white',
    textAlign: 'center',
    ...typography.bodyMedium,
  },
  closeButton: {
    alignSelf: 'flex-end',
    zIndex: 1,
  },
});

export default TrainerRequestButton;