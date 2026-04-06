import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { router } from 'expo-router';

import { typography } from '@/constants/Typography';

import { Ionicons } from '@expo/vector-icons';

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
  container: {
    alignItems: 'center',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    flexDirection: 'row',
    height: 60,
    paddingHorizontal: 20,
  },
  backButton: {
    marginRight: 15,
  },
  title: {
    ...typography.heading3,
    color: '#EA1D25',
  },
});

export default ScreenTitle;
