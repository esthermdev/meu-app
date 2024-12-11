import { StyleSheet, View, ScrollView, Button, Text } from 'react-native';
import { Href, router } from 'expo-router';
import { useAuth } from '@/context/AuthProvider';
import { Card } from '@/components/Card';
import { Ionicons } from '@expo/vector-icons';
import { TouchableOpacity } from 'react-native-gesture-handler';


export default function UserDashboard() {
  const { profile } = useAuth();

  return (
    <ScrollView 
      style={styles.container}
    >
      {/* Admin Info */}
      <View style={styles.header}>
        <Text style={styles.welcomeText}>
          Welcome, {profile?.full_name}
        </Text>
      </View>

      {/* Cards */}
      <View style={styles.statsContainer}>        
        <TouchableOpacity style={{ flex: 1 }} onPress={() => router.push('/favorites')}>
          <Card style={styles.statsCard}>
            <Ionicons name="heart" size={24} color="red" />
            <Text style={styles.statsLabel}>Favorites</Text>
          </Card>
        </TouchableOpacity>

        {profile?.is_admin ? 
          <TouchableOpacity style={{ flex: 1 }} onPress={() => router.push('/admin' as Href)}>
            <Card style={styles.statsCard}>
              <Ionicons name="settings" size={24} color="red" />
              <Text style={styles.statsLabel}>Admin</Text>
            </Card>
          </TouchableOpacity>  :
          null
        }

      </View>

      {/* Quick Actions */}
      <View style={styles.actionsContainer}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.buttonGroup}>
          <Button 
            onPress={() => router.push('/(user)/account')}
            title='My Profile'
          />
          <Button 
            onPress={() => router.back()}
            title='Back to app'
          />
          <Button 
            onPress={() => null}
            title='Delete Account'
          />
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    justifyContent: 'space-between',
  },
  statsCard: {
    width: 100,
    height: 100,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  statsNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    marginVertical: 8,
  },
  statsLabel: {
    fontSize: 15,
    color: '#666',
    fontFamily: 'OutfitRegular',
    textAlign: 'center',
  },
  actionsContainer: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  buttonGroup: {
    gap: 12,
  },
  actionButton: {
    borderRadius: 8,
  },
  secondaryButton: {
    backgroundColor: '#666',
  },
});