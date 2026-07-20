import { useState } from 'react';
import UserCard from './components/UserCard/UserCard';
import './App.css';

const COLORS = ['#d4edda', '#cce5ff', '#f8d7da', '#fff3cd', '#e2d5f1'];

function App() {
  const [age, setAge] = useState(29);
  const [color, setColor] = useState(COLORS[0]);

  const handleAgeChange = () => {
    setAge((prev) => prev + 1);
  };

  const handleColorChange = () => {
    setColor((prev) => {
      const currentIndex = COLORS.indexOf(prev);
      const nextIndex = (currentIndex + 1) % COLORS.length;
      return COLORS[nextIndex];
    });
  };

  return (
    <div className="app">
      <div className="app__buttons">
        <button type="button" onClick={handleAgeChange}>
          Изменить возраст
        </button>
        <button type="button" onClick={handleColorChange}>
          Изменить цвет карточки
        </button>
      </div>

      <UserCard name="Иван Петров" age={age} color={color} />
    </div>
  );
}

export default App;
