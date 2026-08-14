import  { useMemo, useState } from 'react'

const initialUsers = [
    { id: 1, name: 'Алексей' },
    { id: 2, name: 'Мария' },
    { id: 3, name: 'Иван' },
    { id: 4, name: 'Ольга' },
    { id: 5, name: 'Дмитрий' },
]

function UserSearch() {
    const [users] = useState(initialUsers)
    const [search, setSearch] = useState('')
    const [rerenderCount, setRerenderCount] = useState(0)

    const filteredUsers = useMemo(() => {
        console.log('Фильтрация списка пользователей')

        const query = search.trim().toLowerCase()

        if (!query) {
            return users
        }

        return users.filter((user) => user.name.toLowerCase().includes(query))
    }, [search, users])

    return (
        <section className="user-search">
            <h1>Поиск пользователей (useMemo)</h1>

            <input
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Введите имя"
            />

            <ul>
                {filteredUsers.map((user) => (
                    <li key={user.id}>{user.name}</li>
                ))}
            </ul>

            <button type="button" onClick={() => setRerenderCount((count) => count + 1)}>
                Лишний ререндер: {rerenderCount}
            </button>
        </section>
    )
}

export default UserSearch
