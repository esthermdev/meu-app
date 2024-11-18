import React from 'react';
import { StatusBar, View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Href, router } from 'expo-router';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

// Define the type for Material Icons names
type MaterialIconName = keyof typeof MaterialIcons.glyphMap;

interface AdminOptionProps {
  title: string;
  iconName: MaterialIconName;
  onPress?: () => void;
}

const AdminOption = ({ title, iconName, onPress }: AdminOptionProps) => (
  <TouchableOpacity style={styles.optionButton} onPress={onPress}>
    <MaterialIcons name={iconName} size={52} color="#FFFFFF" />
    <Text maxFontSizeMultiplier={1} style={styles.optionText}>{title}</Text>
  </TouchableOpacity>
);

interface AdminOptionType {
  title: string;
  iconName: MaterialIconName;
}

const AdminScreen = () => {
  const adminOptions: AdminOptionType[] = [
    {
      title: 'Update Scores',
      iconName: 'scoreboard',
    },
    {
      title: 'Trainers List',
      iconName: 'sports',
    },
    {
      title: 'Cart Requests',
      iconName: 'directions-car',
    },
    {
      title: 'Water Refill Requests',
      iconName: 'water-drop',
    },
    {
      title: 'Send Public Announcement',
      iconName: 'campaign',
    },
  ];


  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.subtitle}>What do you need?</Text>
      <ScrollView contentContainerStyle={styles.contentContainer}>
        {adminOptions.map((option, index) => (
          <AdminOption
            key={index}
            title={option.title}
            iconName={option.iconName}
            onPress={() => null}
          />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#333243',
  },
  subtitle: {
    fontFamily: 'Outfit-Medium',
    fontSize: 18,
    color: '#FFFFFF',
    marginTop: 20,
    marginLeft: 20,
  },
  contentContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    padding: 20,
  },
  optionButton: {
    width: '45%',
    aspectRatio: 1,
    backgroundColor: '#EA1D25',
    borderRadius: 15,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  optionText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Outfit-SemiBold',
    marginTop: 10,
    textAlign: 'center',
  },
});

export default AdminScreen;