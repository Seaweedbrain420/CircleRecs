import { useState, useEffect } from 'react'
import { Search, Loader2 } from 'lucide-react'
import { useAppDispatch, useAppSelector } from '@/store'
import { searchMediaThunk, clearSearchResults } from '@/store/slices/mediaSlice'
import { openAddEntryModal } from '@/store/slices/uiSlice'
import { useDebounce } from '@/hooks/useDebounce'
import SearchResultCard from '@/components/media/SearchResultCard'
import AddEntryModal from '@/components/media/AddEntryModal'
import type { MediaType, MediaSearchResult } from '@/types/media.types'
import { cn } from '@/lib/utils'
import styles from './SearchPage.module.scss'

const TYPES: { value: MediaType; label: string }[] = [
  { value: 'BOOK', label: 'Books' },
  { value: 'MOVIE', label: 'Movies' },
  { value: 'TV_SHOW', label: 'TV Shows' },
]

export default function SearchPage() {
  const dispatch = useAppDispatch()
  const { searchResults, isSearching } = useAppSelector((s) => s.media)
  const { addEntryModalOpen, selectedMediaForAdd } = useAppSelector((s) => s.ui)

  const [query, setQuery] = useState('')
  const [type, setType] = useState<MediaType>('BOOK')
  const debouncedQuery = useDebounce(query, 400)

  useEffect(() => {
    if (debouncedQuery.trim().length < 2) {
      dispatch(clearSearchResults())
      return
    }
    dispatch(searchMediaThunk({ type, query: debouncedQuery }))
  }, [debouncedQuery, type, dispatch])

  const handleTypeChange = (t: MediaType) => {
    setType(t)
    if (debouncedQuery.trim().length >= 2) {
      dispatch(searchMediaThunk({ type: t, query: debouncedQuery }))
    }
  }

  const handleAdd = (result: MediaSearchResult) => {
    dispatch(openAddEntryModal(result))
  }

  return (
    <div className={styles.page}>
      <h1 className={styles.heading}>Search</h1>

      {/* Type toggle */}
      <div className={styles.typeRow}>
        {TYPES.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => handleTypeChange(value)}
            className={cn(styles.typeBtn, type === value && styles.typeBtnActive)}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Search input */}
      <div className={styles.inputWrap}>
        <Search className={styles.inputIcon} />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={`Search ${TYPES.find((t) => t.value === type)?.label.toLowerCase()}…`}
          className={styles.input}
        />
        {isSearching && (
          <Loader2 className={styles.spinnerIcon} />
        )}
      </div>

      {/* Results */}
      {searchResults.length > 0 && (
        <div className={styles.results}>
          {searchResults.map((result) => (
            <SearchResultCard
              key={result.externalId}
              result={result}
              onAdd={handleAdd}
            />
          ))}
        </div>
      )}

      {!isSearching && query.length >= 2 && searchResults.length === 0 && (
        <p className={styles.noResults}>No results found</p>
      )}

      {query.length === 0 && (
        <p className={styles.hint}>
          Type at least 2 characters to search
        </p>
      )}

      {addEntryModalOpen && selectedMediaForAdd && (
        <AddEntryModal media={selectedMediaForAdd} />
      )}
    </div>
  )
}
