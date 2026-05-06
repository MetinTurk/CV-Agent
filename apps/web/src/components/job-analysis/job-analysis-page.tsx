// Module: Renders the static "CV Özelleştirme Sihirbazı" job analysis page UI.
import type { JSX, ReactNode } from "react"
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Award,
  Bell,
  Bold,
  Bot,
  Briefcase,
  Check,
  ChevronDown,
  FileText,
  GripVertical,
  Italic,
  LayoutDashboard,
  List,
  ListOrdered,
  MessageCircle,
  PlusCircle,
  Settings,
  Sparkles,
  Underline,
  Wand2,
} from "lucide-react"

import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { Separator } from "@workspace/ui/components/separator"
import { cn } from "@workspace/ui/lib/utils"

type WizardStepStatus = "completed" | "active" | "pending"

type WizardStep = {
  index: number
  title: string
  status: WizardStepStatus
  statusLabel: string
}

type SidebarItem = {
  href: string
  label: string
  icon: typeof LayoutDashboard
  isActive?: boolean
}

type ExperienceItem = {
  role: string
  company: string
  period: string
  isCurrent?: boolean
  bullets: { text: string; highlights?: string[] }[]
}

type LibraryProject = {
  title: string
  description: string
  tags: string[]
}

type LibraryCertificate = {
  title: string
  issuer: string
  year: string
}

const wizardSteps: WizardStep[] = [
  { index: 1, title: "Analiz", status: "completed", statusLabel: "Tamamlandı" },
  { index: 2, title: "Düzenleme", status: "active", statusLabel: "Devam Ediyor" },
  { index: 3, title: "İnceleme", status: "pending", statusLabel: "Bekleniyor" },
]

const sidebarItems: SidebarItem[] = [
  { href: "#panel", label: "Panel", icon: LayoutDashboard },
  { href: "#is-analizi", label: "İş Analizi", icon: Briefcase, isActive: true },
  { href: "#yz-sohbet", label: "YZ Sohbet", icon: MessageCircle },
  { href: "#belgeler", label: "Belgeler", icon: FileText },
]

const expertiseTags: string[] = [
  "Dağıtık Sistemler",
  "Bulut Tabanlı Tasarım",
  "Java/Spring Boot",
  "AWS Altyapısı",
  "Sistem Tasarımı",
]

const addedKeywords: string[] = [
  "değişim elementleri",
  "Principal Architect",
  "Kubernetes",
]

const experienceItems: ExperienceItem[] = [
  {
    role: "Lead Cloud Architect",
    company: "TechFlow Corp",
    period: "2019 - GÜNÜMÜZ",
    isCurrent: true,
    bullets: [
      {
        text: "4PB boyutundaki verinin altı kıtaya dağılmasını uçtan uca yönlendirilen iç içe geçmiş dağıtık veritabanı migrasyonu stratejisi kurguladım.",
        highlights: ["dağıtık veritabanı migrasyonu"],
      },
    ],
  },
  {
    role: "Senior Full-stack Engineer",
    company: "Innovate.ai",
    period: "2015 - 2018",
    bullets: [
      {
        text: "React ve Node.js tabanlı SPA mimarisini yeniden tasarlayarak ürünün performansını %40 artırdım ve SLO uyumluluğunu sağladım.",
        highlights: ["SPA mimarisi"],
      },
    ],
  },
]

const libraryProjects: LibraryProject[] = [
  {
    title: "E-Ticaret Mikroservis Migrasyonu",
    description:
      "Monolitik yapıyı 15+ mikroservise ayırarak dağıtım hızını ve güvenilirliği artırdım.",
    tags: ["Docker", "Kubernetes"],
  },
  {
    title: "Gerçek Zamanlı Analitik Dashboard",
    description:
      "Saniyede 10k+ olay işleyen Apache Kafka tabanlı veri akışı dashboard'u tasarladım.",
    tags: ["Kafka", "React"],
  },
]

const libraryCertificates: LibraryCertificate[] = [
  {
    title: "AWS Certified Solutions Architect",
    issuer: "Amazon",
    year: "2022",
  },
  {
    title: "Certified Kubernetes Administrator",
    issuer: "CNCF",
    year: "2021",
  },
]

