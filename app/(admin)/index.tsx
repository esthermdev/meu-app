// app/(admin)/index.tsx
import { useState, useEffect } from 'react';
import { StyleSheet, View, ScrollView, RefreshControl, Button, Text } from 'react-native';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/AuthProvider';
import { Card } from '@/components/Card';
import { MaterialIcons } from '@expo/vector-icons';

// Define types for your dashboard data
type DashboardStats = {
  totalUsers: number;
  teamId: number;
  // Add more stats as needed
};

export default function AdminDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      
      // Example: Fetch dashboard statistics from Supabase
      const [usersResponse, postsResponse] = await Promise.all([
        supabase
          .from('profiles')
          .select('id', { count: 'exact' }),
        supabase
          .from('teams')
          .select('id')
      ]);

      setStats({
        totalUsers: usersResponse.count || 0,
        teamId: postsResponse.count || 0,
      });
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      alert('Error loading dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchDashboardStats();
    setRefreshing(false);
  };

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Admin Info */}
      <View style={styles.header}>
        <Text style={styles.welcomeText}>
          Welcome, {user?.email}
        </Text>
        <Text style={styles.roleText}>
          Admin Dashboard
        </Text>
      </View>

      {/* Statistics Cards */}
      <View style={styles.statsContainer}>
        <Card style={styles.statsCard}>
          <MaterialIcons name="people" size={24} color="#f4511e" />
          <Text style={styles.statsNumber}>
            {loading ? '...' : stats?.totalUsers}
          </Text>
          <Text style={styles.statsLabel}>Total Users</Text>
        </Card>

        <Card style={styles.statsCard}>
          <MaterialIcons name="post-add" size={24} color="#2196F3" />
          <Text style={styles.statsNumber}>
            {loading ? '...' : stats?.teamId}
          </Text>
          <Text style={styles.statsLabel}>Team ID</Text>
        </Card>
      </View>

      {/* Quick Actions */}
      <View style={styles.actionsContainer}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.buttonGroup}>
            <Button 
                onPress={() => router.navigate('/(tabs)/home')}
                title='Back to app'
            />
            <Button 
                onPress={() => router.push('/(admin)/account')}
                title='My Profile'
            />
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
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
  roleText: {
    fontSize: 16,
    color: '#666',
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    justifyContent: 'space-between',
  },
  statsCard: {
    width: '30%',
    padding: 16,
    alignItems: 'center',
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
    fontSize: 12,
    color: '#666',
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