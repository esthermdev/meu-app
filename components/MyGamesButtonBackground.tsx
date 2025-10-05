// components/backgrounds/MyGamesBackground.tsx
import { View, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { typography } from '@/constants/Typography';
import CustomText from './CustomText';

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
  container: {
    flex: 1,
    backgroundColor: '#e63e2f',
    overflow: 'hidden',
    padding: 14,
    justifyContent: 'space-between',
  },
  circleContainer: {
    position: 'absolute',
    top: -120,
    right: -100,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: '#ff5a46',
    opacity: 0.7,
  },
  title: {
    color: '#fff',
    ...typography.textLargeBold
  },
});

export default MyGamesButtonBackground;