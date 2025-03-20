// components/CustomHeader.js
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import { router } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { fonts, typography } from '@/constants/Typography';
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';

interface CustomUpdateScoresHeader {
  title: string | string[];
}

export const CustomUpdateScoresHeader: React.FC<CustomUpdateScoresHeader> = ({ title }) => {
  return (
    <View style={styles.headerContainer}>
      <TouchableOpacity onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={23} color="#fff" />
      </TouchableOpacity>

      <Text style={styles.header} maxFontSizeMultiplier={1}>{title}</Text>

      <TouchableOpacity onPress={() => router.navigate('/(user)')}>
        <MaterialIcons name="person-outline" size={25} color="#fff" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomColor: '#D9D9D9',
    borderBottomWidth: 1,
    backgroundColor: '#EA1D25',
    paddingVertical: 10,
    paddingHorizontal: 20
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

export default CustomUpdateScoresHeader;