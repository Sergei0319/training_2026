/**
 * Вход в личный кабинет пользователя: распознавание support-методов,
 * извлечение OAuth-токенов из ответа API и сбор URL desktop.doki.online.
 */
import { dokiRequestForHost } from './client'
import type { DokiJson } from './client'
import { labelForKey } from './labels'
import type { ApiHostKind, SavedMethod } from '../methods/types'

/** Токен, найденный в JSON: путь в дереве + ключ + значение для кнопок ЛК. */
export type UserTokenEntry = {
  id: string
  key: string
  label: string
  value: string
}

/** Имена полей, похожие на токен (включая суффикс _token). */
const TOKEN_KEY_RE = /^(access_token|refresh_token|token|.*_token)$/i
const LK_TOKEN_KEYS = new Set(['access_token', 'refresh_token'])
/** Приоритет пользователя для кнопок ЛК (created by — первый). */
const LK_USER_SCOPE_PRIORITY = ['created_by', 'createdBy', 'user', 'client', 'customer', 'target_user']
/** Не использовать токены подписантов для входа в ЛК. */
const LK_SIGNER_PATH_MARKERS = ['signer', 'signers']

/** Pathname без query и хвостовых слэшей; полный URL сводим к pathname. */
function normalizeSupportPath(path: string): string {
  const trimmed = path.trim()
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    try {
      return normalizeSupportPath(new URL(trimmed).pathname)
    } catch {
      /* fall through */
    }
  }
  const withoutQuery = trimmed.split('?')[0]?.trim() || '/'
  return withoutQuery.replace(/\/+$/, '') || '/'
}

const PHONE_KEYS = new Set(['phone_number', 'phone', 'public_phone', 'client_phone', 'customer_phone'])
const CREATED_BY_SCOPES = ['created_by', 'createdBy'] as const

function methodLabel(method: SavedMethod): string {
  return `${method.buttonLabel} ${method.name}`.toLowerCase()
}

/**
 * GET /support/user/info — информация по пользователю (по телефону).
 * Путь канонический или подпись плитки («токен/email/ИНН лк») — после переименований в коллекции.
 */
export function isUserInfoMethod(method: SavedMethod): boolean {
  if (method.method.toUpperCase() !== 'GET') return false
  if (normalizeSupportPath(method.path) === '/support/user/info') return true
  const label = methodLabel(method)
  return label.includes('user/info') || (label.includes('токен') && label.includes('лк')) || (label.includes('email') && label.includes('лк')) || (label.includes('инн') && label.includes('лк'))
}

/** GET /support/contract/info — информация по договору. */
export function isContractInfoMethod(method: SavedMethod): boolean {
  if (method.method.toUpperCase() !== 'GET') return false
  if (normalizeSupportPath(method.path) === '/support/contract/info') return true
  const label = methodLabel(method)
  return label.includes('договор') && label.includes('информац')
}

/** Операция, из ответа которой можно строить кнопки входа в ЛК. */
export function isLkSupportInfoMethod(method: SavedMethod): boolean {
  return isUserInfoMethod(method) || isContractInfoMethod(method)
}

/** То же, но по сырым method+path (журнал, повтор запроса без SavedMethod). */
export function isLkSupportInfoRequest(method: string, path: string): boolean {
  if (method.toUpperCase() !== 'GET') return false
  const normalized = normalizeSupportPath(path)
  return normalized === '/support/user/info' || normalized === '/support/contract/info'
}

/** GET /support/contract/info по method+path, без объекта плитки. */
export function isContractInfoRequest(method: string, path: string): boolean {
  if (method.toUpperCase() !== 'GET') return false
  return normalizeSupportPath(path) === '/support/contract/info'
}

/** Журнал: user/contract info по подписи запроса (если path в записи не совпал). */
export function isLkSupportLogAction(action: string): boolean {
  const label = action.toLowerCase()
  if (label.includes('/support/user/info') || label.includes('/support/contract/info')) return true
  if (label.includes('договор') && label.includes('информац')) return true
  if (label.includes('токен') && label.includes('лк')) return true
  if (label.includes('email') && label.includes('лк')) return true
  if (label.includes('инн') && label.includes('лк')) return true
  return false
}

