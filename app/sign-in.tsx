import { useState } from 'react';
import { StyleSheet, View, TouchableOpacity, TextInput, KeyboardAvoidingView, TouchableWithoutFeedback, Platform, Keyboard, Text, Image, ScrollView } from 'react-native';
import { Link, router } from 'expo-router';
import { useAuth } from '@/context/AuthProvider';
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { images } from '@/constants';
import { typography } from '@/constants/Typography';
import PrimaryButton from '@/components/buttons/PrimaryButton';

export default function SignIn() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();

  const handleSignIn = async () => {
    try {
      setLoading(true);
      await signIn(email);
      alert('Check your email for the link to log in!');
      setEmail('');
      Keyboard.dismiss();
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
              
              <Text style={styles.title}>Sign In</Text>
              <Text style={{...typography.bodyMedium}}>Sign in to continue</Text>

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
                onPress={handleSignIn}
                title={loading ? 'Sending link...' : 'Send Link'}
                disabled={loading}
              />

              <View style={styles.footer}>
                <Text style={styles.text}>Don't have an account? </Text>
                <Link href={'/sign-up'} asChild>
                  <TouchableOpacity>
                    <Text style={styles.link}>Sign Up</Text>
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