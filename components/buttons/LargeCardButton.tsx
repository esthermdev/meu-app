// components/buttons/LargeCardButton.tsx
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View, ImageBackground } from 'react-native';
import { router, Href } from 'expo-router';
import { FontAwesome, MaterialIcons } from '@expo/vector-icons';
import { typography } from '@/constants/Typography';

type FontAwesomeNames = keyof typeof FontAwesome.glyphMap;

interface LargeCardButtonProps {
  title: string;
  icon?: FontAwesomeNames | React.ReactNode;
  backgroundColor?: string;
  route?: Href<string | object>;
  disabled?: boolean;
  backgroundImage?: any; // For image background
  renderCustomBackground?: () => React.ReactNode; // For complex backgrounds
}

const LargeCardButton: React.FC<LargeCardButtonProps> = ({
  title,
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
            <Text style={styles.text}>{title}</Text>
          </View>
        </ImageBackground>
      );
    }
    
    return (
      <View style={[styles.contentContainer, { backgroundColor }]}>
        {icon && typeof icon !== 'string' && (
          <View>{icon}</View>
        )}

        <Text style={styles.text}>{title}</Text>
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
    height: 140,
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
    padding: 15,
    justifyContent: 'space-between',
  },
  watchLiveContainer: {
    padding: 15,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    flex: 1,
    justifyContent: 'space-between',
  },
  text: {
    color: '#fff',
    ...typography.h4
  },
});

export default LargeCardButton;