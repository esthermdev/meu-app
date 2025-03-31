import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ViewStyle, Dimensions, Alert } from 'react-native';
import { Href, router } from 'expo-router';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { typography } from '@/constants/Typography';
import { supabase } from '@/lib/supabase';
import CustomText from '@/components/CustomText';

const { width } = Dimensions.get('window')
const buttonWidth = (width - 40);

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
    <Text maxFontSizeMultiplier={1} style={styles.optionText}>{title}</Text>
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
      title: 'Update Scores',
      iconName: 'scoreboard',
      route: '/admin/update-scores',
    },
    {
      title: 'Update Standings',
      iconName: 'trophy',
      onPress: updateStandings
    },
    {
      title: 'Trainers List',
      iconName: 'whistle',
      route: '/admin/trainers-list',
    },
    {
      title: 'Cart Requests',
      iconName: 'car',
      route: '/admin/cart-requests',
    },
    {
      title: 'Water Requests',
      iconName: 'water',
      route: '/admin/water-requests',
    },
    {
      title: 'Send Public Announcement',
      iconName: 'bullhorn',
      route: '/admin/announcements',
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
            onPress={option.onPress || (option.route !== undefined ? () => router.push(option.route as Href<string | object>) : undefined)}
          />
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  headerText: {
    ...typography.heading3,
    color: "#fff",
    paddingLeft: 20,
    marginBottom: 12,
    marginTop: 20
  },
  contentContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12
  },
  optionButton: {
    width: buttonWidth / 2 - 6,
    maxHeight: 150,
    aspectRatio: 1,
    backgroundColor: '#262626',
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionText: {
    marginTop: 5,
    color: '#FFFFFF',
    ...typography.textSemiBold,
    textAlign: 'center',
  },
});

export default AdminScreen;