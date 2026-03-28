'use client'

import { useState } from 'react'
import { Beaker, Loader2 } from 'lucide-react'
import { useLeadResearch } from '@/hooks/use-lead-research'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

interface LeadResearchButtonProps {
  leadId: string
  companyName?: string
}

export function LeadResearchButton({
  leadId,
  companyName,
}: LeadResearchButtonProps) {
  const [open, setOpen] = useState(false)
  const { startResearch, isLoading, fullText, research } = useLeadResearch()

  const handleStartResearch = async () => {
    await startResearch(leadId)
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => {
          setOpen(true)
          if (!fullText) {
            handleStartResearch()
          }
        }}
        className="gap-2"
        disabled={isLoading}
      >
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Analysiere...
          </>
        ) : (
          <>
            <Beaker className="h-4 w-4" />
            Lead recherchieren
          </>
        )}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Lead-Recherche: {companyName || 'Firma'}</DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto pr-4 py-4">
            {isLoading && !fullText ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-accent" />
                  <p className="text-sm text-muted-foreground">Analysiere Website...</p>
                </div>
              </div>
            ) : fullText ? (
              <div className="text-sm text-foreground space-y-4">
                <div
                  dangerouslySetInnerHTML={{
                    __html: fullText
                      .split('\n')
                      .map(line => {
                        if (line.startsWith('## ')) {
                          return `<h2 class="mt-4 mb-2 font-semibold text-base">${line.replace('## ', '')}</h2>`
                        }
                        if (line.startsWith('### ')) {
                          return `<h3 class="mt-3 mb-2 font-semibold text-sm">${line.replace('### ', '')}</h3>`
                        }
                        if (line.startsWith('- ') || line.startsWith('* ')) {
                          return `<li class="ml-4 text-sm">${line.replace(/^[-*]\s+/, '')}</li>`
                        }
                        if (line.trim()) {
                          return `<p class="text-sm text-foreground">${line}</p>`
                        }
                        return ''
                      })
                      .join('')
                  }}
                />
              </div>
            ) : (
              <div className="text-sm text-muted-foreground py-4">
                Starten Sie eine Recherche, um die Website zu analysieren
              </div>
            )}
          </div>

          {research && (
            <div className="mt-4 pt-4 border-t border-border">
              <div className="grid grid-cols-2 gap-4 text-sm">
                {research.tech_stack && research.tech_stack.length > 0 && (
                  <div>
                    <p className="font-semibold text-foreground mb-2">Tech Stack</p>
                    <div className="flex flex-wrap gap-1">
                      {research.tech_stack.map((tech, idx) => (
                        <span
                          key={idx}
                          className="bg-secondary text-secondary-foreground px-2 py-1 rounded text-xs"
                        >
                          {tech}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {research.dach_data?.locations && research.dach_data.locations.length > 0 && (
                  <div>
                    <p className="font-semibold text-foreground mb-2">Standorte (DACH)</p>
                    <ul className="text-xs text-muted-foreground space-y-1">
                      {research.dach_data.locations.map((loc, idx) => (
                        <li key={idx}>• {loc}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="mt-4 flex justify-end gap-2 pt-4 border-t border-border">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Schließen
            </Button>
            {!isLoading && (
              <Button onClick={handleStartResearch} className="gap-2">
                <Beaker className="h-4 w-4" />
                Neu recherchieren
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
