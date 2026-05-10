// Module: Renders the saved user profile page after profile collection completes.
import {
  useEffect,
  useState,
  type DragEvent,
  type FormEvent,
  type JSX,
} from "react"
import {
  AlertCircle,
  BookOpen,
  BriefcaseBusiness,
  FileText,
  Info,
  Languages,
  Link,
  ListChecks,
  LogOut,
  Medal,
  Pencil,
  Plus,
  Sparkles,
  Upload,
  UserRound,
} from "lucide-react"

import { Button } from "@workspace/ui/components/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@workspace/ui/components/field"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import { Separator } from "@workspace/ui/components/separator"

import { AppSidebar } from "@/components/app-sidebar"
import { ThemeToggle } from "@/components/theme-toggle"
import type { AuthUser } from "@/lib/auth-api"
import {
  addProfileCertification,
  addProfileProject,
  getSavedProfile,
  updateProfile,
  uploadProfileCertificationDocument,
  type SavedProfileResponse,
} from "@/lib/profile-api"
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
  action?: JSX.Element
}

type ProfileFormState = {
  full_name: string
  location: string
  skills: string
  projects: string
  certifications: string
  languages: string
  work_experiences: string
  education: string
  additional_information: string
}

const emptyText = "Henüz eklenmedi"
const CERTIFICATE_MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024
const CERTIFICATE_ALLOWED_FILE_TYPES = [
  "application/pdf",
  "image/png",
  "image/jpeg",
] as const

function profileToForm(profile: ProfileData): ProfileFormState {
  return {
    full_name: profile.full_name ?? "",
    location: profile.location ?? "",
    skills: profile.skills.join("\n"),
    projects: profile.projects.join("\n"),
    certifications: profile.certifications.join("\n"),
    languages: profile.languages.join("\n"),
    work_experiences: profile.work_experiences.join("\n"),
    education: profile.education ?? "",
    additional_information: profile.additional_information ?? "",
  }
}

function formToProfile(form: ProfileFormState): ProfileData {
  const splitLines = (text: string): string[] =>
    text
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean)

  return {
    full_name: form.full_name.trim() || null,
    location: form.location.trim() || null,
    skills: splitLines(form.skills),
    projects: splitLines(form.projects),
    certifications: splitLines(form.certifications),
    languages: splitLines(form.languages),
    work_experiences: splitLines(form.work_experiences),
    education: form.education.trim() || null,
    additional_information: form.additional_information.trim() || null,
  }
}

export function ProfilePage({
  token,
  user,
  onLogout,
  onProfileChatRequested,
}: ProfilePageProps): JSX.Element {
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
      <AppSidebar token={token} />

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
              token={token}
            />
          ) : null}
        </div>
      </section>
    </main>
  )
}

