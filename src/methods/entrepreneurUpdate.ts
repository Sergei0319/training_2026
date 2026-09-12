/**
 * Плитка «обновление пользователя ИП»: каталог полей, JSON-тело, валидация user_id.
 * Отличается от физлица набором реквизитов и распознаванием по подписи «ип».
 */
import type { SavedMethod } from './types'
import { firstErrorMessage, validateMongoObjectId } from '../forms/validateTileField'
import { labelForKey } from '../doki/labels'
import {
  buildNestedJsonBody,
  getDefaultEntries,
  normalizeKeyValueEntries,
  type KeyValueFieldCatalogItem,
  type KeyValueFieldEntry,
} from './keyValueFields'

/** Ключи JSON тела POST /support/user/update для роли entrepreneur. */
export type EntrepreneurFieldKey =
  | 'user_id'
  | 'role'
  | 'law_name'
  | 'law_address'
  | 'tax_id'
  | 'ogrn'
  | 'bank_name'
  | 'bank_account'
  | 'corr_account'
  | 'bic'

/** Строка формы: ключ API + введённое значение. */
export type EntrepreneurFieldEntry = KeyValueFieldEntry

/** Элемент каталога полей ИП (ключ ограничен EntrepreneurFieldKey). */
export type EntrepreneurFieldCatalogItem = KeyValueFieldCatalogItem & { key: EntrepreneurFieldKey }

/** Каталог полей формы ИП: подписи, дефолты, select для role. */
export const ENTREPRENEUR_FIELD_CATALOG: EntrepreneurFieldCatalogItem[] = [
  {
    key: 'user_id',
    label: labelForKey('user_id'),
    defaultValue: '693a48f9d722d915e616cde9',
    inputMode: 'text',
  },
  {
    key: 'role',
    label: labelForKey('role'),
    defaultValue: 'entrepreneur',
    inputMode: 'select',
    options: [{ value: 'entrepreneur', label: 'ИП (entrepreneur)' }],
  },
  {
    key: 'law_name',
    label: labelForKey('law_name'),
    defaultValue: 'ИП Сас Роман Андреевич',
    inputMode: 'text',
  },
  {
    key: 'law_address',
    label: labelForKey('law_address'),
    defaultValue: 'Камчатский край, г. Елизово, ул. Беринга, д. 22, офис 21',
    inputMode: 'text',
  },
  {
    key: 'tax_id',
    label: labelForKey('tax_id'),
    defaultValue: '1234567890',
    inputMode: 'text',
  },
  {
    key: 'ogrn',
    label: labelForKey('ogrn'),
    defaultValue: '1234567890123',
    inputMode: 'text',
  },
  {
    key: 'bank_name',
    label: labelForKey('bank_name'),
    defaultValue: 'Т-Банк',
    inputMode: 'text',
  },
  {
    key: 'bank_account',
    label: labelForKey('bank_account'),
    defaultValue: '40802810900000000001',
    inputMode: 'text',
  },
  {
    key: 'corr_account',
    label: labelForKey('corr_account'),
    defaultValue: '30101810400000000225',
    inputMode: 'text',
  },
  {
    key: 'bic',
    label: labelForKey('bic'),
    defaultValue: '044525225',
    inputMode: 'text',
  },
]

/**
 * Плитка update ИП/ООО: путь /support/user/update и слова «ип» + «ооо» или «ип/» в названии.
 * Нужно, чтобы не спутать с update физлица на том же endpoint.
 */
export function isEntrepreneurUserUpdateMethod(m: SavedMethod): boolean {
  const t = `${m.buttonLabel} ${m.name}`.toLowerCase()
  return (
    m.path.replace(/\?.*$/, '').endsWith('/support/user/update') &&
    t.includes('ип') &&
    (t.includes('ооо') || t.includes('ип/'))
  )
}

/** Стартовые значения формы из каталога. */
export function getDefaultEntrepreneurFieldEntries(): EntrepreneurFieldEntry[] {
  return getDefaultEntries(ENTREPRENEUR_FIELD_CATALOG)
}

/** JSON-тело update: вложенность по точкам в ключе (если появятся). */
export function buildEntrepreneurUpdateBody(entries: EntrepreneurFieldEntry[]): string {
  return buildNestedJsonBody(entries)
}

/** Ошибки полей: сейчас обязательно валидный ObjectId пользователя. */
export function validateEntrepreneurFieldErrors(entries: EntrepreneurFieldEntry[]): Record<string, string> {
  const userId = entries.find((e) => e.key === 'user_id')?.value ?? ''
  const error = validateMongoObjectId(userId, { required: true, label: 'ID пользователя' })
  return error ? { user_id: error } : {}
}

/** Первая ошибка формы ИП или `null`. */
export function validateEntrepreneurFields(entries: EntrepreneurFieldEntry[]): string | null {
  return firstErrorMessage(validateEntrepreneurFieldErrors(entries))
}

/** Нормализует сохранённые поля: только известные ключи, подставляет подписи. */
export function normalizeEntrepreneurFieldEntries(raw: unknown): EntrepreneurFieldEntry[] {
  return normalizeKeyValueEntries(raw, ENTREPRENEUR_FIELD_CATALOG)
}
