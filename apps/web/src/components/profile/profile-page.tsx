// Module: Renders the saved user profile page after profile collection completes.
import { useEffect, useState, type JSX } from "react"
import {
  AlertCircle,
  BookOpen,
  BriefcaseBusiness,
  Languages,
  ListChecks,
  LogOut,
  Medal,
  Pencil,
  UserRound,
} from "lucide-react"

import { Button } from "@workspace/ui/components/button"
import { Separator } from "@workspace/ui/components/separator"

import { AppSidebar } from "@/components/app-sidebar"
import { ThemeToggle } from "@/components/theme-toggle"
import type { AuthUser } from "@/lib/auth-api"
import { getSavedProfile, type SavedProfileResponse } from "@/lib/profile-api"
import type { ProfileData } from "@/lib/profile-chat-api"

type ProfilePageProps = {
  token: string
  user: AuthUser
  onLogout: () => void
  onProfileChatRequested: () => void
}

type ProfileLoadState =
  | { status: "loading" }
  | { status: "loaded"; profile: ProfileData; updatedAt: string }
  | { status: "error"; message: string }

type ProfileSectionProps = {
  title: string
  icon: typeof UserRound
  children: JSX.Element
}

const emptyText = "Henüz eklenmedi"

export function ProfilePage({
  token,
  user,
  onLogout,
  onProfileChatRequested,
}: ProfilePageProps): JSX.Element {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [profileState, setProfileState] = useState<ProfileLoadState>({
    status: "loading",
  })

  useEffect(() => {
    let isActive = true

    getSavedProfile(token)
      .then((response: SavedProfileResponse) => {
        if (isActive) {
          setProfileState({
            status: "loaded",
            profile: response.profile,
            updatedAt: response.updated_at,
          })
        }
      })
      .catch((error: unknown) => {
        if (isActive) {
          setProfileState({
            status: "error",
            message:
              error instanceof Error
                ? error.message
                : "Profil bilgisi alınamadı.",
          })
        }
      })

    return () => {
      isActive = false
    }
  }, [token])

  return (
    <main className="flex min-h-svh bg-background">
      <AppSidebar
        isOpen={isSidebarOpen}
        onToggle={() => setIsSidebarOpen((currentValue) => !currentValue)}
      />

      <section className="min-w-0 flex-1 bg-muted/30">
        <header className="flex min-h-16 items-center justify-between gap-3 border-b border-border bg-background px-4 py-3 md:px-6">
          <div className="min-w-0">
            <p className="truncate text-sm text-muted-foreground">
              {user.first_name} {user.last_name}
            </p>
            <h1 className="truncate text-xl font-semibold">Profilim</h1>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <ThemeToggle />
            <Button type="button" variant="outline" onClick={onLogout}>
              <LogOut data-icon="inline-start" />
              Çıkış Yap
            </Button>
          </div>
        </header>

        <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 p-4 md:p-6">
          {profileState.status === "loading" ? (
            <div className="rounded-lg border border-border bg-card px-4 py-3 text-sm text-muted-foreground">
              Profil bilgileri yükleniyor...
            </div>
          ) : null}

          {profileState.status === "error" ? (
            <div className="flex flex-col gap-3 rounded-lg border border-destructive/30 bg-card p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="mt-0.5 size-5 text-destructive" />
                <div className="min-w-0">
                  <h2 className="font-semibold">Profil bulunamadı</h2>
                  <p className="text-sm leading-6 text-muted-foreground">
                    {profileState.message}
                  </p>
                </div>
              </div>
              <div>
                <Button type="button" onClick={onProfileChatRequested}>
                  <Pencil data-icon="inline-start" />
                  Profil Oluştur
                </Button>
              </div>
            </div>
          ) : null}

          {profileState.status === "loaded" ? (
            <ProfileContent
              profile={profileState.profile}
              updatedAt={profileState.updatedAt}
              onProfileChatRequested={onProfileChatRequested}
            />
          ) : null}
        </div>
      </section>
    </main>
  )
}

function ProfileContent({
  profile,
  updatedAt,
  onProfileChatRequested,
}: {
  profile: ProfileData
  updatedAt: string
  onProfileChatRequested: () => void
}): JSX.Element {
  return (
    <>
      <section className="rounded-lg border border-border bg-card p-4 md:p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="min-w-0">
            <p className="text-sm text-muted-foreground">Kaydedilen Profil</p>
            <h2 className="truncate text-2xl font-semibold">
              {profile.full_name ?? emptyText}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {profile.location ?? emptyText}
            </p>
          </div>

          <div className="flex shrink-0 flex-col gap-2 md:items-end">
            <Button
              type="button"
              variant="outline"
              onClick={onProfileChatRequested}
            >
              <Pencil data-icon="inline-start" />
              Profili Güncelle
            </Button>
            <p className="text-xs text-muted-foreground">
              Son güncelleme: {formatDate(updatedAt)}
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <ProfileSection title="Yetenekler" icon={ListChecks}>
          <TagList values={profile.skills} />
        </ProfileSection>

        <ProfileSection title="Eğitim" icon={BookOpen}>
          <TextValue value={profile.education} />
        </ProfileSection>

        <ProfileSection title="Projeler" icon={BriefcaseBusiness}>
          <BulletList values={profile.projects} />
        </ProfileSection>

        <ProfileSection title="İş Deneyimleri" icon={BriefcaseBusiness}>
          <BulletList values={profile.work_experiences} />
        </ProfileSection>

        <ProfileSection title="Sertifikalar" icon={Medal}>
          <BulletList values={profile.certifications} />
        </ProfileSection>

        <ProfileSection title="Diller" icon={Languages}>
          <TagList values={profile.languages} />
        </ProfileSection>
      </section>

      <ProfileSection title="Ek Bilgiler" icon={UserRound}>
        <TextValue value={profile.additional_information} />
      </ProfileSection>
    </>
  )
}

function ProfileSection({
  title,
  icon: Icon,
  children,
}: ProfileSectionProps): JSX.Element {
  return (
    <section className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-center gap-2">
        <Icon className="size-4 text-muted-foreground" />
        <h3 className="font-semibold">{title}</h3>
      </div>
      <Separator className="my-3" />
      {children}
    </section>
  )
}

function TextValue({ value }: { value: string | null }): JSX.Element {
  return (
    <p className="text-sm leading-6 text-card-foreground">
      {value ?? emptyText}
    </p>
  )
}

function TagList({ values }: { values: string[] }): JSX.Element {
  if (values.length === 0) {
    return <p className="text-sm text-muted-foreground">{emptyText}</p>
  }

  return (
    <div className="flex flex-wrap gap-2">
      {values.map((value) => (
        <span
          key={value}
          className="rounded-md border border-border bg-background px-2.5 py-1 text-sm"
        >
          {value}
        </span>
      ))}
    </div>
  )
}

function BulletList({ values }: { values: string[] }): JSX.Element {
  if (values.length === 0) {
    return <p className="text-sm text-muted-foreground">{emptyText}</p>
  }

  return (
    <ul className="flex list-disc flex-col gap-2 pl-5 text-sm leading-6">
      {values.map((value) => (
        <li key={value}>{value}</li>
      ))}
    </ul>
  )
}

function formatDate(value: string): string {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat("tr-TR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date)
}
