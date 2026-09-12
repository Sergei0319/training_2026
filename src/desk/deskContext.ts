/**
 * React-контекст кабинета: единый снимок auth, настроек, полей плиток, раннера и методов.
 * Значение собирает `DeskProvider`; хуки в `hooks.ts` читают срезы, чтобы компоненты не тянули весь объект.
 */
import { createContext, type Context } from 'react'
import type { TileSettingsUpdate } from '../components/TileSettingsDialog/TileSettingsDialog'
import type { useAuthState } from './useAuthState'
import type { useFieldMapsState } from './useFieldMapsState'
import type { useMethodsState } from './useMethodsState'
import type { useRunnerState } from './useRunnerState'
import type { useSettingsState } from './useSettingsState'

/**
 * Публичный API стола. У `methods` поверх хука добавлены операции,
 * которые трогают и список методов, и карты полей (удаление / настройки плитки).
 */
export type DeskValue = {
  auth: ReturnType<typeof useAuthState>
  settings: ReturnType<typeof useSettingsState>
  fields: ReturnType<typeof useFieldMapsState>
  runner: ReturnType<typeof useRunnerState>
  methods: ReturnType<typeof useMethodsState> & {
    deleteMethodById: (id: string) => boolean
    updateTileSettings: (id: string, updates: TileSettingsUpdate) => void
    deleteSelected: () => void
  }
}

/**
 * Контекст стола. Стартовое `null` отличает «провайдера нет» от валидного значения
 * (хуки тогда бросают ошибку вместо скрытого падения).
 */
export const DeskContext: Context<DeskValue | null> = createContext<DeskValue | null>(null)
