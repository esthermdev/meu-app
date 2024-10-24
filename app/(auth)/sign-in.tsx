import { useState } from 'react';
import { StyleSheet, View, TouchableOpacity, TextInput, Button } from 'react-native';
import { Link, router } from 'expo-router';
import { useAuth } from '@/hooks/AuthProvider';
import { ThemedText } from '@/components/ThemedText';

export default function SignIn() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();

  const handleSignIn = async () => {
    try {
      setLoading(true);
      await signIn(email, password);
    } catch (error) {
      console.error(error);
      alert('Error signing in: ' + (error as Error).message);
    } finally {
      setLoading(false);
      router.navigate('/(admin)')
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.form}>
        <ThemedText style={styles.title}>Sign In</ThemedText>
        
        <TextInput
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          style={styles.input}
        />
        
        <TextInput
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          style={styles.input}
        />

        <Button
            title={loading ? 'Signing in...' : 'Sign In'}
            onPress={handleSignIn}
            disabled={loading}
        />

        <View style={styles.footer}>
          <ThemedText>Don't have an account? </ThemedText>
          <Link href={'../sign-up'} asChild>
            <TouchableOpacity>
              <ThemedText style={styles.link}>Sign Up</ThemedText>
            </TouchableOpacity>
          </Link>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'center',
      padding: 20,
    },
    form: {
      gap: 16,
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      marginBottom: 16,
      textAlign: 'center',
    },
    input: {
      marginBottom: 8,
    },
    footer: {
      flexDirection: 'row',
      justifyContent: 'center',
      marginTop: 16,
    },
    link: {
      color: '#0066cc',
    },
  });