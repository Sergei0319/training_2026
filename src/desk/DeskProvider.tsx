/**
 * Провайдер кабинета: глобальное состояние через Context API (экзамен 2.2).
 * Хранит сессию, операции, поля плиток, журнал запусков и ключ партнёра.
 */
import { useCallback, useMemo, type ReactNode } from 'react'
import type { TileSettingsUpdate } from '../components/TileSettingsDialog/TileSettingsDialog'
import { DeskContext } from './deskContext'
import { useAuthState } from './useAuthState'
import { useFieldMapsState } from './useFieldMapsState'
import { useMethodsState } from './useMethodsState'
import { useRunnerState } from './useRunnerState'
import { useSettingsState } from './useSettingsState'

/**
 * Собирает значение `DeskContext` для всего дерева маршрутов за `App`.
 * Порядок хуков важен: карты полей ждут `hydrated` методов, раннер — токен и ключ партнёра.
 */
export function DeskProvider({ children }: { children: ReactNode }) {
  const auth = useAuthState()
  const settings = useSettingsState()
  const methods = useMethodsState(auth.authGate)
  const fields = useFieldMapsState(auth.authGate, methods.hydrated, methods.methods)
  const runner = useRunnerState({
    bearerToken: auth.bearerToken,
    partnerApiKey: settings.partnerApiKey,
    forceLogin: auth.forceLogin,
    fields,
  })

  const deleteMethodById = useCallback(
    (id: string) => {
      const ok = methods.deleteMethodById(id)
      // Карты полей живут отдельно от списка методов — иначе «мёртвые» id копятся в localStorage.
      if (ok) fields.omitMethod(id)
      return ok
    },
    [methods, fields],
  )
  const updateTileSettings = useCallback(
    (id: string, updates: TileSettingsUpdate) => {
      methods.applyTileSettings(id, updates)
      fields.mergeParams(id, updates.paramValues)
    },
    [methods, fields],
  )
  const deleteSelected = useCallback(() => {
    if (methods.selected) deleteMethodById(methods.selected.id)
  }, [methods.selected, deleteMethodById])

  const value = useMemo(
    () => ({
      auth,
      settings,
      fields,
      runner,
      methods: { ...methods, deleteMethodById, updateTileSettings, deleteSelected },
    }),
    [auth, settings, fields, runner, methods, deleteMethodById, updateTileSettings, deleteSelected],
  )

  return <DeskContext.Provider value={value}>{children}</DeskContext.Provider>
}
