// Module: Renders the UI-only career dashboard and application analysis mockup.
import { useState, type CSSProperties, type JSX } from "react"
import {
  ArrowLeft,
  Bell,
  Bot,
  Building2,
  CalendarClock,
  CheckCircle2,
  CircleAlert,
  CircleX,
  FileText,
  LogOut,
  NotebookPen,
  RefreshCcw,
  Search,
  Send,
  Settings,
} from "lucide-react"

import { Avatar, AvatarFallback } from "@workspace/ui/components/avatar"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { Input } from "@workspace/ui/components/input"
import { Separator } from "@workspace/ui/components/separator"
import { cn } from "@workspace/ui/lib/utils"

import { AppSidebar } from "@/components/app-sidebar"
import { ThemeToggle } from "@/components/theme-toggle"
import type { AuthUser } from "@/lib/auth-api"

type BadgeVariant =
  | "default"
  | "secondary"
  | "outline"
  | "success"
  | "warning"
  | "info"
  | "destructive"

type ApplicationStatus = "waiting" | "approved" | "rejected"

type ApplicationSummary = {
  id: string
  company: string
  role: string
  appliedAt: string
  score: number
  scoreLabel: string
  scoreVariant: BadgeVariant
  status: ApplicationStatus
}

type InsightTone = "success" | "info" | "destructive"

type InsightItem = {
  title: string
  description: string
}

type InsightGroup = {
  title: string
  tone: InsightTone
  items: InsightItem[]
}

type TimelineItem = {
  date: string
  title: string
  description: string
}

type CareerDashboardPageProps = {
  user: AuthUser
  onLogout: () => void
}

const applicationSummaries: ApplicationSummary[] = [
  {
    id: "stripe-product-lead",
    company: "Stripe",
    role: "Product Lead",
    appliedAt: "24 Ekim 2023",
    score: 85,
    scoreLabel: "%85 Uyumlu",
    scoreVariant: "success",
    status: "waiting",
  },
  {
    id: "google-ux-architect",
    company: "Google",
    role: "UX Mimarı",
    appliedAt: "28 Ekim 2023",
    score: 92,
    scoreLabel: "%92 Uyumlu",
    scoreVariant: "info",
    status: "approved",
  },
  {
    id: "airbnb-design-manager",
    company: "Airbnb",
    role: "Tasarım Müdürü",
    appliedAt: "2 Kasım 2023",
    score: 78,
    scoreLabel: "%78 Uyumlu",
    scoreVariant: "secondary",
    status: "rejected",
  },
]

const insightGroups: InsightGroup[] = [
  {
    title: "Yeterli Yönler",
    tone: "success",
    items: [
      {
        title: "Ürün Stratejisi",
        description: "Ürün vizyonu ve yol haritası yönetiminde güçlü deneyim.",
      },
      {
        title: "Çapraz Fonksiyonel Liderlik",
        description:
          "Mühendislik ve tasarım ekipleriyle kanıtlanmış çalışma geçmişi.",
      },
      {
        title: "Agile Metodolojiler",
        description: "Son üç rolde Scrum ve sprint planlama pratiği.",
      },
    ],
  },
  {
    title: "Geliştirilebilir Yönler",
    tone: "info",
    items: [
      {
        title: "Veri Analitiği",
        description:
          "SQL biliniyor; gelişmiş istatistiksel modelleme vurgusu artırılmalı.",
      },
      {
        title: "B2B SaaS",
        description:
          "Genel B2B deneyimi güçlü; FinTech B2B örnekleri öne çıkarılmalı.",
      },
    ],
  },
  {
    title: "Eksik Yönler",
    tone: "destructive",
    items: [
      {
        title: "Stripe API Bilgisi",
        description:
          "CV içinde doğrudan ödeme API’si implementasyonu görünmüyor.",
      },
      {
        title: "Global Ödemeler",
        description: "AB pazarları için regülasyon uyumu deneyimi netleşmeli.",
      },
    ],
  },
]

const timelineItems: TimelineItem[] = [
  {
    date: "Bugün, 10:30",
    title: "Başvuru Durumu Güncellendi",
    description: "Durum İK tarafından Bekliyor olarak güncellendi.",
  },
  {
    date: "28 Ekim 2023",
    title: "İlk İnceleme Tamamlandı",
    description: "Profil işe alım yöneticisi tarafından incelendi.",
  },
  {
    date: "24 Ekim 2023",
    title: "Başvuru Kaydedildi",
    description: "İlan analizi ve başvuru kaydı oluşturuldu.",
  },
]

const statusPresentation: Record<
  ApplicationStatus,
  { label: string; variant: BadgeVariant }
> = {
  waiting: {
    label: "Bekliyor",
    variant: "warning",
  },
  approved: {
    label: "Onaylandı",
    variant: "success",
  },
  rejected: {
    label: "Reddedildi",
    variant: "destructive",
  },
}

