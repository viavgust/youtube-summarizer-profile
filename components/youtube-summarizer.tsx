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

// Вспомогательная функция для удаления символов Markdown
const stripMarkdown = (s: string) =>
  s
    .normalize('NFKC')
    .replace(/```[\s\S]*?```/g, '')     // fenced code blocks
    .replace(/`+/g, '')                 // inline code
    .replace(/(^|\n)[>\s]*([-*+]\s+)/g, '$1') // markdown bullets at line start
    .replace(/(^|\n)\d+\.\s+/g, '$1')   // numbered list markers
    .replace(/[*_~#>]+/g, '')           // bold/italic/strike/headers/quotes
    .replace(/\s{2,}/g, ' ')            // collapse spaces
    .trim();

interface SummaryPoint {
  id: string
  text: string
  timestamp?: string
}

// Вспомогательная функция для извлечения текстовых значений из JSON-объекта
const extractTextFromSummary = (jsonSummary: any): string => {
  const texts: string[] = [];
  if (jsonSummary.verdict && typeof jsonSummary.verdict === 'string') {
    texts.push(`Вердикт: ${jsonSummary.verdict}`);
  }
  if (jsonSummary.reason && typeof jsonSummary.reason === 'string') {
    texts.push(`Причина: ${jsonSummary.reason}`);
  }
  if (jsonSummary.valuevsduration && typeof jsonSummary.valuevsduration === 'string') {
    texts.push(`Ценность/Длительность: ${jsonSummary.valuevsduration}`);
  }
  if (jsonSummary.targetaudience && typeof jsonSummary.targetaudience === 'string') {
    texts.push(`Целевая аудитория: ${jsonSummary.targetaudience}`);
  }
  return texts.join('\n\n'); // Объединяем с двойным переносом строки для лучшей читаемости
};

type ScenarioType = "quick" | "deep" | "decision" | "audio"

interface Scenario {
  id: ScenarioType
  icon: React.ComponentType<{ className?: string }>
}

interface ScenarioText {
  title: string
  subtitle: string
  description: string
  tooltip: string
}

const scenarios: Scenario[] = [
  { id: "quick", icon: List },
  { id: "deep", icon: Brain },
  { id: "decision", icon: CheckCircle },
  { id: "audio", icon: Headphones },
]

const scenarioTexts: Record<ScenarioType, Record<"en" | "ru", ScenarioText>> = {
  quick: {
    en: {
      title: "Quick Scan",
      subtitle: "Quick overview of key moments",
      description: "instant summary for quick decisions",
      tooltip:
        "Get 5-8 key bullet points on the video's essence: main theses, important facts, conclusions. Ideal for quickly understanding content without watching.",
    },
    ru: {
      title: "Быстрый обзор",
      subtitle: "Быстрый обзор ключевых моментов",
      description: "моментальное саммари для быстрых решений",
      tooltip:
        "Получите 5–8 ключевых буллетов по сути видео: основные тезисы, важные факты, выводы. Идеально для быстрого понимания содержания без просмотра.",
    },
  },
  deep: {
    en: {
      title: "Deep Dive",
      subtitle: "In-depth analysis with insights",
      description: "non-obvious insights and arguments",
      tooltip:
        "Detailed breakdown: hidden insights, counterarguments, potential risks and cognitive biases, target audience, plus 3 concrete steps to apply knowledge.",
    },
    ru: {
      title: "Глубокий анализ",
      subtitle: "Глубокий анализ с инсайтами",
      description: "неочевидные инсайты и аргументы",
      tooltip:
        "Детальный разбор: скрытые инсайты, контраргументы, потенциальные риски и когнитивные смещения, целевая аудитория, плюс 3 конкретных шага для применения знаний.",
    },
  },
  decision: {
    en: {
      title: "Decision Helper",
      subtitle: "Is it worth watching?",
      description: "worth watching: yes/doubtful/no",
      tooltip:
        "Clear verdict (Yes/Doubtful/No) with justification, analysis of value-to-duration ratio, identification of the appropriate audience for this content.",
    },
    ru: {
      title: "Помощник в принятии решений",
      subtitle: "Стоит ли тратить время на просмотр",
      description: "стоит ли смотреть: да/сомнительно/нет",
      tooltip:
        "Четкий вердикт (Да/Сомнительно/Нет) с обоснованием, анализ соотношения ценности к длительности, определение подходящей аудитории для этого контента.",
    },
  },
  audio: {
    en: {
      title: "Run & Listen",
      subtitle: "Audio format for activity",
      description: "audio digest for travel/running",
      tooltip:
        "5 super-short key points in listening format + 1-2 memorable 'mantras of the day' for motivation and reinforcing ideas.",
    },
    ru: {
      title: "Бег и прослушивание",
      subtitle: "Аудио-формат для активности",
      description: "аудио-дайджест для дороги/пробежки",
      tooltip:
        "5 сверхкоротких ключевых пунктов в формате для прослушивания + 1–2 запоминающиеся 'мантры дня' для мотивации и закрепления идей.",
    },
  },
}

export default function YouTubeSummarizer() {
  const [url, setUrl] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [lang, setLang] = useState<"en" | "ru">("ru") // Устанавливаем русский по умолчанию
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
        body: JSON.stringify({ url, scenario: selectedScenario, lang }), // Используем состояние lang
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Что-то пошло не так при получении суммирования.")
      }

      const data = await response.json()

      if (data.error) {
        throw new Error(data.error)
      } else if (data.summary) {
        let processedSummary: SummaryPoint[] = [];

        if (typeof data.summary === 'string') {
          try {
            const jsonParsed = JSON.parse(data.summary);
            if (selectedScenario === "decision" && (jsonParsed.verdict || jsonParsed.reason || jsonParsed.valuevsduration || jsonParsed.targetaudience)) {
              const extractedText = extractTextFromSummary(jsonParsed);
              processedSummary.push({ id: "1", text: extractedText });
            } else {
              // Если это строка, но не JSON или не сценарий "decision", обрабатываем как обычный текст
              processedSummary.push({ id: "1", text: data.summary });
            }
          } catch (e) {
            // Если не удалось распарсить как JSON, обрабатываем как обычный текст
            processedSummary.push({ id: "1", text: data.summary });
          }
        } else if (Array.isArray(data.summary)) {
          // Если это уже массив SummaryPoint, используем его напрямую
          processedSummary = data.summary;
        } else if (typeof data.summary === 'object' && data.summary !== null) {
          // Если это объект, но не массив, и содержит поля для сценария "decision"
          if (selectedScenario === "decision" && (data.summary.verdict || data.summary.reason || data.summary.valuevsduration || data.summary.targetaudience)) {
            const extractedText = extractTextFromSummary(data.summary);
            processedSummary.push({ id: "1", text: extractedText });
          } else {
            // В других случаях, если это объект, но не массив и не "decision" сценарий,
            // пытаемся извлечь текст, если есть поле 'text' или 'content'
            const textContent = data.summary.text || data.summary.content || JSON.stringify(data.summary);
            processedSummary.push({ id: "1", text: textContent });
          }
        } else {
          // В любом другом случае, если data.summary не является ни строкой, ни массивом, ни объектом
          processedSummary.push({ id: "1", text: String(data.summary) });
        }
        setSummary(processedSummary);
      } else {
        throw new Error("Транскрипт не найден у провайдера.") // Общая ошибка, если ни summary, ни error не найдены
      }
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
                  <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 w-full">
                    {/* Селектор языка */}
                    <div className="flex-1">
                      <Select value={lang} onValueChange={(value: "en" | "ru") => setLang(value)}>
                        <SelectTrigger
                          className="h-14 sm:h-16 text-base sm:text-lg font-bold bg-gradient-to-r from-purple-500 to-blue-400 hover:from-purple-600 hover:to-blue-500 text-white border-0 rounded-xl shadow-lg hover:shadow-purple-500/25 transition-all duration-300 focus:ring-2 focus:ring-purple-400/50 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-950"
                          style={{
                            boxShadow: "0 10px 20px -6px rgba(147, 51, 234, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.1)",
                          }}
                        >
                          <SelectValue placeholder="Выберите язык" />
                        </SelectTrigger>
                        <SelectContent className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-200 dark:border-gray-700 rounded-xl shadow-lg">
                          <SelectItem value="en">English</SelectItem>
                          <SelectItem value="ru">Русский</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button
                      onClick={handleSummarize}
                      disabled={isLoading}
                      className="flex-1 h-14 sm:h-16 px-8 sm:px-16 text-lg sm:text-xl font-bold bg-gradient-to-r from-purple-500 to-blue-400 hover:from-purple-600 hover:to-blue-500 text-white border-0 rounded-2xl shadow-2xl hover:shadow-purple-500/25 transform hover:scale-110 transition-all duration-500 disabled:transform-none disabled:hover:scale-100 hover:shadow-3xl animate-pulse hover:animate-none focus:ring-2 focus:ring-purple-400/50 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-950"
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
                        "Анализ видео"
                      )}
                    </Button>
                  </div>
                </div>
              </div>

              {summary.length > 0 && !isLoading && (
                <div className="mt-6 p-5 bg-gray-50/50 dark:bg-gray-800/30 border border-gray-200/50 dark:border-gray-700/50 rounded-xl animate-in slide-in-from-top-2 duration-300">
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">Краткое содержание:</h4>
                  <ul className="list-none pl-0 space-y-2 text-gray-800 dark:text-gray-200">
                    {summary.map((point) => (
                      <li key={point.id} className="text-base leading-relaxed">
                        <span>{stripMarkdown(point.text)}</span>
                        {point.timestamp && (
                          <Badge
                            variant="secondary"
                            className="ml-2 font-mono text-xs px-2 py-1.5 rounded-md bg-gray-200/60 dark:bg-gray-700/60 text-gray-600 dark:text-gray-400"
                          >
                            {point.timestamp}
                          </Badge>
                        )}
                      </li>
                    ))}
                  </ul>
                  <Button
                    onClick={handleCopy}
                    disabled={copied}
                    className="mt-4 w-full gap-2 transition-all duration-200 bg-purple-500 hover:bg-purple-600 text-white rounded-lg"
                  >
                    {copied ? (
                      <>
                        <CheckCircle2 className="h-4 w-4 text-green-200" />
                        Скопировано!
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4" />
                        Копировать все пункты
                      </>
                    )}
                  </Button>
                </div>
              )}

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
                          {scenarioTexts[scenario.id][lang].tooltip}
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
                            {scenarioTexts[scenario.id][lang].title}
                          </h4>
                          <p
                            className={`text-xs sm:text-sm font-medium mb-2 leading-relaxed ${
                              isSelected ? "text-purple-600 dark:text-purple-400" : "text-gray-700 dark:text-gray-300"
                            }`}
                          >
                            {scenarioTexts[scenario.id][lang].subtitle}
                          </p>
                          <p
                            className={`text-xs sm:text-sm leading-relaxed ${
                              isSelected ? "text-purple-600 dark:text-purple-400" : "text-gray-600 dark:text-gray-400"
                            }`}
                          >
                            {scenarioTexts[scenario.id][lang].description}
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
