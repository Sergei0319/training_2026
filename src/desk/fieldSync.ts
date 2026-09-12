/**
 * Синхронизация карт полей плиток со списком сохранённых методов.
 * Новые id получают дефолтные формы; уже заполненные строки не перетираем.
 */
import {
  getDefaultEntrepreneurFieldEntries,
  isEntrepreneurUserUpdateMethod,
  type EntrepreneurFieldEntry,
} from '../methods/entrepreneurUpdate'
import {
  getDefaultIndividualFieldEntries,
  isIndividualUserUpdateMethod,
  type IndividualFieldEntry,
} from '../methods/individualUpdate'
import {
  getDefaultResendEmailState,
  isResendEmailMethod,
  type ResendEmailMethodState,
} from '../methods/resendEmail'
import type { SavedMethod } from '../methods/types'

/**
 * Общий проход: для методов, подходящих под `match`, кладёт `create()`,
 * если ячейка пуста (`empty`). Возвращает тот же `prev`, если ничего не менялось —
 * чтобы React не считал это новым объектом и не гонял эффекты сохранения.
 */
function syncMap<T>(
  methods: SavedMethod[],
  prev: Record<string, T>,
  match: (m: SavedMethod) => boolean,
  empty: (row: T | undefined) => boolean,
  create: () => T,
): Record<string, T> {
  let changed = false
  const next = { ...prev }
  for (const m of methods) {
    if (match(m) && empty(next[m.id])) {
      next[m.id] = create()
      changed = true
    }
  }
  return changed ? next : prev
}

/**
 * Карта полей ИП: пустой массив = ещё не инициализировали, подставляем дефолтные строки.
 */
export function syncEntrepreneurFieldsForMethods(
  methods: SavedMethod[],
  prev: Record<string, EntrepreneurFieldEntry[]>,
): Record<string, EntrepreneurFieldEntry[]> {
  return syncMap(methods, prev, isEntrepreneurUserUpdateMethod, (row) => !row?.length, getDefaultEntrepreneurFieldEntries)
}

/**
 * Карта полей физлица: та же схема, что у ИП.
 */
export function syncIndividualFieldsForMethods(
  methods: SavedMethod[],
  prev: Record<string, IndividualFieldEntry[]>,
): Record<string, IndividualFieldEntry[]> {
  return syncMap(methods, prev, isIndividualUserUpdateMethod, (row) => !row?.length, getDefaultIndividualFieldEntries)
}

/**
 * Состояние «переотправка email»: отсутствие записи в карте, а не пустой объект.
 */
export function syncResendEmailForMethods(
  methods: SavedMethod[],
  prev: Record<string, ResendEmailMethodState>,
): Record<string, ResendEmailMethodState> {
  return syncMap(methods, prev, isResendEmailMethod, (row) => !row, () => getDefaultResendEmailState('roles'))
}
