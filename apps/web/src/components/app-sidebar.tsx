// Module: Renders the authenticated career dashboard sidebar navigation.
import type { JSX } from "react"
import {
  Bot,
  BriefcaseBusiness,
  History,
  PlusCircle,
  Search,
  UserRound,
  type LucideIcon,
} from "lucide-react"

import { Button } from "@workspace/ui/components/button"
import { Separator } from "@workspace/ui/components/separator"
import { cn } from "@workspace/ui/lib/utils"

type SidebarNavItem = {
  href: string
  label: string
  icon: LucideIcon
}

type AppSidebarProps = {
  activeHref?: string
}

const sidebarNavItems: SidebarNavItem[] = [
  {
    href: "#profilim",
    label: "Profilim",
    icon: UserRound,
  },
  {
    href: "#gecmis-basvurular",
    label: "Geçmiş Başvurular",
    icon: History,
  },
  {
    href: "#is-analizi",
    label: "İş Analizi",
    icon: Search,
  },
  {
    href: "#ai-kariyer-sohbeti",
    label: "AI Kariyer Sohbeti",
    icon: Bot,
  },
]

export function AppSidebar({
  activeHref = "#profilim",
}: AppSidebarProps): JSX.Element {
  return (
    <aside
      className="hidden min-h-svh w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground md:flex"
      aria-label="Ana menü"
    >
      <div className="flex h-[4.75rem] items-center gap-3 px-4">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
          <BriefcaseBusiness />
        </div>
        <a href="#profilim" className="min-w-0">
          <span className="block truncate text-base font-semibold tracking-normal">
            Kariyer Pilotu
          </span>
          <span className="block truncate text-xs text-muted-foreground">
            Yapay Zeka Kariyer Stratejisi
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
          const isActive = item.href === activeHref

          return (
            <Button
              key={item.href}
              asChild
              variant="ghost"
              size="lg"
              className={cn(
                "relative w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                isActive &&
                  "bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary hover:text-sidebar-primary-foreground"
              )}
            >
              <a href={item.href} title={item.label}>
                <Icon data-icon="inline-start" />
                <span className="truncate">{item.label}</span>
              </a>
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
