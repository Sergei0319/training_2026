/**
 * Нормализация SavedMethod из localStorage/импорта: дефолты полей, хост,
 * whitelist tileParamIds, миграции названий «бонус»→«баланс», канал верификации.
 */
import type { ApiHostKind, SavedMethod } from './types'
import { scrubTileParamsInImportedText } from './templates'
import type { TileParamId } from './tileParams'
import { isEntrepreneurUserUpdateMethod } from './entrepreneurUpdate'
import { isIndividualUserUpdateMethod } from './individualUpdate'
import { isResendEmailMethod } from './resendEmail'
import { isUserInfoSupportMethod } from './userInfoLookup'
import { withVerificationChannelBody } from './verificationResend'

const LEGACY_USER_INFO_METHOD_TITLE = 'информация по токену лк поддержки'
/** Актуальное название плитки GET /support/user/info. */
export const USER_INFO_METHOD_TITLE = 'Получение информации по юзеру'
/** Старое название плитки add-bonus по user id (для скрытия и миграции). */
export const LEGACY_ADD_BONUS_BY_USER_ID_TITLE = 'Добавления бонуса по юзер id'
/** Каноническое название плитки баланса по user id. */
export const ADD_BALANCE_BY_USER_ID_TITLE = 'Добавления баланса по юзер id'
/** Legacy: «бонус в днях». */
export const LEGACY_ADD_BONUS_DAYS_TITLE = 'Добавления бонуса в днях'
/** Канон: подписка в днях. */
export const ADD_SUBSCRIPTION_DAYS_TITLE = 'Добавления подписки в днях'
/** Legacy: бонус к пакету. */
export const LEGACY_ADD_BONUS_PREPAID_PACKAGE_TITLE = 'Добавления бонуса в единицах к пакету'
/** Канон: баланс к пакету. */
export const ADD_BALANCE_PREPAID_PACKAGE_TITLE = 'Добавления баланса в единицах к пакету'
/** Legacy: бонус ИИ. */
export const LEGACY_ADD_BONUS_AI_TITLE = 'Добавления бонуса ИИ'
/** Канон: баланс ИИ. */
export const ADD_BALANCE_AI_TITLE = 'Добавления баланса ИИ'

function applyUserInfoMethodTitle(m: SavedMethod): SavedMethod {
  if (!isUserInfoSupportMethod(m)) return m
  const legacy = LEGACY_USER_INFO_METHOD_TITLE.toLowerCase()
  const matchesLegacy =
    m.name.trim().toLowerCase() === legacy || m.buttonLabel.trim().toLowerCase() === legacy
  if (!matchesLegacy) return m
  return { ...m, name: USER_INFO_METHOD_TITLE, buttonLabel: USER_INFO_METHOD_TITLE }
}

function applyAddBonusByUserIdMethodTitle(m: SavedMethod): SavedMethod {
  if (!m.path.includes('add-bonus')) return m
  const legacy = LEGACY_ADD_BONUS_BY_USER_ID_TITLE.toLowerCase()
  const matchesLegacy =
    m.name.trim().toLowerCase() === legacy || m.buttonLabel.trim().toLowerCase() === legacy
  if (!matchesLegacy) return m
  return { ...m, name: ADD_BALANCE_BY_USER_ID_TITLE, buttonLabel: ADD_BALANCE_BY_USER_ID_TITLE }
}

function applyAddSubscriptionDaysMethodTitle(m: SavedMethod): SavedMethod {
  if (!isAddSubscriptionDaysMethod(m)) return m
  const legacy = LEGACY_ADD_BONUS_DAYS_TITLE.toLowerCase()
  const matchesLegacy =
    m.name.trim().toLowerCase() === legacy || m.buttonLabel.trim().toLowerCase() === legacy
  if (!matchesLegacy) return m
  return { ...m, name: ADD_SUBSCRIPTION_DAYS_TITLE, buttonLabel: ADD_SUBSCRIPTION_DAYS_TITLE }
}

function applyAddBalancePrepaidPackageMethodTitle(m: SavedMethod): SavedMethod {
  if (!isAddBalancePrepaidPackageMethod(m)) return m
  const legacy = LEGACY_ADD_BONUS_PREPAID_PACKAGE_TITLE.toLowerCase()
  const matchesLegacy =
    m.name.trim().toLowerCase() === legacy || m.buttonLabel.trim().toLowerCase() === legacy
  if (!matchesLegacy) return m
  return {
    ...m,
    name: ADD_BALANCE_PREPAID_PACKAGE_TITLE,
    buttonLabel: ADD_BALANCE_PREPAID_PACKAGE_TITLE,
  }
}

function applyAddBalanceAiMethodTitle(m: SavedMethod): SavedMethod {
  if (!isAddBalanceAiMethod(m)) return m
  const legacy = LEGACY_ADD_BONUS_AI_TITLE.toLowerCase()
  const matchesLegacy =
    m.name.trim().toLowerCase() === legacy || m.buttonLabel.trim().toLowerCase() === legacy
  if (!matchesLegacy) return m
  return { ...m, name: ADD_BALANCE_AI_TITLE, buttonLabel: ADD_BALANCE_AI_TITLE }
}

function applyMethodTitleMigrations(m: SavedMethod): SavedMethod {
  return applyAddBalanceAiMethodTitle(
    applyAddBalancePrepaidPackageMethodTitle(
      applyAddSubscriptionDaysMethodTitle(
        applyAddBonusByUserIdMethodTitle(applyUserInfoMethodTitle(m)),
      ),
    ),
  )
}

/**
 * POST add-bonus с полем ai_chat_balance (плейсхолдер или литерал в JSON).
 */
