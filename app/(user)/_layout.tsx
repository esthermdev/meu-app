import { Text, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Redirect, router, Stack } from 'expo-router';

import { useAuth } from '@/hooks/AuthProvider';

export default function UserLayout() {
  const { session, loading, signOut } = useAuth();

  // You can keep the splash screen open, or render a loading screen like we do here.
  if (loading) {
    return <Text>Loading...</Text>;
  }

  // Only require authentication within the (app) group's layout as users
  // need to be able to access the (auth) group and sign in again.
  if (!session) {
    // On web, static rendering will stop here as the user is not authenticated
    // in the headless Node process that the pages are rendered in.
    return <Redirect href="/(auth)/sign-in" />;
  }

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
      alert('Error signing out');
    }
  };

  // This layout can be deferred because it's not the root layout.
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          title: 'User',
          headerStyle: {
            backgroundColor: '#917120',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
          headerBackVisible: false,
          headerLeft: () => (
            <TouchableOpacity 
                onPress={() => router.dismiss()}
            >
              <MaterialIcons name="home" size={24} color="#fff" style={{ marginRight: 10}} />
            </TouchableOpacity>
          ),
          headerRight: () => (
            <TouchableOpacity 
              onPress={handleSignOut}
            >
              <MaterialIcons name="logout" size={24} color="#fff" />
            </TouchableOpacity>
          ),
        }}
      />
      <Stack.Screen 
        name='account'
        options={{
          headerTitle: 'My Account'
        }}
      />
      <Stack.Screen 
        name='favorites'
        options={{
          headerTitle: 'Favorite Teams'
        }}
      />
    </Stack>
  );
}
