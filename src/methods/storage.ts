/**
 * Persist списка плиток в localStorage: ключ v3, чтение legacy v2,
 * нормализация каждой записи. Ошибки квоты/JSON глотаем — UI не должен падать.
 */
import type { SavedMethod } from './types'
import { normalizeSavedMethod } from './normalizeMethod'

const LS_METHODS = 'doki_support_methods_v3'
const LS_METHODS_LEGACY = 'doki_support_methods_v2'

/**
 * Читает сохранённые операции; `null` — нет данных или всё отфильтровалось как битое.
 * Сначала v3, иначе v2 (миграция без отдельного скрипта).
 */
export function loadMethodsFromStorage(): SavedMethod[] | null {
  try {
    let raw = localStorage.getItem(LS_METHODS)
    if (!raw) raw = localStorage.getItem(LS_METHODS_LEGACY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as unknown[]
    if (!Array.isArray(parsed)) return null
    const next = parsed.map(normalizeSavedMethod).filter((x): x is SavedMethod => x !== null)
    return next.length ? next : null
  } catch {
    return null
  }
}

/** Пишет текущий список в v3. QuotaExceeded — молча, список остаётся в памяти. */
export function saveMethodsToStorage(methods: SavedMethod[]): void {
  try {
    localStorage.setItem(LS_METHODS, JSON.stringify(methods))
  } catch {
    /* ignore quota */
  }
}

/** Сброс сохранённых плиток (кнопка «восстановить коллекцию»). */
export function clearMethodsStorage(): void {
  try {
    localStorage.removeItem(LS_METHODS)
  } catch {
    /* ignore */
  }
}
