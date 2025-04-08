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
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Tables } from '@/database.types';
import { typography } from '@/constants/Typography';
import ModalButton from '../../buttons/ModalButtons';
import CustomText from '../../CustomText';

type Field = Tables<'fields'>;

const { width } = Dimensions.get('window');
const numColumns = 5; // Number of columns in the grid
const blockSize = (width * 0.8 - 60) / numColumns; // Calculate block size based on screen width

const WaterRequestButton = () => {
  const [selectedField, setSelectedField] = useState<number | undefined>(undefined);
  const [selectedFieldName, setSelectedFieldName] = useState<string>('');
  const [fields, setFields] = useState<Field[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);

  useEffect(() => {
    fetchFields();
  }, []);

  const fetchFields = async () => {
    const { data, error } = await supabase.from('fields').select('*').order('name');
    if (error) {
      console.error('Error fetching fields:', error);
    } else {
      setFields(data || []);
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

  const renderFieldBlock = ({ item }: { item: Field }) => (
    <TouchableOpacity 
      style={[
        styles.fieldBlock,
        selectedField === item.id && styles.selectedFieldBlock
      ]}
      onPress={() => selectField(item.id, item.name)}
      activeOpacity={1}
    >
      <CustomText 
        style={[
          styles.fieldBlockText,
          selectedField === item.id && styles.selectedFieldText
        ]}
        allowFontScaling
        maxFontSizeMultiplier={1.2}
      >
        {item.name}
      </CustomText>
    </TouchableOpacity>
  );

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
    maxHeight: '70%',
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
  fieldBlockText: {
    ...typography.labelBold,
    textAlign: 'center',
  },
  selectedFieldText: {
    color: '#fff',
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
});