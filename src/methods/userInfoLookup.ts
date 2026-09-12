/**
 * Поиск пользователя GET /support/user/info: один активный критерий
 * (телефон / email / ИНН), сбор query и валидация выбранного значения.
 */
import { validateEmailValue, validatePhoneValue, validateTaxIdValue } from '../forms/validateTileField'
import type { SavedMethod } from './types'
import {
  TILE_PARAM_DEFS,
  type TileParamDef,
  type TileParamId,
} from './tileParams'

function collectMethodText(m: SavedMethod): string {
  const chunks = [
    m.path,
    ...m.query.map((q) => `${q.key}=${q.value}`),
    ...m.headers.map((h) => `${h.key}=${h.value}`),
    m.body ?? '',
  ]
  return chunks.join('\n')
}

/** Id полей, которыми можно искать user/info (взаимоисключающие в query). */
export const USER_INFO_LOOKUP_PARAM_IDS = ['phoneNumber', 'userEmail', 'taxId'] as const satisfies readonly TileParamId[]

/** Один из трёх критериев поиска пользователя. */
export type UserInfoLookupParamId = (typeof USER_INFO_LOOKUP_PARAM_IDS)[number]

const API_QUERY_BY_PARAM: Record<UserInfoLookupParamId, string> = {
  phoneNumber: 'phone_number',
  userEmail: 'email',
  taxId: 'tax_id',
}

/** Путь GET /support/user/info без query (для сборки URL запроса). */
export function normalizeUserInfoRequestPath(path: string): string {
  let normalized = path.split('?')[0]?.trim() || '/'
  if (normalized.startsWith('http://') || normalized.startsWith('https://')) {
    try {
      normalized = new URL(normalized).pathname
    } catch {
      return '/support/user/info'
    }
  }
  normalized = normalized.replace(/\/+$/, '') || '/'
  return normalized
}

/** GET с каноническим путём /support/user/info (полный URL тоже сводится к pathname). */
export function isUserInfoSupportMethod(m: SavedMethod): boolean {
  if (m.method.toUpperCase() !== 'GET') return false
  return normalizeUserInfoRequestPath(m.path) === '/support/user/info'
}

/** true, если id — один из трёх критериев user/info. */
function isUserInfoLookupParamId(id: TileParamId): id is UserInfoLookupParamId {
  return (USER_INFO_LOOKUP_PARAM_IDS as readonly TileParamId[]).includes(id)
}

/** Type guard: id — phoneNumber | userEmail | taxId. */
export { isUserInfoLookupParamId }

/** Все три определения полей поиска из общего каталога плитки. */
export function getAllUserInfoLookupDefs(): TileParamDef[] {
  return USER_INFO_LOOKUP_PARAM_IDS.map(
    (id) => TILE_PARAM_DEFS.find((d) => d.id === id)!,
  ).filter(Boolean)
}

/**
 * Какие поля показать: если в tileParamIds ровно один lookup — только он;
 * иначе эвристика по query; иначе все три (переключатель на плитке).
 */
export function getUserInfoLookupParamDefs(m: SavedMethod): TileParamDef[] {
  if (!isUserInfoSupportMethod(m)) return []
  const all = getAllUserInfoLookupDefs()
  if (m.tileParamIds?.length) {
    const selected = m.tileParamIds.filter(isUserInfoLookupParamId)
    if (selected.length === 1) {
      return all.filter((d) => selected.includes(d.id as UserInfoLookupParamId))
    }
  }
  const fromQuery = getEnabledTileParamsForUserInfoFromQuery(m)
  if (fromQuery.length === 1) return fromQuery
  return all
}

function getEnabledTileParamsForUserInfoFromQuery(m: SavedMethod): TileParamDef[] {
  const text = collectMethodText(m)
  const found = new Set<UserInfoLookupParamId>()
  for (const match of text.matchAll(/\{\{([a-zA-Z][a-zA-Z0-9]*)\}\}/g)) {
    const id = match[1]
    if (isUserInfoLookupParamId(id as TileParamId)) found.add(id as UserInfoLookupParamId)
  }
  if (/\bphone_number=/.test(text)) found.add('phoneNumber')
  if (/\bemail=/.test(text)) found.add('userEmail')
  if (/\btax_id=/.test(text)) found.add('taxId')
  return getAllUserInfoLookupDefs().filter((d) => found.has(d.id as UserInfoLookupParamId))
}

