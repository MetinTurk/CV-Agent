// Module: Renders the authenticated application sidebar navigation.
import { useState, type JSX } from "react"
import { Link, useLocation, useNavigate } from "react-router"
import {
  BarChart3,
  Bot,
  FileText,
  MessageCircle,
  PlusCircle,
  UserRound,
  type LucideIcon,
} from "lucide-react"

import { Button } from "@workspace/ui/components/button"
import { Separator } from "@workspace/ui/components/separator"
import { cn } from "@workspace/ui/lib/utils"

import { NewJobAnalysisModal } from "@/components/job-analysis/new-job-analysis-modal"
import type { JobAnalysisResponse } from "@/lib/job-analysis-api"

type SidebarNavItem = {
  href: string
  label: string
  icon: LucideIcon
}

type AppSidebarProps = {
  token?: string
}

const sidebarNavItems: SidebarNavItem[] = [
  {
    href: "/profile",
    label: "Profilim",
    icon: UserRound,
  },
  {
    href: "/applications",
    label: "Geçmiş Başvurular",
    icon: FileText,
  },
  {
    href: "/job-analysis",
    label: "İş Analizi",
    icon: BarChart3,
  },
  {
    href: "/profile-chat",
    label: "AI Kariyer Sohbeti",
    icon: MessageCircle,
  },
]

export function AppSidebar({ token }: AppSidebarProps = {}): JSX.Element {
  const navigate = useNavigate()
  const location = useLocation()
  const [isNewAnalysisOpen, setIsNewAnalysisOpen] = useState(false)

  const handleAnalysisCreated = (analysis: JobAnalysisResponse): void => {
    navigate("/job-analysis", {
      state: { analysis, token },
    })
  }

  return (
    <>
      <aside
        className="hidden min-h-svh w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground lg:flex"
        aria-label="Ana menü"
      >
        <div className="flex h-16 items-center gap-3 px-4">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
            <Bot />
          </div>
          <Link to="/profile" className="min-w-0">
            <span className="block truncate text-base font-semibold tracking-normal">
              Kariyer Asistanı
            </span>
            <span className="block truncate text-xs text-muted-foreground">
              Yapay Zeka Destekli
            </span>
          </Link>
        </div>

        <Separator />

        <nav
          className="flex flex-1 flex-col gap-1 px-3 py-4"
          aria-label="Sayfa bölümleri"
        >
          {sidebarNavItems.map((item) => {
            const Icon = item.icon
            const isActive =
              item.href === "/job-analysis"
                ? location.pathname.startsWith("/job-analysis")
                : location.pathname === item.href

            return (
              <Button
                key={item.href}
                asChild
                variant="ghost"
                size="lg"
                className={cn(
                  "relative w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                  isActive &&
                    "bg-sidebar-accent text-sidebar-primary after:absolute after:top-1/2 after:right-1.5 after:h-5 after:w-1 after:-translate-y-1/2 after:rounded-full after:bg-sidebar-primary"
                )}
              >
                <Link to={item.href} title={item.label}>
                  <Icon data-icon="inline-start" />
                  <span className="truncate">{item.label}</span>
                </Link>
              </Button>
            )
          })}
        </nav>

        <div className="px-3 pb-4">
          <Button
            type="button"
            size="lg"
            title="Yeni analiz başlat"
            aria-label="Yeni analiz başlat"
            className="w-full justify-start"
            onClick={() => setIsNewAnalysisOpen(true)}
            disabled={token === undefined}
          >
            <PlusCircle data-icon="inline-start" />
            <span className="truncate">Yeni Analiz Başlat</span>
          </Button>
        </div>
      </aside>

      {isNewAnalysisOpen && token !== undefined ? (
        <NewJobAnalysisModal
          token={token}
          onClose={() => setIsNewAnalysisOpen(false)}
          onAnalysisCreated={handleAnalysisCreated}
        />
      ) : null}
    </>
  )
}
