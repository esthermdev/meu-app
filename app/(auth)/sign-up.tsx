import { useState } from 'react';
import { StyleSheet, View, TouchableOpacity, Button, TextInput } from 'react-native';
import { Link } from 'expo-router';
import { useAuth } from '@/hooks/AuthProvider';
import { ThemedText } from '@/components/ThemedText';

export default function SignUp() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();

  const handleSignUp = async () => {
    try {
      setLoading(true);
      await signUp(email, password);
      alert('Check your email for the confirmation link!');
    } catch (error) {
      console.error(error);
      alert('Error signing up: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.form}>
        <ThemedText style={styles.title}>Create Account</ThemedText>
        
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
          onPress={handleSignUp}
          title={loading ? 'Creating account...' : 'Sign Up'}
          disabled={loading}
        />

        <View style={styles.footer}>
          <ThemedText>Already have an account? </ThemedText>
          <Link href={'../sign-in'} asChild>
            <TouchableOpacity>
              <ThemedText style={styles.link}>Sign In</ThemedText>
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