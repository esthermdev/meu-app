// components/LoadingIndicator.tsx
import { typography } from '@/constants/Typography';
import React from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';

type LoadingIndicatorProps = {
  size?: 'small' | 'large';
  color?: string;
  message?: string;
  fullscreen?: boolean;
  transparent?: boolean;
};

const LoadingIndicator: React.FC<LoadingIndicatorProps> = ({
  size = 'large',
  color = '#EA1D25',
  message = 'Loading...',
  fullscreen = true,
  transparent = true,
}) => {
  return (
    <View 
      style={[
        styles.container, 
        fullscreen ? styles.fullscreen : null,
        transparent ? styles.transparent : null
      ]}
    >
      <ActivityIndicator size={size} color={color} />
      {message ? <Text style={styles.text}>{message}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
  },
  fullscreen: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 10,
  },
  transparent: {
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
  },
  text: {
    marginTop: 10,
    ...typography.bodyMedium,
    color: '#000',
  }
});

export default LoadingIndicator;