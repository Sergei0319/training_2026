import { useCallback, useReducer, useState } from 'react'
import { v4 as uuidv4 } from 'uuid'
import ContactForm from './components/ContactForm.jsx'
import ContactList from './components/ContactList.jsx'
import SearchBar from './components/SearchBar.jsx'
import './index.css'

const initialContacts = []

function contactsReducer(state, action) {
  switch (action.type) {
    case 'ADD_CONTACT':
      return [...state, action.payload]
    case 'DELETE_CONTACT':
      return state.filter((contact) => contact.id !== action.payload)
    default:
      return state
  }
}

function App() {
  const [contacts, dispatch] = useReducer(contactsReducer, initialContacts)
  const [search, setSearch] = useState('')

  const handleAdd = (name, phone) => {
    dispatch({
      type: 'ADD_CONTACT',
      payload: { id: uuidv4(), name, phone },
    })
  }

  const handleDelete = useCallback((id) => {
    dispatch({ type: 'DELETE_CONTACT', payload: id })
  }, [])

  const filteredContacts = contacts.filter((contact) =>
    contact.name.toLowerCase().includes(search.trim().toLowerCase()),
  )

  return (
    <div className="app">
      <h1 className="app__title">Контакты</h1>
      <ContactForm onAdd={handleAdd} />
      <SearchBar search={search} onSearchChange={setSearch} />
      <ContactList contacts={filteredContacts} onDelete={handleDelete} />
    </div>
  )
}

export default App
