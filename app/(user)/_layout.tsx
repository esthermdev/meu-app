import { Text, TouchableOpacity } from 'react-native';
import { Redirect, router, Stack } from 'expo-router';

import { useAuth } from '@/context/AuthProvider';

import { MaterialIcons } from '@expo/vector-icons';

export default function UserLayout() {
  const { session, loading } = useAuth();

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

  // This layout can be deferred because it's not the root layout.
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="account"
        options={{
          title: 'My Profile',
          headerTitleAlign: 'center',
          headerStyle: {
            backgroundColor: '#EA1D25',
          },
          headerTintColor: '#fff',
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()}>
              <MaterialIcons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
          ),
        }}
      />
      <Stack.Screen
        name="favorites"
        options={{
          title: 'Favorites',
          headerTitleAlign: 'center',
          headerStyle: {
            backgroundColor: '#EA1D25',
          },
          headerTintColor: '#fff',
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()}>
              <MaterialIcons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
          ),
        }}
      />
      <Stack.Screen
        name="feedback"
        options={{
          title: 'Feedback',
          headerTitleAlign: 'center',
          headerStyle: {
            backgroundColor: '#EA1D25',
          },
          headerTintColor: '#fff',
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()}>
              <MaterialIcons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
          ),
        }}
      />
      <Stack.Screen
        name="delete-account"
        options={{
          title: 'Delete Account',
          headerTitleAlign: 'center',
          headerStyle: {
            backgroundColor: '#EA1D25',
          },
          headerTintColor: '#fff',
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()}>
              <MaterialIcons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
          ),
        }}
      />
      <Stack.Screen
        name="trainers-list"
        options={{
          title: 'Trainer Requests',
          headerTitleAlign: 'center',
          headerStyle: {
            backgroundColor: '#EA1D25',
          },
          headerTintColor: '#fff',
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()}>
              <MaterialIcons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
          ),
        }}
      />
      <Stack.Screen
        name="cart-requests"
        options={{
          title: 'Cart Requests',
          headerTitleAlign: 'center',
          headerStyle: {
            backgroundColor: '#EA1D25',
          },
          headerTintColor: '#fff',
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()}>
              <MaterialIcons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
          ),
        }}
      />
      <Stack.Screen
        name="water-requests"
        options={{
          title: 'Water Requests',
          headerTitleAlign: 'center',
          headerStyle: {
            backgroundColor: '#EA1D25',
          },
          headerTintColor: '#fff',
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()}>
              <MaterialIcons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
          ),
        }}
      />
      <Stack.Screen
        name="chat-list"
        options={{
          title: 'Conversations',
          animation: 'ios_from_left',
          animationTypeForReplace: 'push',
          headerTitleAlign: 'center',
          headerStyle: {
            backgroundColor: '#EA1D25',
          },
          headerTintColor: '#fff',
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.replace('/(user)')}>
              <MaterialIcons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
          ),
        }}
      />
      <Stack.Screen
        name="chat/[conversationId]"
        options={{
          title: 'Chat',
          headerTitleAlign: 'center',
          headerStyle: {
            backgroundColor: '#EA1D25',
          },
          headerTintColor: '#fff',
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.replace('/(user)/chat-list')}>
              <MaterialIcons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
          ),
        }}
      />
      <Stack.Screen
        name="admin"
        options={{
          headerShown: false,
        }}
      />
    </Stack>
  );
}
