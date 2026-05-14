// Module: Renders saved job application analyses with manual application status tracking.
import { useEffect, useMemo, useState, type JSX } from "react"
import { useNavigate } from "react-router"
import {
  AlertCircle,
  BriefcaseBusiness,
  CalendarDays,
  FileText,
} from "lucide-react"

import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { cn } from "@workspace/ui/lib/utils"

import { AppSidebar } from "@/components/app-sidebar"
import {
  listJobAnalyses,
  updateApplicationStatus,
  type ApplicationStatus,
  type JobAnalysisResponse,
} from "@/lib/job-analysis-api"

type ApplicationsPageProps = {
  token: string
}

type ApplicationsLoadState =
  | { status: "loading" }
  | { status: "loaded"; applications: JobAnalysisResponse[] }
  | { status: "error"; message: string }

const applicationStatusOptions: Array<{
  value: ApplicationStatus
  label: string
}> = [
  { value: "pending", label: "Beklemede" },
  { value: "approved", label: "Onaylandı" },
  { value: "rejected", label: "Reddedildi" },
]

const statusLabels = new Map<ApplicationStatus, string>(
  applicationStatusOptions.map((option) => [option.value, option.label])
)

export function ApplicationsPage({
  token,
}: ApplicationsPageProps): JSX.Element {
  const navigate = useNavigate()
  const [loadState, setLoadState] = useState<ApplicationsLoadState>({
    status: "loading",
  })
  const [statusError, setStatusError] = useState<string | null>(null)
  const [reloadAttempt, setReloadAttempt] = useState(0)
  const [updatingApplicationId, setUpdatingApplicationId] = useState<
    string | null
  >(null)

  useEffect(() => {
    let isActive = true

    setLoadState({ status: "loading" })
    listJobAnalyses(token)
      .then((applications) => {
        if (isActive) {
          setLoadState({ status: "loaded", applications })
        }
      })
      .catch((error: unknown) => {
        if (isActive) {
          setLoadState({
            status: "error",
            message:
              error instanceof Error
                ? error.message
                : "Geçmiş başvurular alınamadı.",
          })
        }
      })

    return () => {
      isActive = false
    }
  }, [token, reloadAttempt])

  const applications =
    loadState.status === "loaded" ? loadState.applications : []
  const totalApplications = applications.length
  const averageScore = useMemo(() => {
    const scoredApplications = applications.filter(
      (application) => application.match_analysis !== null
    )

    if (scoredApplications.length === 0) {
      return null
    }

    const totalScore = scoredApplications.reduce(
      (sum, application) =>
        sum + (application.match_analysis?.genel_uyumluluk_puani ?? 0),
      0
    )

    return Math.round(totalScore / scoredApplications.length)
  }, [applications])

  function openApplicationReport(application: JobAnalysisResponse): void {
    navigate("/job-analysis", {
      state: { analysis: application, token },
    })
  }

  async function handleStatusChange(
    application: JobAnalysisResponse,
    applicationStatus: ApplicationStatus
  ): Promise<void> {
    if (
      loadState.status !== "loaded" ||
      application.application_status === applicationStatus
    ) {
      return
    }

    const previousApplications = loadState.applications
    setStatusError(null)
    setUpdatingApplicationId(application.id)
    setLoadState({
      status: "loaded",
      applications: previousApplications.map((item) =>
        item.id === application.id
          ? { ...item, application_status: applicationStatus }
          : item
      ),
    })

    try {
      const updatedApplication = await updateApplicationStatus(
        token,
        application.id,
        applicationStatus
      )
      setLoadState((currentState) =>
        currentState.status === "loaded"
          ? {
              status: "loaded",
              applications: currentState.applications.map((item) =>
                item.id === updatedApplication.id ? updatedApplication : item
              ),
            }
          : currentState
      )
    } catch (error) {
      setLoadState({ status: "loaded", applications: previousApplications })
      setStatusError(
        error instanceof Error
          ? error.message
          : "Başvuru durumu güncellenemedi."
      )
    } finally {
      setUpdatingApplicationId(null)
    }
  }

  return (
    <div className="flex min-h-svh bg-background text-foreground">
      <AppSidebar token={token} />
      <main className="flex min-w-0 flex-1 flex-col gap-6 p-6">
        <header className="flex flex-col gap-2">
          <p className="text-sm text-muted-foreground">Başvuru takibi</p>
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div className="min-w-0">
              <h1 className="text-3xl font-semibold tracking-normal">
                Geçmiş Başvurular
              </h1>
              <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">
                Analiz ettiğiniz iş ilanlarını, başvuru durumlarını ve her ilana
                özel yeterlilik raporunu buradan takip edin.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:flex">
              <SummaryPill label="Toplam" value={String(totalApplications)} />
              <SummaryPill
                label="Ortalama"
                value={averageScore === null ? "-" : `%${averageScore}`}
              />
            </div>
          </div>
        </header>

        {statusError !== null ? (
          <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            <AlertCircle className="mt-0.5 size-4 shrink-0" />
            <span>{statusError}</span>
          </div>
        ) : null}

        <Card className="gap-4">
          <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div className="min-w-0">
              <CardTitle>Başvuru Geçmişi</CardTitle>
              <CardDescription>
                Satıra tıklayarak o ilana ait yeterlilik raporunu açabilirsiniz.
              </CardDescription>
            </div>
            <Badge variant="secondary">
              {loadState.status === "loading"
                ? "Yükleniyor"
                : `${totalApplications} kayıt`}
            </Badge>
          </CardHeader>
          <CardContent>
            {loadState.status === "loading" ? (
              <ApplicationListSkeleton />
            ) : null}

            {loadState.status === "error" ? (
              <div className="flex flex-col items-start gap-3 rounded-lg border border-border bg-muted/30 p-4">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <AlertCircle className="size-4" />
                  Geçmiş başvurular yüklenemedi
                </div>
                <p className="text-sm text-muted-foreground">
                  {loadState.message}
                </p>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setReloadAttempt((attempt) => attempt + 1)}
                >
                  Tekrar Dene
                </Button>
              </div>
            ) : null}

            {loadState.status === "loaded" && applications.length === 0 ? (
              <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-border p-8 text-center">
                <FileText className="size-8 text-muted-foreground" />
                <div>
                  <h2 className="text-base font-semibold tracking-normal">
                    Henüz geçmiş başvuru yok
                  </h2>
                  <p className="mt-1 max-w-md text-sm text-muted-foreground">
                    Bir iş ilanı analizi başlattığınızda kayıt burada görünecek.
                  </p>
                </div>
              </div>
            ) : null}

            {loadState.status === "loaded" && applications.length > 0 ? (
              <div className="flex flex-col gap-3">
                {applications.map((application) => (
                  <ApplicationRow
                    key={application.id}
                    application={application}
                    isUpdating={updatingApplicationId === application.id}
                    onOpen={() => openApplicationReport(application)}
                    onStatusChange={(applicationStatus) =>
                      void handleStatusChange(application, applicationStatus)
                    }
                  />
                ))}
              </div>
            ) : null}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}

