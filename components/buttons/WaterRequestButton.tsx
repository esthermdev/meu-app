import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import {
  StyleSheet,
  Text,
  Alert,
  View,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  FlatList
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Tables } from '@/database.types';
import { typography } from '@/constants/Typography';

type Field = Tables<'fields'>;

const WaterRequestButton = () => {
  const [selectedField, setSelectedField] = useState<number | undefined>(undefined);
  const [selectedFieldName, setSelectedFieldName] = useState<string>('Select a field');
  const [fields, setFields] = useState<Field[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);

  useEffect(() => {
    fetchFields();
  }, []);

  const fetchFields = async () => {
    const { data, error } = await supabase.from('fields').select('*');
    if (error) {
      console.error('Error fetching fields:', error);
    } else {
      setFields(data || []);
      if (data && data.length > 0) {
        setSelectedField(data[0].id);
        setSelectedFieldName(data[0].name);
      }
    }
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

      Alert.alert('Refill of water jugs requested', 'Water is on the way');

    } catch (error) {
      console.error('Error requesting water:', error);
      Alert.alert('Error', 'Failed to request water jug refill');
    } finally {
      hideModal();
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.circleButton}
        onPress={showModal}
      >
        <MaterialCommunityIcons name="water" size={28} color="#347764" />
      </TouchableOpacity>
      <Text style={styles.label}>Water</Text>

      <Modal
        visible={isModalVisible}
        transparent={true}
        animationType='fade'
        onRequestClose={hideModal}
      >
        <TouchableWithoutFeedback onPress={hideModal}>
          <View style={styles.modalContainer}>
            <TouchableWithoutFeedback>
              <View style={styles.pickerContainer}>
                <Text style={styles.pickerTitle} maxFontSizeMultiplier={1.2}>Select Field</Text>
                
                <View style={styles.customPickerContainer}>
                  <Text style={styles.selectedFieldText}>{selectedFieldName}</Text>
                  
                  {/* Custom Dropdown List */}
                  <FlatList
                    data={fields}
                    style={styles.dropdownList}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={({ item }) => (
                      <TouchableOpacity 
                        style={[
                          styles.dropdownItem,
                          selectedField === item.id && styles.dropdownItemSelected
                        ]}
                        onPress={() => selectField(item.id, item.name)}
                      >
                        <Text 
                          style={[
                            styles.dropdownItemText,
                            selectedField === item.id && styles.dropdownItemTextSelected
                          ]}
                        >
                          {`Field ${item.name}`}
                        </Text>
                      </TouchableOpacity>
                    )}
                  />
                </View>
                
                <View style={styles.buttonContainer}>
                  <TouchableOpacity style={styles.cancelButton} onPress={hideModal}>
                    <Text style={styles.buttonText} maxFontSizeMultiplier={1.2}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.confirmButton} onPress={requestWater}>
                    <Text style={styles.buttonText} maxFontSizeMultiplier={1.2}>Confirm</Text>
                  </TouchableOpacity>
                </View>
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
  container: {
    alignItems: 'center',
  },
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
  pickerContainer: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    width: '80%',
    maxHeight: '80%',
  },
  pickerTitle: {
    ...typography.h4,
    marginBottom: 10,
    textAlign: 'center',
  },
  customPickerContainer: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    overflow: 'hidden',
  },
  selectedFieldText: {
    padding: 12,
    ...typography.h5,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  dropdownList: {
    maxHeight: 200,
  },
  dropdownItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  dropdownItemSelected: {
    backgroundColor: '#e6f7ff',
  },
  dropdownItemText: {
    ...typography.body,
  },
  dropdownItemTextSelected: {
    ...typography.bodyBold,
    color: '#0078d4',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
  },
  cancelButton: {
    backgroundColor: '#333243',
    padding: 10,
    borderRadius: 100,
    width: '47%',
  },
  confirmButton: {
    backgroundColor: '#347764',
    padding: 10,
    borderRadius: 100,
    width: '47%',
  },
  buttonText: {
    color: 'white',
    textAlign: 'center',
    ...typography.bodyMedium
  },
});