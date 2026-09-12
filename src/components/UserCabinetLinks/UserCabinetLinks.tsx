/**
 * Кнопки перехода в ЛК пользователя, если в ответе API есть OAuth-пара и URL кабинета.
 * Копирование ссылки: clipboard API, при отказе — window.prompt.
 */
import { useEffect, useMemo, useRef, useState } from 'react'
import type { DokiJson } from '../../doki/client'
import {
  getUserCabinetBaseUrl,
  getUserCabinetOAuthPair,
  getUserCabinetUrlFromResponse,
  openUserCabinetFromResponse,
} from '../../doki/userCabinet'
import './UserCabinetLinks.scss'

type Props = {
  data: DokiJson | string
}

/**
 * Блок «Личный кабинет пользователя»: открыть ЛК и скопировать ссылку.
 * Без пары токенов или URL компонент не рендерится.
 */
export function UserCabinetLinks({ data }: Props) {
  const pair = useMemo(() => getUserCabinetOAuthPair(data), [data])
  const cabinetUrl = useMemo(() => getUserCabinetUrlFromResponse(data), [data])
  const [copied, setCopied] = useState(false)
  const copyTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(
    () => () => {
      // Снимаем таймер «Скопировано», если блок размонтировали раньше 2 с.
      if (copyTimer.current) clearTimeout(copyTimer.current)
    },
    [],
  )

  if (!pair || !cabinetUrl) return null

  /** Копирует URL кабинета; при блокировке clipboard показывает prompt. */
  const copyCabinetUrl = async () => {
    try {
      await navigator.clipboard.writeText(cabinetUrl)
      setCopied(true)
      if (copyTimer.current) clearTimeout(copyTimer.current)
      copyTimer.current = setTimeout(() => setCopied(false), 2000)
    } catch {
      window.prompt('Скопируйте ссылку:', cabinetUrl)
    }
  }

  return (
    <div className="user-cabinet">
      <div className="user-cabinet__head">
        <span className="user-cabinet__title">Личный кабинет пользователя</span>
        <span className="user-cabinet__base muted" title={getUserCabinetBaseUrl()}>
          {getUserCabinetBaseUrl()}
        </span>
      </div>
      <div className="user-cabinet__actions">
        <button
          type="button"
          className="btn btn--primary user-cabinet__btn"
          onClick={() => openUserCabinetFromResponse(data)}
        >
          Открыть ЛК пользователя
        </button>
        <button
          type="button"
          className="btn btn--primary user-cabinet__btn"
          onClick={() => void copyCabinetUrl()}
        >
          {copied
            ? 'Скопировано'
            : 'Скопировать ссылку для перехода в личный кабинет пользователя'}
        </button>
      </div>
      <p className="user-cabinet__hint muted">
        Откроется {getUserCabinetBaseUrl()} под учётной записью пользователя из ответа API.
        {pair.refreshToken ? ' Передаются access и refresh token.' : ' Передаётся access token.'}
      </p>
    </div>
  )
}
