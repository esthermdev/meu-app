import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { typography } from '@/constants/Typography';

interface AdminBottomActionButtonsProps {
  leftButton: () => void;
  rightButton: () => void;
  rightText?: string;
  leftText?: string;
  rightColor?: string;
  leftColor?: string;
}

const AdminBottomActionButtons: React.FC<AdminBottomActionButtonsProps> = ({
  leftButton,
  rightButton,
  rightText = 'Confirm',
  leftText = 'Cancel',
  rightColor = '#E74C3C',
  leftColor = '#000000',
}) => {
  return (
    <View style={styles.buttonContainer}>
      <TouchableOpacity style={[styles.leftButton, { backgroundColor: leftColor }]} onPress={leftButton}>
        <Text style={styles.buttonText} allowFontScaling={false}>
          {leftText}
        </Text>
      </TouchableOpacity>
      <TouchableOpacity style={[styles.rightButton, { backgroundColor: rightColor }]} onPress={rightButton}>
        <Text style={styles.buttonText} allowFontScaling={false}>
          {rightText}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  buttonContainer: {
    alignItems: 'center',
    backgroundColor: '#242424',
    borderTopColor: '#B3B3B38D',
    borderTopWidth: 1,
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'center',
    paddingBottom: 20,
    paddingHorizontal: 20,
    paddingTop: 15,
  },
  buttonText: {
    color: '#242424',
    ...typography.textSemiBold,
    textAlign: 'center',
  },
  leftButton: {
    alignItems: 'center',
    backgroundColor: '#ED8C22',
    borderRadius: 8,
    flex: 1,
    paddingVertical: 12,
  },
  rightButton: {
    alignItems: 'center',
    backgroundColor: '#DDCF9B',
    borderRadius: 8,
    flex: 1,
    height: 62,
    justifyContent: 'center',
    paddingVertical: 12,
  },
});

export default AdminBottomActionButtons;
