import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    include: ['test/**/*.{test,spec}.ts'],
    // better-sqlite3 is a native addon. Multiple vitest forks/threads can
    // crash tinypool with ERR_IPC_CHANNEL_CLOSED (worker SIGSEGV). Keep one
    // long-lived fork so CI and local runs share the same stable pool.
    pool: 'forks',
    fileParallelism: false,
    poolOptions: {
      forks: {
        singleFork: true
      }
    }
  }
})
