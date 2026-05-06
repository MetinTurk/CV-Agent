// Module: Renders the first-login profile collection chatbot experience.
import {
  useRef,
  useState,
  type FormEvent,
  type JSX,
  type KeyboardEvent,
} from "react"
import {
  Bot,
  FileText,
  LinkIcon,
  LogOut,
  MessageSquareText,
  Send,
  UserRound,
} from "lucide-react"

import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { cn } from "@workspace/ui/lib/utils"

import { ThemeToggle } from "@/components/theme-toggle"
import {
  sendProfileChatDocument,
  sendProfileChatMessage,
  type ProfileChatResponse,
} from "@/lib/profile-chat-api"
import type { AuthUser } from "@/lib/auth-api"

type ChatRole = "assistant" | "user"
type SourceMode = "text" | "url" | "docx"

type ChatMessage = {
  id: string
  role: ChatRole
  content: string
}

type ProfileChatPageProps = {
  token: string
  user: AuthUser
  onLogout: () => void
}

const SESSION_ID = "first-login-profile"
const DEFAULT_URL_MESSAGE = "Bu linkteki profil bilgilerimi kullan."
const DEFAULT_DOCX_MESSAGE =
  "Yüklediğim DOCX dokümanındaki profil bilgilerimi kullan."

const sourceModeOptions: Array<{
  mode: SourceMode
  label: string
  icon: typeof MessageSquareText
}> = [
  { mode: "text", label: "Metin", icon: MessageSquareText },
  { mode: "docx", label: "DOCX", icon: FileText },
  { mode: "url", label: "Link", icon: LinkIcon },
]

function getInitialMessage(user: AuthUser): ChatMessage {
  return {
    id: "assistant-initial",
    role: "assistant",
    content:
      `Merhaba ${user.first_name}. Ben Kariyer Yardımcı Pilotun. ` +
      "İlana özel CV üretebilmem için önce profilini netleştirelim. " +
      "Ad soyadın, yaşadığın şehir/ülke ve ana yeteneklerinle başlayalım.",
  }
}

function MessageBubble({ message }: { message: ChatMessage }): JSX.Element {
  const isUserMessage = message.role === "user"
  const Icon = isUserMessage ? UserRound : Bot

  return (
    <div
      className={cn(
        "flex w-full gap-3",
        isUserMessage ? "justify-end" : "justify-start"
      )}
    >
      {!isUserMessage ? (
        <div className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <Icon className="size-3.5" />
        </div>
      ) : null}

      <div
        className={cn(
          "max-w-[760px] rounded-lg border px-3.5 py-2.5 text-sm leading-6 shadow-sm",
          isUserMessage
            ? "border-primary bg-primary text-primary-foreground"
            : "border-border bg-card text-card-foreground"
        )}
      >
        {message.content}
      </div>

      {isUserMessage ? (
        <div className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
          <Icon className="size-3.5" />
        </div>
      ) : null}
    </div>
  )
}

