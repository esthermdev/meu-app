import { Text } from 'react-native';
import { Slot } from 'expo-router';
import { useAuth } from '@/context/AuthProvider';

export default function ProfileLayout() {
  const { loading } = useAuth();
  if (loading) {
    return <Text>Loading...</Text>;
  }

  return <Slot />;
}
