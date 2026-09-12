/**
 * Список сохранённых операций: гидрация из storage/бандла, автосейв, импорт Postman, настройки плиток.
 * Пока `authGate !== 'app'`, коллекцию не грузим и не пишем — иначе гость перезапишет данные оператора.
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import type { TileSettingsUpdate } from '../components/TileSettingsDialog/TileSettingsDialog'
import { loadBundledMethods } from '../methods/loadBundled'
import { createEmptyMethod, parsePostmanCollection } from '../methods/postmanImport'
import { finalizeBundledMethods, mergeMissingBundledMethods } from '../methods/bundledSync'
import { moveMethodToPosition } from '../methods/reorderMethods'
import { loadMethodsFromStorage, saveMethodsToStorage } from '../methods/storage'
import type { SavedMethod } from '../methods/types'
import type { AuthGate } from './types'

/**
 * Хук коллекции операций: загрузка списка (Read) и запись в storage.
 * Create / Update / Delete — функции ниже (экзамен 2.1, CRUD).
 */
export function useMethodsState(authGate: AuthGate) {
  const [methods, setMethods] = useState<SavedMethod[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [hydrated, setHydrated] = useState(false)
  const [saveHint, setSaveHint] = useState<'idle' | 'saved'>('idle')
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const selected = methods.find((m) => m.id === selectedId) ?? null

  useEffect(() => {
    if (authGate !== 'app') return
    let cancelled = false
    ;(async () => {
      let bundled: SavedMethod[]
      try {
        bundled = await loadBundledMethods()
      } catch {
        bundled = []
      }
      const stored = loadMethodsFromStorage()
      if (cancelled) return
      if (stored?.length) {
        // В storage — пользовательский набор: докидываем недостающие из бандла, не ломая порядок.
        const merged = finalizeBundledMethods(
          bundled.length ? mergeMissingBundledMethods(stored, bundled) : stored,
        )
        setMethods(merged)
        setSelectedId(merged[0]?.id ?? null)
        setHydrated(true)
        return
      }
      if (bundled.length) {
        setMethods(bundled)
        setSelectedId(bundled[0]?.id ?? null)
      } else {
        const one = createEmptyMethod()
        setMethods([one])
        setSelectedId(one.id)
      }
      setHydrated(true)
    })()
    return () => {
      cancelled = true
    }
  }, [authGate])

  useEffect(() => {
    if (authGate !== 'app' || !hydrated) return
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => {
      saveMethodsToStorage(methods)
      setSaveHint('saved')
      setTimeout(() => setSaveHint('idle'), 1200)
    }, 350)
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current)
    }
  }, [methods, hydrated, authGate])

  const applyTileSettings = useCallback((id: string, updates: TileSettingsUpdate) => {
    const trimmedLabel = updates.buttonLabel.trim()
    setMethods((prev) =>
      moveMethodToPosition(
        prev.map((m) =>
          m.id === id
            ? {
                ...m,
                buttonLabel: trimmedLabel || m.name || 'Без названия',
                method: (updates.method || 'GET').toUpperCase(),
                path: updates.path.trim() || '/',
                apiHost: updates.apiHost,
                tileParamIds: updates.tileParamIds,
              }
            : m,
        ),
        id,
        updates.position,
      ),
    )
  }, [])

  /** Экзамен 2.1 CRUD: Update — запись полей операции. */
  const updateMethod = useCallback((m: SavedMethod) => {
    setMethods((prev) => prev.map((x) => (x.id === m.id ? m : x)))
  }, [])

  /** Экзамен 2.1 CRUD: Delete — убрать операцию из списка. */
  const deleteMethodById = useCallback(
    (id: string): boolean => {
      const m = methods.find((x) => x.id === id)
      if (!m) return false
      if (!window.confirm(`Удалить запрос «${m.buttonLabel || m.name}»?`)) return false
      setMethods((prev) => {
        const next = prev.filter((x) => x.id !== id)
        setSelectedId((cur) => (cur === id ? (next[0]?.id ?? null) : cur))
        return next
      })
      return true
    },
    [methods],
  )

  /** Экзамен 2.1 CRUD: Create — новая пустая операция. */
  const addMethod = useCallback(() => {
    const m = createEmptyMethod()
    setMethods((prev) => [...prev, m])
    setSelectedId(m.id)
  }, [])

  const importFromFile = useCallback(async (file: File) => {
    try {
      const parsed = parsePostmanCollection(JSON.parse(await file.text()) as unknown)
      if (!parsed.length) {
        window.alert('В файле не найдено запросов в формате коллекции JSON v2.1.')
        return
      }
      if (!window.confirm(`Заменить текущие операции (${methods.length} шт.) на ${parsed.length} из файла?`)) return
      setMethods(parsed)
      setSelectedId(parsed[0]?.id ?? null)
    } catch {
      window.alert('Не удалось разобрать файл. Нужен JSON коллекции запросов (schema v2.1.0).')
    }
  }, [methods.length])

  const resetFromBundled = useCallback(async () => {
    if (!window.confirm('Восстановить набор операций из файла, поставляемого с приложением?')) return
    try {
      const parsed = await loadBundledMethods()
      setMethods(parsed)
      setSelectedId(parsed[0]?.id ?? null)
    } catch {
      window.alert('Не удалось загрузить встроенный файл коллекции.')
    }
  }, [])

  const saveMethodsNow = useCallback(() => {
    saveMethodsToStorage(methods)
    setSaveHint('saved')
    window.setTimeout(() => setSaveHint('idle'), 1600)
  }, [methods])

  const exportMethodsJson = useCallback(() => {
    const blob = new Blob([JSON.stringify(methods, null, 2)], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = 'oki-support-operations.json'
    a.click()
    URL.revokeObjectURL(a.href)
  }, [methods])

  return {
    methods,
    selected,
    selectedId,
    setSelectedId,
    hydrated,
    saveHint,
    applyTileSettings,
    updateMethod,
    deleteMethodById,
    addMethod,
    importFromFile,
    resetFromBundled,
    saveMethodsNow,
    exportMethodsJson,
  }
}