export function isAddBalanceAiMethod(m: SavedMethod): boolean {
  if (m.method.toUpperCase() !== 'POST' || !m.path.includes('add-bonus')) return false
  const body = m.body ?? ''
  return body.includes('{{aiChatBalance}}') || /"ai_chat_balance"\s*:/.test(body)
}

/**
 * add-bonus пакета prepaid по телефону: есть prepaid_contracts_count, нет user_id, есть phone.
 */
export function isAddBalancePrepaidPackageMethod(m: SavedMethod): boolean {
  if (m.method.toUpperCase() !== 'POST' || !m.path.includes('add-bonus')) return false
  const body = m.body ?? ''
  if (!body.includes('prepaid_contracts_count') && !body.includes('{{prepaidContractsCount}}')) {
    return false
  }
  if (body.includes('{{userId}}') || /"user_id"\s*:/.test(body)) return false
  return body.includes('{{phoneNumber}}') || /"phone_number"\s*:/.test(body)
}

/**
 * add-bonus с полем days (подписка в днях).
 */
export function isAddSubscriptionDaysMethod(m: SavedMethod): boolean {
  if (m.method.toUpperCase() !== 'POST' || !m.path.includes('add-bonus')) return false
  const body = m.body ?? ''
  return body.includes('{{days}}') || /"days"\s*:/.test(body)
}

/**
 * add-bonus «по юзер id»: путь + слова юзер и бонус/баланс в подписи.
 */
export function isAddBonusByUserIdMethod(m: SavedMethod): boolean {
  const t = `${m.buttonLabel} ${m.name}`.toLowerCase()
  return (
    t.includes('юзер') &&
    (t.includes('бонус') || t.includes('баланс')) &&
    m.path.includes('add-bonus')
  )
}

/** Восстанавливает prepaid_contracts_count в теле «баланс по user id», если поле было удалено ранее. */
function ensureAddBonusByUserIdPrepaidField(m: SavedMethod): SavedMethod {
  if (!isAddBonusByUserIdMethod(m) || !m.body) return m
  if (m.body.includes('prepaid_contracts_count')) return m
  const body = m.body.replace(
    /("user_id"\s*:\s*"\{\{userId\}\}")(\s*\r?\n\s*\})/,
    '$1,\r\n  "prepaid_contracts_count": {{prepaidContractsCount}}$2',
  )
  if (body === m.body) return m
  return { ...m, body }
}

/** Приводит объект из localStorage / импорта к актуальному SavedMethod. */
export function normalizeSavedMethod(raw: unknown): SavedMethod | null {
  if (!raw || typeof raw !== 'object') return null
  const m = raw as Record<string, unknown>
  if (typeof m.id !== 'string') return null
  const name = typeof m.name === 'string' ? m.name : 'Операция'
  const buttonLabel =
    typeof m.buttonLabel === 'string' && m.buttonLabel.trim() ? m.buttonLabel.trim() : name
  const method = typeof m.method === 'string' ? m.method : 'GET'
  const path = typeof m.path === 'string' ? m.path : '/'
  const query = Array.isArray(m.query)
    ? (m.query as unknown[])
        .map((row) => {
          if (!row || typeof row !== 'object') return null
          const r = row as Record<string, unknown>
          const key = typeof r.key === 'string' ? r.key : ''
          const value = typeof r.value === 'string' ? r.value : ''
          return { key, value: scrubTileParamsInImportedText(value) }
        })
        .filter((x): x is { key: string; value: string } => Boolean(x && x.key))
    : []
  const headers = Array.isArray(m.headers)
    ? (m.headers as unknown[])
        .map((row) => {
          if (!row || typeof row !== 'object') return null
          const r = row as Record<string, unknown>
          const key = typeof r.key === 'string' ? r.key : ''
          const value = typeof r.value === 'string' ? r.value : ''
          return { key, value: scrubTileParamsInImportedText(value) }
        })
        .filter((x): x is { key: string; value: string } => Boolean(x && x.key))
    : []
  const rawBody = typeof m.body === 'string' || m.body === null ? (m.body as string | null) : null
  const body = typeof rawBody === 'string' ? scrubTileParamsInImportedText(rawBody) : rawBody
  const useBearer = Boolean(m.useBearer)
  const apiHost = m.apiHost === 'okidoki.ru' ? 'okidoki.ru' : 'doki.online'
  const tileParamIds = Array.isArray(m.tileParamIds)
    ? (m.tileParamIds as unknown[])
        .filter((x): x is string => typeof x === 'string')
        .filter((x): x is TileParamId =>
          [
            'phoneNumber',
            'userEmail',
            'taxId',
            'contractId',
            'packageId',
            'userId',
            'prepaidContractsCount',
            'days',
            'templateId',
            'aiChatBalance',
            'channel',
            'note',
          ].includes(x),
        )
    : undefined
  const normalized = ensureAddBonusByUserIdPrepaidField(
    withVerificationChannelBody({
      id: m.id,
      name,
      buttonLabel,
      method,
      path,
      query,
      headers,
      body,
      useBearer,
      apiHost: apiHost as ApiHostKind,
      tileParamIds: tileParamIds?.length ? tileParamIds : undefined,
    }),
  )
  if (
    isEntrepreneurUserUpdateMethod(normalized) ||
    isIndividualUserUpdateMethod(normalized) ||
    isResendEmailMethod(normalized)
  ) {
    // У спец-форм свои поля UI — плейсхолдеры плитки не нужны и путают настройки.
    return applyMethodTitleMigrations({ ...normalized, tileParamIds: undefined })
  }
  return applyMethodTitleMigrations(normalized)
}
