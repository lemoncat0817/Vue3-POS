import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useOrderSync } from './useOrderSync'
import * as syncWorkerModule from './sync-worker'

describe('useOrderSync composable', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('傳遞 syncStatus 並提供 start, stop, syncNow 操作', async () => {
    const startSpy = vi.spyOn(syncWorkerModule, 'startSyncWorker').mockImplementation(() => {})
    const stopSpy = vi.spyOn(syncWorkerModule, 'stopSyncWorker').mockImplementation(() => {})
    const syncOnceSpy = vi.spyOn(syncWorkerModule, 'syncOnce').mockResolvedValue(undefined)

    const sync = useOrderSync()
    expect(sync.syncStatus).toBeDefined()

    sync.start()
    expect(startSpy).toHaveBeenCalled()

    sync.stop()
    expect(stopSpy).toHaveBeenCalled()

    await sync.syncNow()
    expect(syncOnceSpy).toHaveBeenCalled()
  })
})
