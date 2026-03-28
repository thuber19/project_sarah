import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export const revalidate = 0

export async function GET() {
  const startTime = performance.now()

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        {
          status: 'error',
          message: 'Missing Supabase configuration',
          timestamp: new Date().toISOString(),
        },
        { status: 500, headers: { 'Cache-Control': 'no-store' } }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Light query to verify connectivity
    const { data, error } = await supabase
      .from('auth.users')
      .select('id')
      .limit(1)

    const responseTime = Math.round((performance.now() - startTime) * 100) / 100

    if (error) {
      return NextResponse.json(
        {
          status: 'error',
          message: 'Supabase connectivity check failed',
          timestamp: new Date().toISOString(),
          responseTime: `${responseTime}ms`,
        },
        { status: 503, headers: { 'Cache-Control': 'no-store' } }
      )
    }

    if (responseTime > 500) {
      return NextResponse.json(
        {
          status: 'degraded',
          message: 'Response time exceeded 500ms threshold',
          version: '1.0.0',
          timestamp: new Date().toISOString(),
          responseTime: `${responseTime}ms`,
        },
        { status: 200, headers: { 'Cache-Control': 'no-store' } }
      )
    }

    return NextResponse.json(
      {
        status: 'ok',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        responseTime: `${responseTime}ms`,
      },
      { status: 200, headers: { 'Cache-Control': 'no-store' } }
    )
  } catch (error) {
    const responseTime = Math.round((performance.now() - startTime) * 100) / 100

    return NextResponse.json(
      {
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
        responseTime: `${responseTime}ms`,
      },
      { status: 500, headers: { 'Cache-Control': 'no-store' } }
    )
  }
}
