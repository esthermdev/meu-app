// components/buttons/LargeCardButton.tsx
import React from 'react';
import { StyleSheet, TouchableOpacity, View, ImageBackground } from 'react-native';
import { router, Href } from 'expo-router';
import { FontAwesome, MaterialIcons } from '@expo/vector-icons';
import { typography } from '@/constants/Typography';
import CustomText from '../CustomText';

type FontAwesomeNames = keyof typeof FontAwesome.glyphMap;

interface LargeCardButtonProps {
  title: string;
  subtitle: string;
  icon?: FontAwesomeNames | React.ReactNode;
  backgroundColor?: string;
  route?: Href;
  disabled?: boolean;
  backgroundImage?: any; // For image background
  renderCustomBackground?: () => React.ReactNode; // For complex backgrounds
}

const LargeCardButton: React.FC<LargeCardButtonProps> = ({
  title,
  subtitle,
  icon,
  backgroundColor = '#333',
  route,
  disabled = false,
  backgroundImage,
  renderCustomBackground,
}) => {
  const renderBackground = () => {
    if (renderCustomBackground) {
      return renderCustomBackground();
    }

    if (backgroundImage) {
      return (
        <ImageBackground source={backgroundImage} style={styles.backgroundImage} resizeMode="cover">
          <View style={styles.watchLiveContainer}>
            <MaterialIcons name="play-circle" size={28} color="#fff" />
            <CustomText style={styles.text}>{title}</CustomText>
          </View>
        </ImageBackground>
      );
    }

    return (
      <View style={[styles.contentContainer, { backgroundColor }]}>
        {icon && typeof icon !== 'string' && <View>{icon}</View>}

        <CustomText style={[styles.text, { color: disabled ? '#e5d9c8' : '#ffffff' }]}>{title}</CustomText>
      </View>
    );
  };

  return (
    <TouchableOpacity
      style={[styles.button, styles.halfWidth]}
      onPress={() => (route ? router.push(route) : null)}
      disabled={disabled}>
      {renderBackground()}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  backgroundImage: {
    height: '100%',
    width: '100%',
  },
  button: {
    borderRadius: 12,
    height: 120,
    overflow: 'hidden',
  },
  contentContainer: {
    alignContent: 'space-between',
    flex: 1,
    justifyContent: 'space-between',
    padding: 14,
  },
  halfWidth: {
    flex: 1,
    minWidth: '45%',
  },
  text: {
    color: '#fff',
    ...typography.textLargeBold,
  },
  watchLiveContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    flex: 1,
    justifyContent: 'space-between',
    padding: 15,
  },
});

export default LargeCardButton;
