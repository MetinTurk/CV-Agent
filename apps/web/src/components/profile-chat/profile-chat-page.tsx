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
  LogOut,
  Send,
  UserRound,
} from "lucide-react"

import { Button } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"

import { ThemeToggle } from "@/components/theme-toggle"
import {
  sendProfileChatMessage,
  type ProfileChatResponse,
} from "@/lib/profile-chat-api"
import type { AuthUser } from "@/lib/auth-api"

type ChatRole = "assistant" | "user"

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
        <div className="bg-primary text-primary-foreground mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg">
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
  const [inputValue, setInputValue] = useState("")
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
    const message = inputValue.trim()
    if (!message || isSending) {
      return
    }

    setInputValue("")
    setErrorMessage(null)
    appendMessage("user", message)
    setIsSending(true)

    try {
      const response = await sendProfileChatMessage(token, {
        message,
        session_id: SESSION_ID,
      })
      applyAgentResponse(response)
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Profil asistanı yanıt veremedi."
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

  return (
    <main className="h-svh overflow-hidden bg-muted/30 p-3 md:p-4">
      <section className="mx-auto flex h-full min-h-0 w-full max-w-[980px] flex-col gap-3">
        <header className="flex h-12 shrink-0 items-center justify-between gap-4 px-1">
          <div className="flex min-w-0 items-center gap-3">
            <div className="bg-primary text-primary-foreground flex size-9 shrink-0 items-center justify-center rounded-lg">
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

        <section className="border-border bg-background flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border shadow-sm">
          <div className="min-h-0 flex-1 overflow-y-auto bg-muted/20 px-3 py-4 [scrollbar-width:none] md:px-5 [&::-webkit-scrollbar]:hidden">
            <div className="flex flex-col gap-4">
              {messages.map((message) => (
                <MessageBubble key={message.id} message={message} />
              ))}

              {isSending ? (
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <div className="bg-primary text-primary-foreground flex size-7 items-center justify-center rounded-lg">
                    <Bot className="size-3.5" />
                  </div>
                  Yanıt hazırlanıyor...
                </div>
              ) : null}
            </div>
          </div>

          <form
            onSubmit={handleSubmit}
            className="border-border bg-background flex shrink-0 flex-col gap-2 border-t p-3"
          >
            {errorMessage ? (
              <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {errorMessage}
              </div>
            ) : null}

            <div className="flex items-end gap-2.5">
              <textarea
                ref={textareaRef}
                value={inputValue}
                rows={1}
                placeholder="Cevabınızı buraya yazın..."
                disabled={isSending}
                onChange={(event) => setInputValue(event.target.value)}
                onKeyDown={handleKeyDown}
                className="border-input bg-background focus-visible:border-ring focus-visible:ring-ring/50 min-h-10 flex-1 resize-none rounded-lg border px-3 py-2.5 text-sm leading-5 outline-none transition-colors placeholder:text-muted-foreground focus-visible:ring-3 disabled:pointer-events-none disabled:opacity-50"
              />
              <Button
                type="submit"
                size="icon-lg"
                aria-label="Mesajı gönder"
                disabled={isSending || inputValue.trim().length === 0}
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
