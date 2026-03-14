import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { BookOpen, Film, Tv, Sparkles, Users, ArrowRight } from 'lucide-react'
import { useAppDispatch, useAppSelector } from '@/store'
import { fetchLibraryThunk, fetchFriendActivityThunk } from '@/store/slices/mediaSlice'
import { fetchRecommendationsThunk } from '@/store/slices/recommendationsSlice'
import { fetchSummaryThunk } from '@/store/slices/statsSlice'
import styles from './DashboardPage.module.scss'

const TYPE_ICON: Record<string, React.ElementType> = {
  BOOK: BookOpen,
  MOVIE: Film,
  TV_SHOW: Tv,
}

export default function DashboardPage() {
  const dispatch = useAppDispatch()
  const user = useAppSelector((s) => s.auth.user)
  const { library, friendActivity } = useAppSelector((s) => s.media)
  const { items: recs } = useAppSelector((s) => s.recommendations)
  const { summary } = useAppSelector((s) => s.stats)

  useEffect(() => {
    dispatch(fetchLibraryThunk({ status: 'IN_PROGRESS' }))
    dispatch(fetchFriendActivityThunk())
    dispatch(fetchRecommendationsThunk())
    dispatch(fetchSummaryThunk())
  }, [dispatch])

  const inProgress = library.filter((e) => e.status === 'IN_PROGRESS').slice(0, 8)
  const topRecs = recs.filter((r) => !r.saved).slice(0, 5)

  return (
    <div className={styles.page}>
      {/* Greeting */}
      <div className={styles.greeting}>
        <h1 className={styles.greetingHeading}>
          Hey, {user?.displayName?.split(' ')[0]} 👋
        </h1>
        <p className={styles.greetingSubtitle}>Here's what's happening in your circle.</p>
      </div>

      {/* Summary pills */}
      {summary && (
        <div className={styles.pillRow}>
          <SummaryPill label="In library" value={summary.totalEntries} />
          <SummaryPill label="Completed" value={summary.completedEntries} />
          <SummaryPill label="Friends" value={summary.friendCount} />
        </div>
      )}

      {/* Currently In Progress */}
      <Section
        title="Currently In Progress"
        linkTo="/library"
        empty={inProgress.length === 0}
        emptyText="Nothing in progress. Add something from Search!"
      >
        <HorizontalScroll>
          {inProgress.map((entry) => {
            const Icon = TYPE_ICON[entry.media?.type ?? 'BOOK'] ?? BookOpen
            return (
              <Link
                key={entry.id}
                to="/library"
                className={styles.inProgressCard}
              >
                <div className={styles.inProgressCover}>
                  {entry.media?.coverImageUrl ? (
                    <img
                      src={entry.media.coverImageUrl}
                      alt={entry.media.title}
                      className={styles.inProgressImg}
                    />
                  ) : (
                    <div className={styles.inProgressPlaceholder}>
                      <Icon className={styles.inProgressPlaceholderIcon} />
                    </div>
                  )}
                </div>
                <p className={styles.inProgressTitle}>{entry.media?.title}</p>
              </Link>
            )
          })}
        </HorizontalScroll>
      </Section>

      {/* Friends' Activity */}
      <Section
        title="Friends' Activity"
        linkTo="/friends"
        empty={friendActivity.length === 0}
        emptyText="Add friends to see what they're watching and reading."
      >
        <div className={styles.list}>
          {friendActivity.slice(0, 6).map((entry) => {
            const Icon = TYPE_ICON[entry.media?.type ?? 'BOOK'] ?? BookOpen
            return (
              <div
                key={entry.id}
                className={styles.activityRow}
              >
                {/* Cover thumbnail */}
                <div className={styles.activityThumb}>
                  {entry.media?.coverImageUrl ? (
                    <img
                      src={entry.media.coverImageUrl}
                      alt={entry.media.title}
                      className={styles.activityThumbImg}
                    />
                  ) : (
                    <div className={styles.activityThumbPlaceholder}>
                      <Icon className={styles.activityThumbIcon} />
                    </div>
                  )}
                </div>

                <div className={styles.activityInfo}>
                  <p className={styles.activityTitle}>{entry.media?.title}</p>
                  <p className={styles.activityMeta}>
                    <span className={styles.activityFriendName}>{(entry as any).user?.displayName}</span>
                    {' '}completed this
                  </p>
                </div>

                <span
                  className={styles.typeBadge}
                  data-type={entry.media?.type}
                >
                  {entry.media?.type?.replace('_', ' ')}
                </span>
              </div>
            )
          })}
        </div>
      </Section>

      {/* Recommended For You */}
      <Section
        title="Recommended For You"
        linkTo="/recommendations"
        empty={topRecs.length === 0}
        emptyText="Go to For You and hit Refresh to generate recommendations."
      >
        <div className={styles.list}>
          {topRecs.map((rec) => (
            <div
              key={rec.id}
              className={styles.recRow}
            >
              <div className={styles.recInfo}>
                <div className={styles.recBadgeRow}>
                  <span
                    className={styles.typeBadge}
                    data-type={rec.mediaType}
                  >
                    {rec.mediaType.replace('_', ' ')}
                  </span>
                </div>
                <p className={styles.recTitle}>{rec.title}</p>
                <p className={styles.recReason}>{rec.reason}</p>
              </div>
            </div>
          ))}
        </div>
      </Section>
    </div>
  )
}

function SummaryPill({ label, value }: { label: string; value: number }) {
  return (
    <div className={styles.pill}>
      <span className={styles.pillValue}>{value}</span>
      <span className={styles.pillLabel}>{label}</span>
    </div>
  )
}

function HorizontalScroll({ children }: { children: React.ReactNode }) {
  return (
    <div className={styles.hScroll}>
      {children}
    </div>
  )
}

function Section({
  title,
  linkTo,
  empty,
  emptyText,
  children,
}: {
  title: string
  linkTo: string
  empty: boolean
  emptyText: string
  children: React.ReactNode
}) {
  return (
    <section className={styles.section}>
      <div className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>{title}</h2>
        <Link
          to={linkTo}
          className={styles.sectionLink}
        >
          See all <ArrowRight className={styles.sectionLinkIcon} />
        </Link>
      </div>
      {empty ? (
        <p className={styles.emptyText}>{emptyText}</p>
      ) : (
        children
      )}
    </section>
  )
}
