// components/buttons/FullWidthButton.tsx
import { StyleSheet, TouchableOpacity, View, ViewStyle } from 'react-native';
import { router, Href } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { typography } from '@/constants/Typography';
import CustomText from '../CustomText';

type MaterialIconNames = keyof typeof MaterialCommunityIcons.glyphMap;

interface FullWidthButtonProps {
  title: string;
  icon: MaterialIconNames;
  backgroundColor: string;
  iconColor?: string;
  route?: Href<string | object>;
  disabled?: boolean;
  style?: ViewStyle;
}

const FullWidthButton: React.FC<FullWidthButtonProps> = ({
  title,
  icon,
  backgroundColor,
  iconColor,
  route,
  disabled = false,
  style,
}) => {
  return (
    <TouchableOpacity
      style={[styles.button, { backgroundColor, borderColor: iconColor }, style]}
      onPress={() => route ? router.push(route) : null}
      disabled={disabled}
    >
      <View style={styles.content}>
        <MaterialCommunityIcons name={icon} size={18} color={iconColor} /> 
        <CustomText style={[styles.text, {color: iconColor}]}>{title}</CustomText>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: 10,
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderWidth: 1,
    width: '100%',
    height: 40
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5
  },
  text: {
    ...typography.bodyMediumBold
  },
});

export default FullWidthButton;