const insightToneStyles: Record<
  InsightTone,
  { iconClassName: string; markerClassName: string; icon: typeof CheckCircle2 }
> = {
  success: {
    icon: CheckCircle2,
    iconClassName: "text-success",
    markerClassName: "bg-success",
  },
  info: {
    icon: CircleAlert,
    iconClassName: "text-info",
    markerClassName: "bg-info",
  },
  destructive: {
    icon: CircleX,
    iconClassName: "text-destructive",
    markerClassName: "bg-destructive",
  },
}

function getUserInitials(user: AuthUser): string {
  const firstInitial = user.first_name.trim().charAt(0)
  const lastInitial = user.last_name.trim().charAt(0)
  const initials = `${firstInitial}${lastInitial}`.trim()

  return initials.length > 0 ? initials.toLocaleUpperCase("tr-TR") : "KP"
}

function StatusBadge({ status }: { status: ApplicationStatus }): JSX.Element {
  const presentation = statusPresentation[status]

  return <Badge variant={presentation.variant}>{presentation.label}</Badge>
}

function CompanyIcon({ company }: { company: string }): JSX.Element {
  return (
    <div
      className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-border bg-muted text-foreground"
      aria-hidden="true"
    >
      <Building2 />
      <span className="sr-only">{company}</span>
    </div>
  )
}

function MobileNavigation(): JSX.Element {
  return (
    <nav
      className="grid grid-cols-2 gap-2 border-b border-border bg-background px-4 py-3 md:hidden"
      aria-label="Mobil sayfa bölümleri"
    >
      {[
        "Profilim",
        "Geçmiş Başvurular",
        "İş Analizi",
        "AI Kariyer Sohbeti",
      ].map((item) => (
        <Button
          key={item}
          type="button"
          variant={item === "Geçmiş Başvurular" ? "secondary" : "outline"}
          size="sm"
          className="justify-center"
        >
          <span className="truncate">{item}</span>
        </Button>
      ))}
    </nav>
  )
}

function DashboardHeader({
  onLogout,
  user,
}: {
  onLogout: () => void
  user: AuthUser
}): JSX.Element {
  return (
    <header className="sticky top-0 z-10 border-b border-border bg-background/95 backdrop-blur">
      <div className="flex min-h-[4.75rem] items-center justify-between gap-4 px-4 md:px-6">
        <div className="relative hidden w-full max-w-[420px] md:block">
          <Search className="pointer-events-none absolute top-1/2 left-3 text-muted-foreground" />
          <Input
            type="search"
            aria-label="Yetenek, iş veya veri sorgula"
            placeholder="Yetenek, iş veya veri sorgulayın..."
            className="h-10 rounded-full bg-muted pl-9"
          />
        </div>

        <div className="min-w-0 md:hidden">
          <p className="truncate text-xs text-muted-foreground">
            Kariyer Pilotu
          </p>
          <h1 className="truncate text-base font-semibold">Zeka Genel Bakış</h1>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Bildirimler"
          >
            <Bell />
          </Button>
          <ThemeToggle />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Ayarlar"
          >
            <Settings />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Çıkış yap"
            onClick={onLogout}
          >
            <LogOut />
          </Button>
          <Avatar>
            <AvatarFallback>{getUserInitials(user)}</AvatarFallback>
          </Avatar>
        </div>
      </div>
      <MobileNavigation />
    </header>
  )
}

function ApplicationHistoryCard({
  applications,
  selectedApplicationId,
  onSelectApplication,
}: {
  applications: ApplicationSummary[]
  selectedApplicationId: string
  onSelectApplication: (applicationId: string) => void
}): JSX.Element {
  return (
    <Card id="gecmis-basvurular">
      <CardHeader className="flex-row items-center justify-between gap-3">
        <div className="min-w-0">
          <CardTitle>Başvuru Geçmişi</CardTitle>
          <CardDescription>
            Son analiz edilen ilanlar ve durumları
          </CardDescription>
        </div>
        <Button type="button" variant="link" size="sm" className="shrink-0">
          Tümünü Gör
        </Button>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {applications.map((application) => {
          const isSelected = application.id === selectedApplicationId

          return (
            <button
              key={application.id}
              type="button"
              aria-pressed={isSelected}
              onClick={() => onSelectApplication(application.id)}
              className={cn(
                "grid min-h-16 grid-cols-[auto_minmax(0,1fr)] items-center gap-3 rounded-lg border border-border bg-background p-3 text-left shadow-sm transition-colors hover:bg-muted/60 md:grid-cols-[auto_minmax(0,1fr)_auto_auto]",
                isSelected && "border-primary bg-primary/5"
              )}
            >
              <CompanyIcon company={application.company} />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">
                  {application.company}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {application.role}
                </p>
              </div>
              <Badge
                variant={application.scoreVariant}
                className="col-start-2 w-fit md:col-start-auto"
              >
                {application.scoreLabel}
              </Badge>
              <div className="col-start-2 md:col-start-auto">
                <StatusBadge status={application.status} />
              </div>
            </button>
          )
        })}
      </CardContent>
    </Card>
  )
}

