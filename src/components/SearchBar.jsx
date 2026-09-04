import { useEffect, useRef } from 'react'

function SearchBar({ search, onSearchChange }) {
  const inputRef = useRef(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  return (
    <div className="search-bar">
      <input
        ref={inputRef}
        className="field"
        type="text"
        placeholder="Поиск контакта"
        value={search}
        onChange={(event) => onSearchChange(event.target.value)}
      />
    </div>
  )
}

export default SearchBar
