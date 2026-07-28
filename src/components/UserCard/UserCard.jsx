import styles from './UserCard.module.css'

const UserCard = ({ user }) => {
    const { name, age, email } = user;
    return (
        <article className={styles['user-card']}>
            <h3>{name}</h3>
            <p>Возраст: {age}</p>
            <p>Email: {email}</p>
        </article>
    )
}
export default UserCard;