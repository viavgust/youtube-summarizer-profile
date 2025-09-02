"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Youtube, Mail, Lock, User, ArrowRight, CheckCircle2, Eye, EyeOff } from "lucide-react"

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [name, setName] = useState("")

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 relative overflow-hidden">
      {/* Subtle animated gradient background */}
      <div
        className="absolute inset-0 bg-gradient-to-br from-blue-50/30 via-purple-50/20 to-pink-50/30 dark:from-blue-950/20 dark:via-purple-950/10 dark:to-pink-950/20"
        style={{
          animation: "gradient-shift 15s ease-in-out infinite",
        }}
      />

      <div className="relative z-10 flex items-center justify-center min-h-screen p-4">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="p-3 bg-gradient-to-r from-purple-500 to-cyan-500 rounded-2xl">
                <Youtube className="h-8 w-8 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">AI Summarizer</h1>
            </div>
            <p className="text-gray-600 dark:text-gray-400">
              {isLogin ? "Добро пожаловать обратно" : "Создайте аккаунт для начала работы"}
            </p>
          </div>

          <Card className="shadow-2xl border-0 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm rounded-3xl">
            <CardHeader className="pb-6">
              <CardTitle className="text-2xl font-bold text-center text-gray-900 dark:text-white">
                {isLogin ? "Вход" : "Регистрация"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {!isLogin && (
                <div className="relative">
                  <User className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    placeholder="Ваше имя"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="pl-12 h-12 text-base border-gray-200 dark:border-gray-700 focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 rounded-xl bg-gray-50/50 dark:bg-gray-800/50"
                  />
                </div>
              )}

              <div className="relative">
                <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-12 h-12 text-base border-gray-200 dark:border-gray-700 focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 rounded-xl bg-gray-50/50 dark:bg-gray-800/50"
                />
              </div>

              <div className="relative">
                <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Пароль"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-12 pr-12 h-12 text-base border-gray-200 dark:border-gray-700 focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 rounded-xl bg-gray-50/50 dark:bg-gray-800/50"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>

              <Button className="w-full h-12 text-base font-semibold bg-gradient-to-r from-purple-500 to-cyan-500 hover:from-purple-600 hover:to-cyan-600 text-white rounded-xl shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-200">
                {isLogin ? "Войти" : "Создать аккаунт"}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>

              <div className="text-center">
                <button
                  onClick={() => setIsLogin(!isLogin)}
                  className="text-sm text-gray-600 dark:text-gray-400 hover:text-purple-500 transition-colors"
                >
                  {isLogin ? "Нет аккаунта? Зарегистрироваться" : "Уже есть аккаунт? Войти"}
                </button>
              </div>

              {!isLogin && (
                <div className="space-y-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Что вы получите:</h4>
                  <div className="space-y-2">
                    <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      <span>Неограниченные суммаризации</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      <span>История всех анализов</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      <span>Экспорт результатов</span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
