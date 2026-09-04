import { useState } from 'react'

function ContactForm({ onAdd }) {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = (event) => {
    event.preventDefault()

    if (!name.trim() || !phone.trim()) {
      setError('Заполните имя и телефон')
      return
    }

    setError('')
    onAdd(name.trim(), phone.trim())
    setName('')
    setPhone('')
  }

  return (
    <form className="contact-form" onSubmit={handleSubmit}>
      <div className="contact-form__fields">
        <input
          className="field"
          type="text"
          placeholder="Имя"
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
        <input
          className="field"
          type="text"
          placeholder="Телефон"
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
        />
      </div>
      <button className="btn btn--primary" type="submit">
        Добавить контакт
      </button>
      {error && <p className="form-error">{error}</p>}
    </form>
  )
}

export default ContactForm
