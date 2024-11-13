import { useState } from 'react';
import { StyleSheet, View, TouchableOpacity, TextInput, Text } from 'react-native';
import { Link } from 'expo-router';
import { useAuth } from '@/hooks/AuthProvider';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Button } from '@rneui/themed';

export default function SignUp() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();

  const handleSignUp = async () => {
    try {
      setLoading(true);
      await signUp(email, password, fullName);
      alert('Check your email for the confirmation link!');
    } catch (error) {
      console.error(error);
      alert('Error signing up: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity onPress={() => router.navigate('/(tabs)/home')}>
        <Ionicons name="home" size={30} color="#EA1D25" />
      </TouchableOpacity>
      <View style={styles.form}>
        <Text style={styles.title}>Create Account</Text>

        <TextInput
          placeholder="Full name"
          value={fullName}
          onChangeText={setFullName}
          autoCapitalize="none"
          style={styles.input}
        />
        
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
          buttonStyle={styles.button}
          titleStyle={styles.buttonText}
        />

        <View style={styles.footer}>
          <Text style={styles.text}>Already have an account? </Text>
          <Link href={'../sign-in'} asChild>
            <TouchableOpacity>
              <Text style={styles.link}>Sign In</Text>
            </TouchableOpacity>
          </Link>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  form: {
    flex: 1,
    gap: 16,
  },
  title: {
    fontFamily: 'OutfitBold',
    fontSize: 28,
    color: '#EA1D25',
    marginBottom: 30,
    textAlign: 'center',
  },
  input: {
    height: 60,
    borderColor: '#8F8DAA',
    borderWidth: 1,
    paddingHorizontal: 22,
    borderRadius: 100,
    fontFamily: 'OutfitRegular',
    fontSize: 18
  },
  button: {
    height: 60,
    backgroundColor: '#EA1D25',
    paddingHorizontal: 22,
    borderRadius: 100,
    marginBottom: 10
  },
  buttonText: {
    fontFamily: 'OutfitSemiBold',
    fontSize: 18,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 16,
  },
  text: {
    fontFamily: 'OutfitRegular',
  },
  link: {
    fontFamily: 'OutfitRegular',
    color: '#0066cc',
  },
});