// Add this to your sign-in.tsx file

import { useState } from 'react';
import { StyleSheet, View, TouchableOpacity, TextInput, KeyboardAvoidingView, 
  TouchableWithoutFeedback, Platform, Keyboard, Text, Image, ScrollView, Alert } from 'react-native';
import { Link, router } from 'expo-router';
import { useAuth } from '@/context/AuthProvider';
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { images } from '@/constants';
import { typography } from '@/constants/Typography';
import PrimaryButton from '@/components/buttons/PrimaryButton';
import { supabase } from '@/lib/supabase';
import CustomText from '@/components/CustomText';

export default function SignIn() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { signIn } = useAuth();

  // Check if the email belongs to a volunteer
  const checkIfVolunteer = async (email: string) => {
    try {
      const { data, error } = await supabase
        .from('volunteers')
        .select('email')
        .eq('email', email.toLowerCase())
        .single();
      
      if (error) {
        // Record not found or other error
        return false;
      }
      
      return true; // Email exists in volunteers table
    } catch (error) {
      console.error('Error checking volunteer status:', error);
      return false;
    }
  };

  const handleSignIn = async () => {
    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const isVolunteer = await checkIfVolunteer(email);

      if (email === 'esmd258@gmail.com' || isVolunteer) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password: email === 'esmd258@gmail.com' ? 'developer' : 'regionals2025'
        });

        if (error) {
          console.error('Sign in error:', error);
          setError('Authentication failed. Please contact an administrator.');
          return;
        }

        router.replace('/(tabs)/profile');
      } else {
        await signIn(email);
        alert('Check your email for the link to log in!');
        setEmail('');
        Keyboard.dismiss();
      }
    } catch (error) {
      console.error(error);
      if (email === 'esmd258@gmail.com' || await checkIfVolunteer(email)) {
        Alert.alert('Error', 'Could not sign in with developer account. Please try again.');
      } else {
        setError("Email doesn't exist. Please create an account to continue.");
      }
    } finally {
      setLoading(false);
    }
  };

  // New function for reviewer login
  // const handleReviewerSignIn = async () => {
  //   try {
  //     setLoading(true);
      
  //     // Direct sign-in with the reviewer account using Supabase's auth.signInWithPassword
  //     const { data, error } = await supabase.auth.signInWithPassword({
  //       email: 'reviewer@maineultimateapp.org',  // Use the email you set up for the reviewer
  //       password: 'app-review-25'   // Use the password you set up for the reviewer
  //     });
      
  //     if (error) throw error;
      
  //     // Navigate to the user section after successful sign-in
  //     router.replace('/(user)');
      
  //   } catch (error) {
  //     console.error('Reviewer sign-in error:', error);
  //     Alert.alert('Error', 'Could not sign in with reviewer account. Please try again.');
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  return (
    <SafeAreaView style={styles.container}>
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
          <TouchableOpacity onPress={() => router.replace('/(tabs)/home')} style={{ marginTop: 20 }}>
            <MaterialCommunityIcons name="home-outline" size={30} color="#000" />
          </TouchableOpacity>
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={styles.form}>
              <Image source={images.logoW} style={styles.image} />
              
              <CustomText style={styles.title}>Sign In</CustomText>
              <CustomText style={styles.subtitle}>Sign in to continue</CustomText>

              <View style={styles.inputContainer}>
                <MaterialIcons name="email" size={20} color="#000" />
                <TextInput
                  placeholder="Email"
                  placeholderTextColor={'lightgrey'}
                  value={email}
                  onChangeText={(text) => {
                    setEmail(text);
                    setError(null);
                  }}
                  allowFontScaling={false}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  style={styles.inputWithIcon}
                />
              </View>

              {error && (
                <View style={styles.errorContainer}>
                  <CustomText style={styles.errorText}>{error}</CustomText>
                  <Link href="/sign-up" asChild>
                    <TouchableOpacity>
                      <CustomText style={styles.signUpLink}>Create an account</CustomText>
                    </TouchableOpacity>
                  </Link>
                </View>
              )}

              <PrimaryButton
                onPress={handleSignIn}
                title={loading ? 'Signing in...' : 'Sign In'}
                disabled={loading}
              />

              {/* Add the App Store Reviewer button */}
              {/* <TouchableOpacity 
                style={styles.reviewerButton} 
                onPress={handleReviewerSignIn}
                disabled={loading}
              >
                <CustomText style={styles.reviewerButtonText}>App Store Reviewer Sign In</CustomText>
              </TouchableOpacity> */}

              <View style={styles.footer}>
                <CustomText style={styles.text}>Don't have an account? </CustomText>
                <Link href={'/sign-up'} asChild>
                  <TouchableOpacity>
                    <CustomText style={styles.link}>Sign Up</CustomText>
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
    paddingHorizontal: 25,
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
    paddingHorizontal: 16,
    paddingVertical: 20,
    marginBottom: 15
  },
  inputWithIcon: {
    flex: 1,
    marginLeft: 8,
    ...typography.textSemiBold,
  },
  errorContainer: {
    backgroundColor: '#FEE2E2',
    borderRadius: 8,
    padding: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#EF4444',
  },
  errorText: {
    ...typography.body,
    color: '#B91C1C',
  },
  signUpLink: {
    ...typography.bodyMedium,
    color: '#EA1D25',
    marginTop: 5,
    textDecorationLine: 'underline',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 16,
    marginBottom: 20,
  },
  text: {
    ...typography.text,
  },
  link: {
    ...typography.text,
    color: '#EA1D25',
    textDecorationLine: 'underline',
  },
  reviewerButton: {
    backgroundColor: '#E5E5E5',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  reviewerButtonText: {
    ...typography.bodyMedium,
    color: '#333333',
  }
});