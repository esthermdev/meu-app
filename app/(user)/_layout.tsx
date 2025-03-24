import { Text, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Redirect, router, Stack } from 'expo-router';
import { useAuth } from '@/context/AuthProvider';

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
    return <Redirect href="/sign-in" />;
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
          headerTitleAlign: 'center',
          headerStyle: {
            backgroundColor: '#EA1D25',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
          headerLeft: () => (
            <TouchableOpacity 
              onPress={() => router.navigate('/(tabs)/home')}
            >
              <MaterialIcons name="arrow-back" size={24} color="#fff" />
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
          title: 'My Profile',
          headerTitleAlign: 'center',
          headerStyle: {
            backgroundColor: '#EA1D25',
          },
          headerTintColor: '#fff',
          headerLeft: () => (
            <TouchableOpacity 
              onPress={() => router.back()}
            >
              <MaterialIcons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
          ),
        }}
      />
      <Stack.Screen 
        name='favorites'
        options={{
          title: 'Favorites',
          headerTitleAlign: 'center',
          headerStyle: {
            backgroundColor: '#EA1D25',
          },
          headerTintColor: '#fff',
          headerLeft: () => (
            <TouchableOpacity 
              onPress={() => router.back()}
            >
              <MaterialIcons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
          ),
        }}
      />
      <Stack.Screen 
        name='feedback'
        options={{
          title: 'Feedback',
          headerTitleAlign: 'center',
          headerStyle: {
            backgroundColor: '#EA1D25',
          },
          headerTintColor: '#fff',
          headerLeft: () => (
            <TouchableOpacity 
              onPress={() => router.back()}
            >
              <MaterialIcons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
          ),
        }}
      />
      <Stack.Screen 
        name='admin'
        options={{
          headerShown: false
        }}
      />
    </Stack>
  );
}
