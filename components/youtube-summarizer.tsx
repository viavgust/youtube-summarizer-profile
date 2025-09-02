"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import {
  Loader2,
  Youtube,
  AlertCircle,
  Moon,
  Sun,
  Copy,
  CheckCircle2,
  List,
  Brain,
  CheckCircle,
  Headphones,
  Info,
} from "lucide-react"

interface SummaryPoint {
  id: string
  text: string
  timestamp?: string
}

type ScenarioType = "quick" | "deep" | "decision" | "audio"

interface Scenario {
  id: ScenarioType
  title: string
  subtitle: string
  description: string
  tooltip: string
  icon: React.ComponentType<{ className?: string }>
}

const scenarios: Scenario[] = [
  {
    id: "quick",
    title: "Quick Scan",
    subtitle: "Быстрый обзор ключевых моментов",
    description: "моментальное саммари для быстрых решений",
    tooltip:
      "Получите 5–8 ключевых буллетов по сути видео: основные тезисы, важные факты, выводы. Идеально для быстрого понимания содержания без просмотра.",
    icon: List,
  },
  {
    id: "deep",
    title: "Deep Dive",
    subtitle: "Глубокий анализ с инсайтами",
    description: "неочевидные инсайты и аргументы",
    tooltip:
      "Детальный разбор: скрытые инсайты, контраргументы, потенциальные риски и когнитивные смещения, целевая аудитория, плюс 3 конкретных шага для применения знаний.",
    icon: Brain,
  },
  {
    id: "decision",
    title: "Decision Helper",
    subtitle: "Стоит ли тратить время на просмотр",
    description: "стоит ли смотреть: да/сомнительно/нет",
    tooltip:
      "Четкий вердикт (Да/Сомнительно/Нет) с обоснованием, анализ соотношения ценности к длительности, определение подходящей аудитории для этого контента.",
    icon: CheckCircle,
  },
  {
    id: "audio",
    title: "Run & Listen",
    subtitle: "Аудио-формат для активности",
    description: "аудио-дайджест для дороги/пробежки",
    tooltip:
      "5 сверхкоротких ключевых пунктов в формате для прослушивания + 1–2 запоминающиеся 'мантры дня' для мотивации и закрепления идей.",
    icon: Headphones,
  },
]

