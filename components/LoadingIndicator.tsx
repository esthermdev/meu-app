// components/LoadingIndicator.tsx
import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { typography } from '@/constants/Typography';

import CustomText from './CustomText';

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
    <View style={[styles.container, fullscreen ? styles.fullscreen : null, transparent ? styles.transparent : null]}>
      <ActivityIndicator size={size} color={color} />
      {message ? <CustomText style={styles.text}>{message}</CustomText> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    borderRadius: 10,
    justifyContent: 'center',
    padding: 20,
  },
  fullscreen: {
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
    zIndex: 10,
  },
  transparent: {
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
  },
  text: {
    marginTop: 10,
    ...typography.heading4,
    color: '#000',
  },
});

export default LoadingIndicator;