function AssistantPanel(): JSX.Element {
  return (
    <Card id="ai-kariyer-sohbeti" className="gap-0 overflow-hidden p-0">
      <div className="flex items-center justify-between bg-foreground px-4 py-3 text-background">
        <div className="flex min-w-0 items-center gap-2">
          <Bot />
          <p className="truncate text-sm font-semibold">
            Yardımcı Pilot Asistanı
          </p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label="Asistan panelini yenile"
          className="text-background hover:bg-background/10 hover:text-background"
        >
          <RefreshCcw />
        </Button>
      </div>
      <CardContent className="flex flex-col gap-3 p-4">
        <div className="rounded-lg bg-muted p-3 text-sm leading-6">
          Merhaba, son GitHub depoların ve LinkedIn güncellemelerin sorgulandı.
          Stripe rolü için yeni yetenek eşleşmeni görmek ister misin?
        </div>
        <div className="ml-auto max-w-[86%] rounded-lg bg-primary p-3 text-sm leading-6 text-primary-foreground">
          Evet, başvuru sorgusunu başlat ve Stripe için yetenek eşleşmemi
          detaylandır.
        </div>
        <div className="rounded-lg border border-border bg-background p-3 text-xs text-muted-foreground">
          <p className="font-medium text-foreground">Çalışıyor</p>
          <code className="mt-1 block break-words whitespace-pre-wrap">
            SELECT match_score FROM career_sync WHERE job_id = stripe_pl_v1
          </code>
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-input bg-background p-2">
          <Input
            aria-label="Asistana kariyer verisi sor"
            placeholder="Kariyerin hakkında veri sorgula..."
            className="h-9 border-0 px-2 shadow-none focus-visible:ring-0"
          />
          <Button type="button" size="icon" aria-label="Mesaj gönder">
            <Send />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

function ScoreRing({ score }: { score: number }): JSX.Element {
  const ringStyle: CSSProperties = {
    background: `conic-gradient(var(--success) ${score * 3.6}deg, var(--muted) 0deg)`,
  }

  return (
    <div className="flex flex-col items-center gap-5">
      <div
        className="grid size-44 place-items-center rounded-full p-3"
        style={ringStyle}
        aria-label={`Uyumluluk skoru yüzde ${score}`}
      >
        <div className="grid size-full place-items-center rounded-full bg-card text-center">
          <div>
            <p className="text-3xl font-semibold tracking-normal">{score}%</p>
            <p className="text-xs text-muted-foreground">Güçlü Eşleşme</p>
          </div>
        </div>
      </div>
      <p className="max-w-[260px] text-center text-sm leading-6 text-muted-foreground">
        Profilin, ürün stratejisi ve liderlik beklentileriyle güçlü şekilde
        örtüşüyor.
      </p>
    </div>
  )
}

function StatusSelector({
  currentStatus,
}: {
  currentStatus: ApplicationStatus
}): JSX.Element {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {Object.entries(statusPresentation).map(([status, presentation]) => {
        const isCurrent = status === currentStatus

        return (
          <Badge
            key={status}
            variant={isCurrent ? presentation.variant : "secondary"}
            className={cn(!isCurrent && "text-muted-foreground")}
          >
            {presentation.label}
          </Badge>
        )
      })}
    </div>
  )
}

function InsightCard({ group }: { group: InsightGroup }): JSX.Element {
  const tone = insightToneStyles[group.tone]
  const Icon = tone.icon

  return (
    <Card>
      <CardHeader className="flex-row items-center gap-2">
        <Icon className={tone.iconClassName} />
        <CardTitle>{group.title}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {group.items.map((item) => (
          <div
            key={item.title}
            className="grid grid-cols-[auto_minmax(0,1fr)] gap-3"
          >
            <span
              className={cn("mt-2 size-1.5 rounded-full", tone.markerClassName)}
              aria-hidden="true"
            />
            <p className="text-sm leading-6 text-muted-foreground">
              <span className="font-semibold text-foreground">
                {item.title}:
              </span>{" "}
              {item.description}
            </p>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

function ApplicationTimeline(): JSX.Element {
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <CalendarClock />
          <CardTitle>Başvuru Zaman Çizelgesi</CardTitle>
        </div>
        <Button type="button" variant="link" size="sm" className="shrink-0">
          Tümünü Gör
        </Button>
      </CardHeader>
      <CardContent className="flex flex-col gap-0">
        {timelineItems.map((item, index) => {
          const isLast = index === timelineItems.length - 1

          return (
            <div
              key={`${item.date}-${item.title}`}
              className="grid grid-cols-[auto_minmax(0,1fr)] gap-3"
            >
              <div className="flex flex-col items-center">
                <span className="mt-1 size-2.5 rounded-full bg-primary" />
                {!isLast ? (
                  <span className="mt-1 min-h-12 w-px flex-1 bg-border" />
                ) : null}
              </div>
              <div className={cn("pb-5", isLast && "pb-0")}>
                <p className="text-xs text-muted-foreground">{item.date}</p>
                <p className="mt-1 text-sm font-semibold">{item.title}</p>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  {item.description}
                </p>
              </div>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}

function ApplicationDetail({
  application,
}: {
  application: ApplicationSummary
}): JSX.Element {
  return (
    <section id="is-analizi" className="flex flex-col gap-4">
      <Card>
        <CardContent className="flex flex-col gap-5">
          <Button
            asChild
            variant="link"
            size="sm"
            className="h-auto w-fit p-0 text-xs font-semibold"
          >
            <a href="#gecmis-basvurular">
              <ArrowLeft data-icon="inline-start" />
              Panele Dön
            </a>
          </Button>

          <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
            <div className="flex min-w-0 items-start gap-4">
              <CompanyIcon company={application.company} />
              <div className="min-w-0">
                <h2 className="truncate text-2xl font-semibold tracking-normal">
                  {application.role}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  <span className="font-semibold text-foreground">
                    {application.company}
                  </span>{" "}
                  · Başvuru: {application.appliedAt}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline">
                <FileText data-icon="inline-start" />
                CV’yi Görüntüle
              </Button>
              <Button type="button">
                <NotebookPen data-icon="inline-start" />
                Not Ekle
              </Button>
            </div>
          </div>

          <Separator />

          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-col gap-2">
              <p className="text-xs font-semibold tracking-normal text-muted-foreground uppercase">
                Güncel Durum
              </p>
              <StatusSelector currentStatus={application.status} />
            </div>
            <Badge variant="secondary" className="w-fit gap-1.5">
              <RefreshCcw />
              Son güncelleme 2 gün önce
            </Badge>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 xl:grid-cols-[minmax(260px,0.78fr)_minmax(0,1.22fr)]">
        <Card className="xl:row-span-3">
          <CardHeader>
            <CardTitle>Uyumluluk Skoru</CardTitle>
            <CardDescription>
              Profil ve ilan beklentileri karşılaştırması
            </CardDescription>
          </CardHeader>
          <CardContent className="flex min-h-[420px] items-center justify-center">
            <ScoreRing score={application.score} />
          </CardContent>
        </Card>

        <div className="grid gap-4">
          <InsightCard group={insightGroups[0]} />
          <div className="grid gap-4 lg:grid-cols-2">
            {insightGroups.slice(1).map((group) => (
              <InsightCard key={group.title} group={group} />
            ))}
          </div>
          <ApplicationTimeline />
        </div>
      </div>
    </section>
  )
}

export function CareerDashboardPage({
  onLogout,
  user,
}: CareerDashboardPageProps): JSX.Element {
  const [selectedApplicationId, setSelectedApplicationId] = useState(
    applicationSummaries[0].id
  )
  const selectedApplication =
    applicationSummaries.find(
      (application) => application.id === selectedApplicationId
    ) ?? applicationSummaries[0]

  return (
    <main className="min-h-svh bg-muted/30">
      <div className="flex min-h-svh">
        <AppSidebar activeHref="#gecmis-basvurular" />

        <section className="min-w-0 flex-1">
          <DashboardHeader user={user} onLogout={onLogout} />

          <div className="mx-auto flex w-full max-w-[1580px] flex-col gap-5 p-4 md:p-6">
            <div className="flex flex-col gap-1">
              <h1 className="text-3xl font-semibold tracking-normal md:text-4xl">
                Zeka Genel Bakış
              </h1>
              <p className="text-sm leading-6 text-muted-foreground">
                Tekrar hoş geldin, {user.first_name}. Yapay zeka senin için 4
                yeni stratejik fırsat belirledi.
              </p>
            </div>

            <div className="grid gap-5 2xl:grid-cols-[minmax(420px,0.9fr)_minmax(0,1.3fr)]">
              <section className="flex min-w-0 flex-col gap-5">
                <ApplicationHistoryCard
                  applications={applicationSummaries}
                  selectedApplicationId={selectedApplication.id}
                  onSelectApplication={setSelectedApplicationId}
                />
                <AssistantPanel />
              </section>

              <ApplicationDetail application={selectedApplication} />
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}