export default function YouTubeSummarizer() {
  const [url, setUrl] = useState("")
  const [language, setLanguage] = useState("ru")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [summary, setSummary] = useState<SummaryPoint[]>([])
  const [copied, setCopied] = useState(false)
  const [selectedScenario, setSelectedScenario] = useState<ScenarioType>("quick")
  const [theme, setTheme] = useState<"light" | "dark">("light")

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") as "light" | "dark" | null
    if (savedTheme) {
      setTheme(savedTheme)
      document.documentElement.classList.toggle("dark", savedTheme === "dark")
    } else if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
      setTheme("dark")
      document.documentElement.classList.add("dark")
    }
  }, [])

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light"
    setTheme(newTheme)
    localStorage.setItem("theme", newTheme)
    document.documentElement.classList.toggle("dark", newTheme === "dark")
  }

  const handleSummarize = async () => {
    if (!url.trim()) {
      setError("Пожалуйста, введите ссылку на YouTube видео")
      return
    }

    if (!url.includes("youtube.com") && !url.includes("youtu.be")) {
      setError("Пожалуйста, введите корректную ссылку на YouTube")
      return
    }

    setIsLoading(true)
    setError("")
    setSummary([])

    try {
      const response = await fetch("/api/summarize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url, scenario: selectedScenario }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Что-то пошло не так при получении суммирования.")
      }

      const data = await response.json()
      setSummary(data.summary)
    } catch (err: any) {
      setError(err.message || "Произошла непредвиденная ошибка.")
      console.error("Ошибка при вызове API суммирования:", err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCopy = async () => {
    const summaryText = summary.map((point) => `• ${point.text}`).join("\n")
    await navigator.clipboard.writeText(summaryText)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 relative overflow-hidden">
      {/* Subtle animated gradient background */}
      <div
        className="absolute inset-0 bg-gradient-to-br from-blue-50/30 via-purple-50/20 to-pink-50/30 dark:from-blue-950/20 dark:via-purple-950/10 dark:to-pink-950/20 animate-pulse"
        style={{
          animation: "gradient-shift 15s ease-in-out infinite",
        }}
      />
      <style jsx>{`
        @keyframes gradient-shift {
          0%, 100% { 
            background: linear-gradient(135deg, rgba(239, 246, 255, 0.3) 0%, rgba(245, 243, 255, 0.2) 50%, rgba(253, 242, 248, 0.3) 100%);
          }
          50% { 
            background: linear-gradient(135deg, rgba(253, 242, 248, 0.3) 0%, rgba(239, 246, 255, 0.2) 50%, rgba(245, 243, 255, 0.3) 100%);
          }
        }
        .dark @keyframes gradient-shift {
          0%, 100% { 
            background: linear-gradient(135deg, rgba(30, 58, 138, 0.2) 0%, rgba(88, 28, 135, 0.1) 50%, rgba(157, 23, 77, 0.2) 100%);
          }
          50% { 
            background: linear-gradient(135deg, rgba(157, 23, 77, 0.2) 0%, rgba(30, 58, 138, 0.1) 50%, rgba(88, 28, 135, 0.2) 100%);
          }
        }
      `}</style>

      {/* Content with relative positioning */}
      <div className="relative z-10">
        {/* Header with theme toggle */}
        <header className="border-b border-border/40 bg-white/80 dark:bg-gray-950/80 backdrop-blur-sm">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center max-w-5xl">
            <div className="flex items-center gap-2">
              <Youtube className="h-6 w-6 text-purple-500" />
              <span className="font-semibold text-lg text-gray-900 dark:text-white">AI Summarizer</span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200"
            >
              <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 text-gray-700 dark:text-gray-300" />
              <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 text-gray-700 dark:text-gray-300" />
              <span className="sr-only">Переключить тему</span>
            </Button>
          </div>
        </header>

        {/* Main content */}
        <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 max-w-4xl">
          <div className="text-center mb-12 sm:mb-16 space-y-4 sm:space-y-6">
            <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold text-balance text-gray-900 dark:text-white font-sans tracking-tight leading-tight">
              AI YouTube Summarizer
            </h1>
            <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-400 font-medium text-pretty max-w-2xl mx-auto leading-relaxed px-4 sm:px-0">
              Вставь ссылку и получи краткое изложение за секунды
            </p>
          </div>

          <Card className="mb-8 sm:mb-12 shadow-xl border-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-2xl transition-all duration-300 hover:shadow-2xl hover:scale-[1.01]">
            <CardContent className="p-6 sm:p-8 lg:p-10 space-y-6 sm:space-y-8">
              <div className="space-y-4 sm:space-y-6">
                <div className="relative">
                  <label htmlFor="youtube-url" className="sr-only">
                    Ссылка на YouTube видео
                  </label>
                  <Youtube className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 sm:h-6 sm:w-6 text-gray-400 dark:text-gray-500" />
                  <Input
                    id="youtube-url"
                    placeholder="https://www.youtube.com/watch?v=..."
                    value={url}
                    onChange={(e) => {
                      setUrl(e.target.value)
                      setError("")
                    }}
                    className="pl-12 sm:pl-14 h-12 sm:h-14 text-base sm:text-lg border-gray-200 dark:border-gray-700 focus:border-purple-400 dark:focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 dark:focus:ring-purple-400/20 transition-all duration-300 rounded-xl bg-gray-50/50 dark:bg-gray-800/50 text-gray-900 dark:text-gray-100"
                  />
                </div>

                <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
                  <div className="w-full sm:w-52">
                    <label htmlFor="language-select" className="sr-only">
                      Выбор языка
                    </label>
                    <Select value={language} onValueChange={setLanguage}>
                      <SelectTrigger
                        id="language-select"
                        className="w-full h-12 sm:h-14 border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50/50 dark:bg-gray-800/50 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-purple-400/20 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-950"
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 rounded-md overflow-hidden">
                        <SelectItem
                          value="ru"
                          className="text-gray-900 dark:text-gray-100 hover:bg-gray-100/80 dark:hover:bg-purple-500/10 hover:text-gray-900 dark:hover:text-gray-100 transition-colors duration-200 data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-purple-500 data-[state=checked]:to-cyan-500 data-[state=checked]:text-white data-[state=checked]:font-bold rounded-md mx-1 my-0.5"
                        >
                          🇷🇺 Русский
                        </SelectItem>
                        <SelectItem
                          value="en"
                          className="text-gray-900 dark:text-gray-100 hover:bg-gray-100/80 dark:hover:bg-purple-500/10 hover:text-gray-900 dark:hover:text-gray-100 transition-colors duration-200 data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-purple-500 data-[state=checked]:to-cyan-500 data-[state=checked]:text-white data-[state=checked]:font-bold rounded-md mx-1 my-0.5"
                        >
                          🇺🇸 English
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Button
                    onClick={handleSummarize}
                    disabled={isLoading}
                    className="h-14 sm:h-16 px-8 sm:px-16 text-lg sm:text-xl font-bold bg-gradient-to-r from-purple-500 to-cyan-500 hover:from-purple-600 hover:to-cyan-600 text-white border-0 rounded-2xl shadow-2xl hover:shadow-purple-500/25 transform hover:scale-110 transition-all duration-500 disabled:transform-none disabled:hover:scale-100 hover:shadow-3xl animate-pulse hover:animate-none focus:ring-2 focus:ring-purple-400/50 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-950"
                    style={{
                      boxShadow: "0 20px 40px -12px rgba(147, 51, 234, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.1)",
                    }}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-3 sm:mr-4 h-6 w-6 sm:h-7 sm:w-7 animate-spin" />
                        Обрабатываю...
                      </>
                    ) : (
                      "Кратко о видео"
                    )}
                  </Button>
                </div>
              </div>

              {error && !isLoading && (
                <div className="flex items-center gap-3 p-5 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-xl text-red-700 dark:text-red-400 animate-in slide-in-from-top-2 duration-300">
                  <AlertCircle className="h-6 w-6 flex-shrink-0" />
                  <span className="text-base">{error}</span>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="mb-8 sm:mb-12">
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4 sm:mb-6 text-center">
              Выберите тип анализа
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 auto-rows-fr">
              {scenarios.map((scenario) => {
                const Icon = scenario.icon
                const isSelected = selectedScenario === scenario.id
                return (
                  <Card
                    key={scenario.id}
                    className={`cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:shadow-lg rounded-2xl border-2 relative group h-full flex flex-col focus-within:ring-2 focus-within:ring-purple-400/50 focus-within:ring-offset-2 focus-within:ring-offset-white dark:focus-within:ring-offset-gray-950 ${
                      isSelected
                        ? "border-purple-500 bg-gradient-to-br from-purple-50 to-cyan-50 dark:from-purple-950/30 dark:to-cyan-950/30 shadow-lg shadow-purple-500/20"
                        : "border-gray-200 dark:border-gray-700 bg-white/60 dark:bg-gray-900/60 hover:border-purple-300 dark:hover:border-purple-600 hover:shadow-purple-500/10"
                    }`}
                    onClick={() => setSelectedScenario(scenario.id)}
                    tabIndex={0}
                    role="button"
                    aria-pressed={isSelected}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault()
                        setSelectedScenario(scenario.id)
                      }
                    }}
                  >
                    <div className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <div className="relative">
                        <Info className="h-5 w-5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" />
                        <div className="absolute bottom-full right-0 mb-2 w-80 p-4 bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 text-sm rounded-md shadow-sm border border-gray-300 dark:border-gray-600 opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none z-10 transform scale-95 group-hover:scale-100">
                          <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-100 dark:border-t-gray-800"></div>
                          {scenario.tooltip}
                        </div>
                      </div>
                    </div>

                    <CardContent className="p-4 sm:p-6 flex-1 flex flex-col">
                      <div className="flex items-start gap-3 sm:gap-4 flex-1">
                        <div
                          className={`p-2.5 sm:p-3 rounded-xl flex-shrink-0 ${
                            isSelected
                              ? "bg-gradient-to-br from-purple-500 to-cyan-500 text-white"
                              : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
                          }`}
                        >
                          <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4
                            className={`font-semibold text-base sm:text-lg mb-1 ${
                              isSelected ? "text-purple-700 dark:text-purple-300" : "text-gray-900 dark:text-gray-100"
                            }`}
                          >
                            {scenario.title}
                          </h4>
                          <p
                            className={`text-xs sm:text-sm font-medium mb-2 leading-relaxed ${
                              isSelected ? "text-purple-600 dark:text-purple-400" : "text-gray-700 dark:text-gray-300"
                            }`}
                          >
                            {scenario.subtitle}
                          </p>
                          <p
                            className={`text-xs sm:text-sm leading-relaxed ${
                              isSelected ? "text-purple-600 dark:text-purple-400" : "text-gray-600 dark:text-gray-400"
                            }`}
                          >
                            {scenario.description}
                          </p>
                        </div>
                        {isSelected && (
                          <div className="flex-shrink-0">
                            <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-purple-500" />
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>

          {isLoading && (
            <Card className="shadow-xl border-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm animate-in slide-in-from-bottom-4 duration-500 rounded-2xl transition-all duration-300 hover:shadow-2xl hover:scale-[1.005]">
              <CardHeader className="pb-6">
                <div className="flex items-center justify-between">
                  <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded-lg w-48 animate-pulse"></div>
                  <div className="h-9 bg-gray-200 dark:bg-gray-700 rounded-lg w-28 animate-pulse"></div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {[...Array(5)].map((_, index) => (
                  <div
                    key={index}
                    className="flex gap-4 p-5 rounded-xl bg-gray-50/50 dark:bg-gray-800/30 border border-gray-200/50 dark:border-gray-700/50"
                  >
                    <div className="flex-shrink-0">
                      <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded-lg w-16 animate-pulse"></div>
                    </div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-full"></div>
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-3/4"></div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {error && !isLoading && (
            <Card className="shadow-xl border-0 bg-red-50/80 dark:bg-red-950/20 backdrop-blur-sm animate-in slide-in-from-bottom-4 duration-500 rounded-2xl border-red-200/50 dark:border-red-800/50 transition-all duration-300 hover:shadow-2xl hover:scale-[1.005]">
              <CardContent className="p-12 text-center">
                <div className="flex flex-col items-center gap-6">
                  <div className="p-4 bg-red-100 dark:bg-red-900/30 rounded-full">
                    <AlertCircle className="h-12 w-12 text-red-500 dark:text-red-400" />
                  </div>
                  <div className="space-y-3">
                    <h3 className="text-xl font-semibold text-red-800 dark:text-red-300">Что-то пошло не так</h3>
                    <p className="text-red-700 dark:text-red-400 text-base leading-relaxed max-w-md">{error}</p>
                    <p className="text-sm text-red-600 dark:text-red-500 mt-4">
                      💡 Проверьте ссылку и попробуйте ещё раз
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {summary.length > 0 && !isLoading && (
            <>
              <Card className="shadow-xl border-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm animate-in slide-in-from-bottom-4 duration-500 rounded-2xl transition-all duration-300 hover:shadow-2xl hover:scale-[1.005]">
                <CardHeader className="pb-6">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                      Краткое содержание
                    </CardTitle>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCopy}
                      className="gap-2 transition-all duration-200 bg-transparent hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
                    >
                      {copied ? (
                        <>
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                          Скопировано
                        </>
                      ) : (
                        <>
                          <Copy className="h-4 w-4" />
                          Копировать
                        </>
                      )}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-5">
                  {summary.map((point, index) => (
                    <div
                      key={point.id}
                      className="flex gap-5 p-6 rounded-xl bg-gray-50/50 dark:bg-gray-800/30 border border-gray-200/50 dark:border-gray-700/50 animate-in slide-in-from-left-2 duration-300 hover:bg-gray-100/50 dark:hover:bg-gray-800/50 transition-colors duration-200"
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      <div className="flex-shrink-0 pt-1">
                        <div className="w-2 h-2 bg-gradient-to-r from-purple-500 to-cyan-500 rounded-full"></div>
                      </div>
                      <div className="flex-1 space-y-3">
                        <p className="text-base leading-7 text-pretty text-gray-800 dark:text-gray-200 font-medium">
                          {point.text}
                        </p>
                        {point.timestamp && (
                          <Badge
                            variant="secondary"
                            className="font-mono text-xs px-2 py-1.5 rounded-md bg-gray-200/60 dark:bg-gray-700/60 text-gray-600 dark:text-gray-400"
                          >
                            {point.timestamp}
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="mt-8 shadow-xl border-0 bg-gray-100/80 dark:bg-gray-800/80 backdrop-blur-sm animate-in fade-in-50 slide-in-from-bottom-4 duration-1000 rounded-2xl transition-all duration-300 hover:shadow-2xl hover:scale-[1.005]">
                <CardContent className="p-8 relative">
                  <div className="flex items-start gap-6">
                    {/* Large quotation mark */}
                    <div className="text-8xl text-gray-400/60 dark:text-gray-500/40 font-serif leading-none select-none">
                      "
                    </div>
                    <div className="flex-1 pt-4">
                      <blockquote
                        className="text-xl font-medium text-gray-800 dark:text-gray-200 leading-relaxed mb-6 animate-in fade-in-50 duration-1500"
                        style={{ animationDelay: "300ms" }}
                      >
                        Самое важное — это не количество информации, которую мы потребляем, а качество понимания того,
                        что действительно имеет значение.
                      </blockquote>
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">Ключевая мысль видео</p>
                        <div className="flex items-center gap-2 px-4 py-2 bg-white/80 dark:bg-gray-700/80 rounded-full border border-gray-200/60 dark:border-gray-600/60 shadow-sm backdrop-blur-sm">
                          <span className="text-lg">🎉</span>
                          <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">вдохновляющее</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </main>

        <footer className="border-t border-gray-200 dark:border-gray-800 mt-16 sm:mt-20">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-5xl">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 sm:gap-6">
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center sm:text-left">
                Powered by Gemini Flash 2.5 + RapidAPI
              </p>
              <div className="flex items-center gap-1 text-sm">
                <a
                  href="#"
                  className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors duration-200 relative group px-2 py-1 focus:ring-2 focus:ring-purple-400/50 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-950 rounded"
                >
                  <span>About</span>
                  <span className="absolute bottom-0 left-2 w-0 h-px bg-gradient-to-r from-purple-500 to-cyan-500 transition-all duration-300 group-hover:w-[calc(100%-16px)]"></span>
                </a>
                <span className="text-gray-300 dark:text-gray-600">·</span>
                <a
                  href="#"
                  className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors duration-200 relative group px-2 py-1 focus:ring-2 focus:ring-purple-400/50 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-950 rounded"
                >
                  <span>Privacy</span>
                  <span className="absolute bottom-0 left-2 w-0 h-px bg-gradient-to-r from-purple-500 to-cyan-500 transition-all duration-300 group-hover:w-[calc(100%-16px)]"></span>
                </a>
                <span className="text-gray-300 dark:text-gray-600">·</span>
                <a
                  href="#"
                  className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors duration-200 relative group px-2 py-1 focus:ring-2 focus:ring-purple-400/50 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-950 rounded"
                >
                  <span>Contact</span>
                  <span className="absolute bottom-0 left-2 w-0 h-px bg-gradient-to-r from-purple-500 to-cyan-500 transition-all duration-300 group-hover:w-[calc(100%-16px)]"></span>
                </a>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  )
}
