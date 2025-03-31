// components/buttons/FullWidthButton.tsx
import { StyleSheet, TouchableOpacity, View } from 'react-native';
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
}

const FullWidthButton: React.FC<FullWidthButtonProps> = ({
  title,
  icon,
  backgroundColor,
  iconColor,
  route,
  disabled = false,
}) => {
  return (
    <TouchableOpacity
      style={[styles.button, { backgroundColor, borderColor: iconColor }, ]}
      onPress={() => route ? router.push(route) : null}
      disabled={disabled}
    >
      <View style={styles.content}>
        <MaterialCommunityIcons name={icon} size={24} color={iconColor} />
        <CustomText style={[styles.text, {color: iconColor}]}>{title}</CustomText>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: 16,
    padding: 15,
    borderWidth: 1,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  text: {
    marginLeft: 15,
    ...typography.textLargeSemiBold
  },
});

export default FullWidthButton;