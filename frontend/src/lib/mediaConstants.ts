import { BookOpen, Film, Tv } from 'lucide-react'

export const TYPE_LABELS: Record<string, string> = {
  BOOK: 'Book',
  MOVIE: 'Movie',
  TV_SHOW: 'TV Show',
}

export const TYPE_ICON: Record<string, React.ElementType> = {
  BOOK: BookOpen,
  MOVIE: Film,
  TV_SHOW: Tv,
}
