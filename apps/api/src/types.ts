import type { AnyDb } from './db/types'

export type AppEnv = {
  Variables: {
    db: AnyDb
    provisioningSecret: string
    tenantId: string | null
    deviceId: string
  }
}
