// components/buttons/LargeCardButton.tsx
import React from 'react';
import { StyleSheet, TouchableOpacity, View, ImageBackground } from 'react-native';
import { router, Href } from 'expo-router';
import { FontAwesome, MaterialIcons } from '@expo/vector-icons';
import { fonts, typography } from '@/constants/Typography';
import CustomText from '../CustomText';

type FontAwesomeNames = keyof typeof FontAwesome.glyphMap;

interface LargeCardButtonProps {
  title: string;
  subtitle: string;
  icon?: FontAwesomeNames | React.ReactNode;
  backgroundColor?: string;
  route?: Href<string | object>;
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
        <ImageBackground 
          source={backgroundImage} 
          style={styles.backgroundImage}
          resizeMode="cover"
        >
          <View style={styles.watchLiveContainer}>
            <MaterialIcons name="play-circle" size={28} color="#fff" />
            <CustomText style={styles.text}>{title}</CustomText>
          </View>
        </ImageBackground>
      );
    }
    
    return (
      <View style={[styles.contentContainer, { backgroundColor }]}>
        {icon && typeof icon !== 'string' && (
          <View>{icon}</View>
        )}

        <CustomText 
            style={[
              styles.text, 
              { color: disabled ? '#e5d9c8' : '#ffffff' }
            ]}
        >
          {title}
        </CustomText>
      </View>
    );
  };

  return (
    <TouchableOpacity
      style={[
        styles.button,
        styles.halfWidth,
      ]}
      onPress={() => route ? router.push(route) : null}
      disabled={disabled}
    >
      {renderBackground()}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: 12,
    overflow: 'hidden',
    height: 120,
  },
  halfWidth: {
    flex: 1,
    minWidth: '45%',
  },
  backgroundImage: {
    width: '100%',
    height: '100%',
  },
  contentContainer: {
    flex: 1,
    padding: 14,
    justifyContent: 'space-between',
    alignContent: 'space-between'
  },
  watchLiveContainer: {
    padding: 15,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    flex: 1,
    justifyContent: 'space-between',
  },
  text: {
    color: '#fff',
    ...typography.textLargeBold

  },
});

export default LargeCardButton;