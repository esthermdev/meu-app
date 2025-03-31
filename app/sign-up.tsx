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
import CustomText from '@/components/CustomText';

export default function SignUp() {
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const { signUp } = useAuth();

  const handleSignUp = async () => {
    // Reset any previous errors
    setNameError(null);
    setEmailError(null);
    
    // Validate full name
    if (!fullName.trim()) {
      setNameError('Please enter your name');
      return;
    }
    
    // Validate email
    if (!email.trim() || !email.includes('@')) {
      setEmailError('Please enter a valid email address');
      return;
    }

    try {
      setLoading(true);
      await signUp(email, fullName);
      alert('Check your email for the confirmation link!\n\nIf you don\'t receive an email, please:\n- Check your spam folder\n- Verify you entered the correct email address\n\nFor additional support, contact support@maineultimateapp.org');
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
        keyboardVerticalOffset={Platform.OS === "ios" ? 10 : 0}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={styles.form}>
              <Image source={images.logoW} style={styles.image} />

              <CustomText style={styles.title}>Sign Up</CustomText>
              <CustomText style={styles.subtitle}>Get started with a new account</CustomText>

              <View style={styles.inputContainer}>
                <FontAwesome6 name="signature" size={20} color="#000" />
                <TextInput
                  placeholder="Full Name"
                  value={fullName}
                  onChangeText={(text) => {
                    setFullName(text);
                    setNameError(null);
                  }}
                  allowFontScaling={false}
                  autoCapitalize="words"
                  style={styles.inputWithIcon}
                />
              </View>
              
              {nameError && (
                <View style={styles.errorContainer}>
                  <Text style={styles.errorText}>{nameError}</Text>
                </View>
              )}
              
              <View style={styles.inputContainer}>
                <MaterialIcons name="email" size={20} color="#000" />
                <TextInput
                  placeholder="Email"
                  value={email}
                  onChangeText={(text) => {
                    setEmail(text);
                    setEmailError(null);
                  }}
                  allowFontScaling={false}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  style={styles.inputWithIcon}
                />
              </View>
              
              {emailError && (
                <View style={styles.errorContainer}>
                  <Text style={styles.errorText}>{emailError}</Text>
                </View>
              )}

              <PrimaryButton 
                onPress={handleSignUp}
                title={loading ? 'Creating account...' : 'Sign Up'}
                disabled={loading}
              />

              <View style={styles.footer}>
                <CustomText style={styles.text}>Already have an account? </CustomText>
                <Link href={'../sign-in'} asChild>
                  <TouchableOpacity>
                    <CustomText style={styles.link}>Sign In</CustomText>
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
  },
  image: {
    height: 90,
    width: 90,
    marginTop: 50,
    marginBottom: 25,   
  },
  title: {
    ...typography.heading1,
    color: '#EA1D25',
    marginTop: 10,
  },
  subtitle: {
    marginTop: 10,
    marginBottom: 20,
    ...typography.heading5
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderColor: '#000',
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 20,
    paddingHorizontal: 16,
    marginBottom: 8
  },
  inputWithIcon: {
    flex: 1,
    marginLeft: 8,
    ...typography.textSemiBold
  },
  errorContainer: {
    backgroundColor: '#FEE2E2',
    borderRadius: 8,
    padding: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#EF4444',
    marginBottom: 15,
  },
  errorText: {
    ...typography.body,
    color: '#B91C1C',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 16,
  },
  text: {
    ...typography.text,
  },
  link: {
    ...typography.text,
    color: '#EA1D25',
    textDecorationLine: 'underline',
  },
});