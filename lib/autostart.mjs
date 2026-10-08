// Orca drops the look whenever it quits or updates itself. `autostart on` installs a small macOS LaunchAgent that runs
// `orca-rice ensure` at login and once a minute: when Orca is running without the look it puts it back, otherwise it
// exits at once (a process list and one small file read). `autostart off` removes it. Nothing else is scheduled.

import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, unlinkSync, writeFileSync } from 'node:fs'
import { homedir, userInfo } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { STATE } from './paths.mjs'

export const LABEL = 'local.orca-rice.ensure'
const PLIST = join(homedir(), 'Library', 'LaunchAgents', `${LABEL}.plist`)
// The launcher, not a Node path: it finds a Node at each run, so a Node upgrade (or none at all) never breaks it
const LAUNCHER = join(dirname(fileURLToPath(import.meta.url)), '..', 'bin', 'orca-rice')
const domain = () => `gui/${userInfo().uid}`

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

// launchd starts jobs with a bare PATH: Homebrew's and the usual Node places are added, and orca-rice's own settings
// passed on
export function plist() {
  const env = {
    PATH: '/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin',
    ...(process.env.ORCA_RICE_DIR ? { ORCA_RICE_DIR: process.env.ORCA_RICE_DIR } : {}),
    ...(process.env.ORCA_RICE_APP ? { ORCA_RICE_APP: process.env.ORCA_RICE_APP } : {}),
  }
  const envXml = `  <key>EnvironmentVariables</key>\n  <dict>\n${Object.entries(env).map(([k, v]) => `    <key>${esc(k)}</key><string>${esc(v)}</string>`).join('\n')}\n  </dict>\n`
  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key><string>${LABEL}</string>
  <key>ProgramArguments</key>
  <array>
    <string>/bin/sh</string>
    <string>${esc(LAUNCHER)}</string>
    <string>ensure</string>
  </array>
${envXml}  <key>RunAtLoad</key><true/>
  <key>StartInterval</key><integer>60</integer>
  <key>ProcessType</key><string>Background</string>
  <key>StandardOutPath</key><string>${esc(join(STATE, 'autostart.log'))}</string>
  <key>StandardErrorPath</key><string>${esc(join(STATE, 'autostart.log'))}</string>
</dict>
</plist>
`
}

const loaded = () => {
  try {
    execFileSync('launchctl', ['print', `${domain()}/${LABEL}`], { stdio: 'ignore' })
    return true
  } catch {
    return false
  }
}

export function autostartStatus() {
  return { installed: existsSync(PLIST), loaded: loaded(), plist: PLIST }
}

export function autostartOn() {
  mkdirSync(dirname(PLIST), { recursive: true })
  mkdirSync(STATE, { recursive: true })
  writeFileSync(PLIST, plist())
  // A job being replaced must be gone before the new one goes in (launchd answers "Bootstrap failed: 5" otherwise)
  if (loaded()) {
    execFileSync('launchctl', ['bootout', `${domain()}/${LABEL}`], { stdio: 'ignore' })
    for (let i = 0; i < 50 && loaded(); i++) execFileSync('/bin/sleep', ['0.1'])
  }
  execFileSync('launchctl', ['bootstrap', domain(), PLIST])
  return autostartStatus()
}

export function autostartOff() {
  if (loaded()) execFileSync('launchctl', ['bootout', `${domain()}/${LABEL}`], { stdio: 'ignore' })
  if (existsSync(PLIST)) unlinkSync(PLIST)
  return autostartStatus()
}
