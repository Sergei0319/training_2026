/**
 * Редактор полей обновления ИП: обёртка над KeyValueFieldsEditor с каталогом entrepreneur.
 */
import { ENTREPRENEUR_FIELD_CATALOG, type EntrepreneurFieldEntry } from '../../methods/entrepreneurUpdate'
import { KeyValueFieldsEditor } from '../KeyValueFieldsEditor/KeyValueFieldsEditor'
import './EntrepreneurFieldsEditor.scss'

type Props = {
  entries: EntrepreneurFieldEntry[]
  onChange: (entries: EntrepreneurFieldEntry[]) => void
  disabled?: boolean
  fieldErrors?: Record<string, string>
}

/** Поля тела запроса обновления предпринимателя. */
export function EntrepreneurFieldsEditor({ entries, onChange, disabled, fieldErrors }: Props) {
  return (
    <KeyValueFieldsEditor
      catalog={ENTREPRENEUR_FIELD_CATALOG}
      entries={entries}
      onChange={onChange}
      disabled={disabled}
      fieldErrors={fieldErrors}
    />
  )
}
