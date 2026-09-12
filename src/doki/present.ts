/**
 * Преобразование сырого JSON API в карточку профиля: плоские поля,
 * тип (организация / физлицо), секции и человекочитаемое резюме ответа.
 */
import type { DokiJson } from './client'
import { labelForKey } from './labels'

/** Вид профиля по полям ответа: юрлицо/ИП, физлицо или не удалось определить. */
export type ProfileKind = 'organization' | 'individual' | 'unknown'

/** Блок карточки профиля: заголовок секции и строки ключ/подпись/значение. */
export type ProfileSection = {
  title: string
  rows: { key: string; label: string; value: string }[]
}

/** Ключи, по которым считаем «организацию», если role не задан. */
const ORG_MARKERS = ['law_name', 'inn', 'ogrn', 'ogrnip', 'kpp', 'law_address', 'company_name', 'full_law_name']

/** Ключи ФИО/документов — признак физлица. */
const PERSON_MARKERS = ['first_name', 'last_name', 'middle_name', 'passport', 'birth_date', 'snils']

/** Вложенные объекты, которые разворачиваем при обходе (остальные объекты глубже 2 не трогаем). */
const NEST_KEYS = new Set(['user', 'profile', 'signer', 'client', 'customer', 'entrepreneur', 'data', 'cards', 'card'])

/** Собирает плоские строковые поля из ответа API (включая system_entities). */
export function flattenDokiPayload(data: DokiJson | string): Record<string, string> {
  const out: Record<string, string> = {}
  if (typeof data === 'string') return out
  walk(data, out, 0)
  return out
}

/**
 * Рекурсивный обход: массивы keyword/value и system_entities кладём как плоские поля.
 * depth > 6 — защита от циклов/огромных деревьев.
 */
function walk(node: DokiJson, out: Record<string, string>, depth: number): void {
  if (depth > 6 || node === null || node === undefined) return
  if (typeof node !== 'object') return

  if (Array.isArray(node)) {
    // Массив сущностей {keyword, value} — типичный формат Doki, не произвольный JSON-массив.
    if (node.length && typeof node[0] === 'object' && node[0] !== null && !Array.isArray(node[0])) {
      const first = node[0] as Record<string, DokiJson>
      if ('keyword' in first || 'id' in first) {
        for (const item of node) {
          if (!item || typeof item !== 'object' || Array.isArray(item)) continue
          const o = item as Record<string, DokiJson>
          const kw = o.keyword != null ? String(o.keyword) : o.id != null ? String(o.id) : ''
          if (kw && o.value != null && typeof o.value !== 'object') {
            out[kw] = String(o.value)
          }
        }
        return
      }
    }
    return
  }

  const o = node as Record<string, DokiJson>
  for (const [k, v] of Object.entries(o)) {
    if (k === 'system_entities' && Array.isArray(v)) {
      for (const item of v) {
        if (!item || typeof item !== 'object' || Array.isArray(item)) continue
        const e = item as Record<string, DokiJson>
        const key = e.keyword != null ? String(e.keyword) : e.id != null ? String(e.id) : ''
        if (key && e.value != null && typeof e.value !== 'object') {
          out[key] = String(e.value)
        }
      }
      continue
    }
    if (k === 'entities' && Array.isArray(v)) {
      for (const item of v) {
        if (!item || typeof item !== 'object' || Array.isArray(item)) continue
        const e = item as Record<string, DokiJson>
        const key =
          e.keyword != null ? String(e.keyword) : e.name != null ? String(e.name) : e.id != null ? String(e.id) : ''
        if (key && e.value != null && typeof e.value !== 'object') {
          out[key] = String(e.value)
        }
      }
      continue
    }
    if (NEST_KEYS.has(k) && v && typeof v === 'object' && !Array.isArray(v)) {
      walk(v, out, depth + 1)
      continue
    }
    if (v === null || v === undefined) continue
    if (typeof v === 'object' && !Array.isArray(v)) {
      if (depth < 2) walk(v, out, depth + 1)
      continue
    }
    if (Array.isArray(v)) continue
    // Не перезаписываем уже найденное непустое значение более глубоким дублем.
    if (!(k in out) || out[k] === '') {
      out[k] = String(v)
    }
  }
}

/**
 * Определяет тип профиля: сначала role, затем «голоса» маркеров организации vs ФИО.
 */
