import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { StyleSheet, View, Alert } from 'react-native'
import { Button, Input } from '@rneui/themed'
import { Session } from '@supabase/supabase-js'
import { Database } from '@/database.types'
import { useAuth } from '@/hooks/AuthProvider'
import { router } from 'expo-router'

type ProfileUpdate = Database['public']['Tables']['profiles']['Insert'];

export default function Account({ session }: { session: Session }) {
  const [loading, setLoading] = useState(true)
  const [fullName, setFullName] = useState('')
  const { signOut } = useAuth()

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

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
      alert('Error signing out');
    }
  };

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
      <View style={[styles.verticallySpaced, styles.mt20]}>
        <Input label="Email" value={session?.user?.email} disabled />
      </View>
      <View style={styles.verticallySpaced}>
        <Input label="Full Name" value={fullName || ''} onChangeText={(text) => setFullName(text)} />
      </View>

      <View style={[styles.verticallySpaced, styles.mt20]}>
        <Button
          title={loading ? 'Loading ...' : 'Update'}
          onPress={() => updateProfile({ full_name: fullName })}
          disabled={loading}
        />
        <Button 
          title='Sign Out'
          onPress={handleSignOut}
        />
        <Button 
          title='Go home'
          onPress={() => router.push('/(tabs)/home')}
        />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    marginTop: 40,
    padding: 12,
  },
  verticallySpaced: {
    paddingTop: 4,
    paddingBottom: 4,
    alignSelf: 'stretch',
    gap: 16
  },
  mt20: {
    marginTop: 20,
  },
})