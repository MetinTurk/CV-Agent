// Module: Renders saved job application history with per-application reports and status controls.
import { useEffect, useState, type JSX } from "react"
import { useNavigate } from "react-router"
import {
  AlertCircle,
  BriefcaseBusiness,
  CalendarDays,
  CheckCircle2,
  Clock3,
  ExternalLink,
  FileText,
  type LucideIcon,
  Loader2,
  XCircle,
} from "lucide-react"

import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"

import { AppSidebar } from "@/components/app-sidebar"
import {
  getApplications,
  updateApplicationStatus,
  type ApplicationStatus,
  type ApplicationSummary,
} from "@/lib/applications-api"
import type { JobAnalysisResponse } from "@/lib/job-analysis-api"

type ApplicationsPageProps = {
  token: string
}

type ApplicationsLoadState =
  | { status: "loading" }
  | { status: "loaded"; applications: ApplicationSummary[] }
  | { status: "error"; message: string }

const statusOptions: {
  value: ApplicationStatus
  label: string
  icon: LucideIcon
  activeClassName: string
}[] = [
  {
    value: "pending",
    label: "Beklemede",
    icon: Clock3,
    activeClassName:
      "border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 dark:border-amber-300/40 dark:bg-amber-300/10 dark:text-amber-300",
  },
  {
    value: "approved",
    label: "Onaylandı",
    icon: CheckCircle2,
    activeClassName:
      "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:border-emerald-300/40 dark:bg-emerald-300/10 dark:text-emerald-300",
  },
  {
    value: "rejected",
    label: "Reddedildi",
    icon: XCircle,
    activeClassName:
      "border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 dark:border-rose-300/40 dark:bg-rose-300/10 dark:text-rose-300",
  },
]

export function ApplicationsPage({
  token,
}: ApplicationsPageProps): JSX.Element {
  const navigate = useNavigate()
  const [loadState, setLoadState] = useState<ApplicationsLoadState>({
    status: "loading",
  })
  const [savingApplicationId, setSavingApplicationId] = useState<string | null>(
    null
  )

  useEffect(() => {
    let isActive = true

    getApplications(token)
      .then((response) => {
        if (isActive) {
          setLoadState({
            status: "loaded",
            applications: response.applications,
          })
        }
      })
      .catch((error: unknown) => {
        if (isActive) {
          setLoadState({
            status: "error",
            message:
              error instanceof Error
                ? error.message
                : "Başvuru geçmişi alınamadı.",
          })
        }
      })

    return () => {
      isActive = false
    }
  }, [token])

  async function handleStatusChange(
    application: ApplicationSummary,
    nextStatus: ApplicationStatus
  ): Promise<void> {
    if (application.application_status === nextStatus) {
      return
    }

    setSavingApplicationId(application.id)

    try {
      const updatedApplication = await updateApplicationStatus(
        token,
        application.id,
        nextStatus
      )

      setLoadState((current) =>
        current.status === "loaded"
          ? {
              status: "loaded",
              applications: current.applications.map((item) =>
                item.id === updatedApplication.id ? updatedApplication : item
              ),
            }
          : current
      )
    } catch (error) {
      setLoadState({
        status: "error",
        message:
          error instanceof Error
            ? error.message
            : "Başvuru durumu güncellenemedi.",
      })
    } finally {
      setSavingApplicationId(null)
    }
  }

  function handleOpenReport(application: ApplicationSummary): void {
    const analysis: JobAnalysisResponse = {
      id: application.id,
      url: application.url,
      job_description: application.job_description,
      match_analysis: application.match_analysis,
      created_at: application.created_at,
    }

    navigate("/job-analysis", {
      state: {
        analysis,
        token,
      },
    })
  }

  return (
    <main className="flex min-h-svh bg-muted/30">
      <AppSidebar token={token} />

      <section className="min-w-0 flex-1">
        <header className="flex min-h-16 items-center justify-between gap-3 border-b border-border bg-background px-4 py-3 md:px-6">
          <div className="min-w-0">
            <p className="truncate text-sm text-muted-foreground">
              İş ilanı raporları
            </p>
            <h1 className="truncate text-xl font-semibold">
              Geçmiş Başvurular
            </h1>
          </div>
        </header>

        <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 p-4 md:p-6">
          {loadState.status === "loading" ? (
            <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-3 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              Başvuru geçmişi yükleniyor...
            </div>
          ) : null}

          {loadState.status === "error" ? (
            <div className="flex items-start gap-3 rounded-lg border border-destructive/30 bg-card p-4">
              <AlertCircle className="mt-0.5 size-5 text-destructive" />
              <div className="min-w-0">
                <h2 className="font-semibold">Başvuru geçmişi alınamadı</h2>
                <p className="text-sm leading-6 text-muted-foreground">
                  {loadState.message}
                </p>
              </div>
            </div>
          ) : null}

          {loadState.status === "loaded" &&
          loadState.applications.length === 0 ? (
            <div className="rounded-lg border border-border bg-card p-5">
              <div className="flex items-start gap-3">
                <BriefcaseBusiness className="mt-0.5 size-5 text-muted-foreground" />
                <div className="min-w-0">
                  <h2 className="font-semibold">Henüz başvuru kaydı yok</h2>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">
                    İş ilanı analizi yaptığınızda raporlarınız ve manuel durum
                    takibiniz burada görünecek.
                  </p>
                </div>
              </div>
            </div>
          ) : null}

          {loadState.status === "loaded" &&
          loadState.applications.length > 0 ? (
            <section className="overflow-hidden rounded-lg border border-border bg-card">
              <div className="grid gap-3 border-b border-border px-4 py-3 text-xs font-medium text-muted-foreground md:grid-cols-[minmax(0,1fr)_330px]">
                <span>Rapor</span>
                <span className="hidden md:block">Başvuru Durumu</span>
              </div>

              <div className="divide-y divide-border">
                {loadState.applications.map((application) => (
                  <ApplicationRow
                    key={application.id}
                    application={application}
                    isSaving={savingApplicationId === application.id}
                    onOpenReport={() => handleOpenReport(application)}
                    onStatusChange={(status) =>
                      handleStatusChange(application, status)
                    }
                  />
                ))}
              </div>
            </section>
          ) : null}
        </div>
      </section>
    </main>
  )
}

function ApplicationRow({
  application,
  isSaving,
  onOpenReport,
  onStatusChange,
}: {
  application: ApplicationSummary
  isSaving: boolean
  onOpenReport: () => void
  onStatusChange: (status: ApplicationStatus) => void
}): JSX.Element {
  const job = application.job_description
  const score = application.match_analysis?.genel_uyumluluk_puani ?? null
  const title = job.title ?? "İş İlanı"
  const company = job.company ?? hostFromUrl(application.url)

  return (
    <article className="grid gap-4 px-4 py-4 md:grid-cols-[minmax(0,1fr)_330px] md:items-center">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="truncate text-base font-semibold">{company}</h2>
          {score !== null ? (
            <Badge variant="secondary" className={scoreToneClassName(score)}>
              %{score} Uyumluluk
            </Badge>
          ) : null}
        </div>
        <p className="mt-1 truncate text-sm text-muted-foreground">{title}</p>
        {job.summary !== null ? (
          <p className="mt-2 line-clamp-2 text-sm leading-6 text-card-foreground">
            {job.summary}
          </p>
        ) : null}
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <CalendarDays className="size-3.5" />
            {formatDate(application.created_at)}
          </span>
          <a
            href={application.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-w-0 items-center gap-1.5 underline-offset-4 hover:underline"
          >
            <ExternalLink className="size-3.5 shrink-0" />
            <span className="truncate">{application.url}</span>
          </a>
        </div>
      </div>

      <div className="flex flex-col gap-3 md:items-end">
        <StatusButtons
          value={application.application_status}
          isSaving={isSaving}
          onChange={onStatusChange}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onOpenReport}
        >
          <FileText data-icon="inline-start" />
          Raporu Gör
        </Button>
      </div>
    </article>
  )
}

function StatusButtons({
  value,
  isSaving,
  onChange,
}: {
  value: ApplicationStatus
  isSaving: boolean
  onChange: (status: ApplicationStatus) => void
}): JSX.Element {
  return (
    <div className="grid w-full grid-cols-3 gap-1 rounded-lg border border-border bg-muted/30 p-1 md:w-[330px]">
      {statusOptions.map((option) => {
        const Icon = option.icon
        const isActive = value === option.value

        return (
          <Button
            key={option.value}
            type="button"
            variant="ghost"
            size="sm"
            className={cn(
              "h-8 min-w-0 border text-xs",
              isActive
                ? option.activeClassName
                : "border-transparent text-muted-foreground"
            )}
            disabled={isSaving}
            onClick={() => onChange(option.value)}
          >
            {isSaving && isActive ? (
              <Loader2 data-icon="inline-start" className="animate-spin" />
            ) : (
              <Icon data-icon="inline-start" />
            )}
            <span className="truncate">{option.label}</span>
          </Button>
        )
      })}
    </div>
  )
}

function scoreToneClassName(score: number): string {
  if (score >= 75) {
    return "bg-emerald-50 text-emerald-700 dark:bg-emerald-300/10 dark:text-emerald-300"
  }

  if (score >= 50) {
    return "bg-amber-50 text-amber-700 dark:bg-amber-300/10 dark:text-amber-300"
  }

  return "bg-rose-50 text-rose-700 dark:bg-rose-300/10 dark:text-rose-300"
}

function hostFromUrl(value: string): string {
  try {
    return new URL(value).hostname.replace(/^www\./, "")
  } catch {
    return "İş İlanı"
  }
}

function formatDate(value: string): string {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat("tr-TR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date)
}
