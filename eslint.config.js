// @ts-check
import js from '@eslint/js'
import pluginVue from 'eslint-plugin-vue'
import { withVueTs, vueTsConfigs } from '@vue/eslint-config-typescript'
import prettierSkipFormatting from '@vue/eslint-config-prettier/skip-formatting'
import globals from 'globals'

// 跨層依賴邊界：pos-domain、pos-contract 與 apps/api 不得引用 Vue / UI 框架。
const FRAMEWORK_IMPORT_RESTRICTIONS = {
  patterns: [
    {
      group: ['vue', 'vue-router', 'pinia', 'pinia-*', 'element-plus', 'element-plus/*', '@element-plus/*', '@vue/*', 'echarts', 'echarts/*', '@pos/app'],
      message: '此套件不得依賴 Vue／UI 框架。',
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
      // 排除 wrangler dev 建置產物，避免 ESLint 檢查打包後的 minified 代碼。
      'apps/api/.wrangler/**',
    ],
  },

  js.configs.recommended,
  pluginVue.configs['flat/recommended'],

  // 型別正確性由 tsc/vue-tsc 把關，此處僅使用語法層規則以提升效能並減少雜訊。
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
      '@typescript-eslint/no-explicit-any': 'warn',
      'vue/multi-word-component-names': ['error', { ignores: ['index'] }],
      'vue/block-lang': ['error', { script: { lang: 'ts' } }],
    },
  },

  prettierSkipFormatting,
)
