import React, { useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, Modal, FlatList, StyleSheet } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { ms } from 'react-native-size-matters';
import { fonts } from '@/constants/Typography';
import { formatDate } from '@/utils/formatDate';

interface DatetimeOption {
  id: number;
  label: string;
  date: string | null;
  time: string;
}

interface DateTimeFilteredDropdownProps {
  label: string;
  datetimeOptions: DatetimeOption[];
  onSelect: (selectedLabel: string) => void;
  selectedValue?: string;
  error?: boolean;
}

export const DateTimeFilteredDropdown: React.FC<DateTimeFilteredDropdownProps> = ({
  label,
  datetimeOptions,
  onSelect,
  selectedValue,
  error,
}) => {
  const [visible, setVisible] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [showingDates, setShowingDates] = useState(true);

  // Group options by date
  const groupedByDate = useMemo(() => {
    const groups = new Map<string, DatetimeOption[]>();

    datetimeOptions.forEach((option) => {
      const dateKey = option.date ? formatDate(option.date, 'short') : 'TBD';
      if (!groups.has(dateKey)) {
        groups.set(dateKey, []);
      }
      groups.get(dateKey)!.push(option);
    });

    return groups;
  }, [datetimeOptions]);

  // Get unique dates
  const uniqueDates = useMemo(() => {
    return Array.from(groupedByDate.keys()).sort();
  }, [groupedByDate]);

  // Get times for selected date
  const timesForSelectedDate = useMemo(() => {
    if (!selectedDate) return [];
    return groupedByDate.get(selectedDate) || [];
  }, [selectedDate, groupedByDate]);

  const toggleDropdown = () => {
    setVisible(!visible);
    if (!visible) {
      setShowingDates(true);
      setSelectedDate(null);
    }
  };

  const handleDateSelect = (date: string) => {
    setSelectedDate(date);
    setShowingDates(false);
  };

  const handleTimeSelect = (option: DatetimeOption) => {
    onSelect(option.label);
    setVisible(false);
    setShowingDates(true);
    setSelectedDate(null);
  };

  const handleBackToDates = () => {
    setShowingDates(true);
    setSelectedDate(null);
  };

  const renderDateItem = ({ item }: { item: string }) => (
    <TouchableOpacity style={styles.item} onPress={() => handleDateSelect(item)}>
      <Text style={styles.listItem} maxFontSizeMultiplier={1}>
        {item}
      </Text>
      <Ionicons name="chevron-forward" size={16} color="#666" />
    </TouchableOpacity>
  );

  const renderTimeItem = ({ item }: { item: DatetimeOption }) => (
    <TouchableOpacity style={styles.item} onPress={() => handleTimeSelect(item)}>
      <Text style={styles.listItem} maxFontSizeMultiplier={1}>
        {item.label.split(' at ')[1]}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.button, error ? { borderColor: '#EA1D25' } : null]}
        onPress={toggleDropdown}>
        <Text style={styles.buttonText} maxFontSizeMultiplier={1.1}>
          {selectedValue || label}
        </Text>
        <Ionicons name={visible ? 'caret-up' : 'caret-down'} size={20} color="#333" />
      </TouchableOpacity>

      <Modal visible={visible} transparent animationType="none">
        <TouchableOpacity style={styles.overlay} onPress={() => setVisible(false)}>
          <View style={styles.dropdown}>
            {!showingDates && (
              <TouchableOpacity style={styles.backButton} onPress={handleBackToDates}>
                <Ionicons name="chevron-back" size={20} color="#333" />
                <Text style={styles.backText}>Back to dates</Text>
              </TouchableOpacity>
            )}

            <Text style={styles.headerText}>
              {showingDates ? 'Select Date' : `Times for ${selectedDate}`}
            </Text>

            {showingDates ? (
              <FlatList
                data={uniqueDates}
                renderItem={renderDateItem}
                keyExtractor={(item) => item.toString()}
              />
            ) : (
              <FlatList
                data={timesForSelectedDate}
                renderItem={renderTimeItem}
                keyExtractor={(item) => item.id.toString()}
              />
            )}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  backButton: {
    alignItems: 'center',
    borderBottomColor: '#ccc',
    borderBottomWidth: 1,
    flexDirection: 'row',
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  backText: {
    color: '#333',
    fontFamily: fonts.medium,
    fontSize: ms(14),
    marginLeft: 5,
  },
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
    maxHeight: '50%',
    paddingTop: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    width: '70%',
  },
  headerText: {
    borderBottomColor: '#ccc',
    borderBottomWidth: 1,
    fontFamily: fonts.medium,
    fontSize: ms(16),
    marginBottom: 5,
    paddingVertical: 10,
    textAlign: 'center',
  },
  item: {
    alignItems: 'center',
    borderBottomColor: '#ccc',
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
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

export default DateTimeFilteredDropdown;
