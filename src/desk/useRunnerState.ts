/**
 * Запуск сохранённых методов: журнал (до 40 записей), busy, ссылки в ЛК по ответу API.
 * Перед HTTP — `prepareMethodRun`; после успеха/ошибки поля плитки сбрасываются.
 */
import { useCallback, useMemo, useState } from 'react'
import { DokiHttpError } from '../doki/client'
import { formatHumanSummary } from '../doki/present'
import {
  canOpenUserCabinet,
  isContractInfoRequest,
  isLkSupportInfoMethod,
  isLkSupportInfoRequest,
  isLkSupportLogAction,
  resolveLkSourceDataForMethod,
} from '../doki/userCabinet'
import { executeSavedMethod } from '../methods/executeSavedMethod'
import type { SavedMethod } from '../methods/types'
import { prepareMethodRun } from './prepareRun'
import type { LogEntry } from './types'
import type { FieldMapsState } from './useFieldMapsState'

/** Зависимости раннера из соседних хуков стола (токен, ключ партнёра, сброс сессии, карты полей). */
type RunnerDeps = {
  bearerToken: string
  partnerApiKey: string
  forceLogin: () => void
  fields: FieldMapsState
}

/**
 * Хук выполнения. 401 на запросе с Bearer уводит на логин.
 * Для методов ЛК `lkSourceData` может быть отдельным догоняющим ответом, не самим `data`.
 */
export function useRunnerState({ bearerToken, partnerApiKey, forceLogin, fields }: RunnerDeps) {
  const [busy, setBusy] = useState(false)
  const [log, setLog] = useState<LogEntry[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [showRaw, setShowRaw] = useState(false)

  const pushLog = useCallback((entry: Omit<LogEntry, 'id' | 'at'>) => {
    const full: LogEntry = {
      ...entry,
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      at: new Date().toLocaleString('ru-RU'),
    }
    setLog((prev) => [full, ...prev].slice(0, 40))
    setActiveId(full.id)
    setShowRaw(false)
  }, [])

  const closeActiveResult = useCallback(() => {
    setActiveId(null)
    setShowRaw(false)
  }, [])

  const runMethod = useCallback(
    async (m: SavedMethod, tileOverrides?: Record<string, string>) => {
      const label = `${m.buttonLabel || m.name} · ${m.method} ${m.path}`
      const fail = (summary: string) =>
        pushLog({ action: label, ok: false, summary, data: '', methodPath: m.path, methodHttp: m.method })
      if (m.useBearer && !bearerToken.trim()) {
        fail('Сессия истекла — войдите снова')
        void forceLogin()
        return
      }
      const prepared = prepareMethodRun(m, fields, tileOverrides)
      if (prepared.error) {
        fail(prepared.error)
        return
      }
      setBusy(true)
      try {
        const { data } = await executeSavedMethod(m, {
          bearerToken: bearerToken.trim(),
          partnerApiKey: partnerApiKey.trim(),
          tileParams: prepared.tileValues,
          entrepreneurFields: prepared.entrepreneurFields,
          individualFields: prepared.individualFields,
          resendEmail: prepared.resendEmail,
        })
        const lkSourceData = isLkSupportInfoMethod(m)
          ? await resolveLkSourceDataForMethod(data, m, bearerToken)
          : data
        pushLog({
          action: label,
          ok: true,
          summary: formatHumanSummary(data),
          data,
          lkSourceData,
          methodPath: m.path,
          methodHttp: m.method,
        })
      } catch (e) {
        if (e instanceof DokiHttpError && e.status === 401) forceLogin()
        fail(e instanceof DokiHttpError ? `${e.message}: ${e.bodyText.slice(0, 400)}` : String(e))
      } finally {
        fields.clearTileInputsForMethod(m)
        setBusy(false)
      }
    },
    [bearerToken, partnerApiKey, fields, pushLog, forceLogin],
  )

  const active = activeId ? (log.find((x) => x.id === activeId) ?? null) : null
  const lkData = active?.lkSourceData ?? active?.data
  const lkReady = useMemo(() => {
    if (!lkData || lkData === '') return false
    if (canOpenUserCabinet(lkData)) return true
    // contract-info: в payload идентификатор лежит иначе, чем в обычном user-info.
    if (active?.methodPath && isContractInfoRequest(active.methodHttp ?? 'GET', active.methodPath)) {
      return canOpenUserCabinet(lkData, true)
    }
    return false
  }, [active?.methodHttp, active?.methodPath, lkData])
  const showLkLinks =
    Boolean(active?.ok && lkReady) &&
    (!active?.methodPath ||
      isLkSupportInfoRequest(active.methodHttp ?? 'GET', active.methodPath) ||
      isLkSupportLogAction(active.action))

  return {
    busy,
    log,
    activeId,
    setActiveId,
    showRaw,
    setShowRaw,
    active,
    lkData,
    showLkLinks,
    runMethod,
    closeActiveResult,
  }
}
