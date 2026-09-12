/**
 * Карточки профиля: заголовок, бейдж и секции пар «подпись — значение».
 * Для строки «В лице» добавляется подсказка про соответствие личному кабинету.
 */
import type { ProfileSection } from '../../doki/present'
import './ProfileCards.scss'

type Props = {
  title: string
  badge: string
  sections: ProfileSection[]
}

/** Блок карточек профиля; пустой `sections` ничего не рисует. */
export function ProfileCards({ title, badge, sections }: Props) {
  if (sections.length === 0) return null
  return (
    <div className="profile-cards">
      <header className="profile-cards__header">
        <h2 className="profile-cards__title">{title}</h2>
        <span className="profile-cards__badge">{badge}</span>
      </header>
      {sections.map((sec) => (
        <section key={sec.title} className="profile-cards__card">
          <h3 className="profile-cards__card-title">{sec.title}:</h3>
          <dl className="profile-cards__dl">
            {sec.rows.map((row) => (
              <div key={row.key} className="profile-cards__row">
                <dt className="profile-cards__dt">
                  {row.label}
                  {row.label.includes('В лице') ? (
                    <span className="profile-cards__info" title="Как в личном кабинете пользователя">
                      i
                    </span>
                  ) : null}
                </dt>
                <dd className="profile-cards__dd">{row.value}</dd>
              </div>
            ))}
          </dl>
        </section>
      ))}
    </div>
  )
}
