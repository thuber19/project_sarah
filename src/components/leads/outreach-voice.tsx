'use client'

import { useState, useRef } from 'react'
import { Download, Mic, Play, Square } from 'lucide-react'
import { GeneratedContentCard } from '@/components/shared/generated-content-card'

interface Props {
  leadId: string
  companyName: string | null
}

type Tone = 'professional' | 'friendly'
type Status = 'idle' | 'generating' | 'ready' | 'error'

export function OutreachVoice({ leadId, companyName }: Props) {
  const [status, setStatus] = useState<Status>('idle')
  const [tone, setTone] = useState<Tone>('professional')
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [script, setScript] = useState<string | null>(null)
  const [filename, setFilename] = useState('voice-message.mp3')
  const [isPlaying, setIsPlaying] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  async function generate() {
    setStatus('generating')
    setError(null)
    if (audioUrl) URL.revokeObjectURL(audioUrl)
    setAudioUrl(null)
    setScript(null)

    try {
      const res = await fetch('/api/outreach/voice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadId, tone }),
      })

      if (!res.ok) {
        const text = await res.text()
        throw new Error(text || 'Unbekannter Fehler')
      }

      const blob = await res.blob()
      const url = URL.createObjectURL(blob)

      const rawScript = res.headers.get('X-Script')
      if (rawScript) setScript(decodeURIComponent(rawScript))

      const disposition = res.headers.get('Content-Disposition')
      const match = disposition?.match(/filename="([^"]+)"/)
      if (match) setFilename(match[1])

      setAudioUrl(url)
      setStatus('ready')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fehler bei der Generierung')
      setStatus('error')
    }
  }

  function togglePlay() {
    if (!audioRef.current) return
    if (isPlaying) {
      audioRef.current.pause()
    } else {
      audioRef.current.play().catch(() => null)
    }
  }

  return (
    <GeneratedContentCard
      title="Voice Message"
      description={`Generiere eine persönliche Sprachnachricht für ${companyName ?? 'diesen Lead'} — als MP3 zum Herunterladen für LinkedIn oder Voicemail.`}
      icon={<Mic className="h-4 w-4" />}
      isLoading={status === 'generating'}
      completion={script}
      onGenerate={generate}
      generateLabel="Voice Message generieren"
      regenerateLabel="Neu generieren"
      emptyLabel="Noch keine Voice Message generiert"
    >
      {/* Tone selector */}
      <div className="mb-4 flex gap-2">
        {(['professional', 'friendly'] as Tone[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTone(t)}
            className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${
              tone === t
                ? 'border-accent bg-accent-light text-accent'
                : 'border-border bg-white text-muted-foreground hover:bg-secondary'
            }`}
          >
            {t === 'professional' ? 'Professionell (Sie)' : 'Persönlich (Du)'}
          </button>
        ))}
      </div>

      {/* Error */}
      {status === 'error' && error && (
        <div className="mb-4 rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Audio player + download */}
      {status === 'ready' && audioUrl && (
        <div className="mb-4 space-y-3" aria-live="polite">
          {/* Hidden native audio element */}
          <audio
            ref={audioRef}
            src={audioUrl}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onEnded={() => setIsPlaying(false)}
          />

          {/* Custom controls */}
          <div className="flex items-center gap-3 rounded-lg border border-border bg-secondary p-3">
            <button
              type="button"
              onClick={togglePlay}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent text-white hover:bg-accent/90"
              aria-label={isPlaying ? 'Pause' : 'Abspielen'}
            >
              {isPlaying ? (
                <Square className="h-4 w-4 fill-white" />
              ) : (
                <Play className="h-4 w-4 fill-white" />
              )}
            </button>
            <span className="flex-1 text-sm text-muted-foreground">
              {isPlaying ? 'Wird abgespielt…' : 'Bereit zum Abspielen'}
            </span>
            <a
              href={audioUrl}
              download={filename}
              className="flex items-center gap-1.5 rounded-lg border border-border bg-white px-3 py-1.5 text-sm font-medium text-foreground hover:bg-secondary"
            >
              <Download className="h-4 w-4" />
              Download MP3
            </a>
          </div>
        </div>
      )}
    </GeneratedContentCard>
  )
}
