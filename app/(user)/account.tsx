import { View } from 'react-native';

import Account from '@/components/Account';
import { useAuth } from '@/context/AuthProvider';

export default function AccountPage() {
  const { session } = useAuth();

  return (
    <View style={{ flex: 1 }}>
      {session && session.user ? <Account key={session.user.id} session={session} /> : null}
    </View>
  );
}
