// Module: Renders the authenticated career dashboard sidebar navigation.
import type { JSX } from "react"
import {
  Bot,
  BriefcaseBusiness,
  History,
  PanelLeftClose,
  PanelLeftOpen,
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
  isOpen: boolean
  onToggle: () => void
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
  activeHref = "#gecmis-basvurular",
  isOpen,
  onToggle,
}: AppSidebarProps): JSX.Element {
  const ToggleIcon = isOpen ? PanelLeftClose : PanelLeftOpen

  return (
    <aside
      className={cn(
        "hidden min-h-svh shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-[width] duration-300 ease-out md:flex",
        isOpen ? "w-64" : "w-[4.5rem]"
      )}
      aria-label="Ana menü"
    >
      <div className="flex h-[4.75rem] items-center justify-between gap-2 px-4">
        <a
          href="#profilim"
          className={cn(
            "flex min-w-0 items-center gap-3 transition-opacity",
            isOpen ? "opacity-100" : "sr-only opacity-0"
          )}
        >
          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
            <BriefcaseBusiness />
          </span>
          <span className="min-w-0">
            <span className="block truncate text-base font-semibold tracking-normal">
              Kariyer Pilotu
            </span>
            <span className="block truncate text-xs text-muted-foreground">
              Yapay Zeka Kariyer Stratejisi
            </span>
          </span>
        </a>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={isOpen ? "Menüyü daralt" : "Menüyü genişlet"}
          aria-expanded={isOpen}
          title={isOpen ? "Menüyü daralt" : "Menüyü genişlet"}
          onClick={onToggle}
          className="shrink-0"
        >
          <ToggleIcon />
        </Button>
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
              variant={isActive ? "secondary" : "ghost"}
              size={isOpen ? "lg" : "icon-lg"}
              className={cn(
                "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                isActive &&
                  "bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary hover:text-sidebar-primary-foreground",
                isOpen ? "w-full justify-start" : "mx-auto"
              )}
            >
              <a href={item.href} title={item.label}>
                <Icon data-icon="inline-start" />
                <span className={cn("truncate", !isOpen && "sr-only")}>
                  {item.label}
                </span>
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
          className={cn(isOpen ? "w-full justify-start" : "mx-auto")}
        >
          <PlusCircle data-icon="inline-start" />
          <span className={cn("truncate", !isOpen && "sr-only")}>
            Yeni Analiz Başlat
          </span>
        </Button>
      </div>
    </aside>
  )
}
