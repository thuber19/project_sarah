# Lead Research Implementation Guide

## Database Setup

Before using the Lead Research feature, you need to create the `lead_research` table in Supabase.

### SQL Migration

Run this SQL in your Supabase SQL Editor:

```sql
-- Create lead_research table
CREATE TABLE lead_research (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lead_id UUID NOT NULL,
  website_url TEXT,
  tech_stack TEXT[] DEFAULT '{}',
  hiring_activity TEXT,
  growth_signals TEXT,
  dach_data JSONB,
  full_report TEXT,
  research_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT unique_user_lead_research UNIQUE(user_id, lead_id),
  FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE
);

-- Create indexes for quick lookups
CREATE INDEX lead_research_user_id_idx ON lead_research(user_id);
CREATE INDEX lead_research_lead_id_idx ON lead_research(lead_id);

-- Enable Row Level Security
ALTER TABLE lead_research ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only access their own research
CREATE POLICY lead_research_user_policy ON lead_research
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
```

### TypeScript Types

After running the migration, update your types:

```bash
pnpm db:types
```

This generates the updated `src/lib/database.types.ts` with the `lead_research` table types.

## API Endpoints

### POST /api/research/lead

Starts a research analysis for a lead.

**Request:**
```typescript
{
  leadId: string;      // UUID of the lead
  websiteUrl?: string; // Optional override for company website
}
```

**Response:**
- `200`: Streaming SSE response with research report
- `404`: Lead not found
- `400`: Invalid request

**Example:**
```typescript
const response = await fetch('/api/research/lead', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ leadId: 'abc-123' })
})

// Process SSE stream
const reader = response.body.getReader()
const decoder = new TextDecoder()

while (true) {
  const { done, value } = await reader.read()
  if (done) break
  console.log(decoder.decode(value))
}
```

## Client-Side Usage

### useLeadResearch Hook

```typescript
'use client'

import { useLeadResearch } from '@/hooks/use-lead-research'
import { LeadResearchDisplay } from '@/components/leads/lead-research-display'

export function LeadDetailPage({ leadId }: { leadId: string }) {
  const { startResearch, isLoading, fullText, error } = useLeadResearch({
    onUpdate: (chunk) => console.log('Update:', chunk),
    onComplete: (research) => console.log('Complete:', research),
    onError: (error) => console.error('Error:', error),
  })

  const handleResearch = async () => {
    await startResearch(leadId)
  }

  return (
    <div>
      <button onClick={handleResearch} disabled={isLoading}>
        {isLoading ? 'Recherchiere...' : 'Lead recherchieren'}
      </button>

      <LeadResearchDisplay
        isLoading={isLoading}
        fullText={fullText}
        error={error}
      />
    </div>
  )
}
```

## Features

### Streaming Research Report

The research tool analyzes:

1. **Tech Stack** - Identifies 5-10 technologies used
2. **Hiring Activity** - Detects open positions and growth signals
3. **Growth Signals** - Finds new products, blog activity, partnerships
4. **DACH-Specific Data** - Impressum, headquarters, employee count, locations
5. **Executive Summary** - Overall assessment and sales readiness

### Caching

- Research results are cached for 7 days per lead
- Subsequent requests return cached results immediately
- Set `websiteUrl` to force a fresh research (caching is skipped)

### Error Handling

- Network errors are caught and displayed to user
- Website scraping failures don't break the research
- Invalid lead IDs return proper error responses

## Integration

### Next Steps (for UI Integration)

1. Add a "Lead recherchieren" button to the Lead Detail page
2. Use `useLeadResearch` hook to trigger research
3. Display results with `LeadResearchDisplay` component
4. Save research results to database when analysis completes
5. Show research age and allow manual refresh

### Lead Detail Page Example

```typescript
// src/app/(app)/leads/[id]/page.tsx

import { useLeadResearch } from '@/hooks/use-lead-research'
import { LeadResearchDisplay } from '@/components/leads/lead-research-display'

export default function LeadDetailPage({ params: { id } }) {
  const { startResearch, isLoading, fullText, error } = useLeadResearch()

  return (
    <div className="space-y-6">
      {/* Existing lead info... */}

      {/* Research Section */}
      <div className="border-t pt-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Company Research</h2>
          <button
            onClick={() => startResearch(id)}
            disabled={isLoading}
          >
            {isLoading ? 'Searching...' : 'Research'}
          </button>
        </div>

        <LeadResearchDisplay
          isLoading={isLoading}
          fullText={fullText}
          error={error}
        />
      </div>
    </div>
  )
}
```

## Database Persistence (Todo)

The current implementation streams the research but doesn't automatically persist it to the database. To complete the feature:

1. Call a Server Action after streaming completes:

```typescript
const { data } = await saveLeadResearch({
  userId: user.id,
  leadId,
  techStack: extractedTechStack,
  hiringActivity,
  growthSignals,
  dachData,
  fullReport: finalText,
})
```

2. Implement the Server Action in `src/app/actions/research.actions.ts`:

```typescript
'use server'

import { requireAuth } from '@/lib/supabase/server'

export async function saveLeadResearch(data: {
  userId: string
  leadId: string
  techStack: string[]
  hiringActivity: string
  growthSignals: string
  dachData: any
  fullReport: string
}) {
  const { supabase } = await requireAuth()

  return supabase
    .from('lead_research')
    .upsert(data, { onConflict: 'user_id,lead_id' })
    .select()
    .single()
}
```

---

**Status**: Infrastructure complete, awaiting DB schema setup and full UI integration.