export function detectProfileKind(f: Record<string, string>): ProfileKind {
  const keys = new Set(Object.keys(f).map((k) => k.toLowerCase()))
  const role = (f.role || '').toLowerCase()
  if (role === 'entrepreneur') return 'organization'
  if (role === 'customer') return 'individual'
  const orgScore = ORG_MARKERS.filter((m) => keys.has(m.toLowerCase()) && f[m]).length
  const personScore = PERSON_MARKERS.filter((m) => keys.has(m.toLowerCase()) && f[m]).length
  if (orgScore >= 2 || (Boolean(f.inn) && Boolean(f.law_name))) return 'organization'
  if (orgScore >= 1 && (f.ogrn || f.kpp)) return 'organization'
  if (personScore >= 2) return 'individual'
  if (f.first_name && f.last_name) return 'individual'
  return 'unknown'
}

/** Берёт значения по списку ключей без учёта регистра, с русскими подписями. */
function pick(f: Record<string, string>, keys: string[]): { key: string; label: string; value: string }[] {
  const rows: { key: string; label: string; value: string }[] = []
  for (const key of keys) {
    const lower = Object.keys(f).find((k) => k.toLowerCase() === key.toLowerCase())
    if (!lower) continue
    const value = f[lower]
    if (value === undefined || value === '') continue
    rows.push({ key: lower, label: labelForKey(lower), value })
  }
  return rows
}

/**
 * Собирает заголовок и секции карточки: контакты, юр. данные, банк или персональные поля.
 * Пустые секции не добавляются.
 */
export function buildProfileCard(
  kind: ProfileKind,
  f: Record<string, string>,
): { title: string; sections: ProfileSection[] } {
  if (kind === 'organization') {
    const title = f.law_name || f.full_law_name || f.company_name || f.name || 'Организация'
    const basic = pick(f, ['phone_number', 'phone', 'client_phone', 'customer_phone', 'public_phone', 'email'])
    const legal = pick(f, [
      'law_name',
      'full_law_name',
      'company_name',
      'representative',
      'signer_basis',
      'in_person',
      'basis_of_authority',
      'law_address',
      'registration_address',
      'legal_address',
      'inn',
      'ogrn',
      'ogrnip',
      'kpp',
    ])
    const bank = pick(f, ['bik', 'bank_name', 'bank_account', 'rs', 'correspondent_account', 'ks'])
    const sections: ProfileSection[] = []
    if (basic.length) sections.push({ title: 'Основная информация', rows: basic })
    if (legal.length) sections.push({ title: 'Данные юр. лица', rows: legal })
    if (bank.length) sections.push({ title: 'Реквизиты организации', rows: bank })
    return { title, sections }
  }
  if (kind === 'individual') {
    const title =
      [f.last_name, f.first_name, f.middle_name].filter(Boolean).join(' ') || f.name || 'Физическое лицо'
    const basic = pick(f, ['phone_number', 'phone', 'email'])
    const person = pick(f, [
      'last_name',
      'first_name',
      'middle_name',
      'birth_date',
      'passport',
      'snils',
      'inn',
      'registration_address',
      'address',
    ])
    const sections: ProfileSection[] = []
    if (basic.length) sections.push({ title: 'Основная информация', rows: basic })
    if (person.length) sections.push({ title: 'Персональные данные', rows: person })
    return { title, sections }
  }
  return { title: 'Профиль', sections: [] }
}

/**
 * Множество ключей, уже показанных в секциях карточки (чтобы не дублировать в «остальных»).
 */
export function usedKeysFromSections(sections: ProfileSection[]): Set<string> {
  const s = new Set<string>()
  for (const sec of sections) {
    for (const r of sec.rows) s.add(r.key)
  }
  return s
}

/**
 * Поля, не попавшие в секции карточки — для блока «прочие данные».
 */
export function remainingFields(
  f: Record<string, string>,
  usedKeys: Set<string>,
): { key: string; label: string; value: string }[] {
  return Object.entries(f)
    .filter(([k, v]) => v && !usedKeys.has(k))
    .map(([key, value]) => ({ key, label: labelForKey(key), value }))
}

/**
 * Короткое текстовое резюме ответа для журнала: бинарь, массив, объект с первыми ключами.
 */
export function formatHumanSummary(data: DokiJson | string): string {
  if (typeof data === 'string') {
    if (data.startsWith('__binary__:')) {
      const parts = data.split(':')
      const len = parts[2] || '?'
      const ct = parts[1] || 'application/octet-stream'
      return `Получен бинарный ответ (${ct}), размер ${len} байт.`
    }
    return data
  }
  if (data === null) return 'null'
  if (typeof data !== 'object') return String(data)
  if (Array.isArray(data)) {
    if (data.length === 0) return 'Пустой список'
    if (typeof data[0] === 'object' && data[0] !== null && !Array.isArray(data[0])) {
      return `Список из ${data.length} записей`
    }
    return `Список из ${data.length} элементов`
  }
  const keys = Object.keys(data)
  return `Объект: ${keys.length} полей (${keys.slice(0, 8).join(', ')}${keys.length > 8 ? '…' : ''})`
}
