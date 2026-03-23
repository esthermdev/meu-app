import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Href, router } from 'expo-router';

import { Card } from '@/components/Card';
import CustomText from '@/components/CustomText';
import NotificationPermission from '@/components/features/notifications/NotificationPermission';
import { typography } from '@/constants/Typography';
import { useAuth } from '@/context/AuthProvider';
import { hasPermission } from '@/context/profileRoles';

import { Ionicons, MaterialIcons } from '@expo/vector-icons';

export default function UserDashboard() {
  const { profile, signOut } = useAuth();
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleOpenDeleteAccount = () => {
    router.push('/(user)/delete-account');
  };

  const handleSignOut = async () => {
    try {
      setIsSigningOut(true);
      await signOut();
      router.replace('/(tabs)/profile');
    } catch (error) {
      console.error('Error signing out:', error);
      Alert.alert('Error', 'Error signing out');
    } finally {
      setIsSigningOut(false);
    }
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
        <Pressable onPress={() => router.push('/(user)/account')}>
          <Card style={styles.card}>
            <MaterialIcons name="account-box" size={24} color="#FE0000" style={styles.cardIcon} />
            <CustomText style={styles.cardLabel}>My Profile</CustomText>
            <MaterialIcons name="arrow-right" size={24} color="#FE0000" />
          </Card>
        </Pressable>

        <Pressable onPress={() => router.push('/(user)/favorites')}>
          <Card style={styles.card}>
            <Ionicons name="heart" size={24} color="#FE0000" style={styles.cardIcon} />
            <CustomText style={styles.cardLabel}>Favorites</CustomText>
            <MaterialIcons name="arrow-right" size={24} color="#FE0000" />
          </Card>
        </Pressable>

        {hasPermission(profile, 'view_admin_dashboard') ? (
          <Pressable onPress={() => router.push('/(user)/admin' as Href)}>
            <Card style={styles.card}>
              <Ionicons name="settings" size={24} color="#FE0000" style={styles.cardIcon} />
              <CustomText style={styles.cardLabel}>Admin</CustomText>
              <MaterialIcons name="arrow-right" size={24} color="#FE0000" />
            </Card>
          </Pressable>
        ) : null}
      </View>

      {/* Quick Actions */}
      <CustomText style={styles.sectionTitle}>Quick Actions</CustomText>
      <Pressable onPress={() => router.navigate('/(user)/feedback')} style={styles.actionButton}>
        <MaterialIcons name="feedback" size={24} color="##000" style={styles.cardIcon} />
        <CustomText style={styles.quickActionLabels}>Feedback</CustomText>
      </Pressable>
      <Pressable
        onPress={() => handleSignOut()}
        style={[styles.actionButton, isSigningOut && styles.disabledButton]}
        disabled={isSigningOut}>
        <Ionicons name="arrow-back-circle" size={24} color="##000" style={styles.cardIcon} />
        <CustomText style={styles.quickActionLabels}>{isSigningOut ? 'Signing out...' : 'Sign Out'}</CustomText>
      </Pressable>
      <Pressable onPress={handleOpenDeleteAccount} style={styles.actionButton}>
        <MaterialIcons name="delete-sweep" size={24} color="##000" style={styles.cardIcon} />
        <CustomText style={styles.quickActionLabels}>Delete Account</CustomText>
      </Pressable>

      {/* Notifications Section */}
      <NotificationPermission />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  actionButton: {
    alignItems: 'center',
    borderBottomColor: '#E5E5E5',
    borderBottomWidth: 1,
    flexDirection: 'row',
    paddingVertical: 20,
  },
  card: {
    alignItems: 'center',
    backgroundColor: '#FFF0F0',
    borderRadius: 12,
    flexDirection: 'row',
    marginVertical: 8,
    padding: 20,
  },
  cardIcon: {
    marginRight: 15,
  },
  cardLabel: {
    flex: 1,
    ...typography.textLargeBold,
    color: '#FE0000',
  },
  container: {
    backgroundColor: '#fff',
    flex: 1,
    padding: 20,
  },
  disabledButton: {
    opacity: 0.6,
  },
  header: {
    marginBottom: 12,
  },
  quickActionLabels: {
    ...typography.textLargeMedium,
    color: '#000',
  },
  sectionTitle: {
    ...typography.textLargeBold,
    marginTop: 20,
  },
  username: {
    color: '#000',
    ...typography.heading3,
  },
  welcomeText: {
    ...typography.heading3,
    color: '#B3B3B3',
  },
});
