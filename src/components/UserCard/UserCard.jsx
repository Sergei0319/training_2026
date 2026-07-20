import './UserCard.css';

function UserCard({ name, age, color }) {
  console.log('Ререндер UserCard');

  return (
    <div className="user-card" style={{ backgroundColor: color }}>
      <h2 className="user-card__name">{name}</h2>
      <p className="user-card__age">Возраст: {age}</p>
    </div>
  );
}

export default UserCard;
