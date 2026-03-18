import { useRef, useState, useEffect } from 'react'
import { Star, ChevronDown, Check } from 'lucide-react'
import { toast } from 'sonner'
import { useAppDispatch } from '@/store'
import { updateEntryThunk } from '@/store/slices/mediaSlice'
import type { MediaEntry, EntryStatus } from '@/types/media.types'
import { TYPE_ICON } from '@/lib/mediaConstants'
import { cn } from '@/lib/utils'
import styles from './MediaCard.module.scss'

const STATUS_LABELS: Record<EntryStatus, string> = {
  WANT: 'Want',
  IN_PROGRESS: 'In Progress',
  COMPLETED: 'Completed',
  DROPPED: 'Dropped',
}

const ALL_STATUSES: EntryStatus[] = ['WANT', 'IN_PROGRESS', 'COMPLETED', 'DROPPED']

interface MediaCardProps {
  entry: MediaEntry
  editable?: boolean
  onClick?: () => void
}

export default function MediaCard({ entry, editable = false, onClick }: MediaCardProps) {
  const dispatch = useAppDispatch()
  const { media } = entry
  const Icon = TYPE_ICON[media.type]

  const [open, setOpen] = useState(false)
  const [pendingStatus, setPendingStatus] = useState<EntryStatus | null>(null)
  const [rating, setRating] = useState(entry.userRating?.toString() ?? '')
  const [saving, setSaving] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // Close dropdown on outside click
  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false)
        setPendingStatus(null)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const handleStatusClick = (e: React.MouseEvent) => {
    if (!editable) return
    e.stopPropagation()
    setOpen((o) => !o)
    setPendingStatus(null)
  }

  const handleSelect = async (status: EntryStatus, e: React.MouseEvent) => {
    e.stopPropagation()
    if (status === 'COMPLETED') {
      // Show rating step before saving
      setPendingStatus('COMPLETED')
      return
    }
    // Immediate save for other statuses
    setSaving(true)
    setOpen(false)
    const result = await dispatch(updateEntryThunk({ entryId: entry.id, payload: { status } }))
    setSaving(false)
    if (updateEntryThunk.fulfilled.match(result)) {
      toast.success(`Moved to ${STATUS_LABELS[status]}`)
    }
  }

  const handleCompletedSave = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (rating) {
      const parsed = parseInt(rating, 10)
      if (isNaN(parsed) || parsed < 1 || parsed > 10) {
        toast.error('Rating must be between 1 and 10')
        return
      }
    }
    setSaving(true)
    setOpen(false)
    setPendingStatus(null)
    const result = await dispatch(
      updateEntryThunk({
        entryId: entry.id,
        payload: {
          status: 'COMPLETED',
          ...(rating ? { userRating: parseInt(rating, 10) } : {}),
        },
      }),
    )
    setSaving(false)
    if (updateEntryThunk.fulfilled.match(result)) {
      toast.success('Marked as Completed!')
    }
  }

  return (
    <div
      onClick={onClick}
      className={cn(styles.card, onClick && styles.cardClickable)}
    >
      {/* Cover */}
      <div className={styles.coverWrap}>
        {media.coverImageUrl ? (
          <img
            src={media.coverImageUrl}
            alt={media.title}
            className={styles.coverImg}
          />
        ) : (
          <div className={styles.coverPlaceholder}>
            <Icon className={styles.coverPlaceholderIcon} />
          </div>
        )}

        {/* Status badge / dropdown trigger */}
        <div ref={menuRef} className={styles.badgeAnchor}>
          <button
            onClick={handleStatusClick}
            disabled={saving}
            data-status={entry.status}
            className={cn(
              styles.statusBadge,
              editable ? styles.statusBadgeEditable : styles.statusBadgeReadonly,
            )}
          >
            {saving ? '…' : STATUS_LABELS[entry.status]}
            {editable && <ChevronDown className={styles.chevron} />}
          </button>

          {/* Dropdown */}
          {open && (
            <div
              className={styles.dropdown}
              onClick={(e) => e.stopPropagation()}
            >
              {pendingStatus === 'COMPLETED' ? (
                // Rating step for Completed
                <div className={styles.ratingStep}>
                  <p className={styles.ratingLabel}>Rate it (optional)</p>
                  <div className={styles.ratingRow}>
                    <Star className={styles.ratingStarIcon} />
                    <input
                      type="number"
                      min={1}
                      max={10}
                      value={rating}
                      onChange={(e) => setRating(e.target.value)}
                      placeholder="1–10"
                      autoFocus
                      className={styles.ratingInput}
                    />
                  </div>
                  <button
                    onClick={handleCompletedSave}
                    className={styles.completedBtn}
                  >
                    <Check className={styles.completedBtnIcon} />
                    Mark Completed
                  </button>
                </div>
              ) : (
                // Status list
                <div className={styles.statusList}>
                  {ALL_STATUSES.map((s) => (
                    <button
                      key={s}
                      onClick={(e) => handleSelect(s, e)}
                      className={cn(
                        styles.statusOption,
                        s === entry.status && styles.statusOptionActive,
                      )}
                    >
                      <span className={styles.statusDot} data-status={s} />
                      {STATUS_LABELS[s]}
                      {s === entry.status && <Check className={styles.checkIcon} />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Info */}
      <div className={styles.info}>
        <p className={styles.title}>{media.title}</p>
        {(media.author || media.director) && (
          <p className={styles.subtitle}>
            {media.author || media.director}
          </p>
        )}
        {media.releaseYear && (
          <p className={styles.year}>{media.releaseYear}</p>
        )}
        {entry.userRating != null && (
          <div className={styles.ratingBadge}>
            <Star className={styles.ratingBadgeIcon} />
            <span className={styles.ratingBadgeText}>{entry.userRating}/10</span>
          </div>
        )}
      </div>
    </div>
  )
}
