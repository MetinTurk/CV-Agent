// Module: Renders the job analysis result page (yeterli/eksik yönler, uyumluluk puanı, tavsiyeler).
import type { JSX } from "react"
import { useLocation, useNavigate } from "react-router"
import {
  ArrowLeft,
  Briefcase,
  CheckCircle2,
  Lightbulb,
  MapPin,
  ShieldAlert,
  Sparkles,
  Target,
} from "lucide-react"

import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { cn } from "@workspace/ui/lib/utils"

import { AppSidebar } from "@/components/app-sidebar"
import type { JobAnalysisResponse } from "@/lib/job-analysis-api"

type JobAnalysisLocationState = {
  analysis?: JobAnalysisResponse
  token?: string
}

export function JobAnalysisPage(): JSX.Element {
  const navigate = useNavigate()
  const location = useLocation()
  const state = (location.state ?? null) as JobAnalysisLocationState | null
  const analysis = state?.analysis ?? null
  const token = state?.token

  if (analysis === null) {
    return (
      <div className="flex min-h-svh bg-muted/20">
        <AppSidebar token={token} />
        <main className="flex flex-1 items-center justify-center p-6">
          <Card className="max-w-md text-center">
            <CardHeader>
              <CardTitle>Henüz bir analiz yok</CardTitle>
            </CardHeader>
            <CardContent className="gap-4">
              <p className="text-sm text-muted-foreground">
                Analiz sonucunu görmek için kenar çubuğundan "Yeni Analiz Başlat"
                seçeneğini kullanarak bir iş ilanı bağlantısı analiz edin.
              </p>
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate(-1)}
              >
                <ArrowLeft data-icon="inline-start" />
                Geri dön
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    )
  }

  const { job_description: jobDescription, match_analysis: matchAnalysis } =
    analysis

  return (
    <div className="flex min-h-svh bg-muted/20">
      <AppSidebar token={token} />

      <main className="flex flex-1 flex-col gap-6 px-4 py-6 md:px-8">
        <Card className="gap-4">
          <CardHeader className="gap-2">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2">
                <Briefcase className="size-5 text-primary" />
                <CardTitle className="text-2xl">
                  {jobDescription.title ?? "İş İlanı Analizi"}
                </CardTitle>
              </div>
              <Badge variant="secondary" className="rounded-full">
                <Sparkles data-icon="inline-start" />
                Yapay Zeka Analizi
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              <a
                href={analysis.url}
                target="_blank"
                rel="noopener noreferrer"
                className="underline-offset-4 hover:underline"
              >
                {analysis.url}
              </a>
            </p>
          </CardHeader>
          <CardContent className="gap-3">
            <JobMetaRow jobDescription={jobDescription} />
            {jobDescription.summary !== null ? (
              <p className="rounded-md border border-border bg-muted/40 p-3 text-sm leading-6 text-foreground">
                {jobDescription.summary}
              </p>
            ) : null}
            {jobDescription.skills.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {jobDescription.skills.map((skill) => (
                  <Badge
                    key={skill}
                    variant="outline"
                    className="px-2.5 py-1 text-xs"
                  >
                    {skill}
                  </Badge>
                ))}
              </div>
            ) : null}
          </CardContent>
        </Card>

        {matchAnalysis === null ? (
          <Card>
            <CardContent className="flex items-start gap-3 py-6">
              <ShieldAlert className="mt-0.5 size-5 text-amber-500" />
              <div className="text-sm text-muted-foreground">
                Profiliniz ile bu iş ilanı arasında uyum analizi şu anda
                üretilemedi. Lütfen profilinizi tamamladığınızdan emin olun ve
                tekrar deneyin.
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            <CompatibilityScoreCard score={matchAnalysis.genel_uyumluluk_puani} />

            <div className="grid gap-6 lg:grid-cols-2">
              <ListCard
                title="Yeterli Yönler"
                description="Profilinizin iş ilanıyla örtüşen güçlü tarafları."
                icon={
                  <CheckCircle2 className="size-5 text-emerald-500" />
                }
                accentClassName="border-emerald-200 bg-emerald-50/60 dark:border-emerald-300/40 dark:bg-emerald-300/10"
                items={matchAnalysis.yeterli_yonler}
                emptyText="Profilinizden öne çıkan eşleşen bir yön bulunamadı."
              />
              <ListCard
                title="Eksik Yönler"
                description="İlanın istediği ancak profilinizde belirgin olmayan alanlar."
                icon={<ShieldAlert className="size-5 text-rose-500" />}
                accentClassName="border-rose-200 bg-rose-50/60 dark:border-rose-300/40 dark:bg-rose-300/10"
                items={matchAnalysis.eksik_yonler}
                emptyText="Belirgin bir eksik yön tespit edilmedi."
              />
            </div>

            <ListCard
              title="Tavsiyeler"
              description="Bu pozisyona daha uygun hale gelmek için somut adımlar."
              icon={<Lightbulb className="size-5 text-amber-500" />}
              accentClassName="border-amber-200 bg-amber-50/60 dark:border-amber-300/40 dark:bg-amber-300/10"
              items={matchAnalysis.tavsiyeler}
              emptyText="Henüz somut bir tavsiye üretilmedi."
            />
          </>
        )}

        {jobDescription.requirements.length > 0 ||
        jobDescription.responsibilities.length > 0 ? (
          <div className="grid gap-6 lg:grid-cols-2">
            {jobDescription.requirements.length > 0 ? (
              <ListCard
                title="Aranan Nitelikler"
                description="İlanda belirtilen gereksinimler."
                icon={<Target className="size-5 text-primary" />}
                items={jobDescription.requirements}
                emptyText="Gereksinim listelenmedi."
              />
            ) : null}
            {jobDescription.responsibilities.length > 0 ? (
              <ListCard
                title="Sorumluluklar"
                description="Pozisyonun günlük sorumlulukları."
                icon={<Briefcase className="size-5 text-primary" />}
                items={jobDescription.responsibilities}
                emptyText="Sorumluluk listelenmedi."
              />
            ) : null}
          </div>
        ) : null}
      </main>
    </div>
  )
}

