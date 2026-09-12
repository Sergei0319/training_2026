/**
 * Модель операции поддержки — основной объект CRUD (экзамен 2.1).
 */
/** api.doki.online или api.okidoki.ru. */
export type ApiHostKind = 'doki.online' | 'okidoki.ru'

import type { TileParamId } from './tileParams'

/**
 * Операция, которую пользователь запускает с плитки и правит в редакторе.
 * query/headers — пары ключ-значение; body — сырой JSON-шаблон или null.
 */
export type SavedMethod = {
  id: string
  /** Внутреннее название / описание в редакторе. */
  name: string
  /** Текст на кнопке быстрого запуска. */
  buttonLabel: string
  method: string
  path: string
  query: { key: string; value: string }[]
  headers: { key: string; value: string }[]
  body: string | null
  useBearer: boolean
  apiHost: ApiHostKind
  /** Какие параметры запроса включены (если пусто — все обнаруженные автоматически). */
  tileParamIds?: TileParamId[]
}
