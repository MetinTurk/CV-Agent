// Module: Renders the login and registration forms for JWT authentication.
import { useState, type FormEvent, type JSX } from "react"
import {
  ArrowRight,
  Eye,
  EyeOff,
} from "lucide-react"

import { Button } from "@workspace/ui/components/button"
import { Checkbox } from "@workspace/ui/components/checkbox"
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@workspace/ui/components/field"
import { Input } from "@workspace/ui/components/input"
import { cn } from "@workspace/ui/lib/utils"
import { ThemeToggle } from "@/components/theme-toggle"
import {
  login,
  register,
  type AuthResponse,
  type LoginPayload,
  type RegisterPayload,
} from "@/lib/auth-api"
import type { TokenPersistence } from "@/lib/auth-token"

type AuthMode = "login" | "register"

type AuthPageProps = {
  onAuthenticated: (
    response: AuthResponse,
    persistence: TokenPersistence
  ) => void
}

type TextInputProps = {
  id: string
  label: string
  type?: "email" | "password" | "text"
  value: string
  placeholder: string
  autoComplete: string
  disabled: boolean
  action?: JSX.Element
  onChange: (value: string) => void
}

function TextInput({
  id,
  label,
  type = "text",
  value,
  placeholder,
  autoComplete,
  disabled,
  action,
  onChange,
}: TextInputProps): JSX.Element {
  return (
    <Field>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      {action ? (
        <div className="relative">
          <Input
            id={id}
            type={type}
            value={value}
            placeholder={placeholder}
            autoComplete={autoComplete}
            disabled={disabled}
            onChange={(event) => onChange(event.target.value)}
            className="h-11 pr-11"
          />
          {action}
        </div>
      ) : (
        <Input
          id={id}
          type={type}
          value={value}
          placeholder={placeholder}
          autoComplete={autoComplete}
          disabled={disabled}
          onChange={(event) => onChange(event.target.value)}
          className="h-11"
        />
      )}
    </Field>
  )
}

