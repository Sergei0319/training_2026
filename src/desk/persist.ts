/**
 * localStorage кабинета: ключи, безопасное чтение/запись и миграция старых карт.
 * Ошибки квоты/приватного режима глотаем — UI должен жить и без персистенции.
 */
import { normalizeVerificationChannel } from '../methods/tileParams'
import { normalizeEntrepreneurFieldEntries, type EntrepreneurFieldEntry } from '../methods/entrepreneurUpdate'
import { normalizeIndividualFieldEntries, type IndividualFieldEntry } from '../methods/individualUpdate'
import { normalizeResendEmailState, type ResendEmailMethodState } from '../methods/resendEmail'

/**
 * Имена ключей. `phonesLegacy` — старое хранилище телефонов до универсальной карты tile-params.
 */
export const LS = {
  partner: 'doki_support_partner_api_key',
  tileParams: 'doki_support_tile_params_by_method',
  entrepreneur: 'doki_support_entrepreneur_fields_by_method',
  individual: 'doki_support_individual_fields_by_method',
  resendEmail: 'doki_support_resend_email_by_method',
  phonesLegacy: 'doki_support_phones_by_method',
} as const

/** Читает строку из localStorage; при запрете доступа — пустая строка. */
export function loadLs(key: string): string {
  try {
    return localStorage.getItem(key) || ''
  } catch {
    return ''
  }
}

/** Пишет строку; сбой хранилища игнорируем. */
export function saveLs(key: string, value: string): void {
  try {
    localStorage.setItem(key, value)
  } catch {
    /* ignore */
  }
}

/**
 * Иммутативное удаление ключа из карты. Если ключа нет, возвращаем тот же объект
 * (меньше лишних ререндеров и записей в storage).
 */
export function omitMapKey<T>(map: Record<string, T>, key: string): Record<string, T> {
  if (!(key in map)) return map
  const next = { ...map }
  delete next[key]
  return next
}

function readObject(key: string): Record<string, unknown> | null {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return null
    const parsed = JSON.parse(raw) as unknown
    return parsed && typeof parsed === 'object' ? (parsed as Record<string, unknown>) : null
  } catch {
    return null
  }
}

function loadLegacyPhonesMap(): Record<string, string> {
  const obj = readObject(LS.phonesLegacy)
  if (!obj) return {}
  const out: Record<string, string> = {}
  for (const [k, v] of Object.entries(obj)) {
    if (typeof v === 'string') out[k] = v
  }
  return out
}

/**
 * Карта параметров плиток. Сначала новый JSON; если пусто — миграция
 * `phones_by_method` → `{ phoneNumber }` для каждого метода.
 * Канал верификации нормализуем, чтобы старые значения совпали с текущим enum.
 */
export function loadTileParamsMap(): Record<string, Record<string, string>> {
  const obj = readObject(LS.tileParams)
  if (obj) {
    const out: Record<string, Record<string, string>> = {}
    for (const [methodId, row] of Object.entries(obj)) {
      if (!row || typeof row !== 'object') continue
      const params: Record<string, string> = {}
      for (const [paramId, value] of Object.entries(row as Record<string, unknown>)) {
        if (typeof value !== 'string') continue
        params[paramId] = paramId === 'channel' ? normalizeVerificationChannel(value) : value
      }
      if (Object.keys(params).length) out[methodId] = params
    }
    if (Object.keys(out).length) return out
  }
  const migrated: Record<string, Record<string, string>> = {}
  for (const [methodId, phone] of Object.entries(loadLegacyPhonesMap())) {
    if (phone.trim()) migrated[methodId] = { phoneNumber: phone.trim() }
  }
  return migrated
}

/** JSON.stringify в localStorage; сбой квоты игнорируем. */
export function saveJson(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    /* ignore */
  }
}

/** Карта полей ИП с нормализацией устаревшей формы записей. */
export function loadEntrepreneurFieldsMap(): Record<string, EntrepreneurFieldEntry[]> {
  const obj = readObject(LS.entrepreneur)
  if (!obj) return {}
  const out: Record<string, EntrepreneurFieldEntry[]> = {}
  for (const [id, row] of Object.entries(obj)) out[id] = normalizeEntrepreneurFieldEntries(row)
  return out
}

/** Карта полей физлица с нормализацией. */
export function loadIndividualFieldsMap(): Record<string, IndividualFieldEntry[]> {
  const obj = readObject(LS.individual)
  if (!obj) return {}
  const out: Record<string, IndividualFieldEntry[]> = {}
  for (const [id, row] of Object.entries(obj)) out[id] = normalizeIndividualFieldEntries(row)
  return out
}

/** Карта состояния переотправки email с нормализацией. */
export function loadResendEmailMap(): Record<string, ResendEmailMethodState> {
  const obj = readObject(LS.resendEmail)
  if (!obj) return {}
  const out: Record<string, ResendEmailMethodState> = {}
  for (const [id, row] of Object.entries(obj)) out[id] = normalizeResendEmailState(row)
  return out
}
