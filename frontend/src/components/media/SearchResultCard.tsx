import { Plus, BookOpen, Film, Tv } from 'lucide-react'
import type { MediaSearchResult } from '@/types/media.types'
import styles from './SearchResultCard.module.scss'

const TYPE_ICON = { BOOK: BookOpen, MOVIE: Film, TV_SHOW: Tv }

interface SearchResultCardProps {
  result: MediaSearchResult
  onAdd: (result: MediaSearchResult) => void
}

export default function SearchResultCard({ result, onAdd }: SearchResultCardProps) {
  const Icon = TYPE_ICON[result.type]

  return (
    <div className={styles.card}>
      {/* Cover */}
      <div className={styles.cover}>
        {result.coverImageUrl ? (
          <img src={result.coverImageUrl} alt={result.title} className={styles.coverImg} />
        ) : (
          <div className={styles.coverPlaceholder}>
            <Icon className={styles.coverPlaceholderIcon} />
          </div>
        )}
      </div>

      {/* Info */}
      <div className={styles.info}>
        <p className={styles.title}>{result.title}</p>
        {(result.author || result.director) && (
          <p className={styles.subtitle}>{result.author || result.director}</p>
        )}
        {result.releaseYear && (
          <p className={styles.year}>{result.releaseYear}</p>
        )}
      </div>

      {/* Add button */}
      <button
        onClick={() => onAdd(result)}
        className={styles.addBtn}
      >
        <Plus className={styles.addBtnIcon} />
        Add
      </button>
    </div>
  )
}
