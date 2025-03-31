import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import {
  StyleSheet,
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
import ModalButton from '../buttons/ModalButtons';
import CustomText from '../CustomText';

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
      hideModal();
      Alert.alert('Water Requested', 'Volunteers will attend to your request shortly.');

    } catch (error) {
      console.error('Error requesting water:', error);
      Alert.alert('Error', 'Failed to request water jug refill');
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
      <CustomText style={styles.label} allowFontScaling maxFontSizeMultiplier={1.2}>Water</CustomText>

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
                <CustomText style={styles.pickerTitle}>Select Field</CustomText>
                
                <FlatList
                  data={fields}
                  style={styles.fieldList}
                  keyExtractor={(item) => item.id.toString()}
                  renderItem={({ item }) => (
                    <TouchableOpacity 
                      style={[
                        styles.fieldItem,
                        selectedField === item.id && styles.selectedFieldItem
                      ]}
                      onPress={() => selectField(item.id, item.name)}
                    >
                      <CustomText style={[
                          styles.fieldItemText,
                          selectedField === item.id && styles.selectedFieldText
                        ]}
                        allowFontScaling
                        maxFontSizeMultiplier={1.4}  
                      >
                        Field {item.name}
                      </CustomText>
                    </TouchableOpacity>
                  )}
                />
                
                <ModalButton 
                  onCancel={hideModal}
                  onConfirm={requestWater}
                  confirmText="Confirm"
                />
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
    ...typography.labelBold
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  pickerContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    width: '80%',
    maxHeight: '60%',
  },
  pickerTitle: {
    ...typography.heading4,
    textAlign: 'center',
    marginBottom: 20,
  },
  fieldList: {
    maxHeight: 250,
  },
  fieldItem: {
    borderTopWidth: 0.5,
    borderColor: '#E0E0E0',
  },
  selectedFieldItem: {
    backgroundColor: '#F5F5F5',
    borderLeftWidth: 3,
    borderLeftColor: '#E74C3C',
  },
  fieldItemText: {
    ...typography.body,
    textAlign: 'center',
    paddingVertical: 15,
  },
  selectedFieldText: {
    ...typography.bodyBold,
    color: '#E74C3C',
  },
});