function isPhoneString(value: string): boolean {
  const trimmed = value.trim()
  return /^\+?\d[\d\s()-]{9,}$/.test(trimmed)
}

function phoneFromRecord(record: Record<string, unknown>): string | null {
  for (const key of PHONE_KEYS) {
    const value = record[key]
    if (typeof value === 'string' && isPhoneString(value)) return value.trim()
  }
  return null
}

function extractPhoneFromEntities(value: DokiJson): string | null {
  if (!Array.isArray(value)) return null
  for (const item of value) {
    if (!item || typeof item !== 'object' || Array.isArray(item)) continue
    const row = item as Record<string, unknown>
    const keywordRaw = row.keyword ?? row.id ?? row.name
    const keyword = typeof keywordRaw === 'string' ? keywordRaw.trim().toLowerCase() : ''
    if (!PHONE_KEYS.has(keyword)) continue
    const rowValue = row.value
    if (typeof rowValue === 'string' && isPhoneString(rowValue)) return rowValue.trim()
  }
  return null
}

function extractPhoneFromNode(node: DokiJson, depth = 0): string | null {
  if (depth > 8 || node === null || node === undefined) return null
  if (typeof node === 'string') return isPhoneString(node) ? node.trim() : null
  if (Array.isArray(node)) {
    for (const item of node) {
      const phone = extractPhoneFromNode(item, depth + 1)
      if (phone) return phone
    }
    return null
  }
  if (typeof node !== 'object') return null

  const record = node as Record<string, DokiJson>
  const direct = phoneFromRecord(record as Record<string, unknown>)
  if (direct) return direct

  const fromEntities =
    extractPhoneFromEntities(record.entities) ?? extractPhoneFromEntities(record.system_entities)
  if (fromEntities) return fromEntities

  for (const [key, value] of Object.entries(record)) {
    if (key === 'entities' || key === 'system_entities') continue
    const phone = extractPhoneFromNode(value, depth + 1)
    if (phone) return phone
  }
  return null
}

/** Телефон created by из ответа contract/info (для дозапроса user/info). */
export function extractPhoneForCreatedBy(data: DokiJson | string): string | null {
  if (typeof data === 'string' || !data || typeof data !== 'object') return null

  const node = findScopedObject(data, CREATED_BY_SCOPES)
  if (node) {
    const phone = extractPhoneFromNode(node, 0)
    if (phone) return phone
  }

  return null
}

/** BFS по объектам: ищем created_by / createdBy, не углубляясь бесконечно. */
function findScopedObject(data: DokiJson, scopes: readonly string[]): DokiJson | null {
  const wanted = new Set(scopes.map((scope) => scope.toLowerCase()))
  const queue: DokiJson[] = [data]

  for (let depth = 0; depth < 12 && queue.length; depth++) {
    const levelSize = queue.length
    for (let i = 0; i < levelSize; i++) {
      const node = queue.shift()
      if (!node || typeof node !== 'object') continue

      if (Array.isArray(node)) {
        for (const item of node) queue.push(item)
        continue
      }

      for (const [key, value] of Object.entries(node)) {
        if (wanted.has(key.toLowerCase()) && value && typeof value === 'object') {
          return value
        }
        if (value && typeof value === 'object') queue.push(value)
      }
    }
  }

  return null
}

/** @deprecated используйте extractPhoneForCreatedBy */
export function extractPhoneForLk(data: DokiJson | string): string | null {
  return extractPhoneForCreatedBy(data)
}

/**
 * Дозапрос GET /support/user/info по телефону created_by.
 * Ошибку сети глотаем: без user/info кнопки ЛК просто не появятся.
 */
export async function fetchSupportUserInfoByPhone(
  phone: string,
  bearerToken: string,
  host: ApiHostKind = 'doki.online',
): Promise<DokiJson | string | null> {
  const qs = new URLSearchParams({ phone_number: phone })
  try {
    const { data } = await dokiRequestForHost(
      `/support/user/info?${qs.toString()}`,
      {
        method: 'GET',
        headers: { Authorization: `Bearer ${bearerToken}` },
      },
      host,
    )
    return data
  } catch {
    return null
  }
}

