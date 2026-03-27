import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex">
      {/* Left Panel */}
      <div className="hidden w-1/2 bg-primary lg:flex">
        <div className="flex w-full flex-col justify-center gap-10 bg-[radial-gradient(ellipse_at_20%_80%,rgba(59,130,246,0.15),transparent_70%)] px-16 py-20">
          {/* Blue accent bar */}
          <div className="w-12 h-1 rounded-full bg-accent" />

          <div className="flex flex-col gap-2">
            <h1 className="text-3xl font-bold text-primary-foreground">
              Sarah
            </h1>
            <p className="text-lg text-sidebar-muted">
              Dein AI Sales Agent f&uuml;r den DACH-Markt
            </p>
          </div>

          {/* Benefit items */}
          <div className="mt-8 flex flex-col gap-5">
            <div className="flex items-center gap-3">
              <div className="h-2 w-2 rounded-full bg-success" />
              <span className="text-[15px] text-sidebar-muted">
                Automatische Lead-Discovery
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-2 w-2 rounded-full bg-success" />
              <span className="text-[15px] text-sidebar-muted">
                KI-gest&uuml;tztes Scoring
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-2 w-2 rounded-full bg-success" />
              <span className="text-[15px] text-sidebar-muted">
                DSGVO-konform
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel */}
      <div className="flex w-full flex-col items-center justify-center bg-white px-10 py-10 lg:w-1/2 lg:px-20">
        <div className="flex w-full max-w-[400px] flex-col gap-8">
          {/* Heading */}
          <div className="flex flex-col gap-2">
            <h2 className="text-2xl font-bold text-foreground">
              Willkommen zur&uuml;ck
            </h2>
            <p className="text-sm text-muted-foreground">
              Melde dich mit deinem Magic Link an
            </p>
          </div>

          {/* Form */}
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="email" className="text-sm font-medium text-foreground">
                Email-Adresse
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="name@unternehmen.at"
                className="h-10"
              />
            </div>
            <Button className="w-full bg-accent py-2.5 text-sm font-semibold text-white hover:bg-accent/90">
              Magic Link senden
            </Button>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-4">
            <div className="h-px flex-1 bg-border" />
            <span className="text-sm text-muted-foreground">oder</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          {/* Google button */}
          <Button
            variant="outline"
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-border py-2.5 text-sm font-medium text-foreground"
          >
            <span className="font-bold">G</span>
            Mit Google anmelden
          </Button>

          {/* Bottom text */}
          <p className="text-center text-sm text-muted-foreground">
            Noch kein Account?{" "}
            <Link
              href="/register"
              className="font-medium text-accent hover:underline"
            >
              Kostenlos registrieren
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
