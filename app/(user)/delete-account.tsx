import { useMemo, useState } from 'react';
import {
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { router } from 'expo-router';

import PrimaryButton from '@/components/buttons/PrimaryButton';
import CustomText from '@/components/CustomText';
import { typography } from '@/constants/Typography';
import { useAuth } from '@/context/AuthProvider';
import { supabase } from '@/lib/supabase';

export default function DeleteAccountScreen() {
  const { user } = useAuth();
  const [confirmationEmail, setConfirmationEmail] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const normalizedUserEmail = useMemo(() => user?.email?.trim().toLowerCase() ?? '', [user?.email]);
  const normalizedConfirmationEmail = confirmationEmail.trim().toLowerCase();
  const isConfirmationValid = normalizedUserEmail.length > 0 && normalizedConfirmationEmail === normalizedUserEmail;

  const performDeleteAccount = async () => {
    try {
      setIsDeleting(true);

      const { error } = await supabase.functions.invoke('delete-account');

      if (error) {
        throw error;
      }

      const { error: signOutError } = await supabase.auth.signOut({ scope: 'local' });

      if (signOutError) {
        throw signOutError;
      }

      router.replace('/sign-in');
    } catch (error) {
      console.error('Error deleting account:', error);
      Alert.alert('Error', 'We could not delete your account. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteAccount = () => {
    if (!normalizedUserEmail) {
      Alert.alert('Error', 'No authenticated email address is available for this account.');
      return;
    }

    if (!isConfirmationValid) {
      Alert.alert('Confirmation required', 'Enter your account email exactly to continue.');
      return;
    }

    Alert.alert(
      'Delete account?',
      'This permanently deletes your Maine Ultimate account and removes your personal data. This cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete Account',
          style: 'destructive',
          onPress: () => {
            void performDeleteAccount();
          },
        },
      ],
    );
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      enabled={Platform.OS === 'ios'}
      style={styles.container}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.heroCard}>
            <CustomText style={styles.heroTitle}>Delete Account</CustomText>
            <CustomText style={styles.heroText}>
              This action is permanent. Once deleted, your sign-in access and account data cannot be recovered.
            </CustomText>
          </View>

          <View style={styles.section}>
            <CustomText style={styles.label}>Account email</CustomText>
            <View style={styles.emailPreview}>
              <CustomText style={styles.emailPreviewText}>{user?.email ?? 'Unavailable'}</CustomText>
            </View>
            <CustomText style={styles.label}>Type your email to confirm</CustomText>
            <TextInput
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isDeleting}
              keyboardType="email-address"
              onChangeText={setConfirmationEmail}
              placeholder="Enter your account email"
              placeholderTextColor="#8A8A8A"
              style={styles.input}
              value={confirmationEmail}
            />
          </View>

          <PrimaryButton
            title={isDeleting ? 'Deleting Account...' : 'Delete Account'}
            loading={isDeleting}
            disabled={!isConfirmationValid || isDeleting}
            onPress={handleDeleteAccount}
            style={styles.deleteButton}
          />

          <TouchableOpacity disabled={isDeleting} onPress={() => router.back()} style={styles.cancelButton}>
            <CustomText style={styles.cancelButtonText}>Cancel</CustomText>
          </TouchableOpacity>
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  bodyText: {
    ...typography.text,
    color: '#444444',
    lineHeight: 22,
    marginTop: 8,
  },
  cancelButton: {
    alignItems: 'center',
    marginTop: 16,
    paddingVertical: 12,
  },
  cancelButtonText: {
    ...typography.textLargeBold,
    color: '#4A4A4A',
  },
  container: {
    backgroundColor: '#FFFFFF',
    flex: 1,
  },
  content: {
    flexGrow: 1,
    padding: 20,
  },
  deleteButton: {
    marginTop: 10,
  },
  emailPreview: {
    backgroundColor: '#FFF4F4',
    borderColor: '#F3C5C5',
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
    padding: 14,
  },
  emailPreviewText: {
    ...typography.textLargeMedium,
    color: '#1F1F1F',
  },
  heroCard: {
    backgroundColor: '#FFF1F1',
    borderColor: '#F0C6C6',
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 24,
    padding: 15,
  },
  heroText: {
    ...typography.text,
    color: '#444444',
    lineHeight: 22,
    marginTop: 8,
  },
  heroTitle: {
    ...typography.heading3,
    color: '#B00020',
  },
  input: {
    borderColor: '#D7D7D7',
    borderRadius: 12,
    borderWidth: 1,
    color: '#111111',
    marginTop: 6,
    paddingHorizontal: 14,
    paddingVertical: 14,
    ...typography.text,
  },
  label: {
    ...typography.textLargeBold,
    color: '#1F1F1F',
    marginBottom: 6,
  },
  section: {
    marginBottom: 10,
  },
  sectionTitle: {
    ...typography.textLargeBold,
    color: '#111111',
  },
});
