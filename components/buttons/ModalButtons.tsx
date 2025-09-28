import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { typography } from '@/constants/Typography';
import CustomText from '../CustomText';

interface ModalButtonContainerProps {
  onCancel: () => void;
  onConfirm: () => void;
  confirmText?: string;
  cancelText?: string;
  confirmColor?: string;
  cancelColor?: string;
}

const ModalButton: React.FC<ModalButtonContainerProps> = ({
  onCancel,
  onConfirm,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  confirmColor = '#EA1D25',
  cancelColor = '#000000',
}) => {
  return (
    <View style={styles.buttonContainer}>
      <TouchableOpacity 
        style={[styles.cancelButton, { backgroundColor: cancelColor }]} 
        onPress={onCancel}
      >
        <CustomText style={styles.buttonText}>{cancelText}</CustomText>
      </TouchableOpacity>
      <TouchableOpacity 
        style={[styles.confirmButton, { backgroundColor: confirmColor }]} 
        onPress={onConfirm}
      >
        <CustomText style={styles.buttonText}>{confirmText}</CustomText>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  cancelButton: {
    padding: 12,
    borderRadius: 6,
    width: '48%',
    justifyContent: 'center',
  },
  confirmButton: {
    padding: 12,
    borderRadius: 6,
    width: '48%',
    justifyContent: 'center',
  },
  buttonText: {
    color: 'white',
    textAlign: 'center',
    ...typography.bodyMedium
  },
});

export default ModalButton;