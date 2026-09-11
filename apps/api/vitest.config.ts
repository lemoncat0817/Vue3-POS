import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    include: ['test/**/*.{test,spec}.ts'],
    // better-sqlite3 is a native addon. On 2-core GitHub runners, default
    // vitest forks racing with other workspace packages crash tinypool
    // (ERR_IPC_CHANNEL_CLOSED). Cap workers in CI only.
    pool: 'forks',
    ...(process.env.CI ? { maxWorkers: 1 } : {})
  }
})
