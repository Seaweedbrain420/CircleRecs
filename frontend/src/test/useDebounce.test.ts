import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useDebounce } from '@/hooks/useDebounce'

describe('useDebounce', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns the initial value immediately', () => {
    const { result } = renderHook(() => useDebounce('initial', 400))
    expect(result.current).toBe('initial')
  })

  it('does not update before the delay has passed', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 400),
      { initialProps: { value: 'initial' } },
    )

    rerender({ value: 'updated' })
    vi.advanceTimersByTime(200)

    expect(result.current).toBe('initial')
  })

  it('updates after the delay has passed', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 400),
      { initialProps: { value: 'initial' } },
    )

    rerender({ value: 'updated' })

    act(() => {
      vi.advanceTimersByTime(400)
    })

    expect(result.current).toBe('updated')
  })

  it('resets the timer on rapid updates (debounces correctly)', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 400),
      { initialProps: { value: 'a' } },
    )

    rerender({ value: 'ab' })
    vi.advanceTimersByTime(200)
    rerender({ value: 'abc' })
    vi.advanceTimersByTime(200)

    // still not updated — timer was reset
    expect(result.current).toBe('a')

    act(() => {
      vi.advanceTimersByTime(400)
    })

    expect(result.current).toBe('abc')
  })

  it('respects a custom delay', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 1000),
      { initialProps: { value: 'initial' } },
    )

    rerender({ value: 'updated' })

    act(() => {
      vi.advanceTimersByTime(999)
    })
    expect(result.current).toBe('initial')

    act(() => {
      vi.advanceTimersByTime(1)
    })
    expect(result.current).toBe('updated')
  })

  it('works with non-string types', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 300),
      { initialProps: { value: 0 } },
    )

    rerender({ value: 42 })

    act(() => {
      vi.advanceTimersByTime(300)
    })

    expect(result.current).toBe(42)
  })
})
