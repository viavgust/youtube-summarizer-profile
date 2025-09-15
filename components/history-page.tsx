"use client"

import { useState, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Youtube, Search, Filter, Calendar, Download } from "lucide-react"

export default function HistoryPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [filterType, setFilterType] = useState("all")
  const [sortBy, setSortBy] = useState("date")
  const [history, setHistory] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const filteredHistory = useMemo(() => {
    let processedHistory = [...history];

    // Search
    if (searchQuery) {
      processedHistory = processedHistory.filter(item =>
        item.video_url.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.summary.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter
    if (filterType !== "all") {
      processedHistory = processedHistory.filter(item => item.scenario === filterType);
    }

    // Sort
    if (sortBy === "date") {
      processedHistory.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    } else if (sortBy === "title") {
      processedHistory.sort((a, b) => a.video_url.localeCompare(b.video_url));
    }

    return processedHistory;
  }, [history, searchQuery, filterType, sortBy]);

  useEffect(() => {
    const fetchHistory = async () => {
      setLoading(true);
      try {
        const response = await fetch('/api/history');

        // Если пользователь не авторизован, это не ошибка, а ожидаемое поведение.
        // Просто показываем пустую историю.
        if (response.status === 401) {
          setHistory([]);
          return;
        }

        if (!response.ok) {
          throw new Error(`Не удалось загрузить историю: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        if (data.error) {
            console.error("Ошибка API при загрузке истории:", data.error);
            setHistory([]);
        } else {
            setHistory(data.items || []);
        }
      } catch (error) {
        console.error("Сетевая ошибка при загрузке истории:", error);
        setHistory([]);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, []);

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/30 via-purple-50/20 to-pink-50/30 dark:from-blue-950/20 dark:via-purple-950/10 dark:to-pink-950/20" />

      <div className="relative z-10">
        <main className="container mx-auto px-4 py-8 max-w-6xl">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">История анализов</h1>
            <p className="text-gray-600 dark:text-gray-400">Все ваши саммари в одном месте.</p>
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
                    <SelectItem value="quick">Быстрый обзор</SelectItem>
                    <SelectItem value="deep">Глубокий анализ</SelectItem>
                    <SelectItem value="decision">Помощник в принятии решений</SelectItem>
                    <SelectItem value="audio">Бег и прослушивание</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-full md:w-48 h-10">
                    <Calendar className="h-4 w-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="date">Сортировать по дате</SelectItem>
                    <SelectItem value="title">Сортировать по названию</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Summary List */}
          <div className="space-y-4">
            {loading ? (
              <p>Загрузка истории...</p>
            ) : filteredHistory.length > 0 ? (
              filteredHistory.map((item) => (
                <Card key={item.id} className="shadow-lg border-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-2xl">
                  <CardContent className="p-6">
                    <a href={item.video_url} target="_blank" rel="noopener noreferrer" className="font-bold hover:underline break-all">{item.video_url}</a>
                    <p className="mt-2">{item.summary}</p>
                    <div className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                      <span>{new Date(item.created_at).toLocaleString()}</span> | <span>{item.scenario}</span> | <span>{item.lang}</span>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card className="shadow-lg border-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-2xl">
                  <CardContent className="p-6 text-center">
                      <p>Ничего не найдено. Попробуйте изменить параметры поиска или фильтрации.</p>
                  </CardContent>
              </Card>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
