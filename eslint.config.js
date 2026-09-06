// @ts-check
import js from '@eslint/js'
import pluginVue from 'eslint-plugin-vue'
import { withVueTs, vueTsConfigs } from '@vue/eslint-config-typescript'
import prettierSkipFormatting from '@vue/eslint-config-prettier/skip-formatting'
import globals from 'globals'

/**
 * 跨層依賴邊界（重構規劃書 §6）。
 *
 * packages/pos-domain 是零執行期依賴的純 TypeScript 領域層，不得引用 Vue、
 * Pinia、瀏覽器 API 或任何 UI 套件；packages/pos-contract 只放 schema 定義，
 * 同理不得依賴框架；apps/api 是 Worker 執行環境，不引用瀏覽器或 Vue 專屬套件。
 * 違反即 CI 失敗，讓依賴方向錯誤在提交當下就被攔下，而不是留到程式碼審查。
 */
const FRAMEWORK_IMPORT_RESTRICTIONS = {
  patterns: [
    {
      group: ['vue', 'vue-router', 'pinia', 'pinia-*', 'element-plus', 'element-plus/*', '@element-plus/*', '@vue/*', 'echarts', 'echarts/*', '@pos/app'],
      message: '此套件不得依賴 Vue／UI 框架，違反重構規劃書 §6 的依賴方向規則。',
    },
  ],
}

export default withVueTs(
  {
    ignores: [
      '**/dist/**',
      '**/coverage/**',
      '**/.tmp/**',
      '**/*.tsbuildinfo',
      'apps/pos/public/**',
      'playwright-report/**',
      'test-results/**',
    ],
  },

  js.configs.recommended,
  pluginVue.configs['flat/recommended'],

  // typescript-eslint 的語法層規則（未啟用型別感知的規則集）。
  // 型別正確性已由各套件的 `tsc --noEmit` / `vue-tsc --noEmit` 全面把關
  // （見 §13 CI 門檻），此處不重複疊加 type-checked 規則集，避免在既有
  // 程式碼尚未完成型別遷移前產生大量與行為無關的噪音。
  vueTsConfigs.recommended,

  {
    name: 'pos/browser-app',
    files: ['apps/pos/src/**/*.{ts,vue}'],
    languageOptions: {
      globals: { ...globals.browser },
    },
  },

  {
    name: 'pos/node-config',
    files: ['**/*.config.{js,ts,mjs,cjs}', 'apps/pos/vite.config.ts', 'eslint.config.js'],
    languageOptions: {
      globals: { ...globals.node },
    },
  },

  {
    name: 'pos/server-and-domain',
    files: ['apps/api/src/**/*.ts', 'packages/*/src/**/*.ts'],
    languageOptions: {
      globals: { ...globals.node },
    },
  },

  {
    name: 'pos/domain-purity',
    files: ['packages/pos-domain/src/**/*.ts', 'packages/pos-contract/src/**/*.ts'],
    rules: {
      'no-restricted-imports': ['error', FRAMEWORK_IMPORT_RESTRICTIONS],
    },
  },
  {
    name: 'pos/api-purity',
    files: ['apps/api/src/**/*.ts'],
    rules: {
      'no-restricted-imports': ['error', FRAMEWORK_IMPORT_RESTRICTIONS],
    },
  },

  {
    name: 'pos/rules',
    rules: {
      // 現行程式碼在型別遷移完成前會暫時保留少量 `any`；先以 warn 觀察，
      // 待 P1 領域抽離完成後再收緊為 error。
      '@typescript-eslint/no-explicit-any': 'warn',
      'vue/multi-word-component-names': ['error', { ignores: ['index'] }],
      'vue/block-lang': ['error', { script: { lang: 'ts' } }],
    },
  },

  prettierSkipFormatting,
)
