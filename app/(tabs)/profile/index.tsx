import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Href, router } from 'expo-router';

import { Card } from '@/components/Card';
import CustomText from '@/components/CustomText';
import NotificationPermission from '@/components/features/notifications/NotificationPermission';
import { typography } from '@/constants/Typography';
import { useAuth } from '@/context/AuthProvider';
import { hasPermission, hasRole } from '@/context/profileRoles';

import SignIn from '../../sign-in';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function UserDashboard() {
  const { session, profile, signOut } = useAuth();
  const [isSigningOut, setIsSigningOut] = useState(false);

  if (!session) {
    return <SignIn />;
  }

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
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }} edges={['top']}>
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <CustomText style={styles.welcomeText}>
            Welcome, <CustomText style={styles.username}>{profile?.full_name}!</CustomText>
          </CustomText>
        </View>

        {/* User */}
        <View style={styles.section}>
          <TouchableOpacity onPress={() => router.push('/(user)/account')}>
            <Card style={styles.card}>
              <MaterialIcons name="account-box" size={24} color="#FE0000" style={styles.cardIcon} />
              <CustomText style={styles.cardLabel}>My Profile</CustomText>
              <MaterialIcons name="arrow-right" size={24} color="#FE0000" />
            </Card>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.push('/(user)/favorites')}>
            <Card style={styles.card}>
              <Ionicons name="heart" size={24} color="#FE0000" style={styles.cardIcon} />
              <CustomText style={styles.cardLabel}>Favorites</CustomText>
              <MaterialIcons name="arrow-right" size={24} color="#FE0000" />
            </Card>
          </TouchableOpacity>
        </View>

        {/* Support */}
        <View style={styles.section}>
          {!hasRole(profile, 'user') ? <CustomText style={styles.sectionTitle}>Support</CustomText> : null}

          {hasPermission(profile, 'view_admin_dashboard') ? (
            <TouchableOpacity onPress={() => router.push('/(user)/admin' as Href)}>
              <Card style={styles.supportCard}>
                <Ionicons name="settings" size={24} color="#4357AD" style={styles.cardIcon} />
                <CustomText style={styles.supportCardLabel}>Admin</CustomText>
                <MaterialIcons name="arrow-right" size={24} color="#4357AD" />
              </Card>
            </TouchableOpacity>
          ) : null}

          {hasPermission(profile, 'manage_water') ? (
            <TouchableOpacity onPress={() => router.push('/(user)/water-requests' as Href)}>
              <Card style={styles.supportCard}>
                <Ionicons name="water" size={24} color="#4357AD" style={styles.cardIcon} />
                <CustomText style={styles.supportCardLabel}>Water Requests</CustomText>
                <MaterialIcons name="arrow-right" size={24} color="#4357AD" />
              </Card>
            </TouchableOpacity>
          ) : null}

          {hasPermission(profile, 'manage_transport') ? (
            <TouchableOpacity onPress={() => router.push('/(user)/cart-requests' as Href)}>
              <Card style={styles.supportCard}>
                <Ionicons name="car" size={24} color="#4357AD" style={styles.cardIcon} />
                <CustomText style={styles.supportCardLabel}>Cart Requests</CustomText>
                <MaterialIcons name="arrow-right" size={24} color="#4357AD" />
              </Card>
            </TouchableOpacity>
          ) : null}

          {hasPermission(profile, 'manage_trainer_requests') ? (
            <TouchableOpacity onPress={() => router.push('/(user)/trainers-list' as Href)}>
              <Card style={styles.supportCard}>
                <Ionicons name="medkit" size={24} color="#4357AD" style={styles.cardIcon} />
                <CustomText style={styles.supportCardLabel}>Trainer Requests</CustomText>
                <MaterialIcons name="arrow-right" size={24} color="#4357AD" />
              </Card>
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Quick Actions */}
        <View>
          <CustomText style={[styles.sectionTitle, { marginBottom: 10 }]}>Quick Actions</CustomText>
          <TouchableOpacity onPress={() => router.navigate('/(user)/feedback')} style={styles.actionButton}>
            <MaterialIcons name="feedback" size={24} color="#000" style={styles.cardIcon} />
            <CustomText style={styles.quickActionLabels}>Feedback</CustomText>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => handleSignOut()}
            style={[styles.actionButton, isSigningOut && styles.disabledButton]}
            disabled={isSigningOut}>
            <Ionicons name="arrow-back-circle" size={24} color="#000" style={styles.cardIcon} />
            <CustomText style={styles.quickActionLabels}>{isSigningOut ? 'Signing out...' : 'Sign Out'}</CustomText>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleOpenDeleteAccount} style={styles.actionButton}>
            <MaterialIcons name="delete-sweep" size={24} color="#000" style={styles.cardIcon} />
            <CustomText style={styles.quickActionLabels}>Delete Account</CustomText>
          </TouchableOpacity>
        </View>

        {/* Notifications Section */}
        <NotificationPermission />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  actionButton: {
    alignItems: 'center',
    borderBottomColor: '#E5E5E5',
    borderBottomWidth: 1,
    flexDirection: 'row',
    paddingVertical: 15,
  },
  card: {
    alignItems: 'center',
    backgroundColor: '#FFF0F0',
    borderRadius: 12,
    flexDirection: 'row',
    padding: 20,
  },
  supportCard: {
    alignItems: 'center',
    backgroundColor: '#ECEFFD',
    borderRadius: 12,
    flexDirection: 'row',
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
  supportCardLabel: {
    flex: 1,
    ...typography.textLargeBold,
    color: '#4357AD',
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
    ...typography.heading4,
  },
  section: {
    gap: 10,
    marginBottom: 20,
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
