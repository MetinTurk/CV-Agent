// Module: Renders the static profile dashboard for authenticated CV Agent users.
import { useState, type JSX } from "react"
import {
  ArrowLeft,
  ArrowUpRight,
  Bell,
  ChevronDown,
  Download,
  Eye,
  Info,
  Link,
  MessageCircle,
  LogOut,
  Pencil,
  Plus,
  RefreshCcw,
  Sparkles,
  Search,
  Settings,
  X,
} from "lucide-react"

import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@workspace/ui/components/field"
import { Input } from "@workspace/ui/components/input"
import { Separator } from "@workspace/ui/components/separator"
import { cn } from "@workspace/ui/lib/utils"

import { AppSidebar } from "@/components/app-sidebar"
import { ThemeToggle } from "@/components/theme-toggle"
import type { AuthUser } from "@/lib/auth-api"
import {
  profileDashboardMock,
  type AllProjectItem,
  type CertificateItem,
  type ContactItem,
  type ProjectItem,
  type TimelineItem,
} from "./profile-dashboard.mock"

type ProfileDashboardPageProps = {
  user: AuthUser
  onLogout: () => void
}

type DashboardView = "profile" | "projects"

function DashboardHeader({
  accountName,
  onLogout,
}: {
  accountName: string
  onLogout: () => void
}): JSX.Element {
  return (
    <header className="sticky top-0 z-10 flex min-h-16 flex-col gap-3 border-b border-border bg-background/95 px-4 py-3 backdrop-blur md:px-6 lg:flex-row lg:items-center lg:justify-between">
      <div className="relative w-full lg:max-w-xl">
        <Search className="pointer-events-none absolute top-1/2 left-3 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Ara..."
          aria-label="Profil dashboard içinde ara"
          className="h-10 bg-muted/40 pl-9"
        />
      </div>

      <div className="flex items-center justify-between gap-2 lg:justify-end">
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="icon"
            aria-label="Bildirimleri görüntüle"
            className="relative"
          >
            <Bell />
            <span className="absolute top-1.5 right-1.5 size-2 rounded-full bg-destructive" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            aria-label="Ayarları aç"
          >
            <Settings />
          </Button>
          <ThemeToggle />
        </div>

        <div
          className="flex items-center gap-2 rounded-lg border border-border bg-card px-2 py-1"
          aria-label={`Oturum sahibi: ${accountName}`}
        >
          <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-xs font-semibold text-primary-foreground">
            {profileDashboardMock.profile.avatarLabel}
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onLogout}
            aria-label="Çıkış yap"
          >
            <LogOut data-icon="inline-start" />
            Çıkış
          </Button>
        </div>
      </div>
    </header>
  )
}

