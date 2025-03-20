import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView } from 'react-native';
import { Href, router } from 'expo-router';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { typography } from '@/constants/Typography';

// Define the type for Material Icons names
type MaterialCommunityIconName = keyof typeof MaterialCommunityIcons.glyphMap;

interface AdminOptionProps {
  title: string;
  iconName: MaterialCommunityIconName;
  route: Href;
  onPress?: () => void;
}

interface AdminOptionType {
  title: string;
  iconName: MaterialCommunityIconName;
  route: Href;
}

const AdminOption = ({ title, iconName, onPress }: AdminOptionProps) => (
  <TouchableOpacity style={styles.optionButton} onPress={onPress}>
    <MaterialCommunityIcons name={iconName} size={50} color="#EA1D25" />
    <Text maxFontSizeMultiplier={1} style={styles.optionText}>{title}</Text>
  </TouchableOpacity>
);

const AdminScreen = () => {
  const adminOptions: AdminOptionType[] = [
    {
      title: 'Update Scores',
      iconName: 'scoreboard',
      route: '/admin/update-scores',
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
      <ScrollView contentContainerStyle={styles.contentContainer}>
        {adminOptions.map((option, index) => (
          <AdminOption
            key={index}
            title={option.title}
            iconName={option.iconName}
            route={option.route}
            onPress={() => option.route ? router.push(option.route) : null}
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
  contentContainer: {
    margin: 'auto',
    backgroundColor: '#000',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  optionButton: {
    width: '45%',
    aspectRatio: 1,
    backgroundColor: '#262626',
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionText: {
    marginTop: 5,
    color: '#FFFFFF',
    ...typography.bodyMedium,
    textAlign: 'center',
  },
});

export default AdminScreen;