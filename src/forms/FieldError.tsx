/**
 * Текст ошибки под полем формы (экзамен 2.1, понятные сообщения валидации).
 */

type Props = {
  /** id элемента ошибки, чтобы поле могло сослаться на него. */
  id?: string
  /** Текст ошибки; пустое/null — компонент не рендерится. */
  message?: string | null
}

/**
 * Рендерит абзац с ролью alert или ничего, если сообщения нет.
 * Так экранные читалки узнают об ошибке, а верстка не резервирует пустое место.
 */
export function FieldError({ id, message }: Props) {
  if (!message) return null
  return (
    <p id={id} className="field__error" role="alert">
      {message}
    </p>
  )
}
