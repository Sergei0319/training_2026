/**
 * Панель «Доступ к API» на странице настроек: адреса хостов, статус SMS-сессии,
 * ключ партнёра для шаблонов {{partnerApiKey}} (localStorage).
 */
import { useAuth, useMethods, useSettings } from '../../desk/hooks'
import './ApiAccessPanel.scss'

/** Поля доступа: read-only базы API и сессия, редактируемый partner API key. */
export function ApiAccessPanel() {
  const { sessionOwner } = useAuth()
  const { dokiBase, okiBase, partnerApiKey, setPartnerApiKey } = useSettings()
  const { saveHint } = useMethods()
  return (
    <section className="panel">
      <h2 className="panel__title">Доступ к API</h2>
      <label className="field">
        <span className="field__label">Базовый адрес api.doki.online</span>
        <input className="field__input field__input--mono" readOnly value={dokiBase} />
      </label>
      <label className="field">
        <span className="field__label">Базовый адрес api.okidoki.ru</span>
        <input className="field__input field__input--mono" readOnly value={okiBase} />
      </label>
      <label className="field">
        <span className="field__label">Сессия поддержки</span>
        <input
          className="field__input field__input--mono"
          readOnly
          value={sessionOwner ? `Вход выполнен: ${sessionOwner}` : 'Активная сессия'}
        />
      </label>
      <p className="muted oki-hint">
        Bearer-токен выдаётся после входа по SMS и хранится только в sessionStorage этого браузера.
        Статичные токены из настроек больше не используются.
      </p>
      <label className="field">
        <span className="field__label">Ключ партнёра для подстановки {'{{partnerApiKey}}'}</span>
        <input
          className="field__input field__input--mono"
          type="password"
          autoComplete="off"
          value={partnerApiKey}
          onChange={(e) => setPartnerApiKey(e.target.value)}
          placeholder="Если используется в query или теле"
        />
      </label>
      <p className="muted oki-hint">
        Параметры запросов (телефон, ID договора, бонусы и др.) настраиваются у каждого запроса и в окне ⚙.
        Глобально здесь ключ партнёра для подстановки в шаблоны.
      </p>
      <p className="muted oki-hint">
        Операции сохраняются автоматически при изменении; кнопка ниже — принудительное сохранение в localStorage.
      </p>
      {saveHint === 'saved' ? <p className="save-hint">Сохранено в этом браузере</p> : null}
    </section>
  )
}
