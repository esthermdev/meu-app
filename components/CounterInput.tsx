import { StyleSheet, TouchableOpacity, View } from 'react-native';

import { typography } from '@/constants/Typography';

import CustomText from './CustomText';
import Ionicons from '@expo/vector-icons/Ionicons';

interface CounterInputProps {
  value: number;
  onValueChange: (value: number) => void;
  min: number;
  max: number;
  label?: string;
}

/**
 * Numeric stepper with minus/plus buttons. The value is clamped to [min, max] and the
 * buttons are dimmed and inert once a bound is reached.
 */
export const CounterInput = ({ value, onValueChange, min, max, label }: CounterInputProps) => {
  const canDecrement = value > min;
  const canIncrement = value < max;

  const increment = () => onValueChange(Math.min(value + 1, max));
  const decrement = () => onValueChange(Math.max(value - 1, min));

  return (
    <View style={styles.counterContainer}>
      <TouchableOpacity
        onPress={decrement}
        style={[styles.counterButton, !canDecrement && styles.counterButtonDisabled]}
        disabled={!canDecrement}
        accessibilityRole="button"
        accessibilityLabel={label ? `Decrease ${label}` : 'Decrease'}>
        <Ionicons name="remove" size={24} color={canDecrement ? '#EA1D25' : '#C4C4C4'} />
      </TouchableOpacity>
      <CustomText style={styles.counterText} allowFontScaling maxFontSizeMultiplier={1.3}>
        {value}
      </CustomText>
      <TouchableOpacity
        onPress={increment}
        style={[styles.counterButton, !canIncrement && styles.counterButtonDisabled]}
        disabled={!canIncrement}
        accessibilityRole="button"
        accessibilityLabel={label ? `Increase ${label}` : 'Increase'}>
        <Ionicons name="add" size={24} color={canIncrement ? '#EA1D25' : '#C4C4C4'} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  counterContainer: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    minWidth: 120,
  },
  counterButton: {
    alignItems: 'center',
    backgroundColor: '#F0F0F0',
    borderRadius: 20,
    height: 35,
    justifyContent: 'center',
    width: 35,
  },
  counterButtonDisabled: {
    backgroundColor: '#F7F7F7',
  },
  counterText: {
    ...typography.textBold,
    minWidth: 40,
    paddingHorizontal: 15,
    textAlign: 'center',
  },
});

export default CounterInput;
