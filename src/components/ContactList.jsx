import { memo } from 'react'

const ContactList = memo(function ContactList({ contacts, onDelete }) {
  if (contacts.length === 0) {
    return <p className="contact-list__empty">Контакты не найдены</p>
  }

  return (
    <ul className="contact-list">
      {contacts.map((contact) => (
        <li key={contact.id} className="contact-list__item">
          <div className="contact-list__info">
            <span className="contact-list__name">{contact.name}</span>
            <span className="contact-list__sep">—</span>
            <span className="contact-list__phone">{contact.phone}</span>
          </div>
          <button
            className="btn btn--danger"
            type="button"
            onClick={() => onDelete(contact.id)}
          >
            Удалить
          </button>
        </li>
      ))}
    </ul>
  )
})

export default ContactList
