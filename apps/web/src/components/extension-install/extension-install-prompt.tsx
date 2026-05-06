// Module: Shows the Chrome extension installation prompt for authenticated users.
import type { JSX } from "react"
import {
  Bot,
  Check,
  ExternalLink,
  FileCheck2,
  Puzzle,
  RefreshCcw,
  Zap,
  type LucideIcon,
} from "lucide-react"

import { Button } from "@workspace/ui/components/button"
import { Separator } from "@workspace/ui/components/separator"

type ExtensionInstallPromptProps = {
  onInstallClick: () => void
  onRemindLater: () => void
}

type FeatureItem = {
  label: string
  icon: LucideIcon
}

const featureItems: FeatureItem[] = [
  {
    label: "Anlık İş İlanı Analizi",
    icon: Zap,
  },
  {
    label: "Otomatik Form Doldurma",
    icon: FileCheck2,
  },
  {
    label: "LinkedIn Veri Senkronizasyonu",
    icon: RefreshCcw,
  },
]

export function ExtensionInstallPrompt({
  onInstallClick,
  onRemindLater,
}: ExtensionInstallPromptProps): JSX.Element {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-background/70 p-4 backdrop-blur-sm">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="extension-install-title"
        aria-describedby="extension-install-description"
        className="grid max-h-[calc(100svh-2rem)] w-full max-w-[840px] overflow-hidden rounded-lg border border-border bg-card text-card-foreground shadow-xl md:grid-cols-[0.78fr_1.18fr]"
      >
        <div className="flex min-h-[220px] items-center justify-center bg-muted/40 p-8 md:min-h-[430px]">
          <div className="flex flex-col items-center gap-6">
            <div className="relative flex size-28 items-center justify-center rounded-lg border bg-background shadow-sm">
              <Puzzle className="size-12 text-primary" aria-hidden="true" />
              <div className="absolute -top-2 -right-2 flex size-7 items-center justify-center rounded-full border bg-primary text-primary-foreground shadow-sm">
                <Check className="size-4" aria-hidden="true" />
              </div>
            </div>

            <div className="flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1.5 text-xs font-medium">
              <Bot className="size-3.5 text-primary" aria-hidden="true" />
              AI Powered
            </div>
          </div>
        </div>

        <div className="flex flex-col justify-center gap-6 p-6 sm:p-8 md:p-10">
          <div className="flex flex-col gap-3">
            <h2
              id="extension-install-title"
              className="max-w-[420px] text-2xl font-semibold tracking-normal sm:text-3xl"
            >
              Analizleri Başlatmak İçin Eklentiyi Kurun
            </h2>
            <p
              id="extension-install-description"
              className="max-w-[430px] text-base leading-7 text-muted-foreground"
            >
              İş ilanlarını anlık olarak analiz etmek ve verilerinizi senkronize
              etmek için Kariyer Yardımcı Pilotu eklentisini tarayıcınıza
              ekleyin.
            </p>
          </div>

          <ul className="flex flex-col gap-3" aria-label="Eklenti özellikleri">
            {featureItems.map((item) => {
              const Icon = item.icon

              return (
                <li
                  key={item.label}
                  className="flex items-center gap-3 text-base"
                >
                  <Icon className="size-5 text-primary" aria-hidden="true" />
                  <span>{item.label}</span>
                </li>
              )
            })}
          </ul>

          <Separator />

          <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
            <Button
              type="button"
              size="lg"
              onClick={onInstallClick}
              className="h-auto min-h-12 px-5 text-base leading-5 whitespace-normal"
            >
              Eklentiyi Chrome'a Ekle
              <ExternalLink data-icon="inline-end" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="lg"
              onClick={onRemindLater}
              className="h-12 px-5 text-base"
            >
              Daha Sonra Hatırlat
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}
