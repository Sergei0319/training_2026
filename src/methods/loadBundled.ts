/**
 * Загрузка встроенной коллекции из public/okidoki.postman_collection.json
 * и прогон через finalizeBundledMethods (скрыть удалённые, схлопнуть дубли).
 */
import { finalizeBundledMethods } from './bundledSync'
import { parsePostmanCollection } from './postmanImport'
import type { SavedMethod } from './types'

/**
 * Fetch коллекции с корня сайта (Vite public). При 404/сети бросает статус.
 */
export async function loadBundledMethods(): Promise<SavedMethod[]> {
  const res = await fetch('/okidoki.postman_collection.json')
  if (!res.ok) throw new Error(String(res.status))
  return finalizeBundledMethods(parsePostmanCollection(await res.json()))
}