function ProfileContent({
  profile: initialProfile,
  updatedAt: initialUpdatedAt,
  token,
}: {
  profile: ProfileData
  updatedAt: string
  token: string
}): JSX.Element {
  const [isEditing, setIsEditing] = useState(false)
  const [currentProfile, setCurrentProfile] = useState(initialProfile)
  const [currentUpdatedAt, setCurrentUpdatedAt] = useState(initialUpdatedAt)
  const [isProjectDialogOpen, setIsProjectDialogOpen] = useState(false)
  const [isCertificationDialogOpen, setIsCertificationDialogOpen] =
    useState(false)

  if (isEditing) {
    return (
      <ProfileEditForm
        profile={currentProfile}
        token={token}
        onSave={(saved) => {
          setCurrentProfile(saved.profile)
          setCurrentUpdatedAt(saved.updated_at)
          setIsEditing(false)
        }}
        onCancel={() => setIsEditing(false)}
      />
    )
  }

  return (
    <>
      <section className="rounded-lg border border-border bg-card p-4 md:p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="min-w-0">
            <p className="text-sm text-muted-foreground">Kaydedilen Profil</p>
            <h2 className="truncate text-2xl font-semibold">
              {currentProfile.full_name ?? emptyText}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {currentProfile.location ?? emptyText}
            </p>
          </div>

          <div className="flex shrink-0 flex-col gap-2 md:items-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsEditing(true)}
            >
              <Pencil data-icon="inline-start" />
              Profili Güncelle
            </Button>
            <p className="text-xs text-muted-foreground">
              Son güncelleme: {formatDate(currentUpdatedAt)}
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <ProfileSection title="Yetenekler" icon={ListChecks}>
          <TagList values={currentProfile.skills} />
        </ProfileSection>

        <ProfileSection title="Eğitim" icon={BookOpen}>
          <TextValue value={currentProfile.education} />
        </ProfileSection>

        <ProfileSection
          title="Projeler"
          icon={BriefcaseBusiness}
          action={
            <Button
              type="button"
              size="sm"
              onClick={() => setIsProjectDialogOpen(true)}
            >
              <Plus data-icon="inline-start" />
              Ekle
            </Button>
          }
        >
          <BulletList values={currentProfile.projects} />
        </ProfileSection>

        <ProfileSection title="İş Deneyimleri" icon={BriefcaseBusiness}>
          <BulletList values={currentProfile.work_experiences} />
        </ProfileSection>

        <ProfileSection
          title="Sertifikalar"
          icon={Medal}
          action={
            <Button
              type="button"
              size="sm"
              onClick={() => setIsCertificationDialogOpen(true)}
            >
              <Plus data-icon="inline-start" />
              Ekle
            </Button>
          }
        >
          <BulletList values={currentProfile.certifications} />
        </ProfileSection>

        <ProfileSection title="Diller" icon={Languages}>
          <TagList values={currentProfile.languages} />
        </ProfileSection>
      </section>

      <ProfileSection title="Ek Bilgiler" icon={UserRound}>
        <TextValue value={currentProfile.additional_information} />
      </ProfileSection>

      <AddProjectDialog
        open={isProjectDialogOpen}
        token={token}
        onOpenChange={setIsProjectDialogOpen}
        onSaved={(saved) => {
          setCurrentProfile(saved.profile)
          setCurrentUpdatedAt(saved.updated_at)
        }}
      />

      <AddCertificationDialog
        open={isCertificationDialogOpen}
        token={token}
        onOpenChange={setIsCertificationDialogOpen}
        onSaved={(saved) => {
          setCurrentProfile(saved.profile)
          setCurrentUpdatedAt(saved.updated_at)
        }}
      />
    </>
  )
}

