import { Alert, Dimensions, ScrollView, StyleSheet, Text, TouchableOpacity, View, ViewStyle } from 'react-native';
import { Href, router } from 'expo-router';

import CustomText from '@/components/CustomText';
import { typography } from '@/constants/Typography';
import { supabase } from '@/lib/supabase';

import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

const { width } = Dimensions.get('window');
const buttonWidth = width - 40;

// Define the type for Material Icons names
type MaterialCommunityIconName = keyof typeof MaterialCommunityIcons.glyphMap;

interface AdminOptionProps {
  title: string;
  iconName: MaterialCommunityIconName;
  route?: Href;
  onPress?: () => void;
  style?: ViewStyle;
}

interface AdminOptionType {
  title: string;
  iconName: MaterialCommunityIconName;
  route?: Href;
  onPress?: () => void;
  style?: ViewStyle;
}

const AdminOption = ({ title, iconName, onPress, style }: AdminOptionProps) => (
  <TouchableOpacity style={[styles.optionButton, style]} onPress={onPress}>
    <MaterialCommunityIcons name={iconName} size={50} color="#EA1D25" />
    <Text maxFontSizeMultiplier={1} style={styles.optionText}>
      {title}
    </Text>
  </TouchableOpacity>
);

const AdminScreen = () => {
  const updateStandings = async () => {
    try {
      // Call the Supabase RPC function
      const { error } = await supabase.rpc('client_update_rankings_and_tiebreakers');

      if (error) {
        console.error('Error updating rankings:', error);
        Alert.alert('Error', 'Failed to update rankings. Please try again.');
        return;
      }

      Alert.alert('Success', 'Rankings have been updated successfully!');
    } catch (error) {
      console.error('Error updating rankings:', error);
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    }
  };

  const adminOptions: AdminOptionType[] = [
    {
      title: 'Update Games',
      iconName: 'scoreboard',
      route: '/admin/update-scores',
    },
    {
      title: 'Update Standings',
      iconName: 'trophy',
      onPress: updateStandings,
    },
    {
      title: 'Send Public Announcement',
      iconName: 'bullhorn',
      route: '/admin/announcements',
    },
    {
      title: 'General Requests / Feedback',
      iconName: 'information',
      route: '/admin/misc',
    },
    {
      title: 'Chat Messages',
      iconName: 'chat',
      route: '/admin/chat-list',
    },
  ];

  return (
    <View style={styles.container}>
      <CustomText style={styles.headerText}>What do you need?</CustomText>
      <ScrollView contentContainerStyle={styles.contentContainer}>
        {adminOptions.map((option, index) => (
          <AdminOption
            key={index}
            title={option.title}
            iconName={option.iconName}
            route={option.route}
            onPress={
              option.onPress || (option.route !== undefined ? () => router.push(option.route as Href) : undefined)
            }
          />
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  optionButton: {
    alignItems: 'center',
    aspectRatio: 1,
    backgroundColor: '#262626',
    borderRadius: 15,
    justifyContent: 'center',
    maxHeight: 150,
    width: buttonWidth / 2 - 6,
  },
  optionText: {
    color: '#FFFFFF',
    marginTop: 5,
    ...typography.textSemiBold,
    textAlign: 'center',
  },
  container: {
    backgroundColor: '#000',
    flex: 1,
  },
  headerText: {
    ...typography.heading3,
    color: '#fff',
    marginBottom: 12,
    marginTop: 20,
    paddingLeft: 20,
  },
  contentContainer: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'center',
  },
});

export default AdminScreen;
