// components/CustomHeader.js
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { typography } from '@/constants/Typography';

interface CustomHeaderProps {
  title: string | string[];
}

export const CustomHeader: React.FC<CustomHeaderProps> = ({ title }) => {
  return (
    <View style={styles.headerContainer}>
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={23} color="#EA1D25" />
      </TouchableOpacity>
      <View style={styles.titleContainer}>
        <Text style={styles.header} maxFontSizeMultiplier={1}>{title}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomColor: '#D9D9D9',
    borderBottomWidth: 1,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#fff',
    position: 'relative',
  },
  header: {
    ...typography.h5,
    color: '#000',
    textAlign: 'center',
  },
  backButton: {
    position: 'absolute',
    left: 20,
    zIndex: 10,
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default CustomHeader;