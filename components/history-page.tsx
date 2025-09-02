"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Youtube, Search, Filter, Calendar, Clock, Eye, Download, Trash2, Star, MoreHorizontal } from "lucide-react"

export default function HistoryPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [filterType, setFilterType] = useState("all")
  const [sortBy, setSortBy] = useState("date")

  const summaries = [
    {
      id: 1,
      title: "Как создать успешный стартап в 2024",
      url: "https://youtube.com/watch?v=example1",
      type: "Quick Scan",
      date: "2024-01-15",
      time: "14:30",
      duration: "15:32",
      status: "completed",
      favorite: true,
      summary: "Основные принципы создания стартапа: валидация идеи, поиск команды, привлечение инвестиций...",
    },
    {
      id: 2,
      title: "Основы машинного обучения для начинающих",
      url: "https://youtube.com/watch?v=example2",
      type: "Deep Dive",
      date: "2024-01-14",
      time: "09:15",
      duration: "28:45",
      status: "completed",
      favorite: false,
      summary: "Детальный разбор алгоритмов ML, практические примеры, рекомендации по изучению...",
    },
    {
      id: 3,
      title: "Продуктивность и тайм-менеджмент",
      url: "https://youtube.com/watch?v=example3",
      type: "Decision Helper",
      date: "2024-01-12",
      time: "16:45",
      duration: "12:18",
      status: "completed",
      favorite: true,
      summary: "Вердикт: Да, стоит посмотреть. Практические техники повышения продуктивности...",
    },
    {
      id: 4,
      title: "Криптовалюты: будущее или пузырь?",
      url: "https://youtube.com/watch?v=example4",
      type: "Run & Listen",
      date: "2024-01-10",
      time: "11:20",
      duration: "22:15",
      status: "processing",
      favorite: false,
      summary: "",
    },
  ]

  const getTypeColor = (type: string) => {
    switch (type) {
      case "Quick Scan":
        return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
      case "Deep Dive":
        return "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300"
      case "Decision Helper":
        return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
      case "Run & Listen":
        return "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300"
      default:
        return "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300"
    }
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/30 via-purple-50/20 to-pink-50/30 dark:from-blue-950/20 dark:via-purple-950/10 dark:to-pink-950/20" />

      <div className="relative z-10">
        {/* Header */}
        <header className="border-b border-border/40 bg-white/80 dark:bg-gray-950/80 backdrop-blur-sm">
          <div className="container mx-auto px-4 py-4 flex justify-between items-center max-w-6xl">
            <div className="flex items-center gap-2">
              <Youtube className="h-6 w-6 text-purple-500" />
              <span className="font-semibold text-lg text-gray-900 dark:text-white">AI Summarizer</span>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="gap-2 bg-transparent">
                <Download className="h-4 w-4" />
                Экспорт всех
              </Button>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8 max-w-6xl">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">История анализов</h1>
            <p className="text-gray-600 dark:text-gray-400">Все ваши суммаризации в одном месте</p>
          </div>

          {/* Filters */}
          <Card className="mb-8 shadow-lg border-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-2xl">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    placeholder="Поиск по названию или содержанию..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 h-10"
                  />
                </div>
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="w-full md:w-48 h-10">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Все типы</SelectItem>
                    <SelectItem value="quick">Quick Scan</SelectItem>
                    <SelectItem value="deep">Deep Dive</SelectItem>
                    <SelectItem value="decision">Decision Helper</SelectItem>
                    <SelectItem value="audio">Run & Listen</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-full md:w-48 h-10">
                    <Calendar className="h-4 w-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="date">По дате</SelectItem>
                    <SelectItem value="title">По названию</SelectItem>
                    <SelectItem value="duration">По длительности</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Summary List */}
          <div className="space-y-4">
            {summaries.map((summary) => (
              <Card
                key={summary.id}
                className="shadow-lg border-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-2xl hover:shadow-xl transition-all duration-200 hover:scale-[1.01]"
              >
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row gap-4">
                    {/* Main Content */}
                    <div className="flex-1 space-y-3">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white line-clamp-1">
                              {summary.title}
                            </h3>
                            {summary.favorite && <Star className="h-5 w-5 text-yellow-500 fill-current" />}
                          </div>
                          <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mb-3">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              <span>{summary.date}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              <span>{summary.time}</span>
                            </div>
                            <Badge className={`text-xs ${getTypeColor(summary.type)}`}>{summary.type}</Badge>
                            <span>{summary.duration}</span>
                          </div>
                          {summary.status === "completed" && summary.summary && (
                            <p className="text-gray-700 dark:text-gray-300 text-sm line-clamp-2">{summary.summary}</p>
                          )}
                          {summary.status === "processing" && (
                            <div className="flex items-center gap-2 text-sm text-orange-600 dark:text-orange-400">
                              <div className="w-4 h-4 border-2 border-orange-600 border-t-transparent rounded-full animate-spin"></div>
                              <span>Обрабатывается...</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex lg:flex-col gap-2 lg:w-32">
                      <Button
                        size="sm"
                        className="flex-1 lg:flex-none bg-gradient-to-r from-purple-500 to-cyan-500 hover:from-purple-600 hover:to-cyan-600"
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Открыть
                      </Button>
                      <Button size="sm" variant="outline" className="flex-1 lg:flex-none bg-transparent">
                        <Download className="h-4 w-4 mr-2" />
                        Скачать
                      </Button>
                      <Button size="sm" variant="ghost" className="lg:hidden">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                      <div className="hidden lg:flex flex-col gap-2">
                        <Button size="sm" variant="ghost" className="justify-start">
                          <Star className="h-4 w-4 mr-2" />
                        </Button>
                        <Button size="sm" variant="ghost" className="justify-start text-red-600 hover:text-red-700">
                          <Trash2 className="h-4 w-4 mr-2" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          <div className="flex justify-center mt-8">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" disabled>
                Предыдущая
              </Button>
              <Button size="sm" className="bg-gradient-to-r from-purple-500 to-cyan-500">
                1
              </Button>
              <Button variant="outline" size="sm">
                2
              </Button>
              <Button variant="outline" size="sm">
                3
              </Button>
              <Button variant="outline" size="sm">
                Следующая
              </Button>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
