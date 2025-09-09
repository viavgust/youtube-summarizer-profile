import { NextResponse } from "next/server"

// Определение интерфейса для точек суммирования, чтобы избежать дублирования
interface SummaryPoint {
  id: string
  text: string
  timestamp?: string
}

async function fetchTimedText(videoId: string, langs: string[] = ["ru","en","ru-RU","en-US"]) {
  for (const lang of langs) {
    const urls = [
      `https://video.google.com/timedtext?lang=${lang}&v=${videoId}`,
      `https://video.google.com/timedtext?lang=${lang}&kind=asr&v=${videoId}`
    ];
    for (const url of urls) {
      const r = await fetch(url);
      if (!r.ok) continue;
      const xml = await r.text();
      const text = xml.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
      if (text) return text;
    }
  }
  return null;
}

function extractTextFromArray(arr: any[]): string | null {
  if (!Array.isArray(arr)) return null;
  const texts = arr.map((item: any) => {
    if (typeof item === "string" && item.trim()) {
      return item.trim();
    }
    if (typeof item?.text === "string" && item.text.trim()) {
      return item.text.trim();
    }
    if (typeof item?.content === "string" && item.content.trim()) {
      return item.content.trim();
    }
    if (typeof item?.caption === "string" && item.caption.trim()) {
      return item.caption.trim();
    }
    if (typeof item?.subtitle === "string" && item.subtitle.trim()) {
      return item.subtitle.trim();
    }
    return "";
  }).filter(Boolean); // Удаляем пустые строки
  const joinedText = texts.join(" ");
  return joinedText.trim() || null; // Возвращаем null, если объединенный текст пуст
}

function pickTranscript(data: any): string | null {
  if (!data) return null;

  // Попытка прямого извлечения текста из известных полей
  const direct =
    data?.text ??
    data?.transcript ??
    data?.captions ??
    data?.subtitle ??
    data?.data?.text ??
    data?.result?.text;
  if (typeof direct === "string" && direct.trim()) return direct;

  // Если data - это массив, пытаемся объединить поля 'text' из его элементов
  const fromArray = extractTextFromArray(data);
  if (fromArray) return fromArray;

  // Если data содержит поле 'data', которое является массивом, ищем 'text' в его элементах
  const fromDataItems = extractTextFromArray(data?.data?.items);
  if (fromDataItems) return fromDataItems;

  // Дополнительная попытка: если data - объект, который содержит массив,
  // и этот массив содержит объекты с полем 'text'
  for (const key in data) {
    if (Object.prototype.hasOwnProperty.call(data, key)) {
      const value = data[key];
      const fromNestedArray = extractTextFromArray(value);
      if (fromNestedArray) return fromNestedArray;
    }
  }

  return null;
}

function extractYouTubeId(input: string): string | null {
  const s = input.trim();
  if (/^[a-zA-Z0-9_-]{11}$/.test(s)) return s;
  try {
    const u = new URL(s);
    if (u.hostname.includes("youtu.be")) {
      const id = u.pathname.split("/").filter(Boolean)[0];
      if (/^[a-zA-Z0-9_-]{11}$/.test(id)) return id;
    }
    const v = u.searchParams.get("v");
    if (v && /^[a-zA-Z0-9_-]{11}$/.test(v)) return v;
    if (u.pathname.startsWith("/shorts/")) {
      const id = u.pathname.split("/")[2];
      if (id && /^[a-zA-Z0-9_-]{11}$/.test(id)) return id;
    }
  } catch {}
  return null;
}