export function AuthPage({ onAuthenticated }: AuthPageProps): JSX.Element {
  const [mode, setMode] = useState<AuthMode>("login")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [passwordRepeat, setPasswordRepeat] = useState("")
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [rememberMe, setRememberMe] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const [showPasswordRepeat, setShowPasswordRepeat] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const isLoginMode = mode === "login"
  const title = isLoginMode ? "Giriş Yap" : "Kayıt Ol"
  const subtitle = isLoginMode
    ? "CV Agent’a hoş geldiniz. Lütfen hesap bilgilerinizi girin."
    : "Kariyer yolculuğunuzda yapay zeka destekli rehberinizle tanışın."

  const submitLabel = isLoginMode ? "Giriş Yap" : "Kayıt Ol"

  const resetMessages = (): void => {
    setErrorMessage(null)
  }

  const switchMode = (nextMode: AuthMode): void => {
    setMode(nextMode)
    resetMessages()
  }

  const submitLogin = async (): Promise<void> => {
    const payload: LoginPayload = {
      email,
      password,
    }
    const response = await login(payload)
    onAuthenticated(response, rememberMe ? "local" : "session")
  }

  const submitRegister = async (): Promise<void> => {
    if (password !== passwordRepeat) {
      setErrorMessage("Şifreler eşleşmiyor.")
      return
    }

    const payload: RegisterPayload = {
      first_name: firstName,
      last_name: lastName,
      email,
      password,
    }
    const response = await register(payload)
    onAuthenticated(response, "local")
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault()
    setIsSubmitting(true)
    resetMessages()

    try {
      if (isLoginMode) {
        await submitLogin()
        return
      }

      await submitRegister()
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "İstek tamamlanamadı."
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderPasswordAction = (
    visible: boolean,
    onClick: () => void
  ): JSX.Element => {
    const Icon = visible ? EyeOff : Eye

    return (
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        aria-label={visible ? "Şifreyi gizle" : "Şifreyi göster"}
        disabled={isSubmitting}
        onClick={onClick}
        className="absolute top-1/2 right-1 -translate-y-1/2"
      >
        <Icon />
      </Button>
    )
  }

  return (
    <main className="bg-muted/30 flex min-h-svh flex-col">
      <header className="border-border bg-background flex h-16 items-center justify-between border-b px-5">
        <div className="text-xl font-semibold">CV Agent</div>
        <ThemeToggle />
      </header>

      <section className="flex flex-1 items-center justify-center px-5 py-10">
        <form
          onSubmit={handleSubmit}
          className="border-border bg-card text-card-foreground flex w-full max-w-[460px] flex-col gap-5 rounded-lg border p-8 shadow-sm"
        >
          <div className={cn("flex flex-col gap-2", isLoginMode && "text-center")}>
            <h1 className="text-3xl font-semibold tracking-normal">{title}</h1>
            <p className="text-muted-foreground text-base leading-6">{subtitle}</p>
          </div>

          <FieldGroup>
            {!isLoginMode ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <TextInput
                  id="first-name"
                  label="Ad"
                  value={firstName}
                  placeholder="Adınız"
                  autoComplete="given-name"
                  disabled={isSubmitting}
                  onChange={setFirstName}
                />
                <TextInput
                  id="last-name"
                  label="Soyad"
                  value={lastName}
                  placeholder="Soyadınız"
                  autoComplete="family-name"
                  disabled={isSubmitting}
                  onChange={setLastName}
                />
              </div>
            ) : null}

            <TextInput
              id="email"
              label={isLoginMode ? "E-posta Adresi" : "E-posta"}
              type="email"
              value={email}
              placeholder={isLoginMode ? "örnek@şirket.com" : "örnek@eposta.com"}
              autoComplete="email"
              disabled={isSubmitting}
              onChange={setEmail}
            />

            <TextInput
              id="password"
              label="Şifre"
              type={showPassword ? "text" : "password"}
              value={password}
              placeholder="••••••••"
              autoComplete={isLoginMode ? "current-password" : "new-password"}
              disabled={isSubmitting}
              action={renderPasswordAction(showPassword, () =>
                setShowPassword((currentValue) => !currentValue)
              )}
              onChange={setPassword}
            />

            {!isLoginMode ? (
              <TextInput
                id="password-repeat"
                label="Şifre Tekrar"
                type={showPasswordRepeat ? "text" : "password"}
                value={passwordRepeat}
                placeholder="••••••••"
                autoComplete="new-password"
                disabled={isSubmitting}
                action={renderPasswordAction(showPasswordRepeat, () =>
                  setShowPasswordRepeat((currentValue) => !currentValue)
                )}
                onChange={setPasswordRepeat}
              />
            ) : null}
          </FieldGroup>

          {isLoginMode ? (
            <Field orientation="horizontal">
              <Checkbox
                id="remember-me"
                checked={rememberMe}
                disabled={isSubmitting}
                onCheckedChange={(checked) => setRememberMe(checked === true)}
              />
              <FieldLabel htmlFor="remember-me">Beni Hatırla</FieldLabel>
            </Field>
          ) : null}

          {errorMessage ? (
            <FieldError className="whitespace-pre-line rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2">
              {errorMessage}
            </FieldError>
          ) : null}

          <Button type="submit" size="lg" disabled={isSubmitting} className="h-11">
            {isSubmitting ? "İşleniyor..." : submitLabel}
            <ArrowRight data-icon="inline-end" />
          </Button>

          <p className="text-muted-foreground text-center text-sm">
            {isLoginMode ? "Hesabınız yok mu?" : "Zaten hesabınız var mı?"}{" "}
            <Button
              type="button"
              variant="link"
              className="h-auto p-0 font-semibold"
              disabled={isSubmitting}
              onClick={() => switchMode(isLoginMode ? "register" : "login")}
            >
              {isLoginMode ? "Kayıt Ol" : "Giriş Yap"}
            </Button>
          </p>
        </form>
      </section>
    </main>
  )
}
