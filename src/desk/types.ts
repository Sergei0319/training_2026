/**
 * Общие типы кабинета: стадия авторизации и запись журнала выполнения запросов.
 */
import type { DokiJson } from '../doki/client'

/**
 * Гейт UI: `checking` — сверка сессии с `/auth/me`, `login` — форма входа, `app` — рабочий стол.
 */
export type AuthGate = 'checking' | 'login' | 'app'

/**
 * Строка журнала раннера. `lkSourceData` — данные для ссылки в ЛК, если ответ
 * метода сам по себе не содержит нужный payload (догоняющий запрос).
 */
export type LogEntry = {
  id: string
  at: string
  action: string
  ok: boolean
  summary: string
  data: DokiJson | string
  lkSourceData?: DokiJson | string
  methodPath?: string
  methodHttp?: string
}
