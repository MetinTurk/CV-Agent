// Module: Renders the authenticated application sidebar navigation.
import type { JSX } from "react"
import {
  History,
  MessageCircle,
  PanelLeftClose,
  PanelLeftOpen,
  PlusCircle,
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
    href: "#gecmis-analizler",
    label: "Geçmiş Analizler",
    icon: History,
  },
  {
    href: "#chatbot",
    label: "Chatbot",
    icon: MessageCircle,
  },
]

export function AppSidebar({
  isOpen,
  onToggle,
}: AppSidebarProps): JSX.Element {
  const ToggleIcon = isOpen ? PanelLeftClose : PanelLeftOpen

  return (
    <aside
      className={cn(
        "border-sidebar-border bg-sidebar text-sidebar-foreground flex min-h-svh shrink-0 flex-col border-r transition-[width] duration-300 ease-out",
        isOpen ? "w-64" : "w-[4.5rem]"
      )}
      aria-label="Ana menü"
    >
      <div className="flex h-16 items-center justify-between gap-2 px-4">
        <a
          href="#profilim"
          className={cn(
            "min-w-0 text-lg font-semibold tracking-normal transition-opacity",
            isOpen ? "opacity-100" : "sr-only opacity-0"
          )}
        >
          CV Agent
        </a>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={isOpen ? "Sidebar'ı kapat" : "Sidebar'ı aç"}
          aria-expanded={isOpen}
          title={isOpen ? "Sidebar'ı kapat" : "Sidebar'ı aç"}
          onClick={onToggle}
          className="shrink-0"
        >
          <ToggleIcon />
        </Button>
      </div>

      <Separator />

      <nav className="flex flex-1 flex-col gap-1 px-3 py-4" aria-label="Sayfa bölümleri">
        {sidebarNavItems.map((item) => {
          const Icon = item.icon

          return (
            <Button
              key={item.href}
              asChild
              variant="ghost"
              size={isOpen ? "lg" : "icon-lg"}
              className={cn(
                "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
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
