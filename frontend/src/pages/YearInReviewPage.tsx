import { useEffect, useState } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
  RadialBarChart,
  RadialBar,
} from 'recharts'
import { BarChart2, ChevronLeft, ChevronRight } from 'lucide-react'
import { useAppDispatch, useAppSelector } from '@/store'
import { fetchYearStatsThunk } from '@/store/slices/statsSlice'
import styles from './YearInReviewPage.module.scss'

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

const TYPE_COLORS = {
  BOOK: '#f59e0b',
  MOVIE: '#6366f1',
  TV_SHOW: '#a78bfa',
}

export default function YearInReviewPage() {
  const dispatch = useAppDispatch()
  const { yearStats, isLoading } = useAppSelector((s) => s.stats)
  const [year, setYear] = useState(new Date().getFullYear())

  useEffect(() => {
    dispatch(fetchYearStatsThunk(year))
  }, [year, dispatch])

  const monthlyData = yearStats?.monthly.map((m) => ({
    name: MONTH_LABELS[m.month - 1],
    Books: m.BOOK,
    Movies: m.MOVIE,
    'TV Shows': m.TV_SHOW,
  })) ?? []

  const radialData = yearStats
    ? [
        { name: 'Books', value: yearStats.totals.BOOK, fill: TYPE_COLORS.BOOK },
        { name: 'Movies', value: yearStats.totals.MOVIE, fill: TYPE_COLORS.MOVIE },
        { name: 'TV Shows', value: yearStats.totals.TV_SHOW, fill: TYPE_COLORS.TV_SHOW },
      ]
    : []

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <BarChart2 className={styles.headerIcon} />
          <h1 className={styles.headerTitle}>Year in Review</h1>
        </div>
        <div className={styles.yearNav}>
          <button
            onClick={() => setYear((y) => y - 1)}
            className={styles.yearBtn}
          >
            <ChevronLeft className={styles.yearBtnIcon} />
          </button>
          <span className={styles.yearLabel}>{year}</span>
          <button
            onClick={() => setYear((y) => y + 1)}
            disabled={year >= new Date().getFullYear()}
            className={styles.yearBtn}
          >
            <ChevronRight className={styles.yearBtnIcon} />
          </button>
        </div>
      </div>

      {isLoading && (
        <div className={styles.skeletonList}>
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className={styles.skeletonBlock} />
          ))}
        </div>
      )}

      {!isLoading && yearStats && (
        <>
          {/* Stat cards */}
          <div className={styles.statsGrid}>
            <StatCard label="Total" value={yearStats.total} />
            <StatCard label="Books" value={yearStats.totals.BOOK} colorClass={styles.statValueAmber} />
            <StatCard label="Movies" value={yearStats.totals.MOVIE} colorClass={styles.statValueIndigo} />
            <StatCard label="TV Shows" value={yearStats.totals.TV_SHOW} colorClass={styles.statValueViolet} />
          </div>

          {yearStats.avgRating != null && (
            <div className={styles.avgRating}>
              <span className={styles.avgRatingLabel}>Avg rating</span>
              <span className={styles.avgRatingValue}>★ {yearStats.avgRating}</span>
            </div>
          )}

          {/* Monthly bar chart */}
          {yearStats.total > 0 ? (
            <>
              <section className={styles.chartSection}>
                <h2 className={styles.sectionHeading}>Monthly Pace</h2>
                <div className={styles.chartCard}>
                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart data={monthlyData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                      <XAxis
                        dataKey="name"
                        tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }}
                        axisLine={false}
                        tickLine={false}
                        allowDecimals={false}
                      />
                      <Tooltip
                        contentStyle={{
                          background: '#0f1423',
                          border: '1px solid rgba(255,255,255,0.08)',
                          borderRadius: 12,
                          color: '#fff',
                          fontSize: 12,
                        }}
                        cursor={{ fill: 'rgba(255,255,255,0.04)' }}
                      />
                      <Legend
                        wrapperStyle={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', paddingTop: 8 }}
                      />
                      <Bar dataKey="Books" fill={TYPE_COLORS.BOOK} radius={[4, 4, 0, 0]} />
                      <Bar dataKey="Movies" fill={TYPE_COLORS.MOVIE} radius={[4, 4, 0, 0]} />
                      <Bar dataKey="TV Shows" fill={TYPE_COLORS.TV_SHOW} radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </section>

              {/* Type breakdown */}
              <div className={styles.breakdownGrid}>
                {/* Radial chart */}
                <section>
                  <h2 className={styles.sectionHeading}>Type Breakdown</h2>
                  <div className={styles.radialCard}>
                    <ResponsiveContainer width="100%" height={200}>
                      <RadialBarChart
                        innerRadius="30%"
                        outerRadius="90%"
                        data={radialData}
                        startAngle={90}
                        endAngle={-270}
                      >
                        <RadialBar dataKey="value" background={{ fill: 'rgba(255,255,255,0.03)' }} />
                        <Legend
                          iconSize={10}
                          wrapperStyle={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}
                        />
                        <Tooltip
                          contentStyle={{
                            background: '#0f1423',
                            border: '1px solid rgba(255,255,255,0.08)',
                            borderRadius: 12,
                            fontSize: 12,
                          }}
                        />
                      </RadialBarChart>
                    </ResponsiveContainer>
                  </div>
                </section>

                {/* Top genres */}
                {yearStats.topGenres.length > 0 && (
                  <section>
                    <h2 className={styles.sectionHeading}>Top Genres</h2>
                    <div className={styles.genreCard}>
                      <div className={styles.genreList}>
                        {yearStats.topGenres.slice(0, 6).map(({ genre, count }) => {
                          const max = yearStats.topGenres[0].count
                          return (
                            <div key={genre} className={styles.genreRow}>
                              <span className={styles.genreLabel}>{genre}</span>
                              <div className={styles.genreBarTrack}>
                                <div
                                  className={styles.genreBarFill}
                                  style={{ width: `${(count / max) * 100}%` }}
                                />
                              </div>
                              <span className={styles.genreCount}>{count}</span>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </section>
                )}
              </div>
            </>
          ) : (
            <div className={styles.empty}>
              <BarChart2 className={styles.emptyIcon} />
              <p className={styles.emptyText}>No completed entries for {year}.</p>
              <p className={styles.emptySubtext}>
                Mark items as Completed to see your stats.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  )
}

function StatCard({
  label,
  value,
  colorClass = '',
}: {
  label: string
  value: number
  colorClass?: string
}) {
  return (
    <div className={styles.statCard}>
      <p className={`${styles.statValue}${colorClass ? ` ${colorClass}` : ''}`}>{value}</p>
      <p className={styles.statLabel}>{label}</p>
    </div>
  )
}
