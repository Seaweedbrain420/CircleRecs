import { useEffect, useMemo } from 'react'
import { Sparkles, Bookmark, X, RefreshCw, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useAppDispatch, useAppSelector } from '@/store'
import {
  fetchRecommendationsThunk,
  generateRecommendationsThunk,
  dismissRecommendationThunk,
  saveRecommendationThunk,
} from '@/store/slices/recommendationsSlice'
import { TYPE_LABELS } from '@/lib/mediaConstants'
import styles from './RecommendationsPage.module.scss'

export default function RecommendationsPage() {
  const dispatch = useAppDispatch()
  const { items, isLoading, isGenerating, error } = useAppSelector(
    (s) => s.recommendations,
  )

  useEffect(() => {
    dispatch(fetchRecommendationsThunk())
  }, [dispatch])

  const handleGenerate = async () => {
    const result = await dispatch(generateRecommendationsThunk())
    if (generateRecommendationsThunk.fulfilled.match(result)) {
      toast.success('Fresh recommendations ready!')
    } else {
      toast.error('Failed to generate recommendations')
    }
  }

  const handleDismiss = (id: string) => {
    dispatch(dismissRecommendationThunk(id))
    toast('Recommendation dismissed')
  }

  const handleSave = (id: string) => {
    dispatch(saveRecommendationThunk(id))
    toast.success('Saved to your list')
  }

  const unsaved = useMemo(() => items.filter((r) => !r.saved), [items])
  const saved = useMemo(() => items.filter((r) => r.saved), [items])

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerText}>
          <h1>For You</h1>
          <p>AI recommendations based on your library and friends' activity</p>
        </div>
        <button
          onClick={handleGenerate}
          disabled={isGenerating}
          className={styles.btnRefresh}
        >
          {isGenerating ? (
            <Loader2 className={styles.spinIcon} />
          ) : (
            <RefreshCw className={styles.btnIcon} />
          )}
          {isGenerating ? 'Generating…' : 'Refresh'}
        </button>
      </div>

      {error && (
        <div className={styles.errorBanner}>{error}</div>
      )}

      {/* Generating skeleton */}
      {isGenerating && (
        <div className={styles.skeletonList}>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className={styles.skeletonCard} />
          ))}
        </div>
      )}

      {/* Loading state */}
      {isLoading && !isGenerating && (
        <div className={styles.skeletonList}>
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className={styles.skeletonCard} />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && !isGenerating && items.length === 0 && (
        <div className={styles.empty}>
          <Sparkles className={styles.emptyIcon} />
          <p className={styles.emptyText}>No recommendations yet.</p>
          <p className={styles.emptySubtext}>
            Hit Refresh to generate your first batch.
          </p>
        </div>
      )}

      {/* Unsaved recommendations */}
      {!isLoading && !isGenerating && unsaved.length > 0 && (
        <section className={styles.unsavedSection}>
          <div className={styles.cardList}>
            {unsaved.map((rec) => (
              <div key={rec.id} className={styles.recCard}>
                <div className={styles.cardBody}>
                  <div className={styles.cardContent}>
                    <div className={styles.badgeRow}>
                      <span className={styles.typeBadge} data-type={rec.mediaType}>
                        {TYPE_LABELS[rec.mediaType] ?? rec.mediaType}
                      </span>
                    </div>
                    <h3 className={styles.cardTitle}>{rec.title}</h3>
                    <p className={styles.cardReason}>{rec.reason}</p>
                  </div>

                  {/* Actions */}
                  <div className={styles.cardActions}>
                    <button
                      onClick={() => handleSave(rec.id)}
                      title="Save"
                      className={styles.btnSave}
                    >
                      <Bookmark className={styles.actionIcon} />
                    </button>
                    <button
                      onClick={() => handleDismiss(rec.id)}
                      title="Dismiss"
                      className={styles.btnDismiss}
                    >
                      <X className={styles.actionIcon} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Saved recommendations */}
      {!isLoading && !isGenerating && saved.length > 0 && (
        <section className={styles.savedSection}>
          <h2 className={styles.sectionHeading}>Saved ({saved.length})</h2>
          <div className={styles.cardList}>
            {saved.map((rec) => (
              <div key={rec.id} className={styles.recCardSaved}>
                <div className={styles.cardBody}>
                  <div className={styles.cardContent}>
                    <div className={styles.badgeRow}>
                      <span className={styles.typeBadge} data-type={rec.mediaType}>
                        {TYPE_LABELS[rec.mediaType] ?? rec.mediaType}
                      </span>
                      <Bookmark className={styles.savedBadgeIcon} />
                    </div>
                    <h3 className={styles.cardTitle}>{rec.title}</h3>
                    <p className={styles.cardReason}>{rec.reason}</p>
                  </div>
                  <button
                    onClick={() => handleDismiss(rec.id)}
                    title="Dismiss"
                    className={`${styles.btnDismiss} ${styles.cardActionsSaved}`}
                  >
                    <X className={styles.actionIcon} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
