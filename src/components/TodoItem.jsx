import  { memo } from 'react'

function TodoItem({ id, text, completed, onToggle, onDelete }) {
    console.log('Render TodoItem:' , Date.now())

    return (
        <li className="todo-item">
            <label className="todo-item__label">
                <input
                    type="checkbox"
                    checked={completed}
                    onChange={() => onToggle(id)}
                />
                <span className={completed ? 'todo-item__text todo-item__text--done' : 'todo-item__text'}>
                    {text}
                </span>
            </label>
            <button type="button" onClick={() => onDelete(id)}>
                Удалить
            </button>
        </li>
    )
}

export default memo(TodoItem)