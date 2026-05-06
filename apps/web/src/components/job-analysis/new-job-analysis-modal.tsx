// Module: Renders the "Yeni Analiz Başlat" card modal that captures a job URL and triggers analysis.
import { useState, type FormEvent, type JSX } from "react"
import { AlertCircle, Info, Link as LinkIcon, Sparkles, X } from "lucide-react"

import { Button } from "@workspace/ui/components/button"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@workspace/ui/components/field"
import { Input } from "@workspace/ui/components/input"

import {
  createJobAnalysis,
  type JobAnalysisResponse,
} from "@/lib/job-analysis-api"

type NewJobAnalysisModalProps = {
  token: string
  onClose: () => void
  onAnalysisCreated?: (analysis: JobAnalysisResponse) => void
}

export function NewJobAnalysisModal({
  token,
  onClose,
  onAnalysisCreated,
}: NewJobAnalysisModalProps): JSX.Element {
  const [url, setUrl] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault()

    const trimmedUrl = url.trim()
    if (trimmedUrl.length === 0) {
      setErrorMessage("Lütfen bir iş ilanı bağlantısı girin.")
      return
    }

    setIsSubmitting(true)
    setErrorMessage(null)

    try {
      const analysis = await createJobAnalysis(token, trimmedUrl)
      onAnalysisCreated?.(analysis)
      onClose()
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "İş ilanı analiz edilemedi. Lütfen tekrar deneyin."
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/70 p-4 backdrop-blur-sm">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="new-job-analysis-title"
        aria-describedby="new-job-analysis-description"
        className="max-h-[calc(100svh-2rem)] w-full max-w-[640px] overflow-hidden rounded-lg border border-border bg-card text-card-foreground shadow-xl"
      >
        <header className="flex items-center justify-between gap-4 border-b border-border px-5 py-4 sm:px-8">
          <h2
            id="new-job-analysis-title"
            className="text-2xl font-semibold tracking-normal"
          >
            Yeni İş Analizi Başlat
          </h2>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Pencereyi kapat"
            onClick={onClose}
            disabled={isSubmitting}
          >
            <X />
          </Button>
        </header>

        <form onSubmit={handleSubmit} className="flex flex-col">
          <div className="flex flex-col gap-7 px-5 py-6 sm:px-8">
            <p
              id="new-job-analysis-description"
              className="max-w-[560px] text-base leading-7 text-muted-foreground"
            >
              Analiz etmek istediğiniz iş ilanının bağlantısını yapıştırın. Yapay
              zeka ilanı okuyacak, yapılandırılmış iş tanımını çıkaracak ve
              profilinize kaydedecek.
            </p>

            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="job-url">İş İlanı Bağlantısı</FieldLabel>
                <div className="relative">
                  <LinkIcon className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="job-url"
                    type="url"
                    value={url}
                    onChange={(event) => setUrl(event.target.value)}
                    placeholder="https://sirket.com/kariyer/yazilim-muhendisi"
                    className="h-14 pl-11 text-base"
                    autoFocus
                    disabled={isSubmitting}
                    required
                  />
                </div>
                <FieldDescription className="flex items-start gap-2 text-xs">
                  <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
                  <span>
                    Bağlantının herkese açık olduğundan emin olun. LinkedIn gibi
                    girişe kapalı sayfalar okunamayabilir.
                  </span>
                </FieldDescription>
              </Field>
            </FieldGroup>

            {errorMessage !== null ? (
              <div
                role="alert"
                className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive"
              >
                <AlertCircle className="mt-0.5 size-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            ) : null}
          </div>

          <footer className="flex flex-col-reverse gap-3 border-t border-border bg-muted/30 px-5 py-4 sm:flex-row sm:justify-end sm:px-8">
            <Button
              type="button"
              variant="ghost"
              size="lg"
              onClick={onClose}
              disabled={isSubmitting}
              className="h-12 px-6"
            >
              İptal
            </Button>
            <Button
              type="submit"
              size="lg"
              disabled={isSubmitting}
              className="h-12 px-7 whitespace-normal"
            >
              <Sparkles data-icon="inline-start" />
              {isSubmitting ? "Analiz Ediliyor..." : "Analiz Et"}
            </Button>
          </footer>
        </form>
      </section>
    </div>
  )
}
