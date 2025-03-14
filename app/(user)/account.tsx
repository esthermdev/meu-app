import { useAuth } from '@/context/AuthProvider'
import Account from '@/components/Account'

export default function AccountPage() {
  const { session } = useAuth()

  return (
    <>
      {session && session.user ? <Account key={session.user.id} session={session} /> : null}
    </>
  )
}