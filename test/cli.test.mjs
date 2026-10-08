import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { existsSync, mkdtempSync, rmSync, symlinkSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { test } from 'node:test'

const ROOT = join(import.meta.dirname, '..')
const TMP = mkdtempSync(join(tmpdir(), 'orca-rice-cli-'))
// No real Orca and no real state: every run here is hermetic
const env = { ...process.env, ORCA_RICE_DIR: join(TMP, 'state'), ORCA_RICE_APP: join(TMP, 'NoOrca.app'), ORCA_RICE_WARP: join(TMP, 'warp') }
const run = (...args) => spawnSync(process.execPath, [join(ROOT, 'bin', 'orca-rice.mjs'), ...args], { env, encoding: 'utf8' })

test.after(() => rmSync(TMP, { recursive: true, force: true }))

test('check writes nothing, even its cache, and says why it is not ready', () => {
  const r = run('check', '--json')
  assert.equal(r.status, 1)
  const j = JSON.parse(r.stdout)
  assert.equal(j.ok, false)
  assert.ok(j.problems.some((p) => p.includes('Orca was not found')))
  assert.equal(existsSync(env.ORCA_RICE_DIR), false)
  assert.equal(existsSync(env.ORCA_RICE_WARP), false)
})

test('install stops on a bad flag before anything is checked or written', () => {
  assert.match(run('install', '--theme').stderr, /--theme needs a value/)
  assert.match(run('install', '--theme', '--no-fx').stderr, /--theme needs a value/)
  assert.match(run('install', '--theme=nope').stderr, /no theme "nope"/)
  assert.match(run('install', '--scene', 'constructor').stderr, /--scene takes on, dim, still or off/)
  assert.match(run('install', '--theme=nord').stderr, /Orca was not found/)
  assert.equal(existsSync(env.ORCA_RICE_DIR), false)
})

test('a scene name that is not a mode is refused', () => {
  assert.match(run('scene', 'constructor').stderr, /usage: orca-rice scene/)
  assert.match(run('scene', 'toString').stderr, /usage: orca-rice scene/)
})

test('the launcher works through a symlink', () => {
  const link = join(TMP, 'orca-rice')
  symlinkSync(join(ROOT, 'bin', 'orca-rice'), link)
  const r = spawnSync('/bin/sh', [link, 'help'], { env, encoding: 'utf8' })
  assert.equal(r.status, 0, r.stderr)
  assert.match(r.stdout, /orca-rice: themes, floating cards and pixel scenes for Orca/)
})
