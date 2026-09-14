export interface BuildInfo {
  commitHash: string
  buildTime: string
  env: string
  displayText: string
  shortText: string
}

export const APP_BUILD_INFO: BuildInfo = {
  commitHash: typeof __COMMIT_HASH__ !== 'undefined' ? __COMMIT_HASH__ : 'dev',
  buildTime: typeof __BUILD_TIME__ !== 'undefined' ? __BUILD_TIME__ : '',
  env: typeof __APP_ENV__ !== 'undefined' ? __APP_ENV__ : 'dev',
  get displayText() {
    return `[${this.env}] #${this.commitHash} · ${this.buildTime}`
  },
  get shortText() {
    return `[${this.env}] #${this.commitHash}`
  }
}

export function logVersionBadge(): void {
  console.log(
    `%c POS %c ${APP_BUILD_INFO.displayText} `,
    'background:#ef4444;color:#fff;font-weight:bold;padding:2px 4px;border-radius:3px 0 0 3px;',
    'background:#292524;color:#f5f5f4;padding:2px 6px;border-radius:0 3px 3px 0;'
  )
}
