// components/buttons/CircleIconButton.tsx
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { Href, router } from 'expo-router';

import { typography } from '@/constants/Typography';

import CustomText from '../CustomText';
import { MaterialCommunityIcons } from '@expo/vector-icons';

type MaterialIconNames = keyof typeof MaterialCommunityIcons.glyphMap;

interface CircleIconButtonProps {
  icon: MaterialIconNames;
  iconColor?: string;
  label: string;
  route?: Href;
  disabled?: boolean;
}

const CircleIconButton: React.FC<CircleIconButtonProps> = ({ icon, iconColor, label, route, disabled = false }) => {
  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.button} onPress={() => (route ? router.push(route) : null)} disabled={disabled}>
        <MaterialCommunityIcons name={icon} size={28} color={iconColor} />
      </TouchableOpacity>
      <CustomText style={styles.label}>{label}</CustomText>
    </View>
  );
};

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    backgroundColor: '#edebebff',
    borderRadius: 35,
    height: 70,
    justifyContent: 'center',
    width: 70,
  },
  container: {
    alignItems: 'center',
  },
  label: {
    marginTop: 5,
    textAlign: 'center',
    ...typography.textSmallBold,
  },
});

export default CircleIconButton;
