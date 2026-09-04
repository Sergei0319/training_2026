const users = [
  'Дмитрий Иванов',
  'Лия Смирнова',
  'Сергей Кузнецов',
]

function UserList() {
  return (
    <div>
      <h2>Список пользователей</h2>
      <ul>
        {users.map((user) => (
          <li key={user}>{user}</li>
        ))}
      </ul>
    </div>
  )
}

export default UserList
