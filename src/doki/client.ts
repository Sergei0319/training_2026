/**
 * HTTP к API Doki/Okidoki через fetch (экзамен 2.2, взаимодействие с API).
 */
import { getApiBaseForHost } from './apiBase'
import type { ApiHostKind } from '../methods/types'

/**
 * JSON-значение ответа API (рекурсивный тип, без Date/undefined).
 */
export type DokiJson =
  | string
  | number
  | boolean
  | null
  | DokiJson[]
  | { [k: string]: DokiJson }

/**
 * Ошибка HTTP: статус и сырое тело — для экрана ответа и журнала.
 */
export class DokiHttpError extends Error {
  readonly status: number
  readonly bodyText: string

  constructor(message: string, status: number, bodyText: string) {
    super(message)
    this.name = 'DokiHttpError'
    this.status = status
    this.bodyText = bodyText
  }
}

/** JSON по Content-Type; если парсинг упал — отдаём текст, чтобы не терять тело ошибки. */
async function parseBody(res: Response): Promise<DokiJson | string> {
  const ct = res.headers.get('content-type') || ''
  if (ct.includes('application/json')) {
    try {
      return (await res.json()) as DokiJson
    } catch {
      return await res.text()
    }
  }
  return await res.text()
}

/** Запрос к API с учётом хоста (doki.online / okidoki.ru). */
export async function dokiRequestForHost(
  pathWithQuery: string,
  init: RequestInit & { parseJson?: boolean } = {},
  host: ApiHostKind,
): Promise<{ status: number; data: DokiJson | string; contentType: string }> {
  const base = getApiBaseForHost(host)
  const path = pathWithQuery.startsWith('/') ? pathWithQuery : `/${pathWithQuery}`
  const url = `${base}${path}`
  const { parseJson, ...rest } = init
  // parseJson оставлен в сигнатуре для совместимости вызовов, на разбор тела не влияет.
  void parseJson
  const res = await fetch(url, {
    ...rest,
    headers: {
      Accept: 'application/json',
      ...(rest.headers as Record<string, string>),
    },
  })
  const contentType = res.headers.get('content-type') || ''
  // PDF/octet-stream нельзя json.parse — кладём маркер, UI покажет «бинарный ответ».
  if (contentType.includes('application/pdf') || contentType.includes('octet-stream')) {
    const buf = await res.arrayBuffer()
    if (!res.ok) {
      const text = new TextDecoder().decode(buf.slice(0, 500))
      throw new DokiHttpError(`HTTP ${res.status}`, res.status, text)
    }
    return {
      status: res.status,
      data: `__binary__:${contentType}:${buf.byteLength}`,
      contentType,
    }
  }
  const data = await parseBody(res)
  if (!res.ok) {
    const bodyText = typeof data === 'string' ? data : JSON.stringify(data)
    throw new DokiHttpError(`HTTP ${res.status}`, res.status, bodyText)
  }
  return { status: res.status, data, contentType }
}

/** @deprecated используйте dokiRequestForHost; оставлено для совместимости. */
export async function dokiRequest(
  path: string,
  init: RequestInit & { parseJson?: boolean } = {},
): Promise<{ status: number; data: DokiJson | string; contentType: string }> {
  return dokiRequestForHost(path, init, 'doki.online')
}

/**
 * Собирает query-строку с обязательным `api_key` партнёра и доп. параметрами.
 */
export function withApiKeyQuery(apiKey: string, params: Record<string, string> = {}): string {
  const q = new URLSearchParams({ api_key: apiKey, ...params })
  return `?${q.toString()}`
}
