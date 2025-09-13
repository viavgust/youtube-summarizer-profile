'use client'

import type { User } from '@supabase/supabase-js'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Mail } from "lucide-react"

interface ProfilePageProps {
  user: User | null
}

export default function ProfilePage({ user }: ProfilePageProps) {
  if (!user) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-950 p-8">
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Please sign in to view your profile.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const getInitials = (email: string) => {
    return email.substring(0, 2).toUpperCase()
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 relative overflow-hidden p-4 md:p-8">
      <main className="container mx-auto max-w-4xl">
        <Card className="mb-8 shadow-xl border-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-2xl">
          <CardContent className="p-8">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
              <Avatar className="h-24 w-24 border-4 border-gradient-to-r from-purple-500 to-cyan-500">
                <AvatarImage src="/placeholder-user.jpg" />
                <AvatarFallback className="text-2xl font-bold bg-gradient-to-r from-purple-500 to-cyan-500 text-white">
                  {getInitials(user.email || 'UU')}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{user.email}</h1>
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    {user.email}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-xl border-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-2xl">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-gray-900 dark:text-white">
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p>No recent activity to show.</p>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
