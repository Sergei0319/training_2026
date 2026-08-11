import { useReducer, useState}   from "react";
import  './App.css'

const initialUsers = [
    { id: 1, name: 'Sergey', active: true },
    { id: 2, name: 'Denis', active: false },
    { id: 3, name: 'Ivan', active: true },
]

function usersReducer(state, action) {
    switch (action.type) {
        case 'UPDATE_NAME':
            return state.map((user) =>
                user.id === action.id ? { ...user, name: action.name } : user
            )
        case 'TOGGLE_ACTIVE':
            return state.map((user) =>
                user.id === action.id ? { ...user, active: !user.active } : user
        )
        case 'DELETE_USER':
            return state.filter((user) => user.id !== action.id)
        default:
            return state
    }
}

function UserItem ({ user, dispatch}) {
    const [draftName, setDraftName] = useState(user.name)

    const handleSave = () => {
        const trimmed = draftName.trim()
        if (!trimmed) return
        dispatch({type: 'UPDATE_NAME', id: user.id, name: trimmed})
    }

    return (
        <li className={`user-item ${user.active ? 'user-item--active' : 'user-item--inactive'}`}>
            <div className="user-item__info">
                <span className="user-item__name">{user.name}</span>
                <span className="user-item__status">
                    {user.active ? 'активен' : 'неактивен'}
                </span>
            </div>

            <div className="user-item__controls">
                <input
                    type="text"
                    value={draftName}
                    onChange={(e) => setDraftName(e.target.value)}
                    aria-label={`Имя пользователя ${user.name}`}
                />
                <button type="button" onClick={handleSave}>
                    Сохранить
                </button>
                <button
                    type="button"
                    onClick={() => dispatch({type: 'TOGGLE_ACTIVE', id: user.id})}
                >
                    {user.active ? 'Деактивировать' : 'Активировать'}
                </button>
                <button
                    type="button"
                    className="user-item__delete"
                    onClick={() => dispatch({type: 'DELETE_USER', id: user.id})}
                >
                    Удалить
                </button>
            </div>
        </li>
    )
}

export default  function App() {
    const [users, dispatch] = useReducer(usersReducer, initialUsers)

    return (
        <div className="app">
            <h1>Список пользователей</h1>
            {users.length === 0 ? (
                <p className="empty">Список пуст</p>
            ) : (
                <ul className="user-list">
                    {users.map((user) => (
                        <UserItem key={user.id} user={user} dispatch={dispatch} />
                    ))}
                </ul>
            )}
        </div>
    )
}