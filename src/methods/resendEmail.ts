/**
 * Плитка переотправки писем по договору: режим роли vs email,
 * сбор JSON, валидация contract_id и списка, чтение черновика из storage.
 */
import type { SavedMethod } from './types'
import { firstErrorMessage, validateEmailValue, validateMongoObjectId } from '../forms/validateTileField'
import { labelForKey } from '../doki/labels'
import {
  getDefaultEntries,
  normalizeKeyValueEntries,
  type KeyValueFieldCatalogItem,
  type KeyValueFieldEntry,
} from './keyValueFields'

/** Кому слать: роли договора или явный список адресов. */
export type ResendEmailMode = 'roles' | 'emails'

/** Состояние формы переотправки: режим + строки каталога. */
export type ResendEmailMethodState = {
  mode: ResendEmailMode
  entries: KeyValueFieldEntry[]
}

const DEFAULT_CONTRACT_ID = '507f1f77bcf86cd799439011'

const ROLES_CATALOG: KeyValueFieldCatalogItem[] = [
  {
    key: 'contract_id',
    label: labelForKey('contract_id'),
    defaultValue: DEFAULT_CONTRACT_ID,
    inputMode: 'text',
  },
  {
    key: 'recipients',
    label: 'Получатели (роли, через запятую)',
    defaultValue: 'created_by, target_user',
    inputMode: 'text',
  },
]

const EMAILS_CATALOG: KeyValueFieldCatalogItem[] = [
  {
    key: 'contract_id',
    label: labelForKey('contract_id'),
    defaultValue: DEFAULT_CONTRACT_ID,
    inputMode: 'text',
  },
  {
    key: 'emails',
    label: 'E-mail (через запятую)',
    defaultValue: 'user@example.com, user2@example.com',
    inputMode: 'text',
  },
]

/** Опции переключателя режима на плитке. */
export const RESEND_EMAIL_MODE_OPTIONS: { value: ResendEmailMode; label: string }[] = [
  { value: 'roles', label: 'Переотправка по ролям' },
  { value: 'emails', label: 'Переотправка по email' },
]

/**
 * Плитка resend-emails: путь API или слово «письм» в названии (русские подписи коллекции).
 */
export function isResendEmailMethod(m: SavedMethod): boolean {
  const path = m.path.replace(/\?.*$/, '')
  const t = `${m.buttonLabel} ${m.name}`.toLowerCase()
  return path.endsWith('/support/contract/resend-emails') || t.includes('письм')
}

/** Каталог полей зависит от режима: recipients или emails. */
export function getResendEmailCatalog(mode: ResendEmailMode): KeyValueFieldCatalogItem[] {
  return mode === 'emails' ? EMAILS_CATALOG : ROLES_CATALOG
}

/** Начальное состояние формы (по умолчанию роли). */
export function getDefaultResendEmailState(mode: ResendEmailMode = 'roles'): ResendEmailMethodState {
  return {
    mode,
    entries: getDefaultEntries(getResendEmailCatalog(mode)),
  }
}

/** Список из строки: запятая, точка с запятой или перевод строки. */
function parseList(value: string): string[] {
  return value
    .split(/[,;\n]+/)
    .map((s) => s.trim())
    .filter(Boolean)
}

/**
 * Тело API: contract_id + массив recipients или emails.
 */
export function buildResendEmailBody(state: ResendEmailMethodState): string {
  const contractId = state.entries.find((e) => e.key === 'contract_id')?.value.trim() ?? ''
  const obj: Record<string, unknown> = { contract_id: contractId }
  if (state.mode === 'roles') {
    const raw = state.entries.find((e) => e.key === 'recipients')?.value ?? ''
    obj.recipients = parseList(raw)
  } else {
    const raw = state.entries.find((e) => e.key === 'emails')?.value ?? ''
    obj.emails = parseList(raw)
  }
  return JSON.stringify(obj, null, 2)
}

/**
 * Ошибки полей: ObjectId договора, непустой список, каждый email по маске.
 */
export function validateResendEmailFieldErrors(state: ResendEmailMethodState): Record<string, string> {
  const errors: Record<string, string> = {}
  const contractId = state.entries.find((e) => e.key === 'contract_id')?.value ?? ''
  const contractError = validateMongoObjectId(contractId, { required: true, label: 'ID договора' })
  if (contractError) errors.contract_id = contractError
  if (state.mode === 'roles') {
    const raw = state.entries.find((e) => e.key === 'recipients')?.value ?? ''
    if (!parseList(raw).length) {
      errors.recipients = 'Поле «Получатели» неверно: укажите хотя бы одну роль'
    }
  } else {
    const raw = state.entries.find((e) => e.key === 'emails')?.value ?? ''
    const emails = parseList(raw)
    if (!emails.length) {
      errors.emails = 'Поле «E-mail» неверно: укажите хотя бы один адрес'
    } else {
      for (const email of emails) {
        const emailError = validateEmailValue(email, { required: true, label: 'E-mail' })
        if (emailError) {
          errors.emails = emailError
          break
        }
      }
    }
  }
  return errors
}

/** Первая ошибка формы или `null`. */
export function validateResendEmailState(state: ResendEmailMethodState): string | null {
  return firstErrorMessage(validateResendEmailFieldErrors(state))
}

/**
 * Черновик из storage: mode emails / emails_only → emails, иначе roles.
 */
export function normalizeResendEmailState(raw: unknown): ResendEmailMethodState {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return getDefaultResendEmailState('roles')
  }
  const r = raw as Record<string, unknown>
  const mode: ResendEmailMode = r.mode === 'emails' || r.mode === 'emails_only' ? 'emails' : 'roles'
  const catalog = getResendEmailCatalog(mode)
  const entries = normalizeKeyValueEntries(r.entries, catalog)
  return { mode, entries }
}
