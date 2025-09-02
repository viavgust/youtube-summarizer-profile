import { NextResponse } from "next/server"

// Определение интерфейса для точек суммирования, чтобы избежать дублирования
interface SummaryPoint {
  id: string
  text: string
  timestamp?: string
}

export async function POST(request: Request) {
  try {
    const { url, scenario } = await request.json()

    if (!url || typeof url !== "string") {
      console.error("Ошибка: Некорректный URL в запросе.")
      return NextResponse.json({ error: "Пожалуйста, введите корректную ссылку на YouTube видео." }, { status: 400 })
    }

    console.log(`Получен запрос на суммирование для URL: ${url}, сценарий: ${scenario}`)

    // Извлечение videoId из YouTube URL
    const videoIdMatch = url.match(/(?:v=|\/)([a-zA-Z0-9_-]{11})(?:&|\?|$)/)
    const videoId = videoIdMatch ? videoIdMatch[1] : null

    if (!videoId) {
      console.error(`Ошибка: Не удалось извлечь ID видео из URL: ${url}`)
      return NextResponse.json({ error: "Не удалось извлечь ID видео из ссылки. Проверьте формат ссылки." }, { status: 400 })
    }

    // Получение ключей API из переменных окружения
    const rapidApiKey = process.env.RAPIDAPI_KEY
    const geminiApiKey = process.env.GEMINI_API_KEY

    if (!rapidApiKey) {
      console.error("Ошибка конфигурации: RAPIDAPI_KEY не установлен в переменных окружения.")
      return NextResponse.json({ error: "Ошибка конфигурации сервера: RapidAPI ключ не найден." }, { status: 500 })
    }
    if (!geminiApiKey) {
      console.error("Ошибка конфигурации: GEMINI_API_KEY не установлен в переменных окружения.")
      return NextResponse.json({ error: "Ошибка конфигурации сервера: Gemini API ключ не найден." }, { status: 500 })
    }

    // Шаг 1: Вызов RapidAPI для получения транскрипта
    const rapidApiUrl = `https://youtube-captions-transcript-subtitles-video-combiner.p.rapidapi.com/download-all/${videoId}?format_subtitle=srt&format_answer=json`
    const rapidApiHeaders = {
      "x-rapidapi-host": "youtube-captions-transcript-subtitles-video-combiner.p.rapidapi.com",
      "x-rapidapi-key": rapidApiKey,
    }

    console.log(`Вызов RapidAPI для videoId: ${videoId}`)
    const rapidApiResponse = await fetch(rapidApiUrl, { headers: rapidApiHeaders })

    if (!rapidApiResponse.ok) {
      const errorText = await rapidApiResponse.text()
      console.error(`Ошибка RapidAPI (${rapidApiResponse.status}): ${rapidApiResponse.statusText}. Ответ: ${errorText}`)
      return NextResponse.json({ error: "Ошибка при получении транскрипта от RapidAPI. Возможно, видео недоступно или не имеет субтитров." }, { status: rapidApiResponse.status })
    }

    const rapidApiData = await rapidApiResponse.json()
    const transcript = rapidApiData.text // Предполагаем, что транскрипт находится в поле 'text'

    if (!transcript || transcript.trim() === "") {
      console.warn(`Транскрипт не найден или пуст для videoId: ${videoId}`)
      return NextResponse.json({ error: "Транскрипт не найден для данного видео. Возможно, субтитры отсутствуют." }, { status: 404 })
    }
    console.log(`Транскрипт успешно получен (первые 100 символов): ${transcript.substring(0, 100)}...`)

    // Шаг 2: Вызов Gemini API для суммаризации
    const geminiApiUrl = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent"
    const geminiApiHeaders = {
      "Content-Type": "application/json", // Исправлена ошибка: ' на "
      "X-goog-api-key": geminiApiKey,
    }

    // Формирование промпта для Gemini API в зависимости от сценария
    let prompt = ""
    switch (scenario) {
      case "quick":
        prompt = `Суммируй следующий текст видео на русском языке в 5-8 ключевых буллетов: ${transcript}`
        break
      case "deep":
        prompt = `Проведи глубокий анализ следующего текста видео на русском языке. Выдели скрытые инсайты, контраргументы, потенциальные риски, когнитивные смещения, определи целевую аудиторию и предложи 3 конкретных шага для применения знаний: ${transcript}`
        break
      case "decision":
        prompt = `Проанализируй следующий текст видео на русском языке и дай четкий вердикт (Да/Сомнительно/Нет) стоит ли его смотреть. Обоснуй свой вердикт, проанализируй соотношение ценности к длительности и определи подходящую аудиторию для этого контента: ${transcript}`
        break
      case "audio":
        prompt = `Суммируй следующий текст видео на русском языке в 5 сверхкоротких ключевых пунктов в формате для прослушивания и предложи 1-2 запоминающиеся "мантры дня" для мотивации и закрепления идей: ${transcript}`
        break
      default:
        prompt = `Суммируй следующий текст видео на русском языке: ${transcript}`
    }

    const geminiApiBody = {
      contents: [
        {
          parts: [
            {
              text: prompt,
            },
          ],
        },
      ],
    }

    console.log("Вызов Gemini API для суммаризации...")
    const geminiApiResponse = await fetch(geminiApiUrl, {
      method: "POST",
      headers: geminiApiHeaders,
      body: JSON.stringify(geminiApiBody),
    })

    if (!geminiApiResponse.ok) {
      const errorData = await geminiApiResponse.json()
      console.error(`Ошибка Gemini API (${geminiApiResponse.status}): ${geminiApiResponse.statusText}. Детали:`, errorData)
      return NextResponse.json({ error: "Ошибка при суммаризации от Gemini API." }, { status: geminiApiResponse.status })
    }

    const geminiApiData = await geminiApiResponse.json()
    const summarizedText = geminiApiData.candidates[0]?.content?.parts[0]?.text

    if (!summarizedText || summarizedText.trim() === "") {
      console.warn("Не удалось получить суммированный текст от Gemini API или он пуст.")
      return NextResponse.json({ error: "Не удалось получить суммированный текст от Gemini API." }, { status: 500 })
    }
    console.log(`Суммирование успешно получено (первые 100 символов): ${summarizedText.substring(0, 100)}...`)

    // Преобразование суммированного текста в формат SummaryPoint[]
    // Разбиваем по абзацам или предложениям, чтобы получить отдельные пункты.
    const summaryPoints: SummaryPoint[] = summarizedText.split("\n").filter(Boolean).map((text: string, index: number) => ({
      id: String(index + 1),
      text: text.trim(),
    }))

    return NextResponse.json({ summary: summaryPoints })
  } catch (error) {
    console.error("Критическая ошибка в API-маршруте /api/summarize:", error)
    return NextResponse.json({ error: "Внутренняя ошибка сервера. Пожалуйста, попробуйте позже." }, { status: 500 })
  }
}
