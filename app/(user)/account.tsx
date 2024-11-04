import { View } from 'react-native'
import { useAuth } from '@/hooks/AuthProvider'
import Account from '@/components/Account'

export default function AccountPage() {
  const { session } = useAuth()

  return (
    <View>
      {session && session.user ? <Account key={session.user.id} session={session} /> : null}
    </View>
  )
}