import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import type { ApiResponse } from '@/lib/api-response'

// ---------------------------------------------------------------------------
// Mock sonner toast
// ---------------------------------------------------------------------------
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}))

// We import toast AFTER vi.mock so the mock is in effect
import { toast } from 'sonner'
import { useServerAction } from './use-server-action'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function successResponse<T>(data: T): ApiResponse<T> {
  return { success: true, data }
}

function failResponse(code: string, message: string): ApiResponse<never> {
  return { success: false, error: { code, message } }
}

/** Flushes microtasks so the startTransition callback completes. */
async function flushTransition() {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0))
  })
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('useServerAction', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // =========================================================================
  // Success path
  // =========================================================================

  describe('success path', () => {
    it('should call onSuccess with the unwrapped data', async () => {
      const action = vi.fn().mockResolvedValue(successResponse({ id: '123' }))
      const onSuccess = vi.fn()

      const { result } = renderHook(() =>
        useServerAction(action, { onSuccess }),
      )

      act(() => {
        result.current.execute({ name: 'test' })
      })
      await flushTransition()

      expect(action).toHaveBeenCalledWith({ name: 'test' })
      expect(onSuccess).toHaveBeenCalledWith({ id: '123' })
    })

    it('should show success toast when successMessage is provided', async () => {
      const action = vi.fn().mockResolvedValue(successResponse('ok'))

      const { result } = renderHook(() =>
        useServerAction(action, { successMessage: 'Gespeichert!' }),
      )

      act(() => {
        result.current.execute('input')
      })
      await flushTransition()

      expect(toast.success).toHaveBeenCalledWith('Gespeichert!')
    })

    it('should not show success toast when successMessage is omitted', async () => {
      const action = vi.fn().mockResolvedValue(successResponse('ok'))

      const { result } = renderHook(() => useServerAction(action))

      act(() => {
        result.current.execute()
      })
      await flushTransition()

      expect(toast.success).not.toHaveBeenCalled()
    })

    it('should not call toast.error on success', async () => {
      const action = vi.fn().mockResolvedValue(successResponse(42))

      const { result } = renderHook(() =>
        useServerAction(action, { successMessage: 'Done' }),
      )

      act(() => {
        result.current.execute()
      })
      await flushTransition()

      expect(toast.error).not.toHaveBeenCalled()
    })
  })

  // =========================================================================
  // Error path
  // =========================================================================

  describe('error path', () => {
    it('should show the server error message via toast.error', async () => {
      const action = vi
        .fn()
        .mockResolvedValue(failResponse('VALIDATION_ERROR', 'Ungültige E-Mail'))

      const { result } = renderHook(() => useServerAction(action))

      act(() => {
        result.current.execute()
      })
      await flushTransition()

      expect(toast.error).toHaveBeenCalledWith('Ungültige E-Mail')
    })

    it('should not call onSuccess on failure', async () => {
      const action = vi
        .fn()
        .mockResolvedValue(failResponse('INTERNAL_ERROR', 'Server error'))
      const onSuccess = vi.fn()

      const { result } = renderHook(() =>
        useServerAction(action, { onSuccess }),
      )

      act(() => {
        result.current.execute()
      })
      await flushTransition()

      expect(onSuccess).not.toHaveBeenCalled()
    })

    it('should not show success toast on failure', async () => {
      const action = vi
        .fn()
        .mockResolvedValue(failResponse('INTERNAL_ERROR', 'Nope'))

      const { result } = renderHook(() =>
        useServerAction(action, { successMessage: 'Should not appear' }),
      )

      act(() => {
        result.current.execute()
      })
      await flushTransition()

      expect(toast.success).not.toHaveBeenCalled()
    })

    it('should use fallback errorMessage when server provides no message', async () => {
      // Simulate a malformed error response without message
      const action = vi.fn().mockResolvedValue({
        success: false,
        error: { code: 'UNKNOWN', message: '' },
      })

      const { result } = renderHook(() =>
        useServerAction(action, { errorMessage: 'Benutzerdefinierter Fehler' }),
      )

      act(() => {
        result.current.execute()
      })
      await flushTransition()

      // Empty string is falsy, so it falls through to errorMessage option
      expect(toast.error).toHaveBeenCalledWith('Benutzerdefinierter Fehler')
    })

    it('should use German default when no errorMessage option and server message is empty', async () => {
      const action = vi.fn().mockResolvedValue({
        success: false,
        error: { code: 'UNKNOWN', message: '' },
      })

      const { result } = renderHook(() => useServerAction(action))

      act(() => {
        result.current.execute()
      })
      await flushTransition()

      expect(toast.error).toHaveBeenCalledWith('Ein Fehler ist aufgetreten')
    })
  })

  // =========================================================================
  // Exception handling (action throws)
  // =========================================================================

  describe('exception handling', () => {
    it('should catch a thrown error and show toast.error', async () => {
      const action = vi.fn().mockRejectedValue(new Error('Network failure'))

      const { result } = renderHook(() => useServerAction(action))

      act(() => {
        result.current.execute()
      })
      await flushTransition()

      expect(toast.error).toHaveBeenCalledWith('Ein Fehler ist aufgetreten')
    })

    it('should use custom errorMessage when action throws', async () => {
      const action = vi.fn().mockRejectedValue(new Error('boom'))

      const { result } = renderHook(() =>
        useServerAction(action, { errorMessage: 'Netzwerkfehler' }),
      )

      act(() => {
        result.current.execute()
      })
      await flushTransition()

      expect(toast.error).toHaveBeenCalledWith('Netzwerkfehler')
    })

    it('should not call onSuccess when action throws', async () => {
      const action = vi.fn().mockRejectedValue(new Error('crash'))
      const onSuccess = vi.fn()

      const { result } = renderHook(() =>
        useServerAction(action, { onSuccess }),
      )

      act(() => {
        result.current.execute()
      })
      await flushTransition()

      expect(onSuccess).not.toHaveBeenCalled()
    })
  })

  // =========================================================================
  // isPending state
  // =========================================================================

  describe('isPending state', () => {
    it('should start with isPending = false', () => {
      const action = vi.fn().mockResolvedValue(successResponse(null))

      const { result } = renderHook(() => useServerAction(action))

      expect(result.current.isPending).toBe(false)
    })

    it('should return isPending = false after action completes', async () => {
      const action = vi.fn().mockResolvedValue(successResponse('done'))

      const { result } = renderHook(() => useServerAction(action))

      act(() => {
        result.current.execute()
      })
      await flushTransition()

      expect(result.current.isPending).toBe(false)
    })

    it('should return isPending = false after action fails', async () => {
      const action = vi
        .fn()
        .mockResolvedValue(failResponse('ERR', 'fail'))

      const { result } = renderHook(() => useServerAction(action))

      act(() => {
        result.current.execute()
      })
      await flushTransition()

      expect(result.current.isPending).toBe(false)
    })

    it('should return isPending = false after action throws', async () => {
      const action = vi.fn().mockRejectedValue(new Error('crash'))

      const { result } = renderHook(() => useServerAction(action))

      act(() => {
        result.current.execute()
      })
      await flushTransition()

      expect(result.current.isPending).toBe(false)
    })
  })

  // =========================================================================
  // Argument passing
  // =========================================================================

  describe('argument passing', () => {
    it('should pass zero arguments to the action', async () => {
      const action = vi.fn().mockResolvedValue(successResponse(null))

      const { result } = renderHook(() => useServerAction(action))

      act(() => {
        result.current.execute()
      })
      await flushTransition()

      expect(action).toHaveBeenCalledWith()
    })

    it('should pass a single object argument to the action', async () => {
      const action = vi.fn().mockResolvedValue(successResponse(null))

      const { result } = renderHook(() => useServerAction(action))

      act(() => {
        result.current.execute({ grade: 'HOT', q: 'test' })
      })
      await flushTransition()

      expect(action).toHaveBeenCalledWith({ grade: 'HOT', q: 'test' })
    })

    it('should pass multiple arguments to the action', async () => {
      const action: Mock<(a: string, b: number) => Promise<ApiResponse<string>>> = vi
        .fn()
        .mockResolvedValue(successResponse('ok'))

      const { result } = renderHook(() => useServerAction(action))

      act(() => {
        result.current.execute('lead-id', 42)
      })
      await flushTransition()

      expect(action).toHaveBeenCalledWith('lead-id', 42)
    })
  })

  // =========================================================================
  // Stable reference
  // =========================================================================

  describe('reference stability', () => {
    it('should return a stable execute function across re-renders', () => {
      const action = vi.fn().mockResolvedValue(successResponse(null))

      const { result, rerender } = renderHook(() => useServerAction(action))

      const firstExecute = result.current.execute
      rerender()
      const secondExecute = result.current.execute

      expect(firstExecute).toBe(secondExecute)
    })
  })
})
