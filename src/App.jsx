import './App.css'
import UserCard from "./components/UserCard/UserCard.jsx";

const users = [
    { id: 1, name: 'Анна', age: 22, email: 'anna@example.com' },
    { id: 2, name: 'Сергей', age: 36, email: 'worksergey2023@gmail.com' },
    { id: 3, name: 'Мария', age: 27, email: 'maria@example.com' },
]

function App() {
    return (
        <div className="app">
            <h1 className="app__title">Пользователи</h1>
            <div className="users-list">
                {users.map((user) => (
                    <UserCard key={user.id} user={user} />
                ))}
            </div>
        </div>
    )

  }



export default App;
