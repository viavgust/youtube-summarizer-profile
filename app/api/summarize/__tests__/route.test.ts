import { POST } from "../route"
import { NextResponse } from "next/server"

// Мокируем fetch для изоляции тестов от внешних API
global.fetch = jest.fn()

describe("API Route /api/summarize", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Устанавливаем моки для переменных окружения
    process.env.RAPIDAPI_KEY = "mock_rapidapi_key"
    process.env.GEMINI_API_KEY = "mock_gemini_api_key"
  })

  // Тест 1: Некорректный URL
  test("should return 400 if URL is missing or invalid", async () => {
    const request = {
      json: async () => ({ url: "", scenario: "quick" }),
    } as Request

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe("Пожалуйста, введите корректную ссылку на YouTube видео.")
  })

  // Тест 2: Не удалось извлечь ID видео
  test("should return 400 if video ID cannot be extracted", async () => {
    const request = {
      json: async () => ({ url: "https://not-a-youtube-link.com", scenario: "quick" }),
    } as Request

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe("Не удалось извлечь ID видео из ссылки. Проверьте формат ссылки.")
  })

  // Тест 3: Отсутствует RapidAPI ключ
  test("should return 500 if RAPIDAPI_KEY is missing", async () => {
    delete process.env.RAPIDAPI_KEY // Удаляем ключ для этого теста

    const request = {
      json: async () => ({ url: "https://www.youtube.com/watch?v=testVideoId", scenario: "quick" }),
    } as Request

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe("Ошибка конфигурации сервера: RapidAPI ключ не найден.")
  })

  // Тест 4: Отсутствует Gemini API ключ
  test("should return 500 if GEMINI_API_KEY is missing", async () => {
    delete process.env.GEMINI_API_KEY // Удаляем ключ для этого теста

    const request = {
      json: async () => ({ url: "https://www.youtube.com/watch?v=testVideoId", scenario: "quick" }),
    } as Request

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe("Ошибка конфигурации сервера: Gemini API ключ не найден.")
  })

  // Тест 5: Ошибка RapidAPI
  test("should return RapidAPI error if fetch fails", async () => {
    ;(fetch as jest.Mock).mockImplementationOnce(() =>
      Promise.resolve(
        new Response(JSON.stringify({ message: "RapidAPI error" }), {
          status: 500,
          statusText: "Internal Server Error",
          headers: { "Content-Type": "application/json" },
        }),
      ),
    )

    const request = {
      json: async () => ({ url: "https://www.youtube.com/watch?v=testVideoId", scenario: "quick" }),
    } as Request

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe("Ошибка при получении транскрипта от RapidAPI. Возможно, видео недоступно или не имеет субтитров.")
  })

  // Тест 6: Транскрипт не найден
  test("should return 404 if transcript is not found", async () => {
    ;(fetch as jest.Mock).mockImplementationOnce(() =>
      Promise.resolve(
        new Response(JSON.stringify({ text: "" }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      ),
    )

    const request = {
      json: async () => ({ url: "https://www.youtube.com/watch?v=testVideoId", scenario: "quick" }),
    } as Request

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data.error).toBe("Транскрипт не найден для данного видео. Возможно, субтитры отсутствуют.")
  })

  // Тест 7: Успешное суммирование
  test("should return a summary on successful API calls", async () => {
    ;(fetch as jest.Mock)
      .mockImplementationOnce(() =>
        // Мок для RapidAPI
        Promise.resolve(
          new Response(JSON.stringify({ text: "Mock transcript of the YouTube video." }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          }),
        ),
      )
      .mockImplementationOnce(() =>
        // Мок для Gemini API
        Promise.resolve(
          new Response(
            JSON.stringify({
              candidates: [{ content: { parts: [{ text: "Mock summary point 1.\nMock summary point 2." }] } }],
            }),
            { status: 200, headers: { "Content-Type": "application/json" } },
          ),
        ),
      )

    const request = {
      json: async () => ({ url: "https://www.youtube.com/watch?v=testVideoId", scenario: "quick" }),
    } as Request

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.summary).toEqual([
      { id: "1", text: "Mock summary point 1." },
      { id: "2", text: "Mock summary point 2." },
    ])
    expect(fetch).toHaveBeenCalledTimes(2) // Проверяем, что оба API были вызваны
  })
})
