import React from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';

import { Database } from '@/database.types';

type Division = Database['public']['Enums']['division'] | 'All';

interface FilterButtonProps {
  title: string;
  color: string;
  division: Division;
  onPress: (division: Division) => void;
  isSelected: boolean;
}

export const FilterButton = React.memo<FilterButtonProps>(({
  title,
  color,
  division,
  onPress,
  isSelected
}) => (
  <TouchableOpacity 
    style={[
      styles.filterButton,
      { backgroundColor: color },
      isSelected && styles.filterButtonSelected
    ]} 
    onPress={() => onPress(division)}
  >
    <Text
      maxFontSizeMultiplier={1.2}
      style={[styles.filterByText, isSelected && styles.filterByTextSelected]}
    >
      {title}
    </Text>
  </TouchableOpacity>
));

const styles = StyleSheet.create({
  filterButton: {
    borderRadius: 100,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  filterButtonSelected: {
    borderColor: '#000',
    opacity: 1,
  },
  filterByText: {
    fontFamily: 'OutfitLight',
    fontSize: 12,
    color: '#fff',
  },
  filterByTextSelected: {
    fontFamily: 'OutfitMedium',
  },
});