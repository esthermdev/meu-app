// lib/auth/AuthProvider.tsx
import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Session, User } from '@supabase/supabase-js';
import * as Linking from 'expo-linking';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { fetchProfileWithRole, ProfileWithRole } from './profileRoles';

type AuthContextType = {
  session: Session | null;
  user: User | null;
  profile: ProfileWithRole | null;
  loading: boolean;
  signIn: (email: string) => Promise<void>;
  signUp: (email: string, full_name: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: (userId?: string) => Promise<void>;
  reviewerSignIn: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<ProfileWithRole | null>(null);
  const [loading, setLoading] = useState(true);

  // Flag to track if we're processing a deep link
  const [isProcessingDeepLink, setIsProcessingDeepLink] = useState(false);
  const isProcessingDeepLinkRef = useRef(false);
  const handleDeepLinkRef = useRef<(url: string) => Promise<void>>(async () => {});
  const handleAnonymousPushTokenRef = useRef<() => Promise<void>>(async () => {});

  useEffect(() => {
    isProcessingDeepLinkRef.current = isProcessingDeepLink;
  }, [isProcessingDeepLink]);

  // Simple function to update login status
  const updateLoginStatus = async (userId: string, isLoggedIn: boolean) => {
    try {
      await supabase
        .from('profiles')
        .update({
          is_logged_in: isLoggedIn,
        })
        .eq('id', userId);
    } catch (error) {
      // Just log the error, don't disrupt the flow
      console.error('Error updating login status:', error);
    }
  };

  const migrateAnonymousPushToken = async (userId: string) => {
    try {
      // Check if we have a token stored in AsyncStorage
      const token = await AsyncStorage.getItem('expo_push_token');

      if (token) {
        // Update the user's profile with the token
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ expo_push_token: token })
          .eq('id', userId);

        if (updateError) throw updateError;
      }
    } catch (error) {
      console.error('Error migrating push token:', error);
    }
  };

  async function getProfile(userId: string) {
    try {
      const data = await fetchProfileWithRole(userId);
      if (data) setProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
      setProfile(null);
    }
  }

  // Function to extract tokens from URL fragments
  const extractTokensFromHash = (hash: string) => {
    if (!hash || hash === '') return null;

    // Remove the leading '#' if present
    const fragment = hash.startsWith('#') ? hash.substring(1) : hash;

    // Split the fragment into key-value pairs
    const params = new URLSearchParams(fragment);

    // Extract the tokens
    const accessToken = params.get('access_token');
    const refreshToken = params.get('refresh_token');

    if (accessToken && refreshToken) {
      return { accessToken, refreshToken };
    }

    return null;
  };

  // Function to handle deep links that contain auth tokens
  const handleDeepLink = async (url: string) => {
    try {
      setIsProcessingDeepLink(true);
      // Check if this URL is coming from an auth flow
      if (url.includes('access_token=') || url.includes('refresh_token=')) {
        // Extract the fragment from the URL (everything after #)
        const hashIndex = url.indexOf('#');
        if (hashIndex !== -1) {
          const fragment = url.substring(hashIndex);
          const tokens = extractTokensFromHash(fragment);

          if (tokens) {
            // Set the session with the extracted tokens
            const { data, error } = await supabase.auth.setSession({
              access_token: tokens.accessToken,
              refresh_token: tokens.refreshToken,
            });

            if (error) {
              console.error('Error setting session:', error);
            } else if (data?.session) {
              console.log('Session successfully established. Navigating to profile...');
              setSession(data.session);
              setUser(data.session.user);

              if (data.session.user) {
                await getProfile(data.session.user.id);
                // Update login status after successful sign-in via deep link
                updateLoginStatus(data.session.user.id, true);
              }

              // Navigate to the user page after a slight delay
              setTimeout(() => {
                router.replace('/(tabs)/profile');
              }, 500);
            }
          }
        }
      }

      setIsProcessingDeepLink(false);
    } catch (error) {
      console.error('Error handling deep link:', error);
      setIsProcessingDeepLink(false);
    }
  };

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        getProfile(session.user.id);
        migrateAnonymousPushToken(session.user.id);
        // Update login status for initial session
        updateLoginStatus(session.user.id, true);
      } else {
        // We're not logged in - check if we need to handle push token
        handleAnonymousPushTokenRef.current();
      }
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log('Auth state change:', _event);
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        getProfile(session.user.id);
        migrateAnonymousPushToken(session.user.id);

        // Update login status when a user signs in
        if (_event === 'SIGNED_IN') {
          updateLoginStatus(session.user.id, true);
        }
      } else if (_event === 'SIGNED_OUT') {
        // We don't have the user ID here anymore (already signed out)
        // Handle anonymous token after sign out
        setTimeout(() => {
          handleAnonymousPushTokenRef.current();
        }, 1000);
      }

      // Only update loading if we're not processing a deep link
      if (!isProcessingDeepLinkRef.current) {
        setLoading(false);
      }
    });

    // Set up deep link handling for initial URL
    const handleInitialURL = async () => {
      try {
        const initialURL = await Linking.getInitialURL();
        if (initialURL) {
          await handleDeepLinkRef.current(initialURL);
        }
      } catch (error) {
        console.error('Error handling initial URL:', error);
        setLoading(false);
      }
    };

    // Handle initial URL
    handleInitialURL();

    // Subscribe to URL open events
    const linkingSubscription = Linking.addEventListener('url', async ({ url }) => {
      console.log('App opened via URL:', url);
      await handleDeepLinkRef.current(url);
    });

    return () => {
      subscription.unsubscribe();
      linkingSubscription.remove();
    };
  }, []);

  // Completely revised approach for token handling
  const handleAnonymousPushToken = async () => {
    try {
      const token = await AsyncStorage.getItem('expo_push_token');
      const deviceId = await AsyncStorage.getItem('device_id');

      if (!token || !deviceId) {
        console.error('No push token or device ID to register');
        return;
      }

      // Call a custom SQL function to handle this safely
      const { error } = await supabase.rpc('handle_anonymous_token', {
        p_device_id: deviceId,
        p_token: token,
      });

      if (error) {
        console.error('Error handling anonymous token with RPC:', error);

        // Fallback approach if RPC fails
        console.log('Attempting fallback approach for token registration');
        await registerTokenFallback(deviceId, token);
      } else {
        console.log('Successfully handled anonymous token via RPC');
      }
    } catch (error) {
      console.error('Error in anonymous token handling:', error);
    }
  };

  handleDeepLinkRef.current = handleDeepLink;
  handleAnonymousPushTokenRef.current = handleAnonymousPushToken;

  // Fallback method if RPC fails
  const registerTokenFallback = async (deviceId: string, token: string) => {
    try {
      // Try to delete first
      try {
        await supabase.from('anonymous_tokens').delete().eq('device_id', deviceId);
        console.log('Deleted any existing token in fallback');
      } catch {
        console.log('No existing token or delete failed in fallback');
      }

      // Wait a moment
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Then try to insert
      const { error } = await supabase.from('anonymous_tokens').insert({
        device_id: deviceId,
        token: token,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      if (error) {
        throw error;
      }

      console.log('Successfully registered token via fallback');
    } catch (error) {
      console.error('Fallback token registration failed:', error);
    }
  };

  const signIn = async (email: string) => {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: false,
        emailRedirectTo: 'meu.app://(tabs)/profile',
      },
    });
    if (error) {
      // If the error mentions user doesn't exist or isn't confirmed
      if (
        error.message.includes('Email not confirmed') ||
        error.message.includes('User not found')
      ) {
        throw new Error('This email is not registered. Please sign up first.');
      }
      throw error;
    }
  };

  const signUp = async (email: string, full_name: string) => {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: true,
        emailRedirectTo: 'meu.app://(tabs)/profile',
        data: {
          full_name: full_name,
        },
      },
    });
    if (error) throw error;
  };

  const signOut = async () => {
    try {
      // Store the user ID before we sign out
      const currentUserId = user?.id;

      if (currentUserId) {
        // Update login status to false with explicit await
        const { error } = await supabase
          .from('profiles')
          .update({ is_logged_in: false })
          .eq('id', currentUserId);
        if (error) {
          console.error('Error updating login status during sign-out:', error);
        }
      } else {
        console.error('No user ID available for updating login status during sign-out');
      }

      // Proceed with sign out
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      console.log('User successfully signed out');
    } catch (error) {
      console.error('Error during sign out:', error);
      throw error;
    }
  };

  const refreshProfile = async (userId?: string) => {
    try {
      const id = userId || user?.id;
      if (!id) return;

      const data = await fetchProfileWithRole(id);
      if (data) setProfile(data);
    } catch (error) {
      console.error('Error refreshing profile:', error);
    }
  };

  // Add this function
  const reviewerSignIn = async () => {
    try {
      // Create a session for the reviewer
      // This creates a "fake" session for the reviewer without requiring email verification
      const reviewSession = {
        user: {
          id: 'app-reviewer',
          email: 'reviewer@maineultimateapp.org',
          user_metadata: {
            full_name: 'App Reviewer',
          },
        },
      };

      // Set the session state
      setSession(reviewSession as any);
      setUser(reviewSession.user as any);

      // Create a fake profile
      const fakeProfile = {
        id: 'reviewer-id',
        full_name: 'App Reviewer',
        is_logged_in: true,
        role_key: 'admin',
        role_name: 'Admin',
        role_keys: ['admin'],
        permission_keys: [
          'view_admin_dashboard',
          'manage_games',
          'manage_transport',
          'manage_water',
          'manage_trainer_requests',
          'receive_cart_notifications',
          'receive_water_notifications',
          'receive_medic_notifications',
        ],
        role: { key: 'admin', name: 'Admin' },
      };

      setProfile(fakeProfile as any);
      setLoading(false);

      // Navigate to the user section
      router.replace('/(user)');
    } catch (error) {
      console.error('Error with reviewer sign-in:', error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        profile,
        loading,
        signIn,
        signUp,
        signOut,
        refreshProfile,
        reviewerSignIn,
      }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
