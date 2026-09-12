/**
 * Синхронизация встроенной коллекции Postman с сохранённым списком плиток:
 * скрытие удалённых операций, дедупликация дублей после переименований, дозапись новых.
 */
import type { SavedMethod } from './types'
import { normalizeUserInfoRequestPath } from './userInfoLookup'
import {
  ADD_BALANCE_AI_TITLE,
  ADD_BALANCE_BY_USER_ID_TITLE,
  ADD_BALANCE_PREPAID_PACKAGE_TITLE,
  ADD_SUBSCRIPTION_DAYS_TITLE,
  isAddBalanceAiMethod,
  isAddBalancePrepaidPackageMethod,
  isAddBonusByUserIdMethod,
  isAddSubscriptionDaysMethod,
  LEGACY_ADD_BONUS_AI_TITLE,
  LEGACY_ADD_BONUS_BY_USER_ID_TITLE,
  LEGACY_ADD_BONUS_DAYS_TITLE,
  LEGACY_ADD_BONUS_PREPAID_PACKAGE_TITLE,
} from './normalizeMethod'

/** Убраны из встроенной коллекции — не показывать в плитках и настройках. */
const REMOVED_BUNDLED_METHOD_NAMES = new Set([
  '200 Запрос информации по договору',
  '200 запрос информации по пользователю',
  'информация по email лк поддержки',
  'информация по ИНН лк поддержки',
  'информация по токену лк поддержки',
  LEGACY_ADD_BONUS_BY_USER_ID_TITLE,
  LEGACY_ADD_BONUS_DAYS_TITLE,
  LEGACY_ADD_BONUS_PREPAID_PACKAGE_TITLE,
  LEGACY_ADD_BONUS_AI_TITLE,
  'Отправка кода MAX',
  'Отправка кода смс',
  'Звонок отправка кода',
  'Отправка кода телеграм',
  'Изменение данных пользователя  Физика копия',
  'Проверка карточек на окидоки',
  'Пакет: снять срок и убрать апгрейды',
])

/**
 * Выкидывает плитки, которые больше не входят во встроенную коллекцию
 * (и старые названия, чтобы не всплыли из localStorage).
 */
export function withoutRemovedBundledMethods(methods: SavedMethod[]): SavedMethod[] {
  return methods.filter(
    (m) => !REMOVED_BUNDLED_METHOD_NAMES.has(m.name) && !REMOVED_BUNDLED_METHOD_NAMES.has(m.buttonLabel),
  )
}

/** Ключ «та же операция»: метод + путь + название (для mergeMissing). */
function methodKey(m: SavedMethod): string {
  const name = (m.name || m.buttonLabel || '').trim()
  return `${m.method.toUpperCase()}:${m.path}:${name}`
}

const USER_INFO_CANONICAL_TITLE = 'Получение информации по юзеру'

function isSupportUserInfoMethod(m: SavedMethod): boolean {
  return m.method.toUpperCase() === 'GET' && normalizeUserInfoRequestPath(m.path) === '/support/user/info'
}

function withUserInfoCanonicalTitle(m: SavedMethod): SavedMethod {
  if ((m.buttonLabel || m.name).trim() === USER_INFO_CANONICAL_TITLE) return m
  return { ...m, name: USER_INFO_CANONICAL_TITLE, buttonLabel: USER_INFO_CANONICAL_TITLE }
}

/** Оставляет одну плитку GET /support/user/info (после переименований могли накопиться дубликаты). */
export function dedupeSupportUserInfoMethods(methods: SavedMethod[]): SavedMethod[] {
  const userInfoMethods = methods.filter(isSupportUserInfoMethod)
  if (userInfoMethods.length <= 1) {
    return methods.map((m) => (isSupportUserInfoMethod(m) ? withUserInfoCanonicalTitle(m) : m))
  }

  const kept =
    userInfoMethods.find((m) => (m.buttonLabel || m.name).trim() === USER_INFO_CANONICAL_TITLE) ??
    userInfoMethods[0]
  const keptId = kept.id

  return methods
    .filter((m) => !isSupportUserInfoMethod(m) || m.id === keptId)
    .map((m) => (m.id === keptId ? withUserInfoCanonicalTitle(m) : m))
}

function withAddBalanceByUserIdCanonicalTitle(m: SavedMethod): SavedMethod {
  if ((m.buttonLabel || m.name).trim() === ADD_BALANCE_BY_USER_ID_TITLE) return m
  return { ...m, name: ADD_BALANCE_BY_USER_ID_TITLE, buttonLabel: ADD_BALANCE_BY_USER_ID_TITLE }
}

/** Оставляет одну плитку POST /support/user/add-bonus по user id. */
export function dedupeAddBalanceByUserIdMethods(methods: SavedMethod[]): SavedMethod[] {
  const matches = methods.filter(isAddBonusByUserIdMethod)
  if (matches.length <= 1) {
    return methods.map((m) => (isAddBonusByUserIdMethod(m) ? withAddBalanceByUserIdCanonicalTitle(m) : m))
  }

  const kept =
    matches.find((m) => (m.buttonLabel || m.name).trim() === ADD_BALANCE_BY_USER_ID_TITLE) ??
    matches[0]
  const keptId = kept.id

  return methods
    .filter((m) => !isAddBonusByUserIdMethod(m) || m.id === keptId)
    .map((m) => (m.id === keptId ? withAddBalanceByUserIdCanonicalTitle(m) : m))
}

function withAddSubscriptionDaysCanonicalTitle(m: SavedMethod): SavedMethod {
  if ((m.buttonLabel || m.name).trim() === ADD_SUBSCRIPTION_DAYS_TITLE) return m
  return { ...m, name: ADD_SUBSCRIPTION_DAYS_TITLE, buttonLabel: ADD_SUBSCRIPTION_DAYS_TITLE }
}

/** Оставляет одну плитку POST /support/user/add-bonus с полем days. */
export function dedupeAddSubscriptionDaysMethods(methods: SavedMethod[]): SavedMethod[] {
  const matches = methods.filter(isAddSubscriptionDaysMethod)
  if (matches.length <= 1) {
    return methods.map((m) =>
      isAddSubscriptionDaysMethod(m) ? withAddSubscriptionDaysCanonicalTitle(m) : m,
    )
  }

  const kept =
    matches.find((m) => (m.buttonLabel || m.name).trim() === ADD_SUBSCRIPTION_DAYS_TITLE) ??
    matches[0]
  const keptId = kept.id

  return methods
    .filter((m) => !isAddSubscriptionDaysMethod(m) || m.id === keptId)
    .map((m) => (m.id === keptId ? withAddSubscriptionDaysCanonicalTitle(m) : m))
}

function withAddBalancePrepaidPackageCanonicalTitle(m: SavedMethod): SavedMethod {
  if ((m.buttonLabel || m.name).trim() === ADD_BALANCE_PREPAID_PACKAGE_TITLE) return m
  return {
    ...m,
    name: ADD_BALANCE_PREPAID_PACKAGE_TITLE,
    buttonLabel: ADD_BALANCE_PREPAID_PACKAGE_TITLE,
  }
}

/** Оставляет одну плитку POST /support/user/add-bonus с prepaid_contracts_count по телефону. */
export function dedupeAddBalancePrepaidPackageMethods(methods: SavedMethod[]): SavedMethod[] {
  const matches = methods.filter(isAddBalancePrepaidPackageMethod)
  if (matches.length <= 1) {
    return methods.map((m) =>
      isAddBalancePrepaidPackageMethod(m) ? withAddBalancePrepaidPackageCanonicalTitle(m) : m,
    )
  }

  const kept =
    matches.find((m) => (m.buttonLabel || m.name).trim() === ADD_BALANCE_PREPAID_PACKAGE_TITLE) ??
    matches[0]
  const keptId = kept.id

  return methods
    .filter((m) => !isAddBalancePrepaidPackageMethod(m) || m.id === keptId)
    .map((m) => (m.id === keptId ? withAddBalancePrepaidPackageCanonicalTitle(m) : m))
}

function withAddBalanceAiCanonicalTitle(m: SavedMethod): SavedMethod {
  if ((m.buttonLabel || m.name).trim() === ADD_BALANCE_AI_TITLE) return m
  return { ...m, name: ADD_BALANCE_AI_TITLE, buttonLabel: ADD_BALANCE_AI_TITLE }
}

/** Оставляет одну плитку POST /support/user/add-bonus с ai_chat_balance. */
export function dedupeAddBalanceAiMethods(methods: SavedMethod[]): SavedMethod[] {
  const matches = methods.filter(isAddBalanceAiMethod)
  if (matches.length <= 1) {
    return methods.map((m) => (isAddBalanceAiMethod(m) ? withAddBalanceAiCanonicalTitle(m) : m))
  }

  const kept =
    matches.find((m) => (m.buttonLabel || m.name).trim() === ADD_BALANCE_AI_TITLE) ?? matches[0]
  const keptId = kept.id

  return methods
    .filter((m) => !isAddBalanceAiMethod(m) || m.id === keptId)
    .map((m) => (m.id === keptId ? withAddBalanceAiCanonicalTitle(m) : m))
}

/** Фильтрация удалённых плиток и дедупликация user/info. */
export function finalizeBundledMethods(methods: SavedMethod[]): SavedMethod[] {
  return dedupeAddBalanceAiMethods(
    dedupeAddBalancePrepaidPackageMethods(
      dedupeAddSubscriptionDaysMethods(
        dedupeAddBalanceByUserIdMethods(
          dedupeSupportUserInfoMethods(withoutRemovedBundledMethods(methods)),
        ),
      ),
    ),
  )
}

/** Добавляет операции из встроенной коллекции, которых ещё нет в сохранённом наборе. */
export function mergeMissingBundledMethods(
  current: SavedMethod[],
  bundled: SavedMethod[],
): SavedMethod[] {
  const keys = new Set(current.map(methodKey))
  const added = bundled.filter((m) => !keys.has(methodKey(m)))
  if (!added.length) return current
  return [...current, ...added]
}
