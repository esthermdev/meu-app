import React from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';

import { DivisionEnum } from '@/types/database';

type Division = DivisionEnum | 'All';

interface FilterButtonProps {
  title: string;
  color: string;
  division: Division;
  onPress: (division: Division) => void;
  isSelected: boolean;
}

export const FilterButton = React.memo<FilterButtonProps>(({ title, color, division, onPress, isSelected }) => (
  <TouchableOpacity
    style={[styles.filterButton, { backgroundColor: color }, isSelected && styles.filterButtonSelected]}
    onPress={() => onPress(division)}>
    <Text maxFontSizeMultiplier={1.2} style={[styles.filterByText, isSelected && styles.filterByTextSelected]}>
      {title}
    </Text>
  </TouchableOpacity>
));

FilterButton.displayName = 'FilterButton';

const styles = StyleSheet.create({
  filterButton: {
    borderColor: 'transparent',
    borderRadius: 100,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  filterButtonSelected: {
    borderColor: '#000',
    opacity: 1,
  },
  filterByText: {
    color: '#fff',
    fontFamily: 'OutfitLight',
    fontSize: 12,
  },
  filterByTextSelected: {
    fontFamily: 'OutfitMedium',
  },
});
