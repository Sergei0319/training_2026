/**
 * Конфиг Vite: React, Cloudflare-плагин и dev-прокси к Doki / Okidoki.
 * Цели прокси берутся из `.env` (`VITE_DOKI_PROXY_TARGET`, `VITE_OKIDOKI_PROXY_TARGET`).
 */
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { cloudflare } from '@cloudflare/vite-plugin'

// https://vite.dev/config/
/**
 * Фабрика конфига. `mode` нужен, чтобы `loadEnv` подхватил `.env.development` / `.env.production`.
 */
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const dokiProxyTarget = env.VITE_DOKI_PROXY_TARGET?.trim() || 'https://api.doki.online'
  const okidokiProxyTarget = env.VITE_OKIDOKI_PROXY_TARGET?.trim() || 'https://api.okidoki.ru'
  const proxyToLocal = dokiProxyTarget.includes('localhost') || dokiProxyTarget.includes('127.0.0.1')

  return {
    plugins: [react(), cloudflare()],
    server: {
      proxy: {
        '/doki-proxy': {
          target: dokiProxyTarget,
          changeOrigin: true,
          rewrite: (p) => p.replace(/^\/doki-proxy/, ''),
          // Локальный HTTP-мок без валидного TLS: `secure: false`, иначе Vite отклонит сертификат.
          secure: !proxyToLocal,
        },
        '/okidoki-proxy': {
          target: okidokiProxyTarget,
          changeOrigin: true,
          rewrite: (p) => p.replace(/^\/okidoki-proxy/, ''),
          secure: !proxyToLocal,
        },
      },
    },
  }
})
