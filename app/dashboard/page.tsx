import { createServer } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import DemoApp from '@/components/demo-app'

// This component is rendered on the server
export default async function Dashboard() {
  const supabase = await createServer()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return redirect('/auth/sign-in')
  }

  return <DemoApp user={user} />
}
