'use client'

import { Toaster as SonnerToaster } from 'sonner'

export function Toaster() {
  return (
    <SonnerToaster
      position="bottom-right"
      toastOptions={{
        className: 'font-sans',
        style: {
          fontFamily: 'var(--font-sans)',
        },
      }}
      richColors
      closeButton
    />
  )
}
