import { StyleSheet, View, ScrollView } from 'react-native';
import { Href, router } from 'expo-router';
import { useAuth } from '@/context/AuthProvider';
import { Card } from '@/components/Card';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { typography } from '@/constants/Typography';
import NotificationPermission from '@/components/features/notifications/NotificationPermission';
import CustomText from '@/components/CustomText';


export default function UserDashboard() {
  const { profile } = useAuth();

  const handleOpenExternalDeleteAccount = () => {
    // Use your new Render URL here
    router.push('https://maine-ultimate-account-deletion.onrender.com');
  };

  return (
    <ScrollView style={styles.container}>      
      <View style={styles.header}>
        <CustomText style={styles.welcomeText}>
          Welcome, <CustomText style={styles.username}>{profile?.full_name}!</CustomText>
        </CustomText>
      </View>

      {/* Cards */}
      <View>
        <TouchableOpacity onPress={() => router.push('/(user)/account')}>
          <Card style={styles.card}>
            <MaterialIcons name="account-box" size={24} color="#FE0000" style={styles.cardIcon} />
            <CustomText style={styles.cardLabel}>My Profile</CustomText>
            <MaterialIcons name="arrow-right" size={24} color="#FE0000" />
          </Card>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push('/favorites')}>
          <Card style={styles.card}>
            <Ionicons name="heart" size={24} color="#FE0000" style={styles.cardIcon} />
            <CustomText style={styles.cardLabel}>Favorites</CustomText>
            <MaterialIcons name="arrow-right" size={24} color="#FE0000" />
          </Card>
        </TouchableOpacity>

        {profile?.is_admin ? 
          <TouchableOpacity onPress={() => router.push('/admin' as Href)}>
            <Card style={styles.card}>
              <Ionicons name="settings" size={24} color="#FE0000" style={styles.cardIcon} />
              <CustomText style={styles.cardLabel}>Admin</CustomText>
              <MaterialIcons name="arrow-right" size={24} color="#FE0000" />
            </Card>
          </TouchableOpacity>  :
          null
        }
      </View>

      {/* Quick Actions */}
      <CustomText style={styles.sectionTitle}>Quick Actions</CustomText>
      <TouchableOpacity onPress={() => router.navigate('/(tabs)/home')} style={styles.actionButton}>
        <Ionicons name="arrow-back-circle" size={24} color="##000" style={styles.cardIcon} />
        <CustomText style={styles.quickActionLabels}>Back to App</CustomText>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => router.navigate('/(user)/feedback')} style={styles.actionButton}>
        <MaterialIcons name="feedback" size={24} color="##000" style={styles.cardIcon} />
        <CustomText style={styles.quickActionLabels}>Feedback</CustomText>
      </TouchableOpacity>
      <TouchableOpacity onPress={handleOpenExternalDeleteAccount} style={styles.actionButton}>
        <MaterialIcons name="delete-sweep" size={24} color="##000" style={styles.cardIcon} />
        <CustomText style={styles.quickActionLabels}>Delete Account</CustomText>
      </TouchableOpacity>

      {/* Notifications Section */}
      <NotificationPermission />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
  },
  header: {
    marginBottom: 12,
  },
  welcomeText: {
    ...typography.heading3,
    color: '#B3B3B3',
  },
  username: {
    color: '#000',
    ...typography.heading3
  },
  card: {
    backgroundColor: '#FFF0F0',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 12,
    marginVertical: 8,
  },
  cardIcon: {
    marginRight: 15,
  },
  cardLabel: {
    flex: 1,
    ...typography.textLargeBold,
    color: '#FE0000',
  },
  sectionTitle: {
    ...typography.textLargeBold,
    marginTop: 20,
  },
  actionButton: {
    borderBottomColor: '#E5E5E5',
    borderBottomWidth: 1,
    paddingVertical: 20,
    flexDirection: 'row',
    alignItems: 'center'
  },
  quickActionLabels: {
    ...typography.textLargeMedium,
    color: '#000',
  },
});