export function ProfileChatPage({
  token,
  user,
  onLogout,
}: ProfileChatPageProps): JSX.Element {
  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    getInitialMessage(user),
  ])
  const [sourceMode, setSourceMode] = useState<SourceMode>("text")
  const [inputValue, setInputValue] = useState("")
  const [urlValue, setUrlValue] = useState("")
  const [documentFile, setDocumentFile] = useState<File | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isSending, setIsSending] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)

  const appendMessage = (role: ChatRole, content: string): void => {
    setMessages((currentMessages) => [
      ...currentMessages,
      {
        id: `${role}-${crypto.randomUUID()}`,
        role,
        content,
      },
    ])
  }

  const applyAgentResponse = (response: ProfileChatResponse): void => {
    appendMessage("assistant", response.reply)
  }

  const submitMessage = async (): Promise<void> => {
    if (isSending) {
      return
    }

    const message = inputValue.trim()
    const url = urlValue.trim()
    const effectiveMessage =
      sourceMode === "text"
        ? message
        : sourceMode === "url"
          ? message || DEFAULT_URL_MESSAGE
          : message || DEFAULT_DOCX_MESSAGE
    const selectedDocumentFile = documentFile

    if (
      (sourceMode === "text" && effectiveMessage.length === 0) ||
      (sourceMode === "url" && url.length === 0) ||
      (sourceMode === "docx" && selectedDocumentFile === null)
    ) {
      return
    }

    setInputValue("")
    setErrorMessage(null)
    appendMessage(
      "user",
      buildSubmittedMessage(
        sourceMode,
        effectiveMessage,
        url,
        selectedDocumentFile
      )
    )
    setIsSending(true)

    try {
      const response =
        sourceMode === "docx"
          ? await sendProfileChatDocument(token, {
              message: effectiveMessage,
              session_id: SESSION_ID,
              document: selectedDocumentFile,
            })
          : await sendProfileChatMessage(token, {
              message: effectiveMessage,
              session_id: SESSION_ID,
              source:
                sourceMode === "url"
                  ? {
                      type: "url",
                      value: url,
                    }
                  : undefined,
            })
      applyAgentResponse(response)
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Profil asistanı yanıt veremedi."
      )
    } finally {
      setIsSending(false)
      textareaRef.current?.focus()
    }
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault()
    void submitMessage()
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>): void => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault()
      void submitMessage()
    }
  }

  const isSubmitDisabled =
    isSending ||
    (sourceMode === "text" && inputValue.trim().length === 0) ||
    (sourceMode === "url" && urlValue.trim().length === 0) ||
    (sourceMode === "docx" && documentFile === null)

  return (
    <main className="h-svh overflow-hidden bg-muted/30 p-3 md:p-4">
      <section className="mx-auto flex h-full min-h-0 w-full max-w-[980px] flex-col gap-3">
        <header className="flex h-12 shrink-0 items-center justify-between gap-4 px-1">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Bot className="size-4.5" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-xs text-muted-foreground">CV Agent</p>
              <h1 className="truncate text-base font-semibold md:text-lg">
                Profil Oluşturma Asistanı
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button variant="outline" onClick={onLogout}>
              <LogOut data-icon="inline-start" />
              Çıkış Yap
            </Button>
          </div>
        </header>

        <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-border bg-background shadow-sm">
          <div className="min-h-0 flex-1 overflow-y-auto bg-muted/20 px-3 py-4 [scrollbar-width:none] md:px-5 [&::-webkit-scrollbar]:hidden">
            <div className="flex flex-col gap-4">
              {messages.map((message) => (
                <MessageBubble key={message.id} message={message} />
              ))}

              {isSending ? (
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <div className="flex size-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                    <Bot className="size-3.5" />
                  </div>
                  Yanıt hazırlanıyor...
                </div>
              ) : null}
            </div>
          </div>

          <form
            onSubmit={handleSubmit}
            className="flex shrink-0 flex-col gap-2 border-t border-border bg-background p-3"
          >
            {errorMessage ? (
              <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {errorMessage}
              </div>
            ) : null}

            <div className="flex flex-wrap items-center gap-2">
              {sourceModeOptions.map((option) => {
                const Icon = option.icon

                return (
                  <Button
                    key={option.mode}
                    type="button"
                    variant={sourceMode === option.mode ? "default" : "outline"}
                    size="sm"
                    disabled={isSending}
                    onClick={() => setSourceMode(option.mode)}
                  >
                    <Icon data-icon="inline-start" />
                    {option.label}
                  </Button>
                )
              })}
            </div>

            {sourceMode === "url" ? (
              <Input
                value={urlValue}
                type="url"
                placeholder="https://..."
                disabled={isSending}
                onChange={(event) => setUrlValue(event.target.value)}
              />
            ) : null}

            {sourceMode === "docx" ? (
              <Input
                type="file"
                accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                disabled={isSending}
                onChange={(event) => {
                  setDocumentFile(event.target.files?.[0] ?? null)
                }}
              />
            ) : null}

            <div className="flex items-end gap-2.5">
              <textarea
                ref={textareaRef}
                value={inputValue}
                rows={1}
                placeholder={
                  sourceMode === "text"
                    ? "Cevabınızı buraya yazın..."
                    : "Ek not yazın..."
                }
                disabled={isSending}
                onChange={(event) => setInputValue(event.target.value)}
                onKeyDown={handleKeyDown}
                className="min-h-10 flex-1 resize-none rounded-lg border border-input bg-background px-3 py-2.5 text-sm leading-5 transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50"
              />
              <Button
                type="submit"
                size="icon-lg"
                aria-label="Mesajı gönder"
                disabled={isSubmitDisabled}
                className="size-10 rounded-lg"
              >
                <Send className="size-4.5" />
              </Button>
            </div>
          </form>
        </section>
      </section>
    </main>
  )
}

function buildSubmittedMessage(
  sourceMode: SourceMode,
  message: string,
  url: string,
  documentFile: File | null
): string {
  if (sourceMode === "url") {
    return `${message}\n${url}`
  }

  if (sourceMode === "docx") {
    return `${message}\nDOCX: ${documentFile?.name ?? ""}`
  }

  return message
}