function TopBar(): JSX.Element {
  return (
    <header className="sticky top-0 z-20 flex h-14 items-center gap-4 border-b border-border bg-background/95 px-6 backdrop-blur">
      <div className="flex items-center gap-2">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground">
          <Bot />
        </div>
        <span className="text-sm font-semibold">Kariyer Pilotu</span>
      </div>

      <nav
        aria-label="Birincil gezinme"
        className="hidden items-center gap-1 md:flex"
      >
        <Button asChild variant="ghost" size="sm">
          <a href="#panel">Panel</a>
        </Button>
        <Button
          asChild
          variant="ghost"
          size="sm"
          className="text-primary aria-[current=page]:bg-muted"
          aria-current="page"
        >
          <a href="#is-analizi">İş Analizi</a>
        </Button>
      </nav>

      <div className="ml-auto flex items-center gap-2">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Bildirimleri görüntüle"
          className="relative"
        >
          <Bell />
          <span className="absolute top-1.5 right-1.5 size-2 rounded-full bg-destructive" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Ayarları aç"
        >
          <Settings />
        </Button>
        <div
          className="flex size-8 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground"
          aria-label="Profil menüsü"
        >
          AR
        </div>
      </div>
    </header>
  )
}

function Sidebar(): JSX.Element {
  return (
    <aside
      className="hidden w-60 shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground lg:flex"
      aria-label="Bölüm gezinmesi"
    >
      <div className="px-5 pt-6 pb-4">
        <p className="text-base font-semibold">Kariyer Pilotu</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Yapay Zeka Kariyer Stratejisi
        </p>
      </div>

      <nav className="flex flex-1 flex-col gap-1 px-3" aria-label="Bölümler">
        {sidebarItems.map((item) => {
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
                  "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground"
              )}
            >
              <a href={item.href}>
                <Icon data-icon="inline-start" />
                <span className="truncate">{item.label}</span>
              </a>
            </Button>
          )
        })}
      </nav>

      <div className="border-t border-sidebar-border p-4">
        <Button type="button" variant="outline" size="sm" className="w-full">
          <PlusCircle data-icon="inline-start" />
          Yeni İlan Ekle
        </Button>
      </div>
    </aside>
  )
}

