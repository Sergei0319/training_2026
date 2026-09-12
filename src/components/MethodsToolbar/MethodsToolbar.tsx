/**
 * Панель действий над набором операций: сохранить, создать, импорт/экспорт JSON,
 * восстановление bundled-набора. Файл для импорта выбирается скрытым input.
 */
import { useRef } from 'react'
import { useMethods } from '../../desk/hooks'
import './MethodsToolbar.scss'

/** Тулбар CRUD/файлов для сохранённых методов (страница настроек). */
export function MethodsToolbar() {
  const importRef = useRef<HTMLInputElement>(null)
  const { saveMethodsNow, addMethod, importFromFile, resetFromBundled, exportMethodsJson } = useMethods()
  return (
    <div className="oki-toolbar">
        <button type="button" className="btn btn--primary" onClick={saveMethodsNow}>
          Сохранить операции
        </button>
        <button type="button" className="btn" onClick={addMethod}>
          Новая операция
        </button>
        <button type="button" className="btn" onClick={() => importRef.current?.click()}>
          Импорт JSON
        </button>
        <button type="button" className="btn" onClick={() => void resetFromBundled()}>
          Восстановить набор
        </button>
        <button type="button" className="btn" onClick={exportMethodsJson}>
          Экспорт операций
        </button>
        <input
          ref={importRef}
          type="file"
          accept=".json,application/json"
          hidden
          onChange={(e) => {
            const file = e.target.files?.[0]
            // Сброс value, чтобы повторный выбор того же файла снова сработал.
            e.target.value = ''
            if (file) void importFromFile(file)
          }}
        />
    </div>
  )
}