export async function POST(request: Request) {
  let diagnostics: any = {
    source: "none",
    langTried: [],
    lengths: { rapid: null, timed: null },
    errors: [],
    actualTranscriptLang: null
  };

  const requestBody = await request.json();
  const { searchParams } = new URL(request.url);
  const debugMode = searchParams.get("debug") === "1" || requestBody.debug === 1;

  try {
    const { url, scenario, lang = "ru" } = requestBody;

    if (!url || typeof url !== "string") {
      const errorMsg = "Ошибка: Некорректный URL в запросе.";
      console.error(errorMsg);
      diagnostics.errors.push(errorMsg);
      return NextResponse.json({ error: "Пожалуйста, введите корректную ссылку на YouTube видео.", ...(debugMode && { diagnostics }) }, { status: 400 });
    }

    console.log(`Получен запрос на суммирование для URL: ${url}, сценарий: ${scenario}, язык: ${lang}`)

    // Извлечение videoId из YouTube URL
    const videoId = extractYouTubeId(url);

    if (!videoId) {
      const errorMsg = `Ошибка: Не удалось извлечь ID видео из URL: ${url}`;
      console.error(errorMsg);
      diagnostics.errors.push(errorMsg);
      return NextResponse.json({ error: "Не удалось извлечь ID видео из ссылки. Проверьте формат ссылки.", ...(debugMode && { diagnostics }) }, { status: 400 });
    }
    diagnostics.videoId = videoId;

    // Получение ключей API из переменных окружения
    const rapidApiKey = process.env.RAPIDAPI_KEY
    const geminiApiKey = process.env.GEMINI_API_KEY

    if (!rapidApiKey) {
      const errorMsg = "Ошибка конфигурации: RAPIDAPI_KEY не установлен в переменных окружения.";
      console.error(errorMsg);
      diagnostics.errors.push(errorMsg);
      return NextResponse.json({ error: "Ошибка конфигурации сервера: RapidAPI ключ не найден.", ...(debugMode && { diagnostics }) }, { status: 500 });
    }
    if (!geminiApiKey) {
      const errorMsg = "Ошибка конфигурации: GEMINI_API_KEY не установлен в переменных окружения.";
      console.error(errorMsg);
      diagnostics.errors.push(errorMsg);
      return NextResponse.json({ error: "Ошибка конфигурации сервера: Gemini API ключ не найден.", ...(debugMode && { diagnostics }) }, { status: 500 });
    }

    // Шаг 1: Вызов RapidAPI для получения транскрипта
    const rapidApiUrl = `https://youtube-captions-transcript-subtitles-video-combiner.p.rapidapi.com/download-all/${videoId}?format_subtitle=srt&format_answer=json&lang=${lang}`
    const rapidApiHeaders = {
      "x-rapidapi-host": "youtube-captions-transcript-subtitles-video-combiner.p.rapidapi.com",
      "x-rapidapi-key": rapidApiKey,
      "Accept": "application/json"
    }

    console.log(`Вызов RapidAPI для videoId: ${videoId} с языком: ${lang}`);
    diagnostics.langTried.push(lang);
    const rapidApiResponse = await fetch(rapidApiUrl, { headers: rapidApiHeaders });

    if (!rapidApiResponse.ok) {
      const errorText = await rapidApiResponse.text();
      const errorMsg = `Ошибка RapidAPI (${rapidApiResponse.status}): ${rapidApiResponse.statusText}. Ответ: ${errorText}`;
      console.error(errorMsg);
      diagnostics.errors.push(errorMsg);
      diagnostics.rapidApiResponseStatus = rapidApiResponse.status;
      diagnostics.rapidApiUrl = rapidApiUrl;
      // Не возвращаем ошибку здесь, чтобы дать шанс fallback'у
    }

    let rapidApiData: any = null;
    try { rapidApiData = await rapidApiResponse.json(); } catch (e: any) {
      diagnostics.errors.push(`Ошибка парсинга RapidAPI JSON: ${e.message || e}`);
    }
    if (rapidApiData) {
      diagnostics.rapidApiRawData = {
        isArray: Array.isArray(rapidApiData),
        typeOf: typeof rapidApiData,
        keys: Object.keys(rapidApiData || {})
      };
      if (debugMode) {
        console.log("RapidAPI Raw Data (initial):", JSON.stringify(diagnostics.rapidApiRawData, null, 2));
        // if (Array.isArray(rapidApiData) && rapidApiData.length > 0) {
        //   console.log("First RapidAPI item (initial):", JSON.stringify(rapidApiData[0], null, 2));
        // }
      }
    }
    let transcript: string | null = pickTranscript(rapidApiData);
    diagnostics.pickTranscriptRapidRawResult = transcript; // Добавляем сырой результат pickTranscript
    diagnostics.pickTranscriptRapidLength = transcript ? transcript.length : null;
    diagnostics.lengths.rapid = transcript ? transcript.length : null;
    if (transcript) {
      diagnostics.source = "rapidapi";
      diagnostics.actualTranscriptLang = lang; // Устанавливаем язык, если транскрипт найден
    }

    // если пусто — повторный запрос с lang=en
    if (transcript === null || transcript.trim().length === 0) {
      console.log(`Транскрипт не найден для языка ${lang}, попытка с lang=en для videoId: ${videoId}`);
      diagnostics.langTried.push("en");
      const base = "https://youtube-captions-transcript-subtitles-video-combiner.p.rapidapi.com";
      const retryUrl = `${base}/download-all/${videoId}?format_subtitle=srt&format_answer=json&lang=en`;
      const retryRes = await fetch(retryUrl, { headers: {
        "X-RapidAPI-Host": "youtube-captions-transcript-subtitles-video-combiner.p.rapidapi.com",
        "X-RapidAPI-Key": process.env.RAPIDAPI_KEY as string,
        "Accept": "application/json"
      }});
      if (!retryRes.ok) {
        const errorText = await retryRes.text();
        const errorMsg = `Ошибка RapidAPI (retry lang=en) (${retryRes.status}): ${retryRes.statusText}. Ответ: ${errorText}`;
        console.error(errorMsg);
        diagnostics.errors.push(errorMsg);
        diagnostics.rapidApiRetryResponseStatus = retryRes.status;
        diagnostics.rapidApiRetryUrl = retryUrl;
      }

      if (retryRes.ok) {
        let j2:any = null; try { j2 = await retryRes.json(); } catch (e: any) {
          diagnostics.errors.push(`Ошибка парсинга RapidAPI (retry lang=en) JSON: ${e.message || e}`);
        }
        if (j2) {
          diagnostics.rapidApiRetryRawData = {
            isArray: Array.isArray(j2),
            typeOf: typeof j2,
            keys: Object.keys(j2 || {})
          };
          if (debugMode) {
            console.log("RapidAPI Raw Data (retry):", JSON.stringify(diagnostics.rapidApiRetryRawData, null, 2));
            // if (Array.isArray(j2) && j2.length > 0) {
            //   console.log("First RapidAPI item (retry):", JSON.stringify(j2[0], null, 2));
            // }
          }
        }
        transcript = pickTranscript(j2);
        diagnostics.pickTranscriptRapidRetryRawResult = transcript; // Добавляем сырой результат pickTranscript
        diagnostics.pickTranscriptRapidRetryLength = transcript ? transcript.length : null;
        diagnostics.lengths.rapid = transcript ? transcript.length : null; // Обновляем общую длину rapid
        if (transcript && transcript.trim()) {
          console.log(`Транскрипт успешно получен с lang=en (первые 100 символов): ${transcript.substring(0, 100)}...`);
          diagnostics.source = "rapidapi";
          diagnostics.actualTranscriptLang = "en"; // Устанавливаем язык, если транскрипт найден
        }
      }
    }

    // Резервный вариант: получение субтитров напрямую из YouTube timedtext
    if (transcript === null || transcript.trim().length === 0) {
      console.log(`Вызов fetchTimedText для videoId: ${videoId}`);
      diagnostics.timedTextCalled = true;
      const fallback = await fetchTimedText(videoId);
      diagnostics.pickTranscriptTimedTextRawResult = fallback; // Добавляем сырой результат fetchTimedText
      diagnostics.lengths.timed = fallback ? fallback.length : null;
      if (fallback && fallback.trim()) {
        transcript = fallback;
        diagnostics.source = "timedtext";
        diagnostics.actualTranscriptLang = "en"; // Предполагаем английский, если из timedtext
        console.log(`Транскрипт успешно получен из YouTube timedtext (первые 100 символов): ${transcript.substring(0, 100)}...`);
      }
    }

    // Проверяем, что транскрипт не null и не пуст после всех попыток получения
    if (transcript === null || transcript.trim().length === 0) {
      const warnMsg = `Транскрипт не найден или пуст для videoId: ${videoId} после всех попыток.`;
      console.warn(warnMsg);
      diagnostics.errors.push(warnMsg);
      return NextResponse.json(
        { error: "Транскрипт не найден у провайдера. Попробуйте другой ролик или язык en.", ...(debugMode && { diagnostics }) },
        { status: 404 }
      );
    }
    console.log(`Транскрипт успешно получен (длина: ${transcript.length}, первые 100 символов): ${transcript.substring(0, 100)}...`);

    // Проверка длины транскрипта для Gemini API и усечение при необходимости
    const MAX_GEMINI_TOKENS = 1048575; // Максимальное количество токенов для Gemini API
    // Приблизительное соотношение: 1 токен ~ 4 символа. Для безопасности, используем 1:1
    const MAX_GEMINI_CHARS = MAX_GEMINI_TOKENS;

    if (transcript.length > MAX_GEMINI_CHARS) {
      console.warn(`Транскрипт слишком длинный (${transcript.length} символов) для Gemini API. Усечение до ${MAX_GEMINI_CHARS} символов.`);
      diagnostics.originalTranscriptLength = transcript.length;
      transcript = transcript.substring(0, MAX_GEMINI_CHARS);
      diagnostics.truncatedTranscriptLength = transcript.length;
      diagnostics.errors.push(`Транскрипт усечен до ${MAX_GEMINI_CHARS} символов для Gemini API.`);
    }
    diagnostics.sentToGeminiLength = transcript.length; // Логируем длину транскрипта, отправленного в Gemini
    diagnostics.pickTranscriptFinalLength = transcript.length; // Добавляем окончательную длину транскрипта

    // Шаг 2: Вызов Gemini API для суммаризации
    const geminiApiUrl = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent"
    const geminiApiHeaders = {
      "Content-Type": "application/json", // Исправлена ошибка: ' на "
      "X-goog-api-key": geminiApiKey,
    }

    const targetLanguagePhrase = diagnostics.actualTranscriptLang === "en" ? "на английском языке" : "на русском языке";

    // Формирование промпта для Gemini API в зависимости от сценария
    let prompt = ""
    switch (scenario) {
      case "quick":
        prompt = `Суммируй следующий текст видео ${targetLanguagePhrase} в 5-8 ключевых буллетов: ${transcript}`
        break
      case "deep":
        prompt = `Проведи глубокий анализ следующего текста видео ${targetLanguagePhrase}. Выдели скрытые инсайты, контраргументы, потенциальные риски, когнитивные смещения, определи целевую аудиторию и предложи 3 конкретных шага для применения знаний: ${transcript}`
        break
      case "decision":
        prompt = `Проанализируй следующий текст видео ${targetLanguagePhrase} и дай четкий вердикт (Да/Сомнительно/Нет) стоит ли его смотреть. Обоснуй свой вердикт, проанализируй соотношение ценности к длительности и определи подходящую аудиторию для этого контента: ${transcript}`
        break
      case "audio":
        prompt = `Суммируй следующий текст видео ${targetLanguagePhrase} в 5 сверхкоротких ключевых пунктов в формате для прослушивания и предложи 1-2 запоминающиеся "мантры дня" для мотивации и закрепления идей: ${transcript}`
        break
      default:
        prompt = `Суммируй следующий текст видео ${targetLanguagePhrase}: ${transcript}`
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
      const warnMsg = "Не удалось получить суммированный текст от Gemini API или он пуст.";
      console.warn(warnMsg);
      diagnostics.errors.push(warnMsg);
      return NextResponse.json({ error: "Не удалось получить суммированный текст от Gemini API.", ...(debugMode && { diagnostics }) }, { status: 500 });
    }
    console.log(`Суммирование успешно получено (первые 100 символов): ${summarizedText.substring(0, 100)}...`);

    // Преобразование суммированного текста в формат SummaryPoint[]
    // Разбиваем по абзацам или предложениям, чтобы получить отдельные пункты.
    const summaryPoints: SummaryPoint[] = summarizedText.split("\n").filter(Boolean).map((text: string, index: number) => ({
      id: String(index + 1),
      text: text.trim(),
    }))

    return NextResponse.json({ summary: summaryPoints, ...(debugMode && { diagnostics }) });
  } catch (error: any) {
    const errorMsg = `Критическая ошибка в API-маршруте /api/summarize: ${error.message || error}`;
    console.error(errorMsg, error);
    diagnostics.errors.push(errorMsg);
    return NextResponse.json({ error: "Внутренняя ошибка сервера. Пожалуйста, попробуйте позже.", ...(debugMode && { diagnostics }) }, { status: 500 });
  }
}
