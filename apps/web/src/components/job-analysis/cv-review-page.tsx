// Module: Renders the tailored CV produced by the LLM (passed via router state).
import { useState, type JSX } from "react"
import { useLocation, useNavigate } from "react-router"
import {
  ArrowLeft,
  AlertTriangle,
  Briefcase,
  Check,
  ChevronDown,
  Download,
  Eye,
  FileText,
  ListChecks,
  Loader2,
  PencilLine,
  PlusCircle,
  ShieldCheck,
  TrendingUp,
  User,
  X,
  ZoomIn,
  ZoomOut,
  type LucideIcon,
} from "lucide-react"

import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import { Card, CardContent, CardHeader } from "@workspace/ui/components/card"
import { Separator } from "@workspace/ui/components/separator"
import { cn } from "@workspace/ui/lib/utils"

import {
  generateAtsReport,
  type AtsMatchLevel,
  type AtsReport,
} from "@/lib/ats-report-api"
import { downloadCvAsDocx } from "@/lib/cv-docx"
import type { TailoredCv } from "@/lib/cv-generation-api"
import type { JobAnalysisResponse } from "@/lib/job-analysis-api"

type ReviewStepStatus = "completed" | "active" | "pending"

type ReviewStep = {
  index: number
  title: string
  status: ReviewStepStatus
}

type ReviewSidebarItem = {
  href: string
  label: string
  icon: typeof User
  isActive?: boolean
}

type CvReviewLocationState = {
  tailoredCv?: TailoredCv
  analysis?: JobAnalysisResponse
  token?: string
}

const reviewSteps: ReviewStep[] = [
  { index: 1, title: "Analiz", status: "completed" },
  { index: 2, title: "Düzenleme", status: "completed" },
  { index: 3, title: "İnceleme", status: "active" },
]

const reviewSidebarItems: ReviewSidebarItem[] = [
  { href: "#profilim", label: "Profilim", icon: User },
  { href: "#is-analizi", label: "İş Analizi", icon: Briefcase },
  {
    href: "#gelisim-merkezi",
    label: "Gelişim Merkezi",
    icon: TrendingUp,
    isActive: true,
  },
  { href: "#belgeler", label: "Belgeler", icon: FileText },
]

function ReviewSidebar(): JSX.Element {
  return (
    <aside
      className="hidden w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground lg:flex"
      aria-label="Bölüm gezinmesi"
    >
      <div className="flex flex-col items-center gap-2 px-5 pt-8 pb-5 text-center">
        <div
          className="flex size-16 items-center justify-center rounded-full bg-muted text-muted-foreground"
          aria-hidden="true"
        >
          <User className="size-8" />
        </div>
        <div>
          <p className="text-base leading-tight font-semibold">
            Kariyer Asistanı
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Yapay Zeka Destekli
          </p>
        </div>
      </div>

      <div className="px-4 pb-4">
        <Button type="button" size="lg" className="w-full">
          <PlusCircle data-icon="inline-start" />
          Yeni Analiz Başlat
        </Button>
      </div>

      <Separator />

      <nav
        className="flex flex-1 flex-col gap-1 px-3 py-3"
        aria-label="Bölümler"
      >
        {reviewSidebarItems.map((item) => {
          const Icon = item.icon

          return (
            <Button
              key={item.href}
              asChild
              variant="ghost"
              size="lg"
              className={cn(
                "w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                item.isActive &&
                  "bg-primary/10 text-primary hover:bg-primary/15 hover:text-primary"
              )}
              aria-current={item.isActive ? "page" : undefined}
            >
              <a href={item.href}>
                <Icon data-icon="inline-start" />
                <span className="truncate">{item.label}</span>
              </a>
            </Button>
          )
        })}
      </nav>
    </aside>
  )
}