/** Данные для кнопок ЛК: created by из ответа или дозапрос user/info. */
export async function resolveLkSourceDataForMethod(
  data: DokiJson | string,
  method: SavedMethod,
  bearerToken: string,
): Promise<DokiJson | string> {
  if (isContractInfoMethod(method) && bearerToken.trim()) {
    if (getUserCabinetOAuthPair(data, true)) return data

    const phone = extractPhoneForCreatedBy(data)
    if (phone) {
      const userInfo = await fetchSupportUserInfoByPhone(phone, bearerToken.trim(), method.apiHost)
      if (userInfo && getUserCabinetOAuthPair(userInfo)) return userInfo
    }

    return ''
  }

  if (isUserInfoMethod(method) && getUserCabinetOAuthPair(data)) return data
  return data
}

/** JWT (три сегмента) или длинный opaque-токен; короткие строки отсекаем как не-токены. */
function isTokenString(value: string): boolean {
  const v = value.trim()
  if (v.length < 12) return false
  if (/^[\w-]+\.[\w-]+\.[\w-]+$/.test(v)) return true
  return /^[A-Za-z0-9_-]{20,}$/.test(v)
}

function pushToken(
  out: UserTokenEntry[],
  path: string[],
  key: string,
  value: string,
): void {
  const trimmed = value.trim()
  if (!trimmed || !isTokenString(trimmed)) return
  const pathHint = path.length ? path.slice(-2).join('.') : ''
  const label = pathHint ? `${labelForKey(key)} (${pathHint})` : labelForKey(key)
  out.push({
    id: [...path, key].join('.'),
    key,
    label,
    value: trimmed,
  })
}

function parseTokenJsonObject(raw: string): { access_token?: string; refresh_token?: string } | null {
  try {
    const parsed = JSON.parse(raw) as unknown
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return null
    const o = parsed as Record<string, unknown>
    const access = typeof o.access_token === 'string' ? o.access_token : typeof o.accessToken === 'string' ? o.accessToken : undefined
    const refresh = typeof o.refresh_token === 'string' ? o.refresh_token : typeof o.refreshToken === 'string' ? o.refreshToken : undefined
    if (!access && !refresh) return null
    return { access_token: access, refresh_token: refresh }
  } catch {
    return null
  }
}

function extractFromTokenField(
  path: string[],
  value: DokiJson,
  out: UserTokenEntry[],
): boolean {
  if (typeof value === 'string') {
    const parsed = parseTokenJsonObject(value)
    if (parsed) {
      if (parsed.access_token) pushToken(out, path, 'access_token', parsed.access_token)
      if (parsed.refresh_token) pushToken(out, path, 'refresh_token', parsed.refresh_token)
      return Boolean(parsed.access_token || parsed.refresh_token)
    }
    if (isTokenString(value)) {
      pushToken(out, path, 'access_token', value)
      return true
    }
    return false
  }
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false
  const o = value as Record<string, DokiJson>
  let found = false
  if (typeof o.access_token === 'string') {
    pushToken(out, path, 'access_token', o.access_token)
    found = true
  }
  if (typeof o.refresh_token === 'string') {
    pushToken(out, path, 'refresh_token', o.refresh_token)
    found = true
  }
  if (typeof o.accessToken === 'string') {
    pushToken(out, path, 'access_token', o.accessToken)
    found = true
  }
  if (typeof o.refreshToken === 'string') {
    pushToken(out, path, 'refresh_token', o.refreshToken)
    found = true
  }
  if (typeof o.access === 'string') {
    pushToken(out, path, 'access_token', o.access)
    found = true
  }
  if (typeof o.refresh === 'string') {
    pushToken(out, path, 'refresh_token', o.refresh)
    found = true
  }
  return found
}

