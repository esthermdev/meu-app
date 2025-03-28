// components/CustomHeader.js
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { fonts, typography } from '@/constants/Typography';
import { MaterialIcons } from '@expo/vector-icons';

interface CustomAdminHeader {
  title: string | string[];
  rightIcon?: boolean;
}

export const CustomAdminHeader: React.FC<CustomAdminHeader> = ({ title, rightIcon = true }) => {
  return (
    <View style={styles.headerContainer}>
      <TouchableOpacity onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={23} color="#fff" />
      </TouchableOpacity>
      <View style={styles.titleContainer}>
        <Text style={styles.header} maxFontSizeMultiplier={1}>{title}</Text>
      </View>
      <View style={{ width: 25 }}>
      {rightIcon ? 
        <TouchableOpacity onPress={() => router.navigate('/(user)')}>
          <MaterialIcons name="person-outline" size={25} color="#fff" />
        </TouchableOpacity> : <></>}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#EA1D25',
  },
  header: {
    fontFamily: fonts.semiBold,
    fontSize: 18,
    color: '#fff',
    textAlign: 'center',
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default CustomAdminHeader;