function ReviewStepper(): JSX.Element {
  return (
    <ol
      className="flex w-full items-center gap-2"
      aria-label="Sihirbaz aşamaları"
    >
      {reviewSteps.map((step, index) => {
        const isCompleted = step.status === "completed"
        const isActive = step.status === "active"

        return (
          <li
            key={step.index}
            className="flex flex-1 items-center gap-3"
            aria-current={isActive ? "step" : undefined}
          >
            <div className="flex flex-col items-center gap-1.5">
              <span
                className={cn(
                  "flex size-9 items-center justify-center rounded-full border-2 text-sm font-semibold",
                  isCompleted &&
                    "border-primary bg-primary text-primary-foreground",
                  isActive &&
                    "border-primary bg-primary text-primary-foreground",
                  !isCompleted &&
                    !isActive &&
                    "border-border bg-background text-muted-foreground"
                )}
              >
                {isCompleted ? <Check className="size-4" /> : step.index}
              </span>
              <p
                className={cn(
                  "text-xs font-medium",
                  isActive && "text-primary",
                  !isActive && !isCompleted && "text-muted-foreground"
                )}
              >
                {step.title}
              </p>
            </div>
            {index < reviewSteps.length - 1 ? (
              <span
                aria-hidden="true"
                className={cn(
                  "mb-5 h-px flex-1",
                  isCompleted ? "bg-primary" : "bg-border"
                )}
              />
            ) : null}
          </li>
        )
      })}
    </ol>
  )
}

type ReviewToolbarProps = {
  onDownload: () => void
  onGenerateAtsReport: () => void
  isDownloading: boolean
  isDownloadDisabled: boolean
  isAtsReportLoading: boolean
  isAtsReportDisabled: boolean
}

function ReviewToolbar({
  onDownload,
  onGenerateAtsReport,
  isDownloading,
  isDownloadDisabled,
  isAtsReportLoading,
  isAtsReportDisabled,
}: ReviewToolbarProps): JSX.Element {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
      <div className="flex items-center gap-2">
        <Eye className="size-4 text-muted-foreground" aria-hidden="true" />
        <h2 className="text-base font-semibold">Sonuç Önizlemesi</h2>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" variant="outline" size="sm">
          <PencilLine data-icon="inline-start" />
          Düzenlemeye Geri Dön
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onGenerateAtsReport}
          disabled={isAtsReportDisabled || isAtsReportLoading}
        >
          {isAtsReportLoading ? (
            <Loader2 data-icon="inline-start" className="animate-spin" />
          ) : (
            <ListChecks data-icon="inline-start" />
          )}
          {isAtsReportLoading ? "Rapor Hazırlanıyor..." : "ATS Raporu"}
        </Button>
        <div
          className="inline-flex items-stretch overflow-hidden rounded-lg"
          data-slot="button-group"
        >
          <Button
            type="button"
            size="sm"
            className="rounded-r-none"
            onClick={onDownload}
            disabled={isDownloadDisabled || isDownloading}
            aria-label="CV'yi DOCX olarak indir"
          >
            {isDownloading ? (
              <Loader2 data-icon="inline-start" className="animate-spin" />
            ) : (
              <Download data-icon="inline-start" />
            )}
            {isDownloading ? "Hazırlanıyor..." : "DOCX İndir"}
          </Button>
          <Button
            type="button"
            size="sm"
            className="rounded-l-none border-l border-primary-foreground/20 px-2"
            aria-label="Daha fazla indirme seçeneği"
            disabled={isDownloadDisabled || isDownloading}
          >
            <ChevronDown />
          </Button>
        </div>

        <Separator orientation="vertical" className="mx-1 h-6" />

        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label="Yakınlaştır"
        >
          <ZoomIn />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label="Uzaklaştır"
        >
          <ZoomOut />
        </Button>
      </div>
    </div>
  )
}

type ReviewCvDocumentProps = {
  cv: TailoredCv
}

