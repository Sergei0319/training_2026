/**
 * Cloudflare Worker: на проде проксирует `/doki-proxy` и `/okidoki-proxy` (как Vite proxy в dev),
 * остальное отдаёт статику из `ASSETS`.
 */

/** Прокси API на проде (аналог Vite proxy в dev). */
const API_PROXIES: { prefix: string; target: string }[] = [
  { prefix: '/doki-proxy', target: 'https://api.doki.online' },
  { prefix: '/okidoki-proxy', target: 'https://api.okidoki.ru' },
]

/**
 * Переписывает URL запроса: префикс прокси снимается, host заменяется на целевой API.
 * Host из исходных заголовков удаляем — иначе апстрим видит хост воркера.
 */
function proxyRequest(request: Request, prefix: string, targetOrigin: string): Request {
  const url = new URL(request.url)
  const apiPath = url.pathname.slice(prefix.length) || '/'
  const apiUrl = `${targetOrigin}${apiPath}${url.search}`

  const headers = new Headers(request.headers)
  headers.delete('host')

  return new Request(apiUrl, {
    method: request.method,
    headers,
    // GET/HEAD с body запрещены Fetch API — иначе прокси падает на чтении.
    body: request.method !== 'GET' && request.method !== 'HEAD' ? request.body : undefined,
    redirect: 'follow',
  })
}

/** Префикс совпадает целиком или как начало пути (`/doki-proxy/v1/...`). */
function matchesProxy(pathname: string, prefix: string): boolean {
  return pathname === prefix || pathname.startsWith(`${prefix}/`)
}

/**
 * Точка входа воркера: сначала прокси API, иначе статика фронтенда.
 */
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const { pathname } = new URL(request.url)

    for (const { prefix, target } of API_PROXIES) {
      if (matchesProxy(pathname, prefix)) {
        return fetch(proxyRequest(request, prefix, target))
      }
    }

    return env.ASSETS.fetch(request)
  },
}

/** Привязки Cloudflare: `ASSETS` — собранный Vite-бандл. */
interface Env {
  ASSETS: Fetcher
}