function AddProjectDialog({
  open,
  token,
  onOpenChange,
  onSaved,
}: {
  open: boolean
  token: string
  onOpenChange: (open: boolean) => void
  onSaved: (saved: SavedProfileResponse) => void
}): JSX.Element {
  const [projectUrl, setProjectUrl] = useState("")
  const [projectError, setProjectError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  function resetForm(): void {
    setProjectUrl("")
    setProjectError(null)
    setIsSaving(false)
  }

  function handleOpenChange(nextOpen: boolean): void {
    if (!nextOpen) {
      resetForm()
    }

    onOpenChange(nextOpen)
  }

  function validateProjectUrl(): string | null {
    const trimmedUrl = projectUrl.trim()

    if (trimmedUrl.length === 0) {
      return "Proje bağlantısı zorunludur."
    }

    try {
      const parsedUrl = new URL(trimmedUrl)

      if (!["http:", "https:"].includes(parsedUrl.protocol)) {
        return "Proje bağlantısı http veya https ile başlamalıdır."
      }
    } catch {
      return "Geçerli bir proje bağlantısı girin."
    }

    return null
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const validationError = validateProjectUrl()
    if (validationError !== null) {
      setProjectError(validationError)
      return
    }

    setIsSaving(true)
    setProjectError(null)

    try {
      const saved = await addProfileProject(token, {
        url: projectUrl.trim(),
      })

      onSaved(saved)
      handleOpenChange(false)
    } catch (error) {
      setProjectError(
        error instanceof Error ? error.message : "Proje eklenemedi."
      )
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="p-0 sm:max-w-lg">
        <form onSubmit={handleSubmit}>
          <div className="flex flex-col gap-6 p-5">
            <DialogHeader className="pr-8">
              <DialogTitle>Yeni Proje Ekle</DialogTitle>
              <DialogDescription className="leading-6">
                GitHub, portfolyo veya canlı proje bağlantınızı buraya ekleyerek
                profilinizi güçlendirin. Yapay zeka, bağlantıdaki içeriği analiz
                ederek projenizi otomatik olarak detaylandıracaktır.
              </DialogDescription>
            </DialogHeader>

            <FieldGroup>
              <Field data-invalid={projectError !== null}>
                <FieldLabel htmlFor="project-url">Proje Bağlantısı</FieldLabel>
                <div className="relative">
                  <Link className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="project-url"
                    value={projectUrl}
                    onChange={(event) => {
                      setProjectUrl(event.target.value)
                      setProjectError(null)
                    }}
                    placeholder="https://github.com/kullanici/proje"
                    className="pl-8"
                    aria-invalid={projectError !== null}
                    disabled={isSaving}
                  />
                </div>
                <FieldDescription className="flex items-start gap-1.5 text-xs">
                  <Info className="mt-0.5 size-3.5 shrink-0" />
                  Desteklenen platformlar: GitHub, GitLab, Behance ve ideal
                  portfolyo adresleri.
                </FieldDescription>
                <FieldError>{projectError}</FieldError>
              </Field>
            </FieldGroup>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => handleOpenChange(false)}
              disabled={isSaving}
            >
              İptal
            </Button>
            <Button type="submit" disabled={isSaving}>
              <Sparkles data-icon="inline-start" />
              {isSaving ? "Ekleniyor..." : "Ekle ve Analiz Et"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function AddCertificationDialog({
  open,
  token,
  onOpenChange,
  onSaved,
}: {
  open: boolean
  token: string
  onOpenChange: (open: boolean) => void
  onSaved: (saved: SavedProfileResponse) => void
}): JSX.Element {
  const [certificateUrl, setCertificateUrl] = useState("")
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [certificateError, setCertificateError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  function resetForm(): void {
    setCertificateUrl("")
    setSelectedFile(null)
    setCertificateError(null)
    setIsSaving(false)
  }

  function handleOpenChange(nextOpen: boolean): void {
    if (!nextOpen) {
      resetForm()
    }

    onOpenChange(nextOpen)
  }

  function validateCertificateUrl(): string | null {
    const trimmedUrl = certificateUrl.trim()

    if (trimmedUrl.length === 0) {
      return "Sertifika bağlantısı zorunludur."
    }

    try {
      const parsedUrl = new URL(trimmedUrl)

      if (!["http:", "https:"].includes(parsedUrl.protocol)) {
        return "Sertifika bağlantısı http veya https ile başlamalıdır."
      }
    } catch {
      return "Geçerli bir sertifika bağlantısı girin."
    }

    return null
  }

  function validateCertificateFile(file: File): string | null {
    if (
      !CERTIFICATE_ALLOWED_FILE_TYPES.includes(
        file.type as (typeof CERTIFICATE_ALLOWED_FILE_TYPES)[number]
      )
    ) {
      return "Yalnızca PDF, PNG veya JPG dosyaları yüklenebilir."
    }

    if (file.size > CERTIFICATE_MAX_FILE_SIZE_BYTES) {
      return "Dosya boyutu en fazla 10MB olabilir."
    }

    return null
  }

  function handleFileSelected(file: File | null): void {
    if (file === null) {
      return
    }

    const validationError = validateCertificateFile(file)
    if (validationError !== null) {
      setSelectedFile(null)
      setCertificateError(validationError)
      return
    }

    setSelectedFile(file)
    setCertificateError(null)
  }

  function handleDrop(event: DragEvent<HTMLLabelElement>): void {
    event.preventDefault()
    handleFileSelected(event.dataTransfer.files.item(0))
  }

  async function handleLinkSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const validationError = validateCertificateUrl()
    if (validationError !== null) {
      setCertificateError(validationError)
      return
    }

    setIsSaving(true)
    setCertificateError(null)

    try {
      const saved = await addProfileCertification(token, {
        url: certificateUrl.trim(),
      })

      onSaved(saved)
      handleOpenChange(false)
    } catch (error) {
      setCertificateError(
        error instanceof Error ? error.message : "Sertifika eklenemedi."
      )
      setIsSaving(false)
    }
  }

  async function handleUploadSubmit() {
    if (selectedFile === null) {
      setCertificateError("Yüklemek için bir belge seçin.")
      return
    }

    setIsSaving(true)
    setCertificateError(null)

    try {
      const saved = await uploadProfileCertificationDocument(token, {
        document: selectedFile,
      })

      onSaved(saved)
      handleOpenChange(false)
    } catch (error) {
      setCertificateError(
        error instanceof Error ? error.message : "Belge yüklenemedi."
      )
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="p-0 sm:max-w-xl">
        <div className="flex flex-col gap-5 p-5">
          <DialogHeader className="pr-8">
            <DialogTitle>Yeni Belge Yükle</DialogTitle>
            <DialogDescription>
              Sertifika veya belgelerinizi bağlantı ya da dosya olarak
              profilinize ekleyin.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleLinkSubmit}>
            <FieldGroup>
              <Field data-invalid={certificateError !== null}>
                <div className="flex gap-2">
                  <div className="relative min-w-0 flex-1">
                    <Link className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      value={certificateUrl}
                      onChange={(event) => {
                        setCertificateUrl(event.target.value)
                        setCertificateError(null)
                      }}
                      placeholder="Bağlantı yapıştırın (URL)"
                      className="pl-8"
                      aria-label="Sertifika bağlantısı"
                      aria-invalid={certificateError !== null}
                      disabled={isSaving}
                    />
                  </div>
                  <Button
                    type="submit"
                    className="bg-foreground text-background hover:bg-foreground/90"
                    disabled={isSaving}
                  >
                    <Link data-icon="inline-start" />
                    Ekle
                  </Button>
                </div>
                <FieldDescription className="flex items-start gap-1.5 text-xs">
                  <Info className="mt-0.5 size-3.5 shrink-0" />
                  Sertifika veya belgelerinizin genel erişime açık bir
                  bağlantısını ekleyebilirsiniz.
                </FieldDescription>
                <FieldError>{certificateError}</FieldError>
              </Field>

              <FieldSeparator />

              <Field>
                <FieldLabel
                  htmlFor="certificate-document"
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={handleDrop}
                  className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-background px-4 py-8 text-center transition-colors hover:bg-muted/50"
                >
                  <span className="flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
                    {selectedFile ? <FileText /> : <Upload />}
                  </span>
                  <span className="font-medium">
                    {selectedFile
                      ? selectedFile.name
                      : "Dosya seçin veya sürükleyip bırakın"}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    PDF, PNG, JPG (Maks. 10MB)
                  </span>
                </FieldLabel>
                <Input
                  id="certificate-document"
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg"
                  className="sr-only"
                  onChange={(event) =>
                    handleFileSelected(event.target.files?.item(0) ?? null)
                  }
                  disabled={isSaving}
                />
              </Field>
            </FieldGroup>
          </form>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="ghost"
            onClick={() => handleOpenChange(false)}
            disabled={isSaving}
          >
            İptal
          </Button>
          <Button
            type="button"
            onClick={handleUploadSubmit}
            disabled={isSaving || selectedFile === null}
          >
            <Upload data-icon="inline-start" />
            {isSaving ? "Yükleniyor..." : "Belgeyi Yükle"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function ProfileEditForm({
  profile,
  token,
  onSave,
  onCancel,
}: {
  profile: ProfileData
  token: string
  onSave: (saved: SavedProfileResponse) => void
  onCancel: () => void
}): JSX.Element {
  const [form, setForm] = useState<ProfileFormState>(() =>
    profileToForm(profile)
  )
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  function handleChange(field: keyof ProfileFormState, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setIsSaving(true)
    setSaveError(null)

    try {
      const saved = await updateProfile(token, formToProfile(form))
      onSave(saved)
    } catch (error) {
      setSaveError(
        error instanceof Error ? error.message : "Profil kaydedilemedi."
      )
      setIsSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <section className="rounded-lg border border-border bg-card p-4 md:p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="flex min-w-0 flex-1 flex-col gap-3">
            <p className="text-sm text-muted-foreground">Profil Düzenleniyor</p>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="full_name">Ad Soyad</Label>
              <Input
                id="full_name"
                value={form.full_name}
                onChange={(e) => handleChange("full_name", e.target.value)}
                placeholder="Ad Soyad"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="location">Konum</Label>
              <Input
                id="location"
                value={form.location}
                onChange={(e) => handleChange("location", e.target.value)}
                placeholder="Konum"
              />
            </div>
          </div>

          <div className="flex shrink-0 flex-col gap-2 pt-6 md:items-end">
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isSaving}
              >
                İptal
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? "Kaydediliyor..." : "Kaydet"}
              </Button>
            </div>
          </div>
        </div>

        {saveError ? (
          <div className="mt-3 flex items-center gap-2 text-sm text-destructive">
            <AlertCircle className="size-4 shrink-0" />
            {saveError}
          </div>
        ) : null}
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <ProfileSection title="Yetenekler" icon={ListChecks}>
          <FormTextArea
            id="skills"
            value={form.skills}
            onChange={(v) => handleChange("skills", v)}
            placeholder="Her satıra bir yetenek yazın"
          />
        </ProfileSection>

        <ProfileSection title="Eğitim" icon={BookOpen}>
          <FormTextArea
            id="education"
            value={form.education}
            onChange={(v) => handleChange("education", v)}
            placeholder="Eğitim bilgilerinizi yazın"
          />
        </ProfileSection>

        <ProfileSection title="Projeler" icon={BriefcaseBusiness}>
          <FormTextArea
            id="projects"
            value={form.projects}
            onChange={(v) => handleChange("projects", v)}
            placeholder="Her satıra bir proje yazın"
          />
        </ProfileSection>

        <ProfileSection title="İş Deneyimleri" icon={BriefcaseBusiness}>
          <FormTextArea
            id="work_experiences"
            value={form.work_experiences}
            onChange={(v) => handleChange("work_experiences", v)}
            placeholder="Her satıra bir iş deneyimi yazın"
          />
        </ProfileSection>

        <ProfileSection title="Sertifikalar" icon={Medal}>
          <FormTextArea
            id="certifications"
            value={form.certifications}
            onChange={(v) => handleChange("certifications", v)}
            placeholder="Her satıra bir sertifika yazın"
          />
        </ProfileSection>

        <ProfileSection title="Diller" icon={Languages}>
          <FormTextArea
            id="languages"
            value={form.languages}
            onChange={(v) => handleChange("languages", v)}
            placeholder="Her satıra bir dil yazın"
          />
        </ProfileSection>
      </section>

      <ProfileSection title="Ek Bilgiler" icon={UserRound}>
        <FormTextArea
          id="additional_information"
          value={form.additional_information}
          onChange={(v) => handleChange("additional_information", v)}
          placeholder="Ek bilgilerinizi yazın"
        />
      </ProfileSection>
    </form>
  )
}

function FormTextArea({
  id,
  value,
  onChange,
  placeholder,
}: {
  id: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
}): JSX.Element {
  return (
    <textarea
      id={id}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={4}
      className="w-full resize-y rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
    />
  )
}

function ProfileSection({
  title,
  icon: Icon,
  children,
  action,
}: ProfileSectionProps): JSX.Element {
  return (
    <section className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <Icon className="size-4 shrink-0 text-muted-foreground" />
          <h3 className="truncate font-semibold">{title}</h3>
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
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
