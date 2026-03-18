import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { BookOpen, Film, Tv, Plus } from 'lucide-react'
import { useAppDispatch, useAppSelector } from '@/store'
import { fetchLibraryThunk, setFilter } from '@/store/slices/mediaSlice'
import MediaCard from '@/components/media/MediaCard'
import type { MediaType, EntryStatus } from '@/types/media.types'
import { cn } from '@/lib/utils'
import styles from './LibraryPage.module.scss'

const TYPES: { value: MediaType | 'ALL'; label: string; icon: React.ElementType }[] = [
  { value: 'ALL', label: 'All', icon: BookOpen },
  { value: 'BOOK', label: 'Books', icon: BookOpen },
  { value: 'MOVIE', label: 'Movies', icon: Film },
  { value: 'TV_SHOW', label: 'TV Shows', icon: Tv },
]

const STATUSES: { value: EntryStatus | 'ALL'; label: string }[] = [
  { value: 'ALL', label: 'All' },
  { value: 'WANT', label: 'Want' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'DROPPED', label: 'Dropped' },
]

export default function LibraryPage() {
  const dispatch = useAppDispatch()
  const { library, isLoading } = useAppSelector((s) => s.media)

  const [typeFilter, setTypeFilter] = useState<MediaType | 'ALL'>('ALL')
  const [statusFilter, setStatusFilter] = useState<EntryStatus | 'ALL'>('ALL')

  useEffect(() => {
    dispatch(
      fetchLibraryThunk({
        type: typeFilter !== 'ALL' ? typeFilter : undefined,
        status: statusFilter !== 'ALL' ? statusFilter : undefined,
      }),
    )
    dispatch(
      setFilter({
        type: typeFilter !== 'ALL' ? typeFilter : undefined,
        status: statusFilter !== 'ALL' ? statusFilter : undefined,
      }),
    )
  }, [typeFilter, statusFilter, dispatch])

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.heading}>My Library</h1>
        <Link
          to="/search"
          className={styles.addBtn}
        >
          <Plus className={styles.addBtnIcon} />
          Add
        </Link>
      </div>

      {/* Type tabs */}
      <div className={cn(styles.filterRow, styles.typeFilterRow)}>
        {TYPES.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => setTypeFilter(value)}
            className={cn(styles.tab, typeFilter === value && styles.tabActive)}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Status filter */}
      <div className={cn(styles.filterRow, styles.statusFilterRow)}>
        {STATUSES.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => setStatusFilter(value)}
            className={cn(styles.chip, statusFilter === value && styles.chipActive)}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className={styles.grid}>
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className={styles.skeleton} />
          ))}
        </div>
      ) : library.length === 0 ? (
        <div className={styles.empty}>
          <BookOpen className={styles.emptyIcon} />
          <p className={styles.emptyText}>Nothing here yet.</p>
          <Link to="/search" className={styles.emptyLink}>
            Search and add something →
          </Link>
        </div>
      ) : (
        <div className={styles.grid}>
          {library.map((entry) => (
            <MediaCard key={entry.id} entry={entry} editable />
          ))}
        </div>
      )}
    </div>
  )
}
