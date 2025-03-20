// lib/auth/AuthProvider.tsx
import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Session, User } from '@supabase/supabase-js';
import { Database } from '@/database.types'
import * as Linking from "expo-linking";
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

type Profile = Database['public']['Tables']['profiles']['Row']

type AuthContextType = {
  session: Session | null;
  user: User | null;
  profile: Profile | null
  loading: boolean;
  signIn: (email: string) => Promise<void>;
  signUp: (email: string, full_name: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: (userId?: string) => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  // Flag to track if we're processing a deep link
  const [isProcessingDeepLink, setIsProcessingDeepLink] = useState(false);

  const migrateAnonymousPushToken = async (userId: string) => {
    try {
      // Check if we have a token stored in AsyncStorage
      const token = await AsyncStorage.getItem('expo_push_token');
      const deviceId = await AsyncStorage.getItem('device_id');
      
      if (token && deviceId) {
        // Update the user's profile with the token
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ expo_push_token: token })
          .eq('id', userId);
          
        if (updateError) throw updateError;
        
        // Delete the token from anonymous_tokens to avoid duplicate notifications
        const { error: deleteError } = await supabase
          .from('anonymous_tokens')
          .delete()
          .eq('device_id', deviceId);
          
        if (deleteError) throw deleteError;
        
        console.log('Successfully migrated anonymous push token to user profile');
      }
    } catch (error) {
      console.error('Error migrating push token:', error);
    }
  };

  async function getProfile(userId: string) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) throw error
      if (data) setProfile(data)
    } catch (error) {
      console.error('Error fetching profile:', error)
      setProfile(null)
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
      console.log("Processing deep link:", url);
      
      // Check if this URL is coming from an auth flow
      if (url.includes('access_token=') || url.includes('refresh_token=')) {
        console.log("Auth parameters detected in URL");
        
        // Extract the fragment from the URL (everything after #)
        const hashIndex = url.indexOf('#');
        if (hashIndex !== -1) {
          const fragment = url.substring(hashIndex);
          const tokens = extractTokensFromHash(fragment);
          
          if (tokens) {
            console.log("Extracted tokens, setting session");
            
            // Set the session with the extracted tokens
            const { data, error } = await supabase.auth.setSession({
              access_token: tokens.accessToken,
              refresh_token: tokens.refreshToken
            });
            
            if (error) {
              console.error("Error setting session:", error);
            } else if (data?.session) {
              console.log("Session successfully established");
              setSession(data.session);
              setUser(data.session.user);
              
              if (data.session.user) {
                await getProfile(data.session.user.id);
              }
              
              // Navigate to the user page after a slight delay
              setTimeout(() => {
                router.replace('/(user)');
              }, 500);
            }
          }
        }
      }
      
      setIsProcessingDeepLink(false);
    } catch (error) {
      console.error("Error handling deep link:", error);
      setIsProcessingDeepLink(false);
    }
  };

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        getProfile(session.user.id)
        migrateAnonymousPushToken(session.user.id)
      }
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        getProfile(session.user.id)
        migrateAnonymousPushToken(session.user.id)
      }
      setLoading(false);

      // Only update loading if we're not processing a deep link
      if (!isProcessingDeepLink) {
        setLoading(false);
      }
    });

    // Set up deep link handling for initial URL
    const handleInitialURL = async () => {
      try {
        const initialURL = await Linking.getInitialURL();
        if (initialURL) {
          console.log("Found initial URL:", initialURL);
          await handleDeepLink(initialURL);
        }
      } catch (error) {
        console.error("Error handling initial URL:", error);
        setLoading(false);
      }
    };
    
    // Handle initial URL
    handleInitialURL();
    
    // Subscribe to URL open events
    const linkingSubscription = Linking.addEventListener('url', async ({ url }) => {
      console.log("App opened via URL:", url);
      await handleDeepLink(url);
    });

    return () => {
      subscription.unsubscribe();
      linkingSubscription.remove();
    };

  }, []);

  const signIn = async (email: string) => {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: false,
        emailRedirectTo: 'meu.app://(user)'
      },
    });
    if (error) {
      // If the error mentions user doesn't exist or isn't confirmed
      if (error.message.includes('Email not confirmed') || 
          error.message.includes('User not found')) {
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
        emailRedirectTo: 'meu.app://(user)',
        data: {
          full_name: full_name
        }
      }
    });
    if (error) throw error;
  };

  const signOut = async () => {
    // Before signing out, ensure the token is saved to anonymous_tokens
    try {
      const token = await AsyncStorage.getItem('expo_push_token');
      const deviceId = await AsyncStorage.getItem('device_id');
      
      if (token && deviceId) {
        // Register as anonymous before logging out
        await registerAnonymousToken(deviceId, token);
      }
    } catch (error) {
      console.error('Error preserving push token before logout:', error);
    }
    
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  const registerAnonymousToken = async (deviceId: string, token: string) => {
    try {
      const { data, error: fetchError } = await supabase
        .from('anonymous_tokens')
        .select('*')
        .eq('device_id', deviceId);
        
      if (fetchError) throw fetchError;
      
      if (data && data.length > 0) {
        // Update existing token
        const { error } = await supabase
          .from('anonymous_tokens')
          .update({ token, updated_at: new Date().toISOString() })
          .eq('device_id', deviceId);
          
        if (error) throw error;
      } else {
        // Insert new token
        const { error } = await supabase
          .from('anonymous_tokens')
          .insert({
            device_id: deviceId,
            token,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
          
        if (error) throw error;
      }
    } catch (error) {
      console.error('Error registering anonymous token:', error);
    }
  };

  const refreshProfile = async (userId?: string) => {
    try {
      const id = userId || user?.id;
      if (!id) return;
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .single();
  
      if (error) throw error;
      if (data) setProfile(data);
    } catch (error) {
      console.error('Error refreshing profile:', error);
    }
  };

  return (
    <AuthContext.Provider value={{
      session,
      user,
      profile,
      loading,
      signIn,
      signUp,
      signOut,
      refreshProfile
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