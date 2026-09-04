import { lazy, Suspense, useState } from 'react'

const UserList = lazy(() => import('./components/UserList.jsx'))

function App() {
  const [showUsers, setShowUsers] = useState(false)

  return (
    <>
      <h1>Домашнее задание: lazy loading</h1>
      <button type="button" onClick={() => setShowUsers(true)}>
        Показать пользователей
      </button>
      {showUsers && (
        <Suspense fallback={<p>Загрузка списка пользователей...</p>}>
          <UserList />
        </Suspense>
      )}
    </>
  )
}

export default App
