import { typography } from '@/constants/Typography';
import React from 'react';
import { StyleSheet, TouchableOpacity, Text, ActivityIndicator, ViewStyle, TextStyle } from 'react-native';

interface PrimaryButtonProps {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

const PrimaryButton: React.FC<PrimaryButtonProps> = ({
  title,
  onPress,
  loading = false,
  disabled = false,
  style,
  textStyle,
}) => {
  return (
    <TouchableOpacity
      style={[
        styles.button,
        disabled && styles.buttonDisabled,
        style,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator color="#FFFFFF" size="small" />
      ) : (
        <Text style={[styles.buttonText, textStyle]}>{title}</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    padding: 20,
    backgroundColor: '#EA1D25',
    borderRadius: 12,
  },
  buttonDisabled: {
    backgroundColor: '#EA1D25',
    opacity: 0.6,
  },
  buttonText: {
    color: '#FFFFFF',
    ...typography.button,
    textAlign: 'center',
  },
});

export default PrimaryButton;