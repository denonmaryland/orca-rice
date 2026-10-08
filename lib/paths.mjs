// Where orca-rice keeps its state, and where Orca is. Both can be moved for tests.

import { homedir } from 'node:os'
import { join } from 'node:path'

export const STATE = process.env.ORCA_RICE_DIR ?? join(homedir(), '.orca-rice')
export const APP = process.env.ORCA_RICE_APP ?? '/Applications/Orca.app'
export const ORCA = join(APP, 'Contents', 'MacOS', 'Orca')
// Orca's updater leaves a downloaded update here until it installs it
export const PENDING = process.env.ORCA_RICE_PENDING ?? join(homedir(), 'Library', 'Caches', 'orca-updater', 'pending')
// Orca's Settings › Terminal › Import from Warp reads theme files from here, with no dialog
export const WARP_THEMES = process.env.ORCA_RICE_WARP ?? join(homedir(), '.warp', 'themes')

export const FILE = join(STATE, 'look.json') // the look the watcher shows (data only)
export const STATUS = join(STATE, 'status.json') // what the watcher in Orca last reported
export const PREFS = join(STATE, 'prefs.json') // theme, scene mode, shape, effects
export const BACKUP = join(STATE, 'settings-backup.json') // Orca's settings as they were before orca-rice
export const COMPAT = join(STATE, 'compat.json') // what each Orca version was found to take
export const PROJECTS = join(STATE, 'projects.json') // folder → theme id
export const PROJECT_DATA = join(STATE, 'projects-look.json') // each project's look (data only)
export const LOCK = join(STATE, 'hook.lock')
