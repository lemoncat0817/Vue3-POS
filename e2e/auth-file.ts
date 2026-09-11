import path from 'path'
import { fileURLToPath } from 'url'

// 獨立成自己的檔案，讓 playwright.config.ts 跟 global.setup.ts 都能 import——
// config 檔不能直接 import global.setup.ts 本身，那樣會把裡面的 setup()（也是
// 一種 test()）在載入 config 的當下就執行，Playwright 會擋下來。
const dirname = path.dirname(fileURLToPath(import.meta.url))
export const authFile = path.join(dirname, '.auth/device-state.json')
