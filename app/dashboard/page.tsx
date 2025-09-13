import { createServer } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import SignOutButton from '@/components/sign-out-button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

// This component is rendered on the server
export default async function Dashboard() {
  const supabase = await createServer()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return redirect('/auth/sign-in')
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Dashboard</CardTitle>
          <CardDescription>Welcome back!</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>Hello, {user.email}</p>
          <SignOutButton />
        </CardContent>
      </Card>
    </div>
  )
}