/**
 * Стартовый критерий: по словам email/ИНН в названии плитки, иначе телефон.
 */
export function defaultUserInfoLookupKind(m: SavedMethod, enabledIds: TileParamId[]): TileParamId {
  const label = `${m.buttonLabel} ${m.name}`.toLowerCase()
  if (enabledIds.includes('userEmail') && label.includes('email')) return 'userEmail'
  if (enabledIds.includes('taxId') && (label.includes('инн') || label.includes('inn'))) return 'taxId'
  if (enabledIds.includes('phoneNumber')) return 'phoneNumber'
  return enabledIds[0] ?? 'phoneNumber'
}

/**
 * Значения трёх полей + служебный userInfoBy (какой критерий активен).
 */
export function mergeUserInfoTileParamValues(
  stored: Record<string, string> | undefined,
  method: SavedMethod,
  overrides?: Record<string, string>,
): Record<string, string> {
  const source = { ...(stored ?? {}), ...(overrides ?? {}) }
  const out: Record<string, string> = {}
  for (const def of getAllUserInfoLookupDefs()) {
    out[def.id] = source[def.id] ?? def.defaultValue
  }
  if (source.userInfoBy?.trim() && isUserInfoLookupParamId(source.userInfoBy.trim() as TileParamId)) {
    out.userInfoBy = source.userInfoBy.trim()
  } else {
    out.userInfoBy = defaultUserInfoLookupKind(method, [...USER_INFO_LOOKUP_PARAM_IDS])
  }
  return out
}

/**
 * Активный критерий: сохранённый userInfoBy, либо единственный enabled, либо дефолт по названию.
 */
export function resolveActiveUserInfoLookupKind(
  m: SavedMethod,
  values: Record<string, string>,
  enabledIds: TileParamId[],
): TileParamId {
  const stored = values.userInfoBy?.trim()
  if (stored && isUserInfoLookupParamId(stored as TileParamId)) {
    return stored as TileParamId
  }
  const enabledLookups = enabledIds.filter(isUserInfoLookupParamId)
  if (enabledLookups.length === 1) return enabledLookups[0]
  return defaultUserInfoLookupKind(m, [...USER_INFO_LOOKUP_PARAM_IDS])
}

/**
 * Пара query API для активного непустого поля; `null` если значение ещё не ввели.
 */
export function resolveUserInfoQuery(
  values: Record<string, string>,
  enabledIds: TileParamId[],
  method: SavedMethod,
): { key: string; value: string; paramId: TileParamId } | null {
  const active = resolveActiveUserInfoLookupKind(method, values, enabledIds)
  const value = (values[active] ?? '').trim()
  if (!value) return null
  return { key: API_QUERY_BY_PARAM[active as UserInfoLookupParamId], value, paramId: active }
}

/**
 * Pathname + один query-параметр поиска (не прокидываем query из редактора целиком).
 */
export function buildUserInfoPathWithQuery(
  path: string,
  values: Record<string, string>,
  enabledIds: TileParamId[],
  method: SavedMethod,
): string {
  const resolved = resolveUserInfoQuery(values, enabledIds, method)
  const base = normalizeUserInfoRequestPath(path)
  if (!resolved) return base
  const qs = new URLSearchParams({ [resolved.key]: resolved.value })
  return `${base}?${qs.toString()}`
}

/**
 * Валидация только активного критерия (остальные поля на плитке можно не заполнять).
 */
export function validateUserInfoLookupParams(
  values: Record<string, string>,
  method: SavedMethod,
): string | null {
  const enabledIds = [...USER_INFO_LOOKUP_PARAM_IDS]
  const lookupDefs = getAllUserInfoLookupDefs()
  const resolved = resolveUserInfoQuery(values, enabledIds, method)
  if (!resolved) {
    const active = resolveActiveUserInfoLookupKind(method, values, enabledIds)
    const label = lookupDefs.find((d) => d.id === active)?.label ?? 'значение'
    return `Поле «${label}» неверно: укажите значение для поиска пользователя.`
  }

  if (resolved.paramId === 'phoneNumber') {
    return validatePhoneValue(resolved.value, { required: true, label: 'Номер телефона' })
  }
  if (resolved.paramId === 'taxId') {
    return validateTaxIdValue(resolved.value, { required: true, label: 'ИНН' })
  }
  if (resolved.paramId === 'userEmail') {
    return validateEmailValue(resolved.value, { required: true, label: 'Email' })
  }

  return null
}
