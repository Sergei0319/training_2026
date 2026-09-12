/**
 * Карты значений плиток (params, ИП, физлицо, resend-email) с записью в localStorage.
 * Синхронизация дефолтов идёт при смене состава методов, но только после гидрации списка.
 */
import { useCallback, useEffect, useMemo, useState } from 'react'
import { isEntrepreneurUserUpdateMethod, type EntrepreneurFieldEntry } from '../methods/entrepreneurUpdate'
import { isIndividualUserUpdateMethod, type IndividualFieldEntry } from '../methods/individualUpdate'
import { isResendEmailMethod, type ResendEmailMethodState } from '../methods/resendEmail'
import type { SavedMethod } from '../methods/types'
import {
  syncEntrepreneurFieldsForMethods,
  syncIndividualFieldsForMethods,
  syncResendEmailForMethods,
} from './fieldSync'
import {
  LS,
  loadEntrepreneurFieldsMap,
  loadIndividualFieldsMap,
  loadResendEmailMap,
  loadTileParamsMap,
  omitMapKey,
  saveJson,
} from './persist'
import type { AuthGate } from './types'

/**
 * Состояние карт полей. Params пишем в LS только в `app`, чтобы гость не затирал чужие данные.
 * Остальные карты сохраняем всегда: они привязаны к id методов, а не к сессии.
 */
export function useFieldMapsState(authGate: AuthGate, hydrated: boolean, methods: SavedMethod[]) {
  const [paramsByMethod, setParamsByMethod] = useState(loadTileParamsMap)
  const [entrepreneurFieldsByMethod, setEntrepreneurFieldsByMethod] = useState(loadEntrepreneurFieldsMap)
  const [individualFieldsByMethod, setIndividualFieldsByMethod] = useState(loadIndividualFieldsMap)
  const [resendEmailByMethod, setResendEmailByMethod] = useState(loadResendEmailMap)

  useEffect(() => {
    if (authGate !== 'app') return
    saveJson(LS.tileParams, paramsByMethod)
  }, [paramsByMethod, authGate])
  useEffect(() => saveJson(LS.entrepreneur, entrepreneurFieldsByMethod), [entrepreneurFieldsByMethod])
  useEffect(() => saveJson(LS.individual, individualFieldsByMethod), [individualFieldsByMethod])
  useEffect(() => saveJson(LS.resendEmail, resendEmailByMethod), [resendEmailByMethod])

  const methodsFieldSyncKey = useMemo(
    () => methods.map((m) => `${m.id}:${m.path}:${m.method}`).join('\0'),
    [methods],
  )
  const [fieldMapsSyncKey, setFieldMapsSyncKey] = useState('')
  // setState во время рендера: официальный способ подстроить стейт под сменившийся список методов
  // без лишнего эффекта (и без двойной записи в LS).
  if (hydrated && fieldMapsSyncKey !== methodsFieldSyncKey) {
    setFieldMapsSyncKey(methodsFieldSyncKey)
    setEntrepreneurFieldsByMethod((prev) => syncEntrepreneurFieldsForMethods(methods, prev))
    setIndividualFieldsByMethod((prev) => syncIndividualFieldsForMethods(methods, prev))
    setResendEmailByMethod((prev) => syncResendEmailForMethods(methods, prev))
  }

  const setParamForMethod = useCallback((methodId: string, paramId: string, value: string) => {
    setParamsByMethod((prev) => ({ ...prev, [methodId]: { ...(prev[methodId] ?? {}), [paramId]: value } }))
  }, [])
  const setEntrepreneurFieldsForMethod = useCallback((methodId: string, entries: EntrepreneurFieldEntry[]) => {
    setEntrepreneurFieldsByMethod((prev) => ({ ...prev, [methodId]: entries }))
  }, [])
  const setIndividualFieldsForMethod = useCallback((methodId: string, entries: IndividualFieldEntry[]) => {
    setIndividualFieldsByMethod((prev) => ({ ...prev, [methodId]: entries }))
  }, [])
  const setResendEmailForMethod = useCallback((methodId: string, state: ResendEmailMethodState) => {
    setResendEmailByMethod((prev) => ({ ...prev, [methodId]: state }))
  }, [])
  const mergeParams = useCallback((id: string, paramValues: Record<string, string>) => {
    setParamsByMethod((prev) => ({ ...prev, [id]: { ...(prev[id] ?? {}), ...paramValues } }))
  }, [])
  const omitMethod = useCallback((id: string) => {
    setParamsByMethod((prev) => omitMapKey(prev, id))
    setEntrepreneurFieldsByMethod((prev) => omitMapKey(prev, id))
    setIndividualFieldsByMethod((prev) => omitMapKey(prev, id))
    setResendEmailByMethod((prev) => omitMapKey(prev, id))
  }, [])
  const clearTileInputsForMethod = useCallback((m: SavedMethod) => {
    setParamsByMethod((prev) => omitMapKey(prev, m.id))
    if (isEntrepreneurUserUpdateMethod(m)) setEntrepreneurFieldsByMethod((prev) => omitMapKey(prev, m.id))
    if (isIndividualUserUpdateMethod(m)) setIndividualFieldsByMethod((prev) => omitMapKey(prev, m.id))
    if (isResendEmailMethod(m)) setResendEmailByMethod((prev) => omitMapKey(prev, m.id))
  }, [])

  return {
    paramsByMethod,
    entrepreneurFieldsByMethod,
    individualFieldsByMethod,
    resendEmailByMethod,
    setParamForMethod,
    setEntrepreneurFieldsForMethod,
    setIndividualFieldsForMethod,
    setResendEmailForMethod,
    mergeParams,
    omitMethod,
    clearTileInputsForMethod,
  }
}

/** Снимок карт полей для `prepareMethodRun` и раннера. */
export type FieldMapsState = ReturnType<typeof useFieldMapsState>
