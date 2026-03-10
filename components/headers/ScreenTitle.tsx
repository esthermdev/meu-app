import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { typography } from '@/constants/Typography';

interface ScreenTitleProps {
  title: string;
  showBackButton?: boolean;
}

export const ScreenTitle: React.FC<ScreenTitleProps> = ({ title, showBackButton = true }) => {
  return (
    <View style={styles.container}>
      {showBackButton && (
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="caret-back" size={20} color="#000" />
        </TouchableOpacity>
      )}
      <Text maxFontSizeMultiplier={1.1} style={styles.title}>
        {title}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  backButton: {
    marginRight: 15,
  },
  container: {
    alignItems: 'center',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    flexDirection: 'row',
    height: 60,
    paddingHorizontal: 20,
  },
  title: {
    ...typography.heading3,
    color: '#EA1D25',
  },
});

export default ScreenTitle;
