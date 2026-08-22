import { memo } from 'react'

function TodoItem({ todo, onToggle, onDelete }) {
	console.log('TodoItem render:', todo.id, todo.text)

	return (
		<li className="todo-item">
			<label>
				<input
					type="checkbox"
					checked={todo.completed}
					onChange={() => onToggle(todo.id)}
				/>
				<span className={todo.completed ? 'todo-item__text todo-item__text--done' : 'todo-item__text'}>
					{todo.text}
				</span>
			</label>
			<button type="button" onClick={() => onDelete(todo.id)}>
				Удалить
			</button>
		</li>
	)
}

export default memo(TodoItem)
