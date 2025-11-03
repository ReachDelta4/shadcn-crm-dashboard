import { describe, it, expect, vi } from 'vitest'
import { debounce } from '@/utils/timing/debounce'

describe('debounce()', () => {
  it('invokes only once after wait period with latest args', () => {
    vi.useFakeTimers()
    const spy = vi.fn()
    const d = debounce(spy, 200)
    d('a')
    d('ab')
    d('abc')
    expect(spy).not.toHaveBeenCalled()
    vi.advanceTimersByTime(199)
    expect(spy).not.toHaveBeenCalled()
    vi.advanceTimersByTime(1)
    expect(spy).toHaveBeenCalledTimes(1)
    expect(spy).toHaveBeenCalledWith('abc')
    vi.useRealTimers()
  })
})

