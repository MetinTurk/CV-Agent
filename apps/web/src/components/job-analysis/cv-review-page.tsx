// Module: Renders the tailored CV produced by the LLM (passed via router state).
import type { JSX } from "react"
import { useLocation, useNavigate } from "react-router"
import {
  ArrowLeft,
  Briefcase,
  Check,
  ChevronDown,
  Download,
  Eye,
  FileText,
  ListChecks,
  PencilLine,
  PlusCircle,
  TrendingUp,
  User,
  ZoomIn,
  ZoomOut,
} from "lucide-react"

import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardContent,
  CardHeader,
} from "@workspace/ui/components/card"
import { Separator } from "@workspace/ui/components/separator"
import { cn } from "@workspace/ui/lib/utils"

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
          <p className="text-base font-semibold leading-tight">
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

function ReviewToolbar(): JSX.Element {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
      <div className="flex items-center gap-2">
        <Eye className="size-4 text-muted-foreground" aria-hidden="true" />
        <h2 className="text-base font-semibold">Sonuç Önizlemesi</h2>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" variant="outline" size="sm">
          <ListChecks data-icon="inline-start" />
          ATS Kontrolü Yap
        </Button>
        <Button type="button" variant="outline" size="sm">
          <PencilLine data-icon="inline-start" />
          Düzenlemeye Geri Dön
        </Button>
        <div
          className="inline-flex items-stretch overflow-hidden rounded-lg"
          data-slot="button-group"
        >
          <Button type="button" size="sm" className="rounded-r-none">
            <Download data-icon="inline-start" />
            İndir
          </Button>
          <Button
            type="button"
            size="sm"
            className="rounded-l-none border-l border-primary-foreground/20 px-2"
            aria-label="Daha fazla indirme seçeneği"
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
          <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Profesyonel Özet
          </h3>
          <p className="text-sm leading-6 text-foreground">{cv.summary}</p>
        </section>
      ) : null}

      {cv.skills.length > 0 ? (
        <section className="mt-6 space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
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
          <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
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
          <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
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
          <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
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
                  {education.degree.length > 0
                    ? ` — ${education.degree}`
                    : ""}
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
          <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
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
          <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
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

function EmptyCvState({
  onBack,
}: {
  onBack: () => void
}): JSX.Element {
  return (
    <article
      className="mx-auto w-full max-w-3xl rounded-lg border border-dashed border-border bg-background px-10 py-12 text-center shadow-sm"
      aria-label="CV bulunamadı"
    >
      <h2 className="text-xl font-semibold tracking-tight text-foreground">
        Henüz oluşturulmuş bir CV yok
      </h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Bu ilana özel bir CV oluşturmak için önce iş analizi sayfasına dönüp
        "Bu İlana Özel CV Oluştur" düğmesine tıklayın.
      </p>
      <Button
        type="button"
        variant="outline"
        className="mt-6"
        onClick={onBack}
      >
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

  const handleBack = (): void => {
    if (state?.analysis !== undefined) {
      navigate("/job-analysis", {
        state: { analysis: state.analysis, token: state.token },
      })
      return
    }
    navigate(-1)
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
            <ReviewToolbar />
          </CardHeader>

          <CardContent className="bg-muted/30 py-8">
            {tailoredCv !== null ? (
              <ReviewCvDocument cv={tailoredCv} />
            ) : (
              <EmptyCvState onBack={handleBack} />
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