function ProfileTimeline({ items }: { items: TimelineItem[] }): JSX.Element {
  return (
    <div className="flex flex-col">
      {items.map((item, index) => (
        <div key={`${item.role}-${item.period}`} className="flex gap-3">
          <div className="flex flex-col items-center">
            <span
              className={cn(
                "mt-1 size-3 rounded-full border-2 border-background",
                item.isCurrent ? "bg-primary" : "bg-muted-foreground/50"
              )}
            />
            {index < items.length - 1 ? (
              <span className="h-full min-h-10 w-px bg-border" />
            ) : null}
          </div>
          <div className="min-w-0 pb-4">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <p
                className={cn("font-medium", item.isCurrent && "text-primary")}
              >
                {item.role} | {item.company}
              </p>
              <p className="text-sm text-muted-foreground">{item.period}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

function ProfileSummaryCard(): JSX.Element {
  const { profile, timeline, meta } = profileDashboardMock

  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex-row items-start justify-between gap-4">
        <div className="flex min-w-0 items-center gap-4">
          <div className="flex size-20 shrink-0 items-center justify-center rounded-lg bg-primary text-2xl font-semibold text-primary-foreground">
            {profile.avatarLabel}
          </div>
          <div className="min-w-0">
            <CardTitle className="text-2xl">{profile.name}</CardTitle>
            <CardDescription>{profile.title}</CardDescription>
          </div>
        </div>
        <Button type="button" className="shrink-0">
          <Pencil data-icon="inline-start" />
          Profili Düzenle
        </Button>
      </CardHeader>

      <CardContent className="gap-5">
        <ProfileTimeline items={timeline} />

        <div className="flex flex-wrap gap-2">
          {meta.map((item) => {
            const Icon = item.icon

            return (
              <Badge key={item.label} variant="secondary" className="gap-1">
                <Icon data-icon="inline-start" />
                {item.label}
              </Badge>
            )
          })}
        </div>

        <Separator />

        <div className="flex flex-col gap-2 rounded-lg bg-muted/40 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="text-sm font-medium">Eğitim</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {profile.education}
            </p>
          </div>
          <Badge variant="outline">{profile.grade}</Badge>
        </div>
      </CardContent>
    </Card>
  )
}

function ProgressBar({ value }: { value: number }): JSX.Element {
  return (
    <div className="h-2 rounded-full bg-muted">
      <div
        className="h-full rounded-full bg-primary"
        style={{ width: `${value}%` }}
      />
    </div>
  )
}

function ContactRow({ item }: { item: ContactItem }): JSX.Element {
  const Icon = item.icon

  return (
    <div className="flex items-start gap-3 rounded-lg border border-border bg-background p-3">
      <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
        <Icon />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{item.label}</p>
        <p className="truncate text-sm font-medium">{item.value}</p>
      </div>
    </div>
  )
}

function ProfileContactCard(): JSX.Element {
  const { contact, profile } = profileDashboardMock

  return (
    <Card>
      <CardHeader>
        <CardTitle>İletişim</CardTitle>
        <CardDescription>
          Başvurularda kullanılacak temel iletişim bilgileri.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {contact.map((item) => (
          <ContactRow key={item.label} item={item} />
        ))}

        <Separator />

        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-medium">Profil Tamamlama</p>
            <Badge>{profile.completion}%</Badge>
          </div>
          <ProgressBar value={profile.completion} />
        </div>
      </CardContent>
    </Card>
  )
}

function SectionHeader({
  title,
  description,
  actionLabel = "Ekle",
  onAddClick,
  onViewAllClick,
}: {
  title: string
  description: string
  actionLabel?: string
  onAddClick?: () => void
  onViewAllClick?: () => void
}): JSX.Element {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        <h2 className="text-base font-semibold tracking-normal">{title}</h2>
        <p className="mt-1 text-sm leading-5 text-muted-foreground">
          {description}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onViewAllClick}
        >
          Tümünü Gör
        </Button>
        <Button type="button" size="sm" onClick={onAddClick}>
          <Plus data-icon="inline-start" />
          {actionLabel}
        </Button>
      </div>
    </div>
  )
}

function ProjectCard({ project }: { project: ProjectItem }): JSX.Element {
  return (
    <Card className="bg-background transition-shadow hover:shadow-md">
      <CardHeader className="flex-row items-start justify-between gap-3">
        <CardTitle>{project.title}</CardTitle>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label={`${project.title} detaylarını görüntüle`}
        >
          <ArrowUpRight />
        </Button>
      </CardHeader>
      <CardContent>
        <p className="text-sm leading-5 text-muted-foreground">
          {project.description}
        </p>
      </CardContent>
      <CardFooter className="flex-wrap">
        {project.tags.map((tag) => (
          <Badge key={tag} variant="secondary">
            {tag}
          </Badge>
        ))}
      </CardFooter>
    </Card>
  )
}

function AddProjectModal({ onClose }: { onClose: () => void }): JSX.Element {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/70 p-4 backdrop-blur-sm">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-project-title"
        aria-describedby="add-project-description"
        className="max-h-[calc(100svh-2rem)] w-full max-w-[700px] overflow-hidden rounded-lg border border-border bg-card text-card-foreground shadow-xl"
      >
        <header className="flex items-center justify-between gap-4 border-b border-border px-5 py-4 sm:px-8">
          <h2
            id="add-project-title"
            className="text-2xl font-semibold tracking-normal"
          >
            Yeni Proje Ekle
          </h2>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Pencereyi kapat"
            onClick={onClose}
          >
            <X />
          </Button>
        </header>

        <div className="flex flex-col gap-7 px-5 py-6 sm:px-8">
          <p
            id="add-project-description"
            className="max-w-[620px] text-base leading-7 text-muted-foreground"
          >
            GitHub, Portfolyo veya canlı proje bağlantınızı buraya ekleyerek
            profilinizi güçlendirin. Yapay zeka, bağlantıdaki içeriği analiz
            ederek projenizi otomatik olarak detaylandıracaktır.
          </p>

          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="project-url">Proje Bağlantısı</FieldLabel>
              <div className="relative">
                <Link className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="project-url"
                  type="url"
                  placeholder="https://github.com/kullanici/proje"
                  className="h-16 pl-11 text-base"
                />
              </div>
              <FieldDescription className="flex items-start gap-2 text-xs">
                <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
                <span>
                  Desteklenen platformlar: GitHub, GitLab, Behance ve özel
                  portfolyo siteleri.
                </span>
              </FieldDescription>
            </Field>
          </FieldGroup>
        </div>

        <footer className="flex flex-col-reverse gap-3 border-t border-border bg-muted/30 px-5 py-4 sm:flex-row sm:justify-end sm:px-8">
          <Button
            type="button"
            variant="ghost"
            size="lg"
            onClick={onClose}
            className="h-12 px-6"
          >
            İptal
          </Button>
          <Button
            type="button"
            size="lg"
            className="h-12 px-7 whitespace-normal"
          >
            <Sparkles data-icon="inline-start" />
            Ekle ve Analiz Et
          </Button>
        </footer>
      </section>
    </div>
  )
}

function ProjectsSection({
  onViewAllProjects,
}: {
  onViewAllProjects: () => void
}): JSX.Element {
  const [isAddProjectOpen, setIsAddProjectOpen] = useState(false)

  return (
    <>
      <section id="is-analizi" className="flex flex-col gap-4">
        <SectionHeader
          title="Projeler"
          description="Başvuru hikayesini güçlendiren seçili çalışma örnekleri."
          actionLabel="Proje Ekle"
          onAddClick={() => setIsAddProjectOpen(true)}
          onViewAllClick={onViewAllProjects}
        />
        <div className="grid gap-4 lg:grid-cols-2">
          {profileDashboardMock.projects.map((project) => (
            <ProjectCard key={project.title} project={project} />
          ))}
        </div>
      </section>

      {isAddProjectOpen ? (
        <AddProjectModal onClose={() => setIsAddProjectOpen(false)} />
      ) : null}
    </>
  )
}

function getProjectToneClass(tone: AllProjectItem["tone"]): string {
  if (tone === "primary") {
    return "bg-primary/10 text-primary"
  }

  if (tone === "secondary") {
    return "bg-secondary text-secondary-foreground"
  }

  return "bg-muted text-muted-foreground"
}

function AllProjectCard({ project }: { project: AllProjectItem }): JSX.Element {
  return (
    <Card className="gap-4 bg-background p-5 transition-shadow hover:shadow-md">
      <CardHeader>
        <Badge
          variant="secondary"
          className={cn("gap-1", getProjectToneClass(project.tone))}
        >
          <span className="size-1.5 rounded-full bg-current" />
          {project.language}
        </Badge>
        <CardTitle className="text-lg">{project.title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm leading-6 text-muted-foreground">
          {project.description}
        </p>
      </CardContent>
    </Card>
  )
}

function ProjectsOverviewPage({ onBack }: { onBack: () => void }): JSX.Element {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-3">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="w-fit"
        >
          <ArrowLeft data-icon="inline-start" />
          Ana Sayfaya Dön
        </Button>
        <div className="min-w-0">
          <h1 className="text-3xl font-semibold tracking-normal">Projelerim</h1>
          <p className="mt-1 text-sm leading-5 text-muted-foreground">
            GitHub üzerinden senkronize edilen projeleriniz ve AI tarafından
            oluşturulan analizleri.
          </p>
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-[minmax(260px,1fr)_auto_auto_auto]">
        <div className="relative min-w-0">
          <Search className="pointer-events-none absolute top-1/2 left-3 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Proje ara..."
            aria-label="Proje ara"
            className="h-10 bg-background pl-9"
          />
        </div>
        <Button type="button" variant="outline" className="justify-between">
          Tür
          <ChevronDown data-icon="inline-end" />
        </Button>
        <Button type="button" variant="outline" className="justify-between">
          Sırala
          <ChevronDown data-icon="inline-end" />
        </Button>
        <Button type="button">
          <RefreshCcw data-icon="inline-start" />
          Senkronize Et
        </Button>
      </div>

      <section className="flex flex-col gap-4" aria-label="Tüm projeler">
        {profileDashboardMock.allProjects.map((project) => (
          <AllProjectCard key={project.title} project={project} />
        ))}
      </section>

      <Card className="ml-auto max-w-sm gap-2 bg-background">
        <CardTitle className="text-sm">Kod Kalitesi Analizi</CardTitle>
        <CardDescription>
          Projelerinizdeki kod kalitesi analizini görmek için senkronizasyon
          tamamlandığında bu alanda statik özet gösterilecektir.
        </CardDescription>
      </Card>
    </div>
  )
}

function getCertificateToneClass(tone: CertificateItem["tone"]): string {
  if (tone === "primary") {
    return "bg-primary/10 text-primary"
  }

  if (tone === "secondary") {
    return "bg-secondary text-secondary-foreground"
  }

  return "bg-destructive/10 text-destructive"
}

function CertificateCard({
  certificate,
}: {
  certificate: CertificateItem
}): JSX.Element {
  const Icon = certificate.icon

  return (
    <div className="grid gap-3 rounded-lg border border-border bg-background p-3 sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:items-center">
      <div
        className={cn(
          "flex size-10 items-center justify-center rounded-lg",
          getCertificateToneClass(certificate.tone)
        )}
      >
        <Icon />
      </div>
      <div className="min-w-0">
        <p className="truncate text-sm font-medium">{certificate.title}</p>
        <p className="text-sm text-muted-foreground">{certificate.meta}</p>
      </div>
      <div className="flex items-center gap-1">
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label={`${certificate.title} görüntüle`}
        >
          <Eye />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label={`${certificate.title} indir`}
        >
          <Download />
        </Button>
      </div>
    </div>
  )
}

function CertificatesSection(): JSX.Element {
  return (
    <section id="gelisim-merkezi" className="flex flex-col gap-4">
      <SectionHeader
        title="Sertifikalar"
        description="Başvurularda öne çıkarılabilecek dosya ve sertifika kayıtları."
      />
      <div className="grid gap-3">
        {profileDashboardMock.certificates.map((certificate) => (
          <CertificateCard key={certificate.title} certificate={certificate} />
        ))}
      </div>
    </section>
  )
}

function CareerAssistantSection(): JSX.Element {
  return (
    <Card id="ai-kariyer-sohbeti">
      <CardHeader className="flex-row items-start justify-between gap-4">
        <div>
          <CardTitle>AI Kariyer Sohbeti</CardTitle>
          <CardDescription>
            Profil hedeflerini netleştirmek için sohbet alanına hızlı erişim.
          </CardDescription>
        </div>
        <MessageCircle className="text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <p className="text-sm leading-5 text-muted-foreground">
          Güçlü yönler, eksik alanlar ve başvuru stratejisi için kariyer
          asistanıyla devam et.
        </p>
        <Button type="button" variant="outline" className="w-full">
          <Sparkles data-icon="inline-start" />
          Asistanı Aç
        </Button>
      </CardContent>
    </Card>
  )
}

export function ProfileDashboardPage({
  user,
  onLogout,
}: ProfileDashboardPageProps): JSX.Element {
  const accountName = `${user.first_name} ${user.last_name}`
  const [dashboardView, setDashboardView] = useState<DashboardView>("profile")

  return (
    <div className="flex min-h-svh bg-muted/30">
      <AppSidebar />

      <main className="min-w-0 flex-1 overflow-y-auto">
        <DashboardHeader accountName={accountName} onLogout={onLogout} />

        <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-5 px-4 py-5 md:px-6 lg:py-6">
          {dashboardView === "projects" ? (
            <ProjectsOverviewPage onBack={() => setDashboardView("profile")} />
          ) : (
            <>
              <section
                id="profilim"
                className="grid gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(340px,0.65fr)]"
              >
                <ProfileSummaryCard />
                <ProfileContactCard />
              </section>

              <ProjectsSection
                onViewAllProjects={() => setDashboardView("projects")}
              />

              <CertificatesSection />

              <CareerAssistantSection />
            </>
          )}
        </div>
      </main>
    </div>
  )
}