type JobMetaRowProps = {
  jobDescription: JobAnalysisResponse["job_description"]
}

function JobMetaRow({ jobDescription }: JobMetaRowProps): JSX.Element | null {
  const items: { label: string; icon: JSX.Element }[] = []

  if (jobDescription.company !== null) {
    items.push({
      label: jobDescription.company,
      icon: <Briefcase className="size-3.5" />,
    })
  }
  if (jobDescription.location !== null) {
    items.push({
      label: jobDescription.location,
      icon: <MapPin className="size-3.5" />,
    })
  }
  if (jobDescription.employment_type !== null) {
    items.push({
      label: jobDescription.employment_type,
      icon: <Sparkles className="size-3.5" />,
    })
  }

  if (items.length === 0) return null

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
      {items.map((item, index) => (
        <span
          key={`${item.label}-${index}`}
          className="inline-flex items-center gap-1.5"
        >
          {item.icon}
          {item.label}
        </span>
      ))}
    </div>
  )
}

type CompatibilityScoreCardProps = {
  score: number
}

function CompatibilityScoreCard({
  score,
}: CompatibilityScoreCardProps): JSX.Element {
  const tone = scoreTone(score)

  return (
    <Card>
      <CardHeader className="gap-1">
        <CardTitle className="text-lg">Genel Uyumluluk Puanı</CardTitle>
        <p className="text-xs text-muted-foreground">
          Profilinizin iş ilanıyla 0-100 arası genel uyum yüzdesi.
        </p>
      </CardHeader>
      <CardContent className="gap-4">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p
              className={cn(
                "text-5xl font-semibold tracking-tight",
                tone.textClassName
              )}
            >
              {score}
              <span className="text-2xl text-muted-foreground">/100</span>
            </p>
            <p className={cn("mt-1 text-sm font-medium", tone.textClassName)}>
              {tone.label}
            </p>
          </div>
        </div>
        <div
          className="h-2.5 w-full overflow-hidden rounded-full bg-muted"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={score}
          aria-label="Uyumluluk puanı"
        >
          <div
            className={cn("h-full rounded-full transition-all", tone.barClassName)}
            style={{ width: `${Math.max(0, Math.min(100, score))}%` }}
          />
        </div>
      </CardContent>
    </Card>
  )
}

type ScoreTone = {
  label: string
  textClassName: string
  barClassName: string
}

function scoreTone(score: number): ScoreTone {
  if (score >= 75) {
    return {
      label: "Yüksek uyum",
      textClassName: "text-emerald-600 dark:text-emerald-400",
      barClassName: "bg-emerald-500",
    }
  }
  if (score >= 50) {
    return {
      label: "Orta uyum",
      textClassName: "text-amber-600 dark:text-amber-400",
      barClassName: "bg-amber-500",
    }
  }
  return {
    label: "Düşük uyum",
    textClassName: "text-rose-600 dark:text-rose-400",
    barClassName: "bg-rose-500",
  }
}

type ListCardProps = {
  title: string
  description?: string
  icon: JSX.Element
  items: string[]
  emptyText: string
  accentClassName?: string
}

function ListCard({
  title,
  description,
  icon,
  items,
  emptyText,
  accentClassName,
}: ListCardProps): JSX.Element {
  return (
    <Card className={cn(accentClassName)}>
      <CardHeader className="gap-1">
        <div className="flex items-center gap-2">
          {icon}
          <CardTitle className="text-lg">{title}</CardTitle>
        </div>
        {description !== undefined ? (
          <p className="text-xs text-muted-foreground">{description}</p>
        ) : null}
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">{emptyText}</p>
        ) : (
          <ul className="space-y-2 text-sm leading-6">
            {items.map((item, index) => (
              <li key={`${index}-${item.slice(0, 24)}`} className="flex gap-2">
                <span aria-hidden="true" className="mt-2 size-1.5 shrink-0 rounded-full bg-foreground/60" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