function extractFromEntities(path: string[], value: DokiJson, out: UserTokenEntry[]): void {
  if (!Array.isArray(value)) return
  for (const item of value) {
    if (!item || typeof item !== 'object' || Array.isArray(item)) continue
    const row = item as Record<string, DokiJson>
    const keywordRaw = row.keyword ?? row.id ?? row.name
    const keyword = typeof keywordRaw === 'string' ? keywordRaw.trim().toLowerCase() : ''
    const rowValue = row.value
    if (typeof rowValue !== 'string') continue
    if (keyword === 'access_token' || keyword === 'refresh_token') {
      pushToken(out, path, keyword, rowValue)
      continue
    }
    if (keyword === 'token' || keyword.endsWith('_token')) {
      extractFromTokenField(path, rowValue, out)
    }
  }
}

function walkTokens(node: DokiJson, path: string[], out: UserTokenEntry[]): void {
  if (node === null || node === undefined) return
  if (typeof node === 'string') return
  if (Array.isArray(node)) {
    node.forEach((item, i) => walkTokens(item, [...path, String(i)], out))
    return
  }
  if (typeof node !== 'object') return

  for (const [key, value] of Object.entries(node)) {
    const nextPath = [...path, key]
    if ((key === 'entities' || key === 'system_entities') && Array.isArray(value)) {
      extractFromEntities(nextPath, value, out)
      continue
    }
    if (key === 'token' || key === 'auth' || key === 'oauth') {
      if (extractFromTokenField(nextPath, value, out)) continue
    }
    if (typeof value === 'string' && LK_TOKEN_KEYS.has(key) && isTokenString(value)) {
      pushToken(out, path, key, value)
    } else if (typeof value === 'string' && key === 'accessToken' && isTokenString(value)) {
      pushToken(out, path, 'access_token', value)
    } else if (typeof value === 'string' && key === 'refreshToken' && isTokenString(value)) {
      pushToken(out, path, 'refresh_token', value)
    } else if (typeof value === 'string' && TOKEN_KEY_RE.test(key) && isTokenString(value)) {
      pushToken(out, path, key, value)
    } else if (value && typeof value === 'object') {
      walkTokens(value, nextPath, out)
    }
  }
}

/** Пара токенов для URL ЛК: access обязателен, refresh желателен. */
export type UserCabinetOAuthPair = {
  accessToken: string
  refreshToken?: string
}

type TokenSession = {
  accessToken: string
  refreshToken?: string
  lastUsedMs: number
}

function parseApiDateMs(value: unknown): number {
  if (typeof value !== 'string' || !value.trim()) return 0
  const ms = Date.parse(value.trim().replace(' ', 'T'))
  return Number.isFinite(ms) ? ms : 0
}

/** exp JWT в мс; без exp считаем токен «ещё живым» (opaque access без payload). */
function jwtExpiresAtMs(token: string): number {
  try {
    const payload = token.split('.')[1]
    if (!payload) return 0
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/')
    const json = JSON.parse(atob(normalized)) as { exp?: unknown }
    return typeof json.exp === 'number' ? json.exp * 1000 : 0
  } catch {
    return 0
  }
}

function isAccessTokenStillValid(token: string): boolean {
  const expMs = jwtExpiresAtMs(token)
  if (!expMs) return true
  return expMs > Date.now()
}

function collectTokenSessions(node: DokiJson, out: TokenSession[]): void {
  if (node === null || node === undefined) return
  if (Array.isArray(node)) {
    for (const item of node) collectTokenSessions(item, out)
    return
  }
  if (typeof node !== 'object') return

  const record = node as Record<string, DokiJson>
  const tokensVal = record.tokens
  if (Array.isArray(tokensVal)) {
    for (const item of tokensVal) {
      if (!item || typeof item !== 'object' || Array.isArray(item)) continue
      const row = item as Record<string, unknown>
      const accessRaw = row.access_token
      if (typeof accessRaw !== 'string' || !isTokenString(accessRaw)) continue
      const refreshRaw = row.refresh_token
      const refreshToken = typeof refreshRaw === 'string' && isTokenString(refreshRaw) ? refreshRaw : undefined
      out.push({
        accessToken: accessRaw.trim(),
        refreshToken,
        lastUsedMs: Math.max(parseApiDateMs(row.last_used), parseApiDateMs(row.created_at)),
      })
    }
  }

  for (const value of Object.values(record)) {
    if (value && typeof value === 'object') collectTokenSessions(value, out)
  }
}

