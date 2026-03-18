import { useState } from 'react'
import { X } from 'lucide-react'
import { toast } from 'sonner'
import { useAppDispatch } from '@/store'
import { addEntryThunk } from '@/store/slices/mediaSlice'
import { closeAddEntryModal } from '@/store/slices/uiSlice'
import type { MediaSearchResult, EntryStatus } from '@/types/media.types'
import { cn } from '@/lib/utils'
import styles from './AddEntryModal.module.scss'

const STATUSES: { value: EntryStatus; label: string }[] = [
  { value: 'WANT', label: 'Want to read/watch' },
  { value: 'IN_PROGRESS', label: 'Currently reading/watching' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'DROPPED', label: 'Dropped' },
]

interface AddEntryModalProps {
  media: MediaSearchResult
}

export default function AddEntryModal({ media }: AddEntryModalProps) {
  const dispatch = useAppDispatch()
  const [status, setStatus] = useState<EntryStatus>('WANT')
  const [rating, setRating] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (rating) {
      const parsed = parseInt(rating, 10)
      if (isNaN(parsed) || parsed < 1 || parsed > 10) {
        toast.error('Rating must be between 1 and 10')
        return
      }
    }
    setIsSubmitting(true)
    const result = await dispatch(
      addEntryThunk({
        mediaType: media.type,
        externalId: media.externalId,
        status,
        userRating: rating ? parseInt(rating, 10) : undefined,
      }),
    )
    setIsSubmitting(false)
    if (addEntryThunk.fulfilled.match(result)) {
      toast.success(`"${media.title}" added to your library`)
    } else {
      toast.error('Failed to add — it may already be in your library')
    }
    dispatch(closeAddEntryModal())
  }

  return (
    <div className={styles.backdrop}>
      <div className={styles.panel}>
        <button
          onClick={() => dispatch(closeAddEntryModal())}
          className={styles.closeBtn}
        >
          <X className={styles.closeBtnIcon} />
        </button>

        {/* Media info */}
        <div className={styles.mediaInfo}>
          {media.coverImageUrl && (
            <img
              src={media.coverImageUrl}
              alt={media.title}
              className={styles.coverImg}
            />
          )}
          <div className={styles.mediaMeta}>
            <p className={styles.mediaTitle}>{media.title}</p>
            {(media.author || media.director) && (
              <p className={styles.mediaSubtitle}>{media.author || media.director}</p>
            )}
            {media.releaseYear && (
              <p className={styles.mediaYear}>{media.releaseYear}</p>
            )}
          </div>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          {/* Status */}
          <div className={styles.field}>
            <label className={styles.label}>Status</label>
            <div className={styles.statusGrid}>
              {STATUSES.map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setStatus(value)}
                  className={cn(
                    styles.statusBtn,
                    status === value && styles.statusBtnActive,
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Rating (only if completed) */}
          {status === 'COMPLETED' && (
            <div className={styles.field}>
              <label className={styles.label}>
                Rating (1–10){' '}
                <span className={styles.labelOptional}>optional</span>
              </label>
              <input
                type="number"
                min={1}
                max={10}
                value={rating}
                onChange={(e) => setRating(e.target.value)}
                placeholder="e.g. 8"
                className={styles.ratingInput}
              />
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className={styles.submitBtn}
          >
            {isSubmitting ? 'Adding…' : 'Add to Library'}
          </button>
        </form>
      </div>
    </div>
  )
}
