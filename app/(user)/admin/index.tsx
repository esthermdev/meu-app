import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView, ViewStyle, Dimensions } from 'react-native';
import { Href, router } from 'expo-router';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { typography } from '@/constants/Typography';

const { width } = Dimensions.get('window')
const buttonWidth = (width - 40);

// Define the type for Material Icons names
type MaterialCommunityIconName = keyof typeof MaterialCommunityIcons.glyphMap;

interface AdminOptionProps {
  title: string;
  iconName: MaterialCommunityIconName;
  route: Href;
  onPress?: () => void;
  style?: ViewStyle;
}

interface AdminOptionType {
  title: string;
  iconName: MaterialCommunityIconName;
  route: Href;
  style?: ViewStyle;
}

const AdminOption = ({ title, iconName, onPress, style }: AdminOptionProps) => (
  <TouchableOpacity style={[styles.optionButton, style]} onPress={onPress}>
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
  ];


  return (
    <View style={styles.container}>
      <Text style={styles.headerText}>What do you need?</Text>
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
        <AdminOption 
          title='Send Public Announcement'
          iconName='bullhorn'
          route='/admin/announcements'
          style={{ width: width - 40, maxHeight: 150 }}
          onPress={() => router.push('/admin/announcements')}
        />
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
    ...typography.h3,
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
    ...typography.bodyMedium,
    textAlign: 'center',
  },
});

export default AdminScreen;