function SummaryPill({
  label,
  value,
}: {
  label: string
  value: string
}): JSX.Element {
  return (
    <div className="rounded-lg border border-border bg-card px-4 py-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 text-lg font-semibold tracking-normal">{value}</div>
    </div>
  )
}

function ApplicationRow({
  application,
  isUpdating,
  onOpen,
  onStatusChange,
}: {
  application: JobAnalysisResponse
  isUpdating: boolean
  onOpen: () => void
  onStatusChange: (applicationStatus: ApplicationStatus) => void
}): JSX.Element {
  const jobTitle = application.job_description.title ?? "Pozisyon belirtilmedi"
  const company = application.job_description.company ?? "Şirket belirtilmedi"
  const score = application.match_analysis?.genel_uyumluluk_puani ?? null
  const createdAt = new Intl.DateTimeFormat("tr-TR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(application.created_at))

  return (
    <div
      role="button"
      tabIndex={0}
      className="grid cursor-pointer grid-cols-1 gap-4 rounded-lg border border-border bg-background p-4 transition-colors hover:bg-muted/40 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none md:grid-cols-[minmax(0,1.4fr)_auto_auto] md:items-center"
      onClick={onOpen}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault()
          onOpen()
        }
      }}
    >
      <div className="flex min-w-0 items-start gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
          <BriefcaseBusiness className="size-5" />
        </div>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="truncate text-sm font-semibold tracking-normal">
              {company}
            </h2>
            <Badge variant="outline">{jobTitle}</Badge>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <CalendarDays className="size-3.5" />
              {createdAt}
            </span>
            <span className="truncate">{application.url}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Badge variant={score === null ? "secondary" : "default"}>
          {score === null ? "Rapor bekleniyor" : `%${score} Uyumluluk`}
        </Badge>
        <StatusBadge applicationStatus={application.application_status} />
      </div>

      <label
        className="flex flex-col gap-1 text-xs font-medium text-muted-foreground"
        onClick={(event) => event.stopPropagation()}
      >
        Durum
        <select
          className="h-9 rounded-md border border-input bg-background px-3 text-sm text-foreground shadow-xs transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-60"
          value={application.application_status}
          disabled={isUpdating}
          onChange={(event) =>
            onStatusChange(event.target.value as ApplicationStatus)
          }
        >
          {applicationStatusOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
    </div>
  )
}

function StatusBadge({
  applicationStatus,
}: {
  applicationStatus: ApplicationStatus
}): JSX.Element {
  return (
    <Badge
      variant={
        applicationStatus === "rejected"
          ? "destructive"
          : applicationStatus === "approved"
            ? "default"
            : "secondary"
      }
      className={cn(applicationStatus === "pending" && "text-muted-foreground")}
    >
      {statusLabels.get(applicationStatus) ?? "Beklemede"}
    </Badge>
  )
}

function ApplicationListSkeleton(): JSX.Element {
  return (
    <div className="flex flex-col gap-3">
      {[0, 1, 2].map((item) => (
        <div
          key={item}
          className="h-24 rounded-lg border border-border bg-muted/30"
        />
      ))}
    </div>
  )
}
