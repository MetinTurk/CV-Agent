// Module: Starts the Elysia HTTP server when the package runs under Bun.
import { createApp } from "./app"
import { getSettings } from "./core/config"

const settings = getSettings()
export const app = createApp(settings)

if (import.meta.main) {
  app.listen({
    hostname: settings.host,
    port: settings.port,
  })

  console.log(
    `${settings.appName} listening on http://${settings.host}:${settings.port}`
  )
}
