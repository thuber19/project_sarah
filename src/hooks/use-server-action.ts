'use client'

import { useCallback, useEffect, useRef, useTransition } from 'react'
import { toast } from 'sonner'
import type { ApiResponse } from '@/lib/api-response'

const DEFAULT_ERROR_MESSAGE = 'Ein Fehler ist aufgetreten'

interface UseServerActionOptions<TData> {
  /** Called with the unwrapped data on success. */
  onSuccess?: (data: TData) => void
  /** Toast message shown on success. Omit to skip the success toast. */
  successMessage?: string
  /** Fallback error message when the server response has none. */
  errorMessage?: string
}

/**
 * Wraps a server action that returns `ApiResponse<TData>` in a `useTransition`,
 * handling toast notifications and error/success callbacks.
 *
 * Supports actions with any number of arguments via rest params.
 *
 * @example
 * ```tsx
 * const { execute, isPending } = useServerAction(updateProfileAction, {
 *   successMessage: 'Profil gespeichert',
 * })
 *
 * // Single arg
 * execute({ company_name: 'Acme' })
 *
 * // No args (use `void` for TArgs)
 * const { execute } = useServerAction(refreshAction)
 * execute()
 * ```
 */
export function useServerAction<TArgs extends unknown[], TData>(
  action: (...args: TArgs) => Promise<ApiResponse<TData>>,
  options?: UseServerActionOptions<TData>,
) {
  const [isPending, startTransition] = useTransition()
  const optionsRef = useRef(options)
  useEffect(() => {
    optionsRef.current = options
  })

  const execute = useCallback(
    (...args: TArgs): void => {
      startTransition(async () => {
        try {
          const result = await action(...args)

          if (!result.success) {
            toast.error(
              result.error?.message ||
                optionsRef.current?.errorMessage ||
                DEFAULT_ERROR_MESSAGE,
            )
            return
          }

          if (optionsRef.current?.successMessage) {
            toast.success(optionsRef.current.successMessage)
          }

          optionsRef.current?.onSuccess?.(result.data)
        } catch {
          toast.error(optionsRef.current?.errorMessage ?? DEFAULT_ERROR_MESSAGE)
        }
      })
    },
    [action, startTransition],
  )

  return { execute, isPending } as const
}
