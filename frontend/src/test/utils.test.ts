import { describe, it, expect } from 'vitest'
import { cn } from '@/lib/utils'

describe('cn utility', () => {
  it('returns an empty string for no arguments', () => {
    expect(cn()).toBe('')
  })

  it('returns a single class name unchanged', () => {
    expect(cn('foo')).toBe('foo')
  })

  it('joins multiple class names with a space', () => {
    expect(cn('foo', 'bar', 'baz')).toBe('foo bar baz')
  })

  it('ignores falsy values', () => {
    expect(cn('foo', false && 'bar', null, undefined, 0 && 'baz')).toBe('foo')
  })

  it('includes truthy conditional classes', () => {
    const isActive = true
    expect(cn('base', isActive && 'active')).toBe('base active')
  })

  it('merges conflicting Tailwind classes (last wins)', () => {
    // bg-red-500 and bg-blue-500 conflict — tailwind-merge keeps the last one
    expect(cn('bg-red-500', 'bg-blue-500')).toBe('bg-blue-500')
  })

  it('handles object syntax from clsx', () => {
    expect(cn({ foo: true, bar: false, baz: true })).toBe('foo baz')
  })

  it('handles array syntax from clsx', () => {
    expect(cn(['foo', 'bar'])).toBe('foo bar')
  })

  it('merges padding utilities correctly', () => {
    // p-4 and px-2 — tailwind-merge resolves the conflict
    const result = cn('p-4', 'px-2')
    expect(result).toBe('p-4 px-2')
  })
})