function ReviewCvDocument({ cv }: ReviewCvDocumentProps): JSX.Element {
  return (
    <article
      className="mx-auto w-full max-w-3xl rounded-lg border border-border bg-background px-10 py-9 shadow-sm"
      aria-label="CV önizlemesi"
    >
      <header className="border-b border-border pb-4">
        <h2 className="text-3xl font-bold tracking-tight text-foreground">
          {cv.full_name.length > 0 ? cv.full_name : "Adınız Soyadınız"}
        </h2>
        {cv.title.length > 0 ? (
          <p className="mt-1 text-sm font-medium text-primary">{cv.title}</p>
        ) : null}
        {cv.location !== null && cv.location.length > 0 ? (
          <p className="mt-1 text-xs text-muted-foreground">{cv.location}</p>
        ) : null}
      </header>

      {cv.summary.length > 0 ? (
        <section className="mt-6 space-y-2">
          <h3 className="text-xs font-semibold tracking-[0.18em] text-muted-foreground uppercase">
            Profesyonel Özet
          </h3>
          <p className="text-sm leading-6 text-foreground">{cv.summary}</p>
        </section>
      ) : null}

      {cv.skills.length > 0 ? (
        <section className="mt-6 space-y-3">
          <h3 className="text-xs font-semibold tracking-[0.18em] text-muted-foreground uppercase">
            Öne Çıkan Yetkinlikler
          </h3>
          <div className="flex flex-wrap gap-2">
            {cv.skills.map((skill) => (
              <Badge
                key={skill}
                variant="outline"
                className="rounded-md border-border bg-background px-2.5 py-1 text-xs font-normal text-foreground"
              >
                {skill}
              </Badge>
            ))}
          </div>
        </section>
      ) : null}

      {cv.experiences.length > 0 ? (
        <section className="mt-6 space-y-4">
          <h3 className="text-xs font-semibold tracking-[0.18em] text-muted-foreground uppercase">
            Deneyim
          </h3>
          <div className="space-y-5">
            {cv.experiences.map((experience, index) => (
              <div
                key={`${experience.role}-${experience.company}-${index}`}
                className="space-y-2"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="text-sm font-semibold text-foreground">
                    {experience.role}
                    {experience.company.length > 0
                      ? ` | ${experience.company}`
                      : ""}
                  </p>
                  {experience.period.length > 0 ? (
                    <p className="text-xs font-medium text-muted-foreground">
                      {experience.period}
                    </p>
                  ) : null}
                </div>
                {experience.bullets.length > 0 ? (
                  <ul className="space-y-1.5 pl-4 text-sm leading-6 text-foreground">
                    {experience.bullets.map((bullet, bulletIndex) => (
                      <li
                        key={bulletIndex}
                        className="list-disc marker:text-muted-foreground"
                      >
                        {bullet}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {cv.projects.length > 0 ? (
        <section className="mt-6 space-y-3">
          <h3 className="text-xs font-semibold tracking-[0.18em] text-muted-foreground uppercase">
            Projeler
          </h3>
          <ul className="space-y-2 text-sm leading-6 text-foreground">
            {cv.projects.map((project, index) => (
              <li key={`${project.name}-${index}`}>
                <span className="font-medium">{project.name}</span>
                {project.description.length > 0 ? (
                  <span className="text-muted-foreground">
                    {" "}
                    — {project.description}
                  </span>
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {cv.educations.length > 0 ? (
        <section className="mt-6 space-y-3">
          <h3 className="text-xs font-semibold tracking-[0.18em] text-muted-foreground uppercase">
            Eğitim
          </h3>
          <ul className="space-y-2 text-sm leading-6 text-foreground">
            {cv.educations.map((education, index) => (
              <li
                key={`${education.institution}-${index}`}
                className="flex flex-wrap items-baseline justify-between gap-2"
              >
                <span>
                  <span className="font-medium">{education.institution}</span>
                  {education.degree.length > 0 ? ` — ${education.degree}` : ""}
                </span>
                {education.period.length > 0 ? (
                  <span className="text-xs font-medium text-muted-foreground">
                    {education.period}
                  </span>
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {cv.certifications.length > 0 ? (
        <section className="mt-6 space-y-3">
          <h3 className="text-xs font-semibold tracking-[0.18em] text-muted-foreground uppercase">
            Sertifikalar
          </h3>
          <ul className="space-y-1 text-sm leading-6 text-foreground">
            {cv.certifications.map((cert, index) => (
              <li key={`${cert}-${index}`} className="list-disc pl-4">
                {cert}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {cv.languages.length > 0 ? (
        <section className="mt-6 space-y-3">
          <h3 className="text-xs font-semibold tracking-[0.18em] text-muted-foreground uppercase">
            Diller
          </h3>
          <div className="flex flex-wrap gap-2">
            {cv.languages.map((language) => (
              <Badge
                key={language}
                variant="outline"
                className="rounded-md border-border bg-background px-2.5 py-1 text-xs font-normal text-foreground"
              >
                {language}
              </Badge>
            ))}
          </div>
        </section>
      ) : null}
    </article>
  )
}

type AtsReportModalProps = {
  report: AtsReport
  onClose: () => void
}

function AtsReportModal({ report, onClose }: AtsReportModalProps): JSX.Element {
  return (
    <div
      className="fixed inset-0 flex items-center justify-center bg-foreground/40 px-4 py-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="ats-report-title"
    >
      <Card className="max-h-full w-full max-w-2xl overflow-auto">
        <CardHeader className="flex flex-row items-center justify-between gap-4 border-b border-border">
          <div className="flex items-center gap-2">
            <ShieldCheck className="size-5 text-primary" aria-hidden="true" />
            <div>
              <h2 id="ats-report-title" className="text-lg font-semibold">
                ATS Raporu
              </h2>
              <p className="text-sm text-muted-foreground">
                Oluşturulan CV'nin bu ilana göre tarama uyumluluğu.
              </p>
            </div>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="ATS raporunu kapat"
            onClick={onClose}
          >
            <X />
          </Button>
        </CardHeader>

        <CardContent className="grid gap-6 p-6 md:grid-cols-[220px_1fr]">
          <div className="flex flex-col items-center justify-center gap-4 border-b border-border pb-6 md:border-r md:border-b-0 md:pr-6 md:pb-0">
            <div
              className="flex size-32 items-center justify-center rounded-full"
              style={{
                background: `conic-gradient(var(--primary) ${report.similarity_score}%, var(--muted) 0)`,
              }}
              aria-label={`ATS benzerlik skoru yüzde ${report.similarity_score}`}
            >
              <div className="flex size-24 flex-col items-center justify-center rounded-full bg-background">
                <span className="text-3xl font-bold">
                  {report.similarity_score}%
                </span>
                <span className="text-xs text-muted-foreground">Benzerlik</span>
              </div>
            </div>
            <Badge variant="secondary" className="rounded-md">
              {getAtsMatchLevelLabel(report.match_level)}
            </Badge>
          </div>

          <div className="flex flex-col gap-5">
            <ReportList
              icon={ShieldCheck}
              title="Güçlü Alanlar"
              items={report.strong_matches}
            />
            <ReportList
              icon={AlertTriangle}
              title="Uyarılar"
              items={report.warnings}
            />
            <ReportList
              icon={ListChecks}
              title="Öneriler"
              items={report.recommendations}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

type ReportListProps = {
  icon: LucideIcon
  title: string
  items: string[]
}

function ReportList({
  icon: Icon,
  title,
  items,
}: ReportListProps): JSX.Element {
  return (
    <section className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <Icon className="size-4 text-muted-foreground" aria-hidden="true" />
        <h3 className="text-sm font-semibold">{title}</h3>
      </div>
      <ul className="flex flex-col gap-2">
        {items.map((item) => (
          <li
            key={item}
            className="rounded-md border border-border bg-muted/30 px-3 py-2 text-sm text-foreground"
          >
            {item}
          </li>
        ))}
      </ul>
    </section>
  )
}

function getAtsMatchLevelLabel(matchLevel: AtsMatchLevel): string {
  switch (matchLevel) {
    case "guclu":
      return "Güçlü Eşleşme"
    case "orta-guclu":
      return "Orta-Güçlü Eşleşme"
    case "orta":
      return "Orta Eşleşme"
    case "zayif":
      return "Zayıf Eşleşme"
  }
}

function EmptyCvState({ onBack }: { onBack: () => void }): JSX.Element {
  return (
    <article
      className="mx-auto w-full max-w-3xl rounded-lg border border-dashed border-border bg-background px-10 py-12 text-center shadow-sm"
      aria-label="CV bulunamadı"
    >
      <h2 className="text-xl font-semibold tracking-tight text-foreground">
        Henüz oluşturulmuş bir CV yok
      </h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Bu ilana özel bir CV oluşturmak için önce iş analizi sayfasına dönüp "Bu
        İlana Özel CV Oluştur" düğmesine tıklayın.
      </p>
      <Button type="button" variant="outline" className="mt-6" onClick={onBack}>
        <ArrowLeft data-icon="inline-start" />
        İş Analizine Dön
      </Button>
    </article>
  )
}

export function CvReviewPage(): JSX.Element {
  const navigate = useNavigate()
  const location = useLocation()
  const state = (location.state ?? null) as CvReviewLocationState | null
  const tailoredCv = state?.tailoredCv ?? null

  const [isDownloading, setIsDownloading] = useState(false)
  const [downloadError, setDownloadError] = useState<string | null>(null)
  const [atsReport, setAtsReport] = useState<AtsReport | null>(null)
  const [isAtsReportOpen, setIsAtsReportOpen] = useState(false)
  const [isGeneratingAtsReport, setIsGeneratingAtsReport] = useState(false)
  const [atsReportError, setAtsReportError] = useState<string | null>(null)

  const handleBack = (): void => {
    if (state?.analysis !== undefined) {
      navigate("/job-analysis", {
        state: { analysis: state.analysis, token: state.token },
      })
      return
    }
    navigate(-1)
  }

  const handleDownload = async (): Promise<void> => {
    if (tailoredCv === null || isDownloading) {
      return
    }
    setIsDownloading(true)
    setDownloadError(null)
    try {
      await downloadCvAsDocx(tailoredCv)
    } catch {
      setDownloadError(
        "CV indirilemedi. Lütfen tekrar deneyin veya tarayıcınızı kontrol edin."
      )
    } finally {
      setIsDownloading(false)
    }
  }

  const handleGenerateAtsReport = async (): Promise<void> => {
    if (tailoredCv === null || isGeneratingAtsReport) {
      return
    }

    const analysis = state?.analysis ?? null
    const token = state?.token ?? null

    if (analysis === null || token === null) {
      setAtsReportError(
        "ATS raporu için iş analizi veya oturum bilgisi bulunamadı. Lütfen iş analizinden tekrar CV oluşturun."
      )
      return
    }

    setIsGeneratingAtsReport(true)
    setAtsReportError(null)

    try {
      const report = await generateAtsReport(
        token,
        analysis.job_description,
        tailoredCv
      )
      setAtsReport(report)
      setIsAtsReportOpen(true)
    } catch (error) {
      setAtsReportError(
        error instanceof Error
          ? error.message
          : "ATS raporu oluşturulamadı. Lütfen tekrar deneyin."
      )
    } finally {
      setIsGeneratingAtsReport(false)
    }
  }

  return (
    <div className="flex min-h-svh bg-muted/30">
      <ReviewSidebar />

      <main className="flex flex-1 flex-col gap-6 px-4 py-6 md:px-8">
        <div className="flex flex-col gap-4">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="w-fit text-muted-foreground hover:text-foreground"
            onClick={handleBack}
          >
            <ArrowLeft data-icon="inline-start" />
            İş Analizine Dön
          </Button>

          <h1 className="text-2xl font-semibold tracking-tight">
            CV Özelleştirme Sihirbazı
          </h1>

          <div className="max-w-2xl">
            <ReviewStepper />
          </div>
        </div>

        <Card className="gap-4">
          <CardHeader className="pb-0">
            <ReviewToolbar
              onDownload={() => {
                void handleDownload()
              }}
              onGenerateAtsReport={() => {
                void handleGenerateAtsReport()
              }}
              isDownloading={isDownloading}
              isDownloadDisabled={tailoredCv === null}
              isAtsReportLoading={isGeneratingAtsReport}
              isAtsReportDisabled={
                tailoredCv === null ||
                state?.analysis === undefined ||
                state?.token === undefined
              }
            />
          </CardHeader>

          <CardContent className="bg-muted/30 py-8">
            {downloadError !== null ? (
              <p
                role="alert"
                className="mx-auto mb-4 w-full max-w-3xl rounded-md border border-destructive/40 bg-destructive/10 px-4 py-2 text-sm text-destructive"
              >
                {downloadError}
              </p>
            ) : null}
            {atsReportError !== null ? (
              <p
                role="alert"
                className="mx-auto mb-4 w-full max-w-3xl rounded-md border border-destructive/40 bg-destructive/10 px-4 py-2 text-sm text-destructive"
              >
                {atsReportError}
              </p>
            ) : null}
            {tailoredCv !== null ? (
              <ReviewCvDocument cv={tailoredCv} />
            ) : (
              <EmptyCvState onBack={handleBack} />
            )}
          </CardContent>
        </Card>
      </main>
      {isAtsReportOpen && atsReport !== null ? (
        <AtsReportModal
          report={atsReport}
          onClose={() => {
            setIsAtsReportOpen(false)
          }}
        />
      ) : null}
    </div>
  )
}
