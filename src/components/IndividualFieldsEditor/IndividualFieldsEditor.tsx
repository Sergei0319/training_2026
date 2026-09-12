/**
 * Редактор полей обновления физлица: обёртка над KeyValueFieldsEditor с каталогом individual.
 */
import { INDIVIDUAL_FIELD_CATALOG, type IndividualFieldEntry } from '../../methods/individualUpdate'
import { KeyValueFieldsEditor } from '../KeyValueFieldsEditor/KeyValueFieldsEditor'
import './IndividualFieldsEditor.scss'

type Props = {
  entries: IndividualFieldEntry[]
  onChange: (entries: IndividualFieldEntry[]) => void
  disabled?: boolean
  fieldErrors?: Record<string, string>
}

/** Поля тела запроса обновления индивидуального пользователя. */
export function IndividualFieldsEditor({ entries, onChange, disabled, fieldErrors }: Props) {
  return (
    <KeyValueFieldsEditor
      catalog={INDIVIDUAL_FIELD_CATALOG}
      entries={entries}
      onChange={onChange}
      disabled={disabled}
      fieldErrors={fieldErrors}
    />
  )
}
