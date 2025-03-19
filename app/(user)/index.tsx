import { StyleSheet, View, ScrollView, Button, Text } from 'react-native';
import { Href, router } from 'expo-router';
import { useAuth } from '@/context/AuthProvider';
import { Card } from '@/components/Card';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { fonts, typography } from '@/constants/Typography';


export default function UserDashboard() {
  const { profile, signOut } = useAuth();

  const handleOpenExternalDeleteAccount = () => {
    // Use your new Render URL here
    router.push('https://maine-ultimate-account-deletion.onrender.com');
    signOut();
  };
  

  return (
    <ScrollView 
      style={styles.container}
    >
      <View style={styles.header}>
        <Text style={styles.welcomeText}>
          Welcome, <Text style={{ color: '#000' }}>{profile?.full_name}!</Text>
        </Text>
      </View>

      {/* Cards */}
      <View>
        <TouchableOpacity onPress={() => router.push('/(user)/account')}>
          <Card style={styles.card}>
            <MaterialIcons name="account-box" size={24} color="#FE0000" style={styles.cardIcon} />
            <Text style={styles.cardLabel}>My Profile</Text>
            <MaterialIcons name="arrow-right" size={24} color="#FE0000" />
          </Card>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push('/favorites')}>
          <Card style={styles.card}>
            <Ionicons name="heart" size={24} color="#FE0000" style={styles.cardIcon} />
            <Text style={styles.cardLabel}>Favorites</Text>
            <MaterialIcons name="arrow-right" size={24} color="#FE0000" />
          </Card>
        </TouchableOpacity>

        {profile?.is_admin ? 
          <TouchableOpacity onPress={() => router.push('/admin' as Href)}>
            <Card style={styles.card}>
              <Ionicons name="settings" size={24} color="#FE0000" style={styles.cardIcon} />
              <Text style={styles.cardLabel}>Admin</Text>
              <MaterialIcons name="arrow-right" size={24} color="#FE0000" />
            </Card>
          </TouchableOpacity>  :
          null
        }
      </View>

      {/* Quick Actions */}
      <Text style={styles.sectionTitle}>Quick Actions</Text>
      <TouchableOpacity onPress={() => router.navigate('/(tabs)/home')} style={styles.actionButton}>
        <Ionicons name="arrow-back-circle" size={24} color="##000" style={styles.cardIcon} />
        <Text style={styles.quickActionLabels}>Back to App</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => router.navigate('/(user)/feedback')} style={styles.actionButton}>
        <MaterialIcons name="feedback" size={24} color="##000" style={styles.cardIcon} />
        <Text style={styles.quickActionLabels}>Feedback</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={handleOpenExternalDeleteAccount} style={styles.actionButton}>
        <MaterialIcons name="delete-sweep" size={24} color="##000" style={styles.cardIcon} />
        <Text style={styles.quickActionLabels}>Delete Account</Text>
      </TouchableOpacity>
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
    marginBottom: 20,
  },
  welcomeText: {
    ...typography.h3,
    marginBottom: 4,
    color: '#B3B3B3',
  },
  card: {
    backgroundColor: '#FFF0F0',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 12
  },
  cardIcon: {
    marginRight: 15,
  },
  cardLabel: {
    flex: 1,
    ...typography.label,
    color: '#FE0000',
  },
  sectionTitle: {
    fontFamily: fonts.bold,
    fontSize: 20,
    paddingVertical: 15
  },
  actionButton: {
    borderBottomColor: '#E5E5E5',
    borderBottomWidth: 1,
    paddingVertical: 20,
    flexDirection: 'row',
    alignItems: 'center'
  },
  quickActionLabels: {
    fontFamily: fonts.semiBold,
    fontSize: 16,
    color: '#000',
  }
});