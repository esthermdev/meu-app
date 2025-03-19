import { useState, useEffect } from 'react'
import { StyleSheet, View, Alert, Text, TouchableOpacity, TouchableWithoutFeedback, KeyboardAvoidingView, Keyboard, TextInput, Image, Platform, ScrollView } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { supabase } from '@/lib/supabase'
import { Session } from '@supabase/supabase-js'
import { Database } from '@/database.types'
import { MaterialIcons, FontAwesome6, Ionicons } from '@expo/vector-icons'
import { typography } from '@/constants/Typography'
import { images } from '@/constants'
import { router } from 'expo-router'
import PrimaryButton from '@/components/buttons/PrimaryButton'
import { useAuth } from '@/context/AuthProvider'

type ProfileUpdate = Database['public']['Tables']['profiles']['Insert'];

export default function Account({ session }: { session: Session }) {
  const { refreshProfile } = useAuth();
  const [loading, setLoading] = useState(true)
  const [fullName, setFullName] = useState('')

  useEffect(() => {
    if (session) getProfile()
      console.log(session)
  }, [session])

  async function getProfile() {
    try {
      setLoading(true)
      if (!session?.user) throw new Error('No user on the session!')

      const { data, error, status } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session?.user.id)
        .single()
      if (error && status !== 406) {
        throw error
      }

      if (data) {
        setFullName(data.full_name ?? '')
      }
    } catch (error) {
      if (error instanceof Error) {
        Alert.alert(error.message)
      }
    } finally {
      setLoading(false)
    }
  }

  async function updateProfile({
    full_name,
  }: {
    full_name: string
  }) {
    try {
      setLoading(true)
      if (!session?.user) throw new Error('No user on the session!')

      const updates: ProfileUpdate = {
        id: session?.user.id,
        full_name: full_name || null,
        updated_at: new Date().toISOString()
      }

      const { error } = await supabase.from('profiles').upsert(updates)

      if (error) {
        throw error
      }
      await refreshProfile()
      Alert.alert('Profile updated successfully')
    } catch (error) {
      if (error instanceof Error) {
        Alert.alert(error.message)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 30 : 0}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={styles.form}>
              <Text style={styles.title}>Update your profile details here.</Text>
              <Text style={styles.label}>Email</Text>
              <View style={[styles.inputContainer, styles.disabledInput]}>
                <MaterialIcons name="email" size={20} color="#666" />
                <Text style={styles.disabledText}>{session?.user?.email}</Text>
              </View>
              
              <Text style={styles.label}>Full Name</Text>
              <View style={styles.inputContainer}>
                <FontAwesome6 name="signature" size={20} color="#000" />
                <TextInput
                  value={fullName || ''}
                  onChangeText={(text) => setFullName(text)}
                  style={styles.inputWithIcon}
                  placeholder="Enter your full name"
                />
              </View>

              <View style={styles.buttonContainer}>
                <PrimaryButton
                  title={loading ? 'Loading...' : 'Update Profile'}
                  onPress={() => updateProfile({ full_name: fullName })}
                  disabled={loading}
                />
              </View>
            </View>
          </TouchableWithoutFeedback>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    ...typography.h2,
  },
  form: {
    flex: 1,
    gap: 15,
  },
  label: {
    ...typography.bodyMedium,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderColor: '#000',
    borderWidth: 1,
    borderRadius: 12,
    padding: 20
  },
  disabledInput: {
    backgroundColor: '#f0f0f0',
    borderColor: '#ccc',
  },
  disabledText: {
    ...typography.bodyMedium,
    color: '#666',
    marginLeft: 8,
    flex: 1,
  },
  inputWithIcon: {
    flex: 1,
    marginLeft: 8,
    ...typography.bodyMedium,
  },
  buttonContainer: {
    gap: 15,
  }
});