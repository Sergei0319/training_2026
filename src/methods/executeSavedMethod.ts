/**
 * Выполнение сохранённой плитки: шаблоны {{var}}, спец-тела (ИП/физик/письма),
 * query user/info и Bearer, затем запрос к выбранному хосту API.
 */
import { dokiRequestForHost } from '../doki/client'
import type { DokiJson } from '../doki/client'
import type { SavedMethod } from './types'
import { applyRequestTemplate, omitEmptyOptionalNumericFields } from './templates'
import {
  buildEntrepreneurUpdateBody,
  isEntrepreneurUserUpdateMethod,
  type EntrepreneurFieldEntry,
} from './entrepreneurUpdate'
import {
  buildIndividualUpdateBody,
  isIndividualUserUpdateMethod,
  type IndividualFieldEntry,
} from './individualUpdate'
import { buildResendEmailBody, isResendEmailMethod, type ResendEmailMethodState } from './resendEmail'
import {
  buildUserInfoPathWithQuery,
  isUserInfoSupportMethod,
  USER_INFO_LOOKUP_PARAM_IDS,
} from './userInfoLookup'
import { withVerificationChannelBody } from './verificationResend'

/** Переменные запуска: токены поддержки/партнёра и значения полей плитки. */
export type ExecuteVars = {
  bearerToken: string
  partnerApiKey: string
  /** Подстановка {{placeholder}} в path/query/headers/body. */
  tileParams?: Record<string, string>
  entrepreneurFields?: EntrepreneurFieldEntry[]
  individualFields?: IndividualFieldEntry[]
  resendEmail?: ResendEmailMethodState
}

/**
 * Собирает URL, заголовки и тело и вызывает API.
 * GET/HEAD без body; спец-плитки игнорируют сырой JSON из редактора.
 */
export async function executeSavedMethod(
  m: SavedMethod,
  vars: ExecuteVars,
): Promise<{ data: DokiJson | string }> {
  const prepared = withVerificationChannelBody(m)
  const templateVars: Record<string, string> = {
    ...(vars.tileParams ?? {}),
    bearerToken: vars.bearerToken,
    partnerApiKey: vars.partnerApiKey,
  }
  const apply = (s: string) => applyRequestTemplate(s, templateVars)

  let pathWithQuery: string
  if (isUserInfoSupportMethod(prepared)) {
    // Один query-параметр поиска (телефон/email/ИНН), не все сразу из редактора.
    pathWithQuery = buildUserInfoPathWithQuery(
      prepared.path,
      vars.tileParams ?? {},
      [...USER_INFO_LOOKUP_PARAM_IDS],
      prepared,
    )
  } else {
    const qs = new URLSearchParams()
    for (const q of prepared.query) {
      if (!q.key) continue
      qs.append(q.key, apply(q.value))
    }
    pathWithQuery = qs.toString() ? `${prepared.path}?${qs.toString()}` : prepared.path
  }

  const headers: Record<string, string> = { Accept: 'application/json' }
  for (const h of prepared.headers) {
    if (h.key) headers[h.key] = apply(h.value)
  }
  if (prepared.useBearer && vars.bearerToken.trim()) {
    headers.Authorization = `Bearer ${vars.bearerToken.trim()}`
  }

  const methodUpper = prepared.method.toUpperCase()
  const init: RequestInit = { method: methodUpper, headers }

  const canHaveBody = !['GET', 'HEAD'].includes(methodUpper)
  if (canHaveBody && isEntrepreneurUserUpdateMethod(prepared) && vars.entrepreneurFields) {
    init.body = buildEntrepreneurUpdateBody(vars.entrepreneurFields)
    if (!headers['Content-Type'] && !headers['content-type']) {
      headers['Content-Type'] = 'application/json'
    }
  } else if (canHaveBody && isIndividualUserUpdateMethod(prepared) && vars.individualFields) {
    init.body = buildIndividualUpdateBody(vars.individualFields)
    if (!headers['Content-Type'] && !headers['content-type']) {
      headers['Content-Type'] = 'application/json'
    }
  } else if (canHaveBody && isResendEmailMethod(prepared) && vars.resendEmail) {
    init.body = buildResendEmailBody(vars.resendEmail)
    if (!headers['Content-Type'] && !headers['content-type']) {
      headers['Content-Type'] = 'application/json'
    }
  } else if (canHaveBody && prepared.body?.trim()) {
    const bodyText = omitEmptyOptionalNumericFields(apply(prepared.body))
    if (bodyText.includes('{{')) {
      const missing = [...bodyText.matchAll(/\{\{([a-zA-Z][a-zA-Z0-9]*)\}\}/g)].map((x) => x[1])
      throw new Error(
        `Не подставлены параметры запроса: ${[...new Set(missing)].join(', ')}. Откройте ⚙ и включите нужные поля.`,
      )
    }
    init.body = bodyText
    if (!headers['Content-Type'] && !headers['content-type']) {
      headers['Content-Type'] = 'application/json'
    }
  }

  return dokiRequestForHost(pathWithQuery, init, prepared.apiHost)
}
