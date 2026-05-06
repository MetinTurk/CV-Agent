// Module: Creates the Drizzle PostgreSQL database client.
import { drizzle } from "drizzle-orm/postgres-js"
import postgres from "postgres"

import { getSettings } from "../core/config"
import * as schema from "./schema"

const settings = getSettings()
const sql = postgres(settings.databaseUrl, {
  max: 10,
})

export const db = drizzle(sql, {
  schema,
})
