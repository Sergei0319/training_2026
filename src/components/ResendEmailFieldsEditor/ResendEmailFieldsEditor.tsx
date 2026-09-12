/**
 * Редактор повторной отправки писем: выбор режима (роли и т.д.) и поля тела из каталога режима.
 * При смене режима сохраняются contract_id и emails, остальные ключи берутся из нового каталога.
 */
import {
  getResendEmailCatalog,
  RESEND_EMAIL_MODE_OPTIONS,
  type ResendEmailMethodState,
  type ResendEmailMode,
} from '../../methods/resendEmail'
import { KeyValueFieldsEditor } from '../KeyValueFieldsEditor/KeyValueFieldsEditor'
import './ResendEmailFieldsEditor.scss'

type Props = {
  state: ResendEmailMethodState
  onChange: (state: ResendEmailMethodState) => void
  disabled?: boolean
  fieldErrors?: Record<string, string>
}

/**
 * Форма resend-email: select варианта запроса + динамический список полей.
 */
export function ResendEmailFieldsEditor({ state, onChange, disabled, fieldErrors }: Props) {
  const catalog = getResendEmailCatalog(state.mode)

  /** Смена режима пересобирает entries; общие ключи (договор, emails) переносятся. */
  const setMode = (mode: ResendEmailMode) => {
    if (mode === state.mode) return
    const contractId = state.entries.find((e) => e.key === 'contract_id')?.value.trim()
    const emails = state.entries.find((e) => e.key === 'emails')?.value.trim()
    const entries = getResendEmailCatalog(mode).map((d) => {
      if (d.key === 'contract_id' && contractId) return { key: d.key, value: contractId }
      if (d.key === 'emails' && emails) return { key: d.key, value: emails }
      return { key: d.key, value: d.defaultValue }
    })
    onChange({ mode, entries })
  }

  return (
    <div onClick={(e) => e.stopPropagation()}>
      <label className="kv-fields__mode">
        <span className="kv-fields__mode-label">Вариант запроса</span>
        <select
          className="kv-fields__mode-select"
          value={state.mode}
          disabled={disabled}
          onChange={(e) => setMode(e.target.value as ResendEmailMode)}
        >
          {RESEND_EMAIL_MODE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </label>
      <KeyValueFieldsEditor
        catalog={catalog}
        entries={state.entries}
        disabled={disabled}
        fieldErrors={fieldErrors}
        onChange={(entries) => onChange({ ...state, entries })}
      />
    </div>
  )
}
