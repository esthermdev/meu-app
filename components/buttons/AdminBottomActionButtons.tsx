import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { fonts, typography } from '@/constants/Typography';

interface AdminBottomActionButtons {
  leftButton: () => void;
  rightButton: () => void;
  rightText?: string;
  leftText?: string;
  rightColor?: string;
  leftColor?: string;
}

const AdminBottomActionButtons: React.FC<AdminBottomActionButtons> = ({
  leftButton,
  rightButton,
  rightText = 'Confirm',
  leftText = 'Cancel',
  rightColor = '#E74C3C',
  leftColor = '#000000',
}) => {
  return (
    <View style={styles.buttonContainer}>
      <TouchableOpacity 
        style={[styles.leftButton, { backgroundColor: leftColor }]} 
        onPress={leftButton}
      >
        <Text style={styles.buttonText} allowFontScaling={false}>{leftText}</Text>
      </TouchableOpacity>
      <TouchableOpacity 
        style={[styles.rightButton, { backgroundColor: rightColor }]} 
        onPress={rightButton}
      >
        <Text style={styles.buttonText} allowFontScaling={false}>{rightText}</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  buttonContainer: {
    borderTopColor: '#B3B3B38D',
    borderTopWidth: 1,
    flexDirection: 'row',
    paddingTop: 15,
    paddingBottom: 20,
    paddingHorizontal: 20,
    backgroundColor: '#242424',
    gap: 12,
    justifyContent: 'center',
    alignItems: 'center'
  },
  leftButton: {
    flex: 1,
    backgroundColor: '#ED8C22',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  rightButton: {
    flex: 1,
    backgroundColor: '#DDCF9B',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    height: 62,
    justifyContent: 'center'
  },
  buttonText: {
    color: '#242424',
    ...typography.textSemiBold,
    textAlign: 'center',
  },
});

export default AdminBottomActionButtons;