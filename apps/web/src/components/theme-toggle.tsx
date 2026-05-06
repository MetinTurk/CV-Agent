// Module: Provides a reusable button for switching between light and dark themes.
import type { JSX } from "react"
import { Moon, Sun } from "lucide-react"

import { Button } from "@workspace/ui/components/button"
import { useTheme } from "@/components/theme-provider"

export function ThemeToggle(): JSX.Element {
  const { theme, setTheme } = useTheme()
  const isDarkTheme = theme === "dark"
  const nextTheme = isDarkTheme ? "light" : "dark"
  const Icon = isDarkTheme ? Sun : Moon

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      aria-label={isDarkTheme ? "Açık temaya geç" : "Koyu temaya geç"}
      onClick={() => setTheme(nextTheme)}
    >
      <Icon data-icon="inline-start" />
      Tema
    </Button>
  )
}
