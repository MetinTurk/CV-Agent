// Module: Renders the authenticated application sidebar navigation.
import type { JSX } from "react"
import {
  BarChart3,
  Bot,
  BriefcaseBusiness,
  MessageCircle,
  PlusCircle,
  UserRound,
  type LucideIcon,
} from "lucide-react"

import { Button } from "@workspace/ui/components/button"
import { Separator } from "@workspace/ui/components/separator"
import { cn } from "@workspace/ui/lib/utils"

export type SidebarView = "profile" | "applications" | "analysis" | "assistant"

type SidebarNavItem = {
  view: SidebarView
  label: string
  icon: LucideIcon
}

const sidebarNavItems: SidebarNavItem[] = [
  {
    view: "profile",
    label: "Profilim",
    icon: UserRound,
  },
  {
    view: "applications",
    label: "Geçmiş Başvurular",
    icon: BriefcaseBusiness,
  },
  {
    view: "analysis",
    label: "İş Analizi",
    icon: BarChart3,
  },
  {
    view: "assistant",
    label: "Yapay Zeka Sohbet",
    icon: MessageCircle,
  },
]

type AppSidebarProps = {
  activeView: SidebarView
  onNavigate: (view: SidebarView) => void
}

export function AppSidebar({
  activeView,
  onNavigate,
}: AppSidebarProps): JSX.Element {
  return (
    <aside
      className="hidden min-h-svh w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground lg:flex"
      aria-label="Ana menü"
    >
      <div className="flex h-16 items-center gap-3 px-4">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
          <Bot />
        </div>
        <a
          href="#profilim"
          onClick={(event) => {
            event.preventDefault()
            onNavigate("profile")
          }}
          className="min-w-0"
        >
          <span className="block truncate text-base font-semibold tracking-normal">
            Kariyer Yardımcı Pilotu
          </span>
          <span className="block truncate text-xs text-muted-foreground">
            Yapay Zeka Destekli
          </span>
        </a>
      </div>

      <Separator />

      <nav
        className="flex flex-1 flex-col gap-1 px-3 py-4"
        aria-label="Sayfa bölümleri"
      >
        {sidebarNavItems.map((item) => {
          const Icon = item.icon
          const isActive = activeView === item.view

          return (
            <Button
              key={item.view}
              type="button"
              variant="ghost"
              size="lg"
              onClick={() => onNavigate(item.view)}
              className={cn(
                "relative w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                isActive &&
                  "bg-sidebar-accent text-sidebar-primary after:absolute after:top-1/2 after:right-1.5 after:h-5 after:w-1 after:-translate-y-1/2 after:rounded-full after:bg-sidebar-primary"
              )}
            >
              <Icon data-icon="inline-start" />
              <span className="truncate">{item.label}</span>
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
        >
          <PlusCircle data-icon="inline-start" />
          <span className="truncate">Yeni Analiz Başlat</span>
        </Button>
      </div>
    </aside>
  )
}
