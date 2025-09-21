import { View, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import CustomText from '@/components/CustomText';
import { typography } from '@/constants/Typography';

interface ComingSoonPlaceholderProps {
  message?: string;
  iconName?: keyof typeof MaterialIcons.glyphMap;
  iconSize?: number;
  style?: any;
}

export default function ComingSoonPlaceholder({ 
  message = "Coming Soon", 
  iconName = "schedule",
  iconSize = 64,
  style 
}: ComingSoonPlaceholderProps) {
  return (
    <View style={[styles.container, style]}>
      <MaterialIcons
        name={iconName}
        size={iconSize}
        color="#EA1D25"
        style={styles.icon}
      />
      <CustomText style={styles.message}>{message}</CustomText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  icon: {
    marginBottom: 16,
    opacity: 0.6,
  },
  message: {
    ...typography.textLargeMedium,
    color: '#888',
    textAlign: 'center',
  },
});