import Link from 'next/link'
import { Mail, AtSign, RefreshCw, ArrowLeft, Shield } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AuthLeftPanel } from '@/components/auth/auth-left-panel'

export default function MagicLinkSentPage() {
  return (
    <div className="min-h-screen flex">
      <AuthLeftPanel />

      {/* Right Panel */}
      <div className="flex w-full flex-col items-center justify-center bg-white px-10 py-10 lg:w-1/2 lg:px-20">
        <div className="flex w-full max-w-[400px] flex-col items-center">
          {/* Icon circle */}
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-accent-light">
            <Mail className="h-9 w-9 text-accent" />
          </div>

          {/* Heading */}
          <h2 className="mt-8 text-2xl font-bold text-foreground tracking-[-0.5px]">
            &Uuml;berpr&uuml;fe dein Postfach
          </h2>

          {/* Subtitle */}
          <p className="mt-2 text-sm text-muted-foreground text-center">
            Wir haben dir einen Magic Link an deine E-Mail-Adresse gesendet. Bitte klicke auf den
            Link, um dich anzumelden.
          </p>

          {/* Email display */}
          <div className="mt-6 flex w-full items-center gap-3 rounded-lg border border-border px-4 py-3">
            <AtSign className="h-4 w-4 text-accent" />
            <span className="text-sm text-foreground">sarah@unternehmen.de</span>
          </div>

          {/* Resend button */}
          <Button variant="outline" className="mt-4 w-full">
            <RefreshCw className="mr-2 h-4 w-4" />
            Link erneut senden
          </Button>

          {/* Back link */}
          <Link
            href="/login"
            className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-accent hover:underline"
          >
            <ArrowLeft className="h-4 w-4" />
            Zur&uuml;ck zur Anmeldung
          </Link>

          {/* Footer */}
          <div className="mt-8 flex items-center gap-1.5 text-xs text-muted-foreground">
            <Shield className="h-3.5 w-3.5" />
            <span>DSGVO-konform &middot; Keine Kreditkarte n&ouml;tig</span>
          </div>
        </div>
      </div>
    </div>
  )
}
