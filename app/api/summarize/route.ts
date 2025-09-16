import { NextResponse } from "next/server"
import { createServer } from "@/lib/supabase/server"

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
    const { url, scenario, lang: receivedLang = "ru" } = requestBody;
    const targetLang = receivedLang === "en" ? "en" : "ru"; // Нормализация языка

    if (debugMode) {
      diagnostics.receivedLang = receivedLang;
      diagnostics.targetLang = targetLang;
    }

    if (!url || typeof url !== "string") {
      const errorMsg = "Ошибка: Некорректный URL в запросе.";
      console.error(errorMsg);
      diagnostics.errors.push(errorMsg);
      return NextResponse.json({ error: "Пожалуйста, введите корректную ссылку на YouTube видео.", ...(debugMode && { diagnostics }) }, { status: 400 });
    }

    console.log(`Получен запрос на суммирование для URL: ${url}, сценарий: ${scenario}, язык: ${receivedLang}`)

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
    const rapidApiKey = process.env.RAPIDAPI_KEY;
    const rapidApiHost = process.env.RAPIDAPI_HOST;
    const geminiApiKey = process.env.GEMINI_API_KEY;

    if (!rapidApiKey || !rapidApiHost) {
      const errorMsg = "Ошибка конфигурации: RAPIDAPI_KEY или RAPIDAPI_HOST не установлены.";
      console.error("[RapidAPI] missing env", errorMsg);
      diagnostics.errors.push(errorMsg);
      return NextResponse.json({ error: "Ошибка конфигурации сервера: RapidAPI ключ или хост не найден.", ...(debugMode && { diagnostics }) }, { status: 500 });
    }
    if (!geminiApiKey) {
      const errorMsg = "Ошибка конфигурации: GEMINI_API_KEY не установлен.";
      console.error(errorMsg);
      diagnostics.errors.push(errorMsg);
      return NextResponse.json({ error: "Ошибка конфигурации сервера: Gemini API ключ не найден.", ...(debugMode && { diagnostics }) }, { status: 500 });
    }

    let rapidApiData: any = null;
    let transcript: string | null = null;

    // --- RapidAPI transcript fetch (fixed) ---
    const base = `https://${rapidApiHost}`;
    const rapidApiHeaders = {
      "X-RapidAPI-Host": rapidApiHost,
      "X-RapidAPI-Key": rapidApiKey,
      "Accept": "application/json",
    };

    const rapidapiUrl = `${base}/download-json/${videoId}?language=${receivedLang}`;
    const fetchOptions = { headers: rapidApiHeaders };
    
    console.log("[RapidAPI] Sending request:", JSON.stringify({ url: rapidapiUrl, options: fetchOptions }, null, 2));

    const rapidApiResponse = await fetch(rapidapiUrl, fetchOptions);

    const responseHeaders: Record<string, string> = {};
    rapidApiResponse.headers.forEach((value, key) => {
      responseHeaders[key] = value;
    });

    console.log("[RapidAPI] Received response:", JSON.stringify({
      status: rapidApiResponse.status,
      statusText: rapidApiResponse.statusText,
      headers: responseHeaders
    }, null, 2));

    if (!rapidApiResponse.ok) {
      const errTxt = await rapidApiResponse.text().catch(() => "");
      console.warn("[RapidAPI] first try failed:", rapidApiResponse.status, rapidApiResponse.statusText, errTxt?.slice(0, 300));

      // retry with fallback language EN
      const retryUrl = `${base}/download-json/${videoId}?language=en`;
      console.log("[RapidAPI] retry url:", retryUrl);

      const retryRes = await fetch(retryUrl, { headers: rapidApiHeaders });

      if (!retryRes.ok) {
        const rTxt = await retryRes.text().catch(() => "");
        console.warn("[RapidAPI] retry failed:", retryRes.status, retryRes.statusText, rTxt?.slice(0, 300));
        diagnostics.errors.push(`RapidAPI failed: ${rapidApiResponse.status}/${retryRes.status}`);
        diagnostics.rapidApiResponseStatus = `${rapidApiResponse.status} -> ${retryRes.status}`;
      } else {
        const j2 = await retryRes.json().catch((e:any)=>{ console.error("parse retry json", e); return null; });
        rapidApiData = j2;
      }
    } else {
      const j1 = await rapidApiResponse.json().catch((e:any)=>{ console.error("parse json", e); return null; });
      rapidApiData = j1;
    }
    // --- end RapidAPI block ---

    transcript = pickTranscript(rapidApiData);
    diagnostics.pickTranscriptRapidRawResult = transcript; // Добавляем сырой результат pickTranscript
    diagnostics.pickTranscriptRapidLength = transcript ? transcript.length : null;
    diagnostics.lengths.rapid = transcript ? transcript.length : null;
    if (transcript) {
      diagnostics.source = "rapidapi";
      diagnostics.actualTranscriptLang = receivedLang; // Устанавливаем язык, если транскрипт найден
    }

    if (transcript) {
      diagnostics.source = "rapidapi";
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

    // Гарантируем, что промпт содержит жесткую директиву языка
    const languageDirective = targetLang === "en" ? "English" : "Russian";
    const promptPrefix = `Ответ дай на ${languageDirective}. Без Markdown и лишних кавычек.`;

    // Формирование промпта для Gemini API в зависимости от сценария
    let prompt = ""
    switch (scenario) {
      case "quick":
        prompt = `${promptPrefix} Суммируй следующий текст видео в 5-8 ключевых буллетов: ${transcript}`
        break
      case "deep":
        prompt = `${promptPrefix} Проведи глубокий анализ следующего текста видео. Выдели скрытые инсайты, контраргументы, потенциальные риски, когнитивные смещения, определи целевую аудиторию и предложи 3 конкретных шага для применения знаний: ${transcript}`
        break
      case "decision":
        prompt = `${promptPrefix} Проанализируй следующий текст видео и дай четкий вердикт (Да/Сомнительно/Нет) стоит ли его смотреть. Обоснуй свой вердикт, проанализируй соотношение ценности к длительности и определи подходящую аудиторию для этого контента: ${transcript}`
        break
      case "audio":
        prompt = `${promptPrefix} Суммируй следующий текст видео в 5 сверхкоротких ключевых пунктов в формате для прослушивания и предложи 1-2 запоминающиеся "мантры дня" для мотивации и закрепления идей: ${transcript}`
        break
      default:
        prompt = `${promptPrefix} Суммируй следующий текст видео: ${transcript}`
    }

    if (debugMode) {
      diagnostics.promptFirstLine = prompt.split('\n')[0];
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
    let summarizedText = geminiApiData.candidates[0]?.content?.parts[0]?.text;

    if (!summarizedText || summarizedText.trim() === "") {
      const warnMsg = "Не удалось получить суммированный текст от Gemini API или он пуст.";
      console.warn(warnMsg);
      diagnostics.errors.push(warnMsg);
      return NextResponse.json({ error: "Не удалось получить суммированный текст от Gemini API.", ...(debugMode && { diagnostics }) }, { status: 500 });
    }

    if (debugMode) {
      diagnostics.modelResponseFirst100Chars = summarizedText.substring(0, 100);
      // Грубая эвристика для определения языка
      const isCyrillic = /[а-яА-ЯЁё]/.test(summarizedText);
      const isLatin = /[a-zA-Z]/.test(summarizedText);
      if (isCyrillic && !isLatin) {
        diagnostics.finalLangGuess = "ru";
      } else if (isLatin && !isCyrillic) {
        diagnostics.finalLangGuess = "en";
      } else if (isCyrillic && isLatin) {
        diagnostics.finalLangGuess = "mixed";
      } else {
        diagnostics.finalLangGuess = "unknown";
      }
    }

    console.log(`Суммирование успешно получено (первые 100 символов): ${summarizedText.substring(0, 100)}...`);

    // Мягкий фолбэк: если язык ответа не совпал с targetLang
    if (debugMode && diagnostics.finalLangGuess !== "unknown" && diagnostics.finalLangGuess !== targetLang) {
      console.warn(`Язык ответа модели (${diagnostics.finalLangGuess}) не совпал с целевым языком (${targetLang}). Выполняем фолбэк-перевод.`);
      diagnostics.fallbackTriggered = true;

      const fallbackPrompt = `Переведи следующий текст на ${languageDirective} без Markdown и лишних кавычек: ${summarizedText}`;
      const fallbackApiBody = {
        contents: [
          {
            parts: [
              {
                text: fallbackPrompt,
              },
            ],
          },
        ],
      };

      const fallbackApiResponse = await fetch(geminiApiUrl, {
        method: "POST",
        headers: geminiApiHeaders,
        body: JSON.stringify(fallbackApiBody),
      });

      if (fallbackApiResponse.ok) {
        const fallbackApiData = await fallbackApiResponse.json();
        const translatedText = fallbackApiData.candidates[0]?.content?.parts[0]?.text;
        if (translatedText && translatedText.trim() !== "") {
          summarizedText = translatedText;
          diagnostics.fallbackTranslatedTextFirst100Chars = translatedText.substring(0, 100);
          // Повторная эвристика для переведенного текста
          const isCyrillicFallback = /[а-яА-ЯЁё]/.test(translatedText);
          const isLatinFallback = /[a-zA-Z]/.test(translatedText);
          if (isCyrillicFallback && !isLatinFallback) {
            diagnostics.finalLangGuessAfterFallback = "ru";
          } else if (isLatinFallback && !isCyrillicFallback) {
            diagnostics.finalLangGuessAfterFallback = "en";
          } else if (isCyrillicFallback && isLatinFallback) {
            diagnostics.finalLangGuessAfterFallback = "mixed";
          } else {
            diagnostics.finalLangGuessAfterFallback = "unknown";
          }
          console.log(`Фолбэк-перевод успешно получен (первые 100 символов): ${summarizedText.substring(0, 100)}...`);
        } else {
          diagnostics.errors.push("Фолбэк-перевод не дал результата.");
        }
      } else {
        const fallbackErrorData = await fallbackApiResponse.json();
        diagnostics.errors.push(`Ошибка фолбэк-перевода Gemini API (${fallbackApiResponse.status}): ${fallbackApiResponse.statusText}. Детали: ${JSON.stringify(fallbackErrorData)}`);
      }
    }

    // Очистка текста от Markdown-символов
    const cleanedText = summarizedText.replace(/[*_~`]/g, '');

    // Преобразование суммированного текста в формат SummaryPoint[]
    // Разбиваем по абзацам или предложениям, чтобы получить отдельные пункты.
    const summaryPoints: SummaryPoint[] = cleanedText.split("\n").filter(Boolean).map((text: string, index: number) => ({
      id: String(index + 1),
      text: text.trim(),
    }))

    // Сохранение истории в Supabase
    let dbError = null;
    try {
      const supabase = await createServer()
      const { data: { user } } = await supabase.auth.getUser()

      if (user && cleanedText?.trim()) {
        // user_id будет добавлен автоматически триггером в базе данных
        const { error } = await supabase.from("summaries").insert({
          video_id: videoId,
          video_url: url,
          lang: targetLang,
          summary: cleanedText,
          scenario: scenario,
        });
        if (error) {
          throw error;
        }
      }
    } catch (error: any) {
      console.error("Ошибка при работе с Supabase для сохранения истории:", error)
      dbError = error.message;
    }

    return NextResponse.json({ summary: summaryPoints, dbError, ...(debugMode && { diagnostics }) });
  } catch (error: any) {
    const errorMsg = `Критическая ошибка в API-маршруте /api/summarize: ${error.message || error}`;
    console.error(errorMsg, error);
    diagnostics.errors.push(errorMsg);
    return NextResponse.json({ error: "Внутренняя ошибка сервера. Пожалуйста, попробуйте позже.", ...(debugMode && { diagnostics }) }, { status: 500 });
  }
}
