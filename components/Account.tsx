import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableWithoutFeedback,
  View,
} from 'react-native';

import PrimaryButton from '@/components/buttons/PrimaryButton';
import { typography } from '@/constants/Typography';
import { useAuth } from '@/context/AuthProvider';
import { supabase } from '@/lib/supabase';
import { ProfileUpdate } from '@/types/database';

import CustomText from './CustomText';
import { FontAwesome6, MaterialIcons } from '@expo/vector-icons';
import { Session } from '@supabase/supabase-js';

export default function Account({ session }: { session: Session }) {
  const { refreshProfile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [fullName, setFullName] = useState('');

  const getProfile = useCallback(async () => {
    try {
      setLoading(true);
      if (!session?.user) throw new Error('No user on the session!');

      const { data, error, status } = await supabase.from('profiles').select('*').eq('id', session?.user.id).single();
      if (error && status !== 406) {
        throw error;
      }

      if (data) {
        setFullName(data.full_name ?? '');
      }
    } catch (error) {
      if (error instanceof Error) {
        Alert.alert(error.message);
      }
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    if (session) getProfile();
    console.log('Current user session: ', session);
  }, [getProfile, session]);

  async function updateProfile({ full_name }: { full_name: string }) {
    try {
      setLoading(true);
      if (!session?.user) throw new Error('No user on the session!');

      const updates: ProfileUpdate = {
        full_name: full_name || null,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase.from('profiles').update(updates).eq('id', session.user.id);

      if (error) {
        throw error;
      }
      await refreshProfile();
      Alert.alert('Profile updated successfully');
    } catch (error) {
      if (error instanceof Error) {
        Alert.alert(error.message);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 30 : 0}>
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={styles.form}>
              <CustomText style={styles.title}>Update your profile details here.</CustomText>
              <CustomText style={styles.label}>Email</CustomText>
              <View style={[styles.inputContainer, styles.disabledInput]}>
                <MaterialIcons name="email" size={20} color="#666" />
                <CustomText style={styles.disabledText}>{session?.user?.email}</CustomText>
              </View>

              <CustomText style={styles.label}>Full Name</CustomText>
              <View style={styles.inputContainer}>
                <FontAwesome6 name="signature" size={20} color="#000" />
                <TextInput
                  value={fullName || ''}
                  onChangeText={(text) => setFullName(text)}
                  style={styles.inputWithIcon}
                  placeholder="Enter your full name"
                  allowFontScaling={false}
                />
              </View>

              <PrimaryButton
                title={loading ? 'Loading...' : 'Update Profile'}
                onPress={() => updateProfile({ full_name: fullName })}
                disabled={loading}
              />
            </View>
          </TouchableWithoutFeedback>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  form: {
    flex: 1,
    gap: 15,
  },
  title: {
    ...typography.heading2,
  },
  label: {
    ...typography.textLargeBold,
  },
  inputContainer: {
    alignItems: 'center',
    borderColor: '#000',
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    padding: 20,
  },
  disabledInput: {
    backgroundColor: '#f0f0f0',
    borderColor: '#ccc',
  },
  disabledText: {
    ...typography.textSemiBold,
    color: '#666',
    flex: 1,
    marginLeft: 8,
  },
  inputWithIcon: {
    flex: 1,
    marginLeft: 8,
    ...typography.textSemiBold,
  },
});
