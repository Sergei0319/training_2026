/**
 * Валидация операции в редакторе (экзамен 2.1): подписи, путь, хост, тело, query.
 * Ошибки привязаны к ключам полей, не к одному общему сообщению.
 */
import type { SavedMethod } from '../methods/types'

/** Разрешённые HTTP-глаголы в редакторе операции. */
const HTTP = new Set(['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD'])
/** Хосты API, которые умеет клиент (без произвольных URL — безопасность и прокси). */
const HOSTS = new Set(['doki.online', 'okidoki.ru'])
/** Путь как pathname RFC 3986: начинается с «/», без пробелов и фрагментов. */
const PATH_RE = /^\/[A-Za-z0-9._~!$&'()*+,;=:@%/-]*$/

/**
 * Карта ошибок полей редактора операции.
 * Ключ есть только если поле не прошло проверку.
 */
export type MethodFieldErrors = Partial<
  Record<'buttonLabel' | 'name' | 'path' | 'method' | 'body' | 'query' | 'apiHost', string>
>

/**
 * Проверяет SavedMethod перед сохранением/запуском.
 * Тело с `{{плейсхолдерами}}` сначала подменяется на JSON-null, иначе JSON.parse падает на шаблоне.
 */
export function validateSavedMethod(method: SavedMethod): MethodFieldErrors {
  const errors: MethodFieldErrors = {}
  const buttonLabel = method.buttonLabel.trim()
  const name = method.name.trim()

  if (!buttonLabel) {
    errors.buttonLabel = 'Поле «Текст на кнопке» неверно: укажите текст кнопки'
  } else if (buttonLabel.length > 80) {
    errors.buttonLabel = 'Поле «Текст на кнопке» неверно: не больше 80 символов'
  }

  if (!name) {
    errors.name = 'Поле «Внутреннее название» неверно: заполните название'
  } else if (name.length > 80) {
    errors.name = 'Поле «Внутреннее название» неверно: не больше 80 символов'
  }

  const methodHttp = method.method.trim().toUpperCase()
  if (!HTTP.has(methodHttp)) {
    errors.method = 'Поле «HTTP» неверно: выберите метод из списка'
  }

  if (!HOSTS.has(method.apiHost)) {
    errors.apiHost = 'Поле «Хост» неверно: выберите api.doki.online или api.okidoki.ru'
  }

  const path = method.path.trim()
  if (!path) {
    errors.path = 'Поле «Путь» неверно: укажите путь запроса'
  } else if (!path.startsWith('/')) {
    errors.path = 'Поле «Путь» неверно: путь должен начинаться с «/»'
  } else if (/\s/.test(path)) {
    errors.path = 'Поле «Путь» неверно: уберите пробелы'
  } else if (path.includes('?') || path.includes('#')) {
    errors.path = 'Поле «Путь» неверно: query и якорь задаются отдельно, без «?» и «#»'
  } else if (!PATH_RE.test(path)) {
    errors.path = 'Поле «Путь» неверно: недопустимые символы'
  }

  const body = method.body?.trim()
  if (body) {
    // Плейсхолдеры не валидный JSON — временно заменяем, чтобы проверить структуру объекта.
    const normalized = body.replace(/\{\{[^}]+\}\}/g, 'null')
    try {
      JSON.parse(normalized)
    } catch {
      errors.body = 'Поле «Тело» неверно: укажите корректный JSON'
    }
  }

  const badQuery = method.query.findIndex((row) => row.value.trim() && !row.key.trim())
  if (badQuery >= 0) {
    errors.query = `Поле «Query-параметры» неверно: у строки ${badQuery + 1} нет ключа`
  }

  return errors
}

/**
 * Первая ошибка в порядке полей формы — удобно показать одну строку под кнопкой «Сохранить».
 */
export function firstMethodError(errors: MethodFieldErrors): string | null {
  return (
    errors.buttonLabel ??
    errors.name ??
    errors.method ??
    errors.apiHost ??
    errors.path ??
    errors.query ??
    errors.body ??
    null
  )
}
