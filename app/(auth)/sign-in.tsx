import { useState } from 'react';
import { StyleSheet, View, TouchableOpacity, TextInput, KeyboardAvoidingView, TouchableWithoutFeedback, Platform, Keyboard, Text } from 'react-native';
import { Link, router } from 'expo-router';
import { useAuth } from '@/hooks/AuthProvider';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '@rneui/themed';

export default function SignIn() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();

  const handleSignIn = async () => {
    try {
      setLoading(true);
      await signIn(email, password);
      router.push('/(tabs)/home')
    } catch (error) {
      console.error(error);
      alert('Error signing in: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity onPress={() => router.dismiss()}>
        <Ionicons name="home" size={30} color="#EA1D25" />
      </TouchableOpacity>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.form}>
            <Text style={styles.title}>Sign In</Text>
            
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
              buttonStyle={styles.button}
              titleStyle={styles.buttonText}
            />

            <View style={styles.footer}>
              <Text style={styles.text}>Don't have an account? </Text>
              <Link href={'../sign-up'} asChild>
                <TouchableOpacity>
                  <Text style={styles.link}>Sign Up</Text>
                </TouchableOpacity>
              </Link>
            </View>

          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
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