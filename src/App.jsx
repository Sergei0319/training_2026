import { useCallback, useState } from 'react'
import TodoItem from './components/TodoItem'
import './App.css'

const initialTodos = [
	{ id: 1, text: 'Разобрать useCallback', completed: false },
	{ id: 2, text: 'Обернуть TodoItem в memo', completed: false },
	{ id: 3, text: 'Проверить консоль при добавлении задачи', completed: true },
]

function App() {
	const [todos, setTodos] = useState(initialTodos)
	const [newText, setNewText] = useState('')

	const handleToggle = useCallback((id) => {
		setTodos((prev) =>
			prev.map((todo) =>
				todo.id === id ? { ...todo, completed: !todo.completed } : todo
			)
		)
	}, [])

	const handleDelete = useCallback((id) => {
		setTodos((prev) => prev.filter((todo) => todo.id !== id))
	}, [])

	const handleAdd = (event) => {
		event.preventDefault()
		const text = newText.trim()
		if (!text) return

		setTodos((prev) => [
			...prev,
			{ id: Date.now(), text, completed: false },
		])
		setNewText('')
	}

	return (
		<main className="app">
			<h1>Список задач</h1>
			<p>
				Откройте консоль: при вводе текста и добавлении задачи
				уже отрисованные <code>TodoItem</code> не должны
				перерендериваться. Логи появятся только у изменённых элементов.
			</p>

			<form className="todo-form" onSubmit={handleAdd}>
				<input
					type="text"
					value={newText}
					onChange={(e) => setNewText(e.target.value)}
					placeholder="Новая задача"
					aria-label="Текст новой задачи"
				/>
				<button type="submit">Добавить</button>
			</form>

			<ul className="todo-list">
				{todos.map((todo) => (
					<TodoItem
						key={todo.id}
						todo={todo}
						onToggle={handleToggle}
						onDelete={handleDelete}
					/>
				))}
			</ul>
		</main>
	)
}

export default App
