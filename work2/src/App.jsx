import { useState } from 'react'
import UserStatus from './components/UserStatus.jsx'

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  const toggleLogin = () => setIsLoggedIn((prev) => !prev)

  return (
    <div className="app">
      <UserStatus isLoggedIn={isLoggedIn} onLogin={() => setIsLoggedIn(true)} />
      {isLoggedIn && (
        <button type="button" className="btn btn-secondary" onClick={toggleLogin}>
          Переключить isLoggedIn
        </button>
      )}
    </div>
  )
}

export default App