/** Свежая валидная сессия; если все просрочены — берём последнюю used, чтобы кнопка ЛК не пропала. */
function pickBestTokenSession(sessions: TokenSession[]): TokenSession | undefined {
  if (!sessions.length) return undefined
  const valid = sessions.filter((s) => isAccessTokenStillValid(s.accessToken))
  const pool = valid.length ? valid : sessions
  return pool.reduce((best, cur) => (cur.lastUsedMs >= best.lastUsedMs ? cur : best))
}

/** user/info: access_token на user=null, пары в user.tokens[] — первый пользователь в ответе, свежая сессия. */
function getOAuthPairFromTokenSessions(data: DokiJson): UserCabinetOAuthPair | null {
  const sessions: TokenSession[] = []
  collectTokenSessions(data, sessions)
  const best = pickBestTokenSession(sessions)
  if (!best) return null
  return { accessToken: best.accessToken, refreshToken: best.refreshToken }
}

/** Первый блок user/info в ответе API (массив аккаунтов на один телефон). */
function primaryUserInfoNode(data: DokiJson | string): DokiJson | string {
  if (typeof data === 'string' || data === null || data === undefined) return data
  if (Array.isArray(data) && data.length > 0) {
    const first = data[0]
    if (first && typeof first === 'object') return first
  }
  return data
}

function tokenPathSegments(id: string): string[] {
  return id.split('.').map((segment) => segment.toLowerCase())
}

function isSignerTokenPath(id: string): boolean {
  const segments = tokenPathSegments(id)
  return segments.some((segment) => LK_SIGNER_PATH_MARKERS.includes(segment))
}

function isCreatedByTokenPath(id: string): boolean {
  const segments = tokenPathSegments(id)
  return segments.some((segment) => segment === 'created_by' || segment === 'createdby')
}

function tokenPathHasUserScope(id: string): boolean {
  const segments = tokenPathSegments(id)
  const scoped = [
    'created_by',
    'createdby',
    'target_user',
    'targetuser',
    'signer',
    'signers',
    'user',
    'client',
    'customer',
    'entrepreneur',
  ]
  return segments.some((segment) => scoped.includes(segment))
}

/**
 * Выбор access: не signer; created_by важнее; createdByOnly не берёт чужой user.
 * Иначе приоритет scope, затем корневой токен.
 */
function pickAccessTokenEntry(tokens: UserTokenEntry[], createdByOnly = false): UserTokenEntry | undefined {
  const accessTokens = tokens.filter((t) => t.key === 'access_token' && !isSignerTokenPath(t.id))
  if (!accessTokens.length) return undefined
  if (accessTokens.length === 1) return accessTokens[0]

  const createdBy = accessTokens.find((t) => isCreatedByTokenPath(t.id))
  if (createdBy) return createdBy

  if (createdByOnly) return undefined

  for (const scope of LK_USER_SCOPE_PRIORITY) {
    const match = accessTokens.find((t) => t.id.toLowerCase().includes(scope.toLowerCase()))
    if (match) return match
  }

  const rootLevel = accessTokens.find((t) => !tokenPathHasUserScope(t.id))
  if (rootLevel) return rootLevel

  return accessTokens[0]
}

function pickRefreshTokenEntry(
  tokens: UserTokenEntry[],
  accessEntry: UserTokenEntry | undefined,
): UserTokenEntry | undefined {
  const refreshTokens = tokens.filter((t) => t.key === 'refresh_token' && !isSignerTokenPath(t.id))
  if (!refreshTokens.length) return undefined
  if (accessEntry) {
    const accessPrefix = accessEntry.id.replace(/\.access_token$/, '')
    const sameScope = refreshTokens.find((t) => t.id.startsWith(`${accessPrefix}.`))
    if (sameScope) return sameScope
  }
  return refreshTokens.length === 1 ? refreshTokens[0] : refreshTokens.find((t) => accessEntry && isCreatedByTokenPath(t.id) === isCreatedByTokenPath(accessEntry.id)) ?? refreshTokens[0]
}

