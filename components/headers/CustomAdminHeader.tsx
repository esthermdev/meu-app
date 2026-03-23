// components/CustomHeader.js
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { router } from 'expo-router';

import { fonts } from '@/constants/Typography';

import { MaterialIcons } from '@expo/vector-icons';
import Ionicons from '@expo/vector-icons/Ionicons';

interface CustomAdminHeaderProps {
  title: string | string[];
  rightIcon?: boolean;
}

export const CustomAdminHeader: React.FC<CustomAdminHeaderProps> = ({ title, rightIcon = true }) => {
  return (
    <View style={styles.headerContainer}>
      <TouchableOpacity onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={23} color="#fff" />
      </TouchableOpacity>
      <View style={styles.titleContainer}>
        <Text style={styles.header} maxFontSizeMultiplier={1}>
          {title}
        </Text>
      </View>
      <View style={{ width: 25 }}>
        {rightIcon ? (
          <TouchableOpacity onPress={() => router.navigate('/(tabs)/profile')}>
            <MaterialIcons name="person-outline" size={25} color="#fff" />
          </TouchableOpacity>
        ) : (
          <></>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    color: '#fff',
    fontFamily: fonts.semiBold,
    fontSize: 18,
    textAlign: 'center',
  },
  headerContainer: {
    alignItems: 'center',
    backgroundColor: '#EA1D25',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  titleContainer: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
});

export default CustomAdminHeader;
