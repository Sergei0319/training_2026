/**
 * Импорт коллекции Postman v2: item → SavedMethod, разбор url/query/headers/body,
 * замена демо api_key и scrub плейсхолдеров, заготовка пустой операции.
 */
import type { ApiHostKind, SavedMethod } from './types'
import { scrubImported } from './templates'
import { withVerificationChannelBody } from './verificationResend'

type PMQuery = { key: string; value?: string; disabled?: boolean }
type PMUrl = string | { raw?: string; host?: string[]; path?: string[]; query?: PMQuery[]; protocol?: string }

type PMRequest = {
  method?: string
  header?: { key: string; value?: string; disabled?: boolean }[]
  body?: { mode?: string; raw?: string }
  url: PMUrl
  auth?: { type?: string; bearer?: { key: string; value: string }[] }
}

type PMItem = { name?: string; request?: PMRequest | string }

/** Демо-ключ из коллекции — при импорте меняем на {{partnerApiKey}}. */
const EXAMPLE_PARTNER_KEY = '665f09e7871f36cd185b73cf'

function hostKindFromHostname(hostname: string): ApiHostKind {
  if (hostname.includes('okidoki')) return 'okidoki.ru'
  return 'doki.online'
}

/** Postman url: строка, raw или host+path+query → URL для pathname/search. */
function postmanUrlToURL(urlField: PMUrl): URL {
  if (typeof urlField === 'string') {
    return new URL(urlField)
  }
  if (urlField.raw) {
    return new URL(urlField.raw)
  }
  const host = (urlField.host || []).join('.')
  const pathParts = urlField.path || []
  const path = pathParts.length ? `/${pathParts.join('/')}` : '/'
  const u = new URL(`https://${host}${path}`)
  for (const q of urlField.query || []) {
    if (q.disabled || !q.key) continue
    u.searchParams.append(q.key, q.value ?? '')
  }
  return u
}

function newMethodId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID()
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

/**
 * Один запрос коллекции → SavedMethod или null (папка без request, битый URL).
 */
export function postmanItemToSavedMethod(item: PMItem, index: number): SavedMethod | null {
  const r = item.request
  if (!r || typeof r === 'string') return null
  const method = (r.method || 'GET').toUpperCase()
  let u: URL
  try {
    u = postmanUrlToURL(r.url)
  } catch {
    return null
  }
  const path = u.pathname || '/'
  const query: { key: string; value: string }[] = []
  u.searchParams.forEach((value, key) => {
    query.push({ key, value: scrubImported(value, EXAMPLE_PARTNER_KEY) })
  })
  const headers =
    (r.header || [])
      .filter((h) => h && !h.disabled && h.key)
      .map((h) => ({
        key: h.key,
        value: scrubImported(h.value ?? '', EXAMPLE_PARTNER_KEY),
      })) ?? []
  let body: string | null = null
  if (r.body?.mode === 'raw' && typeof r.body.raw === 'string' && r.body.raw.trim()) {
    body = scrubImported(r.body.raw.trim(), EXAMPLE_PARTNER_KEY)
  }
  const useBearer = r.auth?.type === 'bearer' || Boolean(r.auth?.bearer?.length)
  const name = item.name?.trim() || `Операция ${index + 1}`
  return withVerificationChannelBody({
      id: newMethodId(),
      name,
      buttonLabel: name,
      method,
      path,
      query,
      headers,
      body,
      useBearer,
      apiHost: hostKindFromHostname(u.hostname),
    })
}

/**
 * Корневой `item[]` коллекции (без рекурсии папок) → список операций.
 */
export function parsePostmanCollection(json: unknown): SavedMethod[] {
  const root = json as { item?: PMItem[] }
  if (!root.item || !Array.isArray(root.item)) return []
  const out: SavedMethod[] = []
  root.item.forEach((item, i) => {
    const m = postmanItemToSavedMethod(item, i)
    if (m) out.push(m)
  })
  return out
}

/** Пустая плитка для редактора: GET /support/, Bearer, хост doki.online. */
export function createEmptyMethod(): SavedMethod {
  return {
    id: newMethodId(),
    name: 'Новая операция',
    buttonLabel: 'Новая операция',
    method: 'GET',
    path: '/support/',
    query: [],
    headers: [],
    body: null,
    useBearer: true,
    apiHost: 'doki.online',
  }
}
