"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Youtube, Mail, Settings, BarChart3, Clock, Download, Edit3, Save, X } from "lucide-react"

export default function ProfilePage() {
  const [isEditing, setIsEditing] = useState(false)
  const [name, setName] = useState("Александр Петров")
  const [email, setEmail] = useState("alex@example.com")

  const stats = [
    { label: "Всего анализов", value: "127", icon: BarChart3, color: "text-purple-500" },
    { label: "Время сэкономлено", value: "42ч", icon: Clock, color: "text-cyan-500" },
    { label: "Этот месяц", value: "23", icon: Youtube, color: "text-green-500" },
  ]

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/30 via-purple-50/20 to-pink-50/30 dark:from-blue-950/20 dark:via-purple-950/10 dark:to-pink-950/20" />

      <div className="relative z-10">
        {/* Header */}
        <header className="border-b border-border/40 bg-white/80 dark:bg-gray-950/80 backdrop-blur-sm">
          <div className="container mx-auto px-4 py-4 flex justify-between items-center max-w-5xl">
            <div className="flex items-center gap-2">
              <Youtube className="h-6 w-6 text-purple-500" />
              <span className="font-semibold text-lg text-gray-900 dark:text-white">AI Summarizer</span>
            </div>
            <Button variant="ghost" size="icon" className="rounded-full">
              <Settings className="h-5 w-5" />
            </Button>
          </div>
        </header>

        <main className="container mx-auto px-4 py-12 max-w-4xl">
          {/* Profile Header */}
          <Card className="mb-8 shadow-xl border-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-2xl">
            <CardContent className="p-8">
              <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                <Avatar className="h-24 w-24 border-4 border-gradient-to-r from-purple-500 to-cyan-500">
                  <AvatarImage src="/placeholder-avatar.jpg" />
                  <AvatarFallback className="text-2xl font-bold bg-gradient-to-r from-purple-500 to-cyan-500 text-white">
                    АП
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 space-y-4">
                  {isEditing ? (
                    <div className="space-y-3">
                      <Input value={name} onChange={(e) => setName(e.target.value)} className="text-xl font-bold" />
                      <Input value={email} onChange={(e) => setEmail(e.target.value)} type="email" />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => setIsEditing(false)}
                          className="bg-gradient-to-r from-purple-500 to-cyan-500"
                        >
                          <Save className="h-4 w-4 mr-2" />
                          Сохранить
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setIsEditing(false)}>
                          <X className="h-4 w-4 mr-2" />
                          Отмена
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{name}</h1>
                        <Button size="sm" variant="ghost" onClick={() => setIsEditing(true)} className="p-2">
                          <Edit3 className="h-4 w-4" />
                        </Button>
                      </div>
                      <p className="text-gray-600 dark:text-gray-400 flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        {email}
                      </p>
                      <Badge className="bg-gradient-to-r from-purple-500 to-cyan-500 text-white">
                        Premium пользователь
                      </Badge>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {stats.map((stat, index) => {
              const Icon = stat.icon
              return (
                <Card
                  key={index}
                  className="shadow-lg border-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-2xl hover:scale-105 transition-transform duration-200"
                >
                  <CardContent className="p-6 text-center">
                    <div className={`inline-flex p-3 rounded-full bg-gray-100 dark:bg-gray-800 mb-4`}>
                      <Icon className={`h-6 w-6 ${stat.color}`} />
                    </div>
                    <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{stat.value}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">{stat.label}</div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {/* Recent Activity */}
          <Card className="shadow-xl border-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-2xl">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl font-semibold text-gray-900 dark:text-white">
                  Последняя активность
                </CardTitle>
                <Button variant="outline" size="sm" className="gap-2 bg-transparent">
                  <Download className="h-4 w-4" />
                  Экспорт
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                {
                  title: "Как создать успешный стартап",
                  date: "2 часа назад",
                  type: "Quick Scan",
                  duration: "15:32",
                },
                {
                  title: "Основы машинного обучения",
                  date: "Вчера",
                  type: "Deep Dive",
                  duration: "28:45",
                },
                {
                  title: "Продуктивность и тайм-менеджмент",
                  date: "3 дня назад",
                  type: "Decision Helper",
                  duration: "12:18",
                },
              ].map((item, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 rounded-xl bg-gray-50/50 dark:bg-gray-800/30 border border-gray-200/50 dark:border-gray-700/50 hover:bg-gray-100/50 dark:hover:bg-gray-800/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-gradient-to-r from-purple-500 to-cyan-500 rounded-lg">
                      <Youtube className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white">{item.title}</h3>
                      <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                        <span>{item.date}</span>
                        <Badge variant="secondary" className="text-xs">
                          {item.type}
                        </Badge>
                        <span>{item.duration}</span>
                      </div>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm">
                    Открыть
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  )
}
