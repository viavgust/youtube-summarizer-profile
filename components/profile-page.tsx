'use client'

import { useState, useEffect } from 'react'
import type { User } from '@supabase/supabase-js'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Mail, Youtube } from "lucide-react"

interface ProfilePageProps {
  user: User | null
}

export default function ProfilePage({ user }: ProfilePageProps) {
  const [history, setHistory] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchHistory = async () => {
      if (!user) {
        setLoading(false)
        return
      }
      setLoading(true)
      try {
        const response = await fetch('/api/history')
        if (response.status === 401) {
          setHistory([])
          return
        }
        if (!response.ok) {
          throw new Error(`Не удалось загрузить историю: ${response.statusText}`)
        }
        const data = await response.json()
        if (data.error) {
          console.error("Ошибка API при загрузке истории:", data.error)
          setHistory([])
        } else {
          setHistory(data.items || [])
        }
      } catch (error) {
        console.error("Сетевая ошибка при загрузке истории:", error)
        setHistory([])
      } finally {
        setLoading(false)
      }
    }

    fetchHistory()
  }, [user])
  if (!user) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-950 p-8">
        <Card>
          <CardHeader>
            <CardTitle>Профиль</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Пожалуйста, войдите, чтобы просмотреть свой профиль.</p>
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
              История запросов
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p>Загрузка истории...</p>
            ) : history.length > 0 ? (
              <div className="space-y-4">
                {history.map((item) => (
                  <div key={item.id} className="flex items-start gap-4">
                    <div className="bg-gray-100 dark:bg-gray-800 p-2 rounded-full">
                      <Youtube className="h-5 w-5 text-purple-500" />
                    </div>
                    <div>
                      <a 
                        href={item.video_url} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="font-medium text-sm text-gray-800 dark:text-gray-200 break-all hover:underline"
                      >
                        {item.video_url}
                      </a>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {new Date(item.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p>Нет запросов для отображения.</p>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
