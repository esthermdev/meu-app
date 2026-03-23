// components/backgrounds/MyGamesBackground.tsx
import { StyleSheet, View } from 'react-native';

import { typography } from '@/constants/Typography';

import CustomText from './CustomText';
import { Feather } from '@expo/vector-icons';

const MyGamesButtonBackground = ({ title }: { title: string }) => {
  return (
    <View style={styles.container}>
      {/* Decorative circle */}
      <View style={styles.circleContainer} />

      {/* Icon */}
      <Feather name="target" size={28} color="#fff" />

      {/* Title */}
      <CustomText style={styles.title}>{title}</CustomText>
    </View>
  );
};

const styles = StyleSheet.create({
  circleContainer: {
    backgroundColor: '#ff5a46',
    borderRadius: 150,
    height: 300,
    opacity: 0.7,
    position: 'absolute',
    right: -100,
    top: -120,
    width: 300,
  },
  container: {
    backgroundColor: '#e63e2f',
    flex: 1,
    justifyContent: 'space-between',
    overflow: 'hidden',
    padding: 14,
  },
  title: {
    color: '#fff',
    ...typography.textLargeBold,
  },
});

export default MyGamesButtonBackground;
