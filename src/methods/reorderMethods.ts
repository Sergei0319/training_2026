/**
 * Изменение порядка плиток: перенос операции на позицию с нумерацией «как у пользователя» (с 1).
 */
import type { SavedMethod } from './types'

/** Перемещает операцию на позицию 1…n (нумерация с единицы). */
export function moveMethodToPosition(
  methods: SavedMethod[],
  id: string,
  position1Based: number,
): SavedMethod[] {
  const from = methods.findIndex((m) => m.id === id)
  if (from < 0) return methods
  const to = Math.max(0, Math.min(methods.length - 1, Math.round(position1Based) - 1))
  if (from === to) return methods
  const next = [...methods]
  const [item] = next.splice(from, 1)
  next.splice(to, 0, item)
  return next
}
