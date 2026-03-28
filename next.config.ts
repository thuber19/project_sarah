import type { NextConfig } from 'next'
import { withSentryConfig } from '@sentry/nextjs'
import withBundleAnalyzer from '@next/bundle-analyzer'

const withBundleAnalyzerConfig = withBundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
})

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=()' },
        ],
      },
    ]
  },
}

export default withSentryConfig(withBundleAnalyzerConfig(nextConfig), {
  // Suppress Sentry build logs
  silent: true,
  // Include dependency source maps for readable stack traces
  widenClientFileUpload: true,
  // Delete source maps after upload (hides them from browser devtools)
  sourcemaps: {
    deleteSourcemapsAfterUpload: true,
  },
  // Remove Sentry debug statements to reduce bundle size
  bundleSizeOptimizations: {
    excludeDebugStatements: true,
  },
})
