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
  Dimensions,
  FlatList
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { ms } from 'react-native-size-matters';
import { Tables } from '@/database.types';

type Field = Tables<'fields'>;

const { width } = Dimensions.get('window');
const buttonWidth = (width - 70) / 2;

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
      const { data: newRequest, error: insertError } = await supabase
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
      console.error('Error requesting water jug refills:', error);
      Alert.alert('Error', 'Failed to request water jug refill');
    } finally {
      hideModal();
    }
  };

  return (
    <View>
      <TouchableOpacity
        style={styles.buttonStyle}
        onPress={showModal}
      >
        <Ionicons name="water" size={27} color="#FFF" />
        <Text maxFontSizeMultiplier={1} style={styles.text}>Water</Text>
      </TouchableOpacity>

      <Modal
        visible={isModalVisible}
        transparent={true}
        animationType="slide"
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
  buttonStyle: {
    flex: 1,
    padding: 20,
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    borderRadius: 22,
    minHeight: 120,
    width: buttonWidth,
    backgroundColor: '#3DC5C5',
  },
  text: {
    fontSize: ms(16),
    fontFamily: 'Outfit-Bold',
    color: '#fff'
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
    fontSize: ms(20),
    fontFamily: 'Outfit-Bold',
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
    fontSize: ms(16),
    fontFamily: 'Outfit-Medium',
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
    fontSize: ms(16),
    fontFamily: 'Outfit-Regular',
  },
  dropdownItemTextSelected: {
    fontFamily: 'Outfit-Medium',
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
    backgroundColor: '#EA1D25',
    padding: 10,
    borderRadius: 100,
    width: '47%',
  },
  buttonText: {
    color: 'white',
    textAlign: 'center',
    fontFamily: 'Outfit-Bold',
    fontSize: ms(16)
  },
});