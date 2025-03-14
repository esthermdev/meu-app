// components/backgrounds/MyGamesBackground.tsx
import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { typography } from '@/constants/Typography';

const MyGamesBackground = ({ title }: { title: string }) => {
  return (
    <View style={styles.container}>
      {/* Decorative circle */}
      <View style={styles.circleContainer} />
      
      {/* Icon */}
      <FontAwesome5 name="bullseye" size={28} color="#fff" />
      
      {/* Title */}
      <Text style={styles.title}>{title}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#e63e2f',
    overflow: 'hidden',
    padding: 20,
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
    ...typography.h4,
  },
});

export default MyGamesBackground;