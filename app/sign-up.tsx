import { useState } from 'react';
import { StyleSheet, View, TouchableOpacity, TouchableWithoutFeedback, TextInput, Text, Image, KeyboardAvoidingView, Keyboard, Platform } from 'react-native';
import { Link } from 'expo-router';
import { useAuth } from '@/context/AuthProvider';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome6, MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { images } from '@/constants';
import { typography } from '@/constants/Typography';
import PrimaryButton from '@/components/buttons/PrimaryButton';
import { ScrollView } from 'react-native-gesture-handler';

export default function SignUp() {
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();

  const handleSignUp = async () => {
    try {
      setLoading(true);
      await signUp(email, fullName);
      alert('Check your email for the confirmation link!');
      setEmail('');
      setFullName('');
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
        <MaterialCommunityIcons name="home-outline" size={30} color="#000" />
      </TouchableOpacity>
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
              <Image source={images.logoW} style={styles.image} />

              <Text style={styles.title}>Sign Up</Text>
              <Text style={{...typography.bodyMedium}}>Get started with a new account</Text>

              <View style={styles.inputContainer}>
                <FontAwesome6 name="signature" size={20} color="#000" />
                <TextInput
                  placeholder="Full Name"
                  value={fullName}
                  onChangeText={setFullName}
                  autoCapitalize="none"
                  style={styles.inputWithIcon}
                />
              </View>
              
              <View style={styles.inputContainer}>
                <MaterialIcons name="email" size={20} color="#000" />
                <TextInput
                  placeholder="Email"
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  style={styles.inputWithIcon}
                />
              </View>

              <PrimaryButton 
                onPress={handleSignUp}
                title={loading ? 'Creating account...' : 'Sign Up'}
                disabled={loading}
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
          </TouchableWithoutFeedback>
        </ScrollView>
    </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 25,
  },
  form: {
    flex: 1,
    gap: 15,
  },
  image: {
    height: 90,
    width: 90,
    marginTop: 50,
    marginBottom: 25,   
  },
  title: {
    ...typography.h1,
    color: '#EA1D25',
    marginTop: 10,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderColor: '#000',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 15,
  },
  inputWithIcon: {
    flex: 1,
    padding: 20,
    ...typography.bodyMedium,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 16,
  },
  text: {
    ...typography.body,
  },
  link: {
    ...typography.body,
    color: '#EA1D25',
    textDecorationLine: 'underline',
  },
});