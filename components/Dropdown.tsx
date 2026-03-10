import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, FlatList, StyleSheet } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { ms } from 'react-native-size-matters';
import { fonts } from '@/constants/Typography';

interface DropdownProps {
  label: string;
  data: string[];
  onSelect: (item: string) => void;
  selectedValue?: string;
  error?: boolean;
}

export const Dropdown: React.FC<DropdownProps> = ({ label, data, onSelect, selectedValue, error }) => {
  const [visible, setVisible] = useState(false);

  const toggleDropdown = () => {
    setVisible(!visible);
  };

  const renderItem = ({ item }: { item: string }) => (
    <TouchableOpacity
      style={styles.item}
      onPress={() => {
        onSelect(item);
        setVisible(false);
      }}>
      <Text style={styles.listItem} maxFontSizeMultiplier={1}>
        {item}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <TouchableOpacity style={[styles.button, error ? { borderColor: '#EA1D25' } : null]} onPress={toggleDropdown}>
        <Text style={styles.buttonText} maxFontSizeMultiplier={1.1}>
          {selectedValue || label}
        </Text>
        <Ionicons name={visible ? 'caret-up' : 'caret-down'} size={20} color="#333" />
      </TouchableOpacity>
      <Modal visible={visible} transparent animationType="none">
        <TouchableOpacity style={styles.overlay} onPress={() => setVisible(false)}>
          <View style={styles.dropdown}>
            <FlatList data={data} renderItem={renderItem} keyExtractor={(item) => item.toString()} />
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    borderColor: '#ccc',
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 15,
  },
  buttonText: {
    fontFamily: fonts.medium,
    fontSize: ms(16),
  },
  container: {
    marginBottom: 8,
  },
  dropdown: {
    backgroundColor: 'white',
    borderRadius: 12,
    elevation: 5,
    margin: 'auto',
    maxHeight: '40%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    width: '60%',
  },
  inputError: {
    borderColor: '#DD3333',
    borderWidth: 1,
  },
  item: {
    alignItems: 'center',
    borderBottomColor: '#ccc',
    borderBottomWidth: 1,
    marginHorizontal: 10,
    paddingVertical: 15,
  },
  listItem: {
    fontFamily: fonts.regular,
    fontSize: ms(16),
  },
  overlay: {
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    flex: 1,
  },
});

export default Dropdown;