function WizardStepper(): JSX.Element {
  return (
    <ol
      className="flex w-full items-center gap-3"
      aria-label="Sihirbaz aşamaları"
    >
      {wizardSteps.map((step, index) => {
        const isCompleted = step.status === "completed"
        const isActive = step.status === "active"

        return (
          <li
            key={step.index}
            className="flex flex-1 items-center gap-3"
            aria-current={isActive ? "step" : undefined}
          >
            <div className="flex items-center gap-3">
              <span
                className={cn(
                  "flex size-8 items-center justify-center rounded-full border-2 text-sm font-semibold",
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
              <div className="min-w-0">
                <p
                  className={cn(
                    "text-sm font-medium",
                    !isActive && !isCompleted && "text-muted-foreground"
                  )}
                >
                  {step.title}
                </p>
                <p className="text-xs text-muted-foreground">
                  {step.statusLabel}
                </p>
              </div>
            </div>
            {index < wizardSteps.length - 1 ? (
              <span
                aria-hidden="true"
                className={cn(
                  "ml-2 hidden h-px flex-1 sm:block",
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

function EditorToolbar(): JSX.Element {
  const groups: { label: string; buttons: { icon: typeof Bold; label: string }[] }[] = [
    {
      label: "Metin biçimi",
      buttons: [
        { icon: Bold, label: "Kalın" },
        { icon: Italic, label: "İtalik" },
        { icon: Underline, label: "Altı çizili" },
      ],
    },
    {
      label: "Liste",
      buttons: [
        { icon: List, label: "Madde listesi" },
        { icon: ListOrdered, label: "Numaralı liste" },
      ],
    },
    {
      label: "Hizalama",
      buttons: [
        { icon: AlignLeft, label: "Sola hizala" },
        { icon: AlignCenter, label: "Ortaya hizala" },
        { icon: AlignRight, label: "Sağa hizala" },
      ],
    },
  ]

  return (
    <div
      role="toolbar"
      aria-label="Metin düzenleme araç çubuğu"
      className="flex flex-wrap items-center gap-1 rounded-md border border-border bg-muted/40 p-1"
    >
      {groups.map((group, groupIndex) => (
        <div key={group.label} className="flex items-center gap-1">
          {groupIndex > 0 ? (
            <Separator orientation="vertical" className="mx-1 h-5" />
          ) : null}
          {group.buttons.map((button) => {
            const Icon = button.icon

            return (
              <Button
                key={button.label}
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label={button.label}
              >
                <Icon />
              </Button>
            )
          })}
        </div>
      ))}
    </div>
  )
}

function HighlightedText({
  text,
  highlights,
}: {
  text: string
  highlights?: string[]
}): JSX.Element {
  if (highlights === undefined || highlights.length === 0) {
    return <>{text}</>
  }

  const pattern = new RegExp(`(${highlights.map(escapeRegExp).join("|")})`, "gi")
  const segments = text.split(pattern)

  return (
    <>
      {segments.map((segment, index) => {
        const isHighlight = highlights.some(
          (highlight) => highlight.toLowerCase() === segment.toLowerCase()
        )

        if (!isHighlight) {
          return <span key={index}>{segment}</span>
        }

        return (
          <mark
            key={index}
            className="rounded bg-amber-200/70 px-0.5 text-foreground dark:bg-amber-300/30"
          >
            {segment}
          </mark>
        )
      })}
    </>
  )
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

function CvPreview(): JSX.Element {
  return (
    <article
      className="rounded-lg border border-border bg-background p-6 shadow-sm"
      aria-label="CV önizlemesi"
    >
      <header className="border-b border-border pb-4">
        <h2 className="text-2xl font-semibold tracking-tight">Alex Rivera</h2>
        <p className="mt-1 text-sm text-primary">
          Principal Solutions Architect | Bulut Altyapı Uzmanı
        </p>
      </header>

      <section className="mt-5 space-y-2">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-foreground">
          Profesyonel Özet
        </h3>
        <p className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm leading-6 text-foreground dark:border-amber-300/40 dark:bg-amber-300/10">
          <HighlightedText
            text="Yüksek ölçekli dağıtık sistemler ve bulut bilişim mimarisinde uzmanlaşmış, 10 yılı aşkın deneyime sahip vizyoner Principal Architect. Fortune 500 şirketlerinde dijital dönüşüm öncülük ettiği teknik etkinliği ve hedefleriyle uyumlu hale getirerek sistem verimliliğinde %40 artış sağlamıştır. Kubernetes, AWS ve reaktif mikroservisler konusunda uzman."
            highlights={["Principal Architect", "Kubernetes"]}
          />
        </p>
        <p className="text-xs text-muted-foreground">
          + Eklendi:{" "}
          {addedKeywords.map((keyword, index) => (
            <span key={keyword}>
              <span className="font-medium text-foreground">"{keyword}"</span>
              {index < addedKeywords.length - 1 ? ", " : ""}
            </span>
          ))}
        </p>
      </section>

      <section className="mt-5 space-y-2">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-foreground">
          Temel Uzmanlık Alanları
        </h3>
        <div className="flex flex-wrap gap-2">
          {expertiseTags.map((tag) => (
            <Badge key={tag} variant="secondary" className="px-2.5 py-1">
              {tag}
            </Badge>
          ))}
        </div>
      </section>

      <section className="mt-5 space-y-3">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-foreground">
          Profesyonel Deneyim
        </h3>
        <div className="space-y-4">
          {experienceItems.map((item) => (
            <div key={`${item.role}-${item.period}`} className="flex gap-3">
              <span
                aria-hidden="true"
                className={cn(
                  "mt-1.5 size-2.5 shrink-0 rounded-full",
                  item.isCurrent ? "bg-primary" : "bg-muted-foreground/50"
                )}
              />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="font-medium">
                    {item.role} | {item.company}
                  </p>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    {item.period}
                  </p>
                </div>
                <ul className="mt-1.5 space-y-1.5 text-sm leading-6 text-muted-foreground">
                  {item.bullets.map((bullet, bulletIndex) => (
                    <li key={bulletIndex} className="flex gap-2">
                      <span aria-hidden="true">•</span>
                      <span className="text-foreground">
                        <HighlightedText
                          text={bullet.text}
                          highlights={bullet.highlights}
                        />
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </section>
    </article>
  )
}

function OptimizedCvCard(): JSX.Element {
  return (
    <Card className="gap-4">
      <CardHeader className="flex-row items-center justify-between gap-3">
        <CardTitle className="text-lg">Optimize Edilmiş CV</CardTitle>
        <Badge className="rounded-full bg-primary text-primary-foreground">
          Yapay Zeka Tarafından Optimize Edildi
        </Badge>
      </CardHeader>
      <CardContent className="gap-4">
        <EditorToolbar />
        <CvPreview />
      </CardContent>
    </Card>
  )
}

function LibrarySectionHeader({
  title,
}: {
  title: string
}): JSX.Element {
  return (
    <div className="flex items-center justify-between">
      <h3 className="text-sm font-semibold">{title}</h3>
      <span className="flex items-center gap-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        <GripVertical className="size-3" />
        Sürükle ve Bırak
      </span>
    </div>
  )
}

function LibraryItemCard({
  icon,
  title,
  subtitle,
  children,
}: {
  icon: ReactNode
  title: string
  subtitle?: string
  children?: ReactNode
}): JSX.Element {
  return (
    <div
      className="group flex cursor-grab items-start gap-3 rounded-lg border border-border bg-background p-3 transition-colors hover:border-primary/40 hover:bg-muted/40"
      role="button"
      tabIndex={0}
      aria-label={`${title} öğesini sürükle`}
    >
      <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{title}</p>
        {subtitle !== undefined ? (
          <p className="truncate text-xs text-muted-foreground">{subtitle}</p>
        ) : null}
        {children}
      </div>
      <GripVertical
        aria-hidden="true"
        className="mt-1 size-4 text-muted-foreground/60 opacity-0 transition-opacity group-hover:opacity-100"
      />
    </div>
  )
}

function ContentLibrary(): JSX.Element {
  return (
    <Card className="gap-5">
      <CardHeader>
        <CardTitle className="text-lg">İçerik Kütüphanesi</CardTitle>
        <p className="text-xs text-muted-foreground">
          Profilinizden seçtiklerinizi sürükleyerek CV'nize ekleyin.
        </p>
      </CardHeader>

      <CardContent className="gap-5">
        <section className="flex flex-col gap-3">
          <LibrarySectionHeader title="Projeler" />
          <div className="flex flex-col gap-2">
            {libraryProjects.map((project) => (
              <LibraryItemCard
                key={project.title}
                icon={<Sparkles className="size-4" />}
                title={project.title}
                subtitle={project.description}
              >
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {project.tags.map((tag) => (
                    <Badge
                      key={tag}
                      variant="outline"
                      className="px-1.5 py-0 text-[10px]"
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
              </LibraryItemCard>
            ))}
          </div>
        </section>

        <Separator />

        <section className="flex flex-col gap-3">
          <LibrarySectionHeader title="Sertifikalar" />
          <div className="flex flex-col gap-2">
            {libraryCertificates.map((certificate) => (
              <LibraryItemCard
                key={certificate.title}
                icon={<Award className="size-4" />}
                title={certificate.title}
                subtitle={`${certificate.issuer} · ${certificate.year}`}
              />
            ))}
          </div>
        </section>
      </CardContent>
    </Card>
  )
}

function FloatingAiButton(): JSX.Element {
  return (
    <Button
      type="button"
      size="lg"
      className="fixed right-6 bottom-6 z-30 h-12 gap-2 rounded-full px-5 shadow-lg"
    >
      <MessageCircle data-icon="inline-start" />
      Düzenlemek için YZ'ye Sor
    </Button>
  )
}

export function JobAnalysisPage(): JSX.Element {
  return (
    <div className="flex min-h-svh flex-col bg-muted/20">
      <TopBar />

      <div className="flex flex-1">
        <Sidebar />

        <main className="flex flex-1 flex-col gap-6 px-4 py-6 md:px-8">
          <Card className="gap-4">
            <CardContent className="gap-4">
              <WizardStepper />
              <Separator />
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <Wand2 className="size-5 text-primary" />
                  <h1 className="text-2xl font-semibold tracking-tight">
                    CV Özelleştirme Sihirbazı
                  </h1>
                </div>
                <p className="text-sm text-muted-foreground">
                  Senior Yazılım Mühendisi özgeçmişiniz{" "}
                  <span className="font-medium text-foreground">
                    "CloudScale Inc."
                  </span>{" "}
                  bünyesindeki{" "}
                  <span className="font-medium text-foreground">
                    "Principal Architect"
                  </span>{" "}
                  pozisyonu için optimize ediliyor.
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <OptimizedCvCard />
            </div>
            <div className="lg:col-span-1">
              <ContentLibrary />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <Button type="button" variant="outline">
              Önceki Adım
            </Button>
            <Button type="button" className="gap-2">
              İncelemeye Geç
              <ChevronDown className="-rotate-90" />
            </Button>
          </div>
        </main>
      </div>

      <FloatingAiButton />
    </div>
  )
}
