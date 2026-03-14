import { Link } from 'react-router-dom'
import styles from './NotFoundPage.module.scss'

export default function NotFoundPage() {
  return (
    <div className={styles.page}>
      <p className={styles.code}>404</p>
      <h1 className={styles.heading}>Page not found</h1>
      <p className={styles.description}>
        The page you're looking for doesn't exist.
      </p>
      <Link to="/" className={styles.homeLink}>
        Back to home
      </Link>
    </div>
  )
}