/** Пара OAuth для входа в ЛК (access обязателен). */
export function getUserCabinetOAuthPair(
  data: DokiJson | string,
  createdByOnly = false,
): UserCabinetOAuthPair | null {
  const scope = createdByOnly ? data : primaryUserInfoNode(data)

  if (!createdByOnly && typeof scope !== 'string' && scope && typeof scope === 'object') {
    const fromSessions = getOAuthPairFromTokenSessions(scope)
    if (fromSessions) return fromSessions
  }

  const tokens = collectUserTokens(scope)
  const accessEntry = pickAccessTokenEntry(tokens, createdByOnly)
  if (!accessEntry) return null
  const refreshEntry = pickRefreshTokenEntry(tokens, accessEntry)
  return { accessToken: accessEntry.value, refreshToken: refreshEntry?.value }
}

/** Есть ли в ответе пара токенов, достаточная для открытия ЛК. */
export function canOpenUserCabinet(data: DokiJson | string, createdByOnly = false): boolean {
  return getUserCabinetOAuthPair(data, createdByOnly) !== null
}

/** Все токены пользователя из ответа API (access, refresh и др.). */
export function collectUserTokens(data: DokiJson | string): UserTokenEntry[] {
  if (typeof data === 'string' || data === null || data === undefined) return []
  const out: UserTokenEntry[] = []
  walkTokens(data, [], out)
  const seen = new Set<string>()
  return out.filter((t) => {
    const sig = `${t.key}:${t.value}`
    if (seen.has(sig)) return false
    seen.add(sig)
    return true
  })
}

/** Базовый URL ЛК из env или desktop.doki.online/profile (без хвостового слэша). */
export function getUserCabinetBaseUrl(): string {
  const fromEnv = import.meta.env.VITE_USER_LK_URL?.trim()
  return (fromEnv || 'https://desktop.doki.online/profile').replace(/\/$/, '')
}

/**
 * Собирает URL ЛК с query access_token / refresh_token.
 * extra не перезаписывает эти два ключа — иначе сломается вход.
 */
export function buildUserCabinetUrl(parts: {
  accessToken?: string
  refreshToken?: string
  extra?: { param: string; value: string }
}): string {
  const url = new URL(getUserCabinetBaseUrl())
  if (parts.accessToken) url.searchParams.set('access_token', parts.accessToken)
  if (parts.refreshToken) url.searchParams.set('refresh_token', parts.refreshToken)
  if (parts.extra && !['access_token', 'refresh_token'].includes(parts.extra.param)) {
    url.searchParams.set(parts.extra.param, parts.extra.value)
  }
  return url.toString()
}

/** URL для входа в ЛК по выбранному токену и остальным из того же ответа. */
export function buildUserCabinetUrlForEntry(
  entry: UserTokenEntry,
  all: UserTokenEntry[],
): string {
  const access = all.find((t) => t.key === 'access_token')?.value
  const refresh = all.find((t) => t.key === 'refresh_token')?.value

  if (entry.key === 'access_token') {
    return buildUserCabinetUrl({ accessToken: entry.value, refreshToken: refresh })
  }
  if (entry.key === 'refresh_token') {
    return buildUserCabinetUrl({ accessToken: access, refreshToken: entry.value })
  }
  return buildUserCabinetUrl({
    accessToken: access,
    refreshToken: refresh,
    extra: { param: entry.key, value: entry.value },
  })
}

/** URL для входа в ЛК по токенам из ответа support API. */
export function getUserCabinetUrlFromResponse(data: DokiJson | string): string | null {
  const pair = getUserCabinetOAuthPair(data)
  if (!pair) return null
  return buildUserCabinetUrl({
    accessToken: pair.accessToken,
    refreshToken: pair.refreshToken,
  })
}

/** Открыть ЛК пользователя по токенам из ответа support API. */
export function openUserCabinetFromResponse(data: DokiJson | string): boolean {
  const url = getUserCabinetUrlFromResponse(data)
  if (!url) return false
  openUserCabinet(url)
  return true
}

/** Открывает ЛК в новой вкладке; noopener — чтобы не отдать window.opener. */
export function openUserCabinet(url: string): void {
  window.open(url, '_blank', 'noopener,noreferrer')
}
