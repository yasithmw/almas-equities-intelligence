import { afterEach, describe, expect, it, vi } from 'vitest'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { isEntryPoint, syncBrief } from './sync-brief.mjs'

describe('syncBrief', () => {
  let dir: string | undefined

  afterEach(() => {
    vi.restoreAllMocks()
    if (dir) rmSync(dir, { recursive: true, force: true })
    dir = undefined
  })

  it('warns and leaves an existing target untouched when the source is missing', () => {
    dir = mkdtempSync(join(tmpdir(), 'sync-brief-'))
    const target = join(dir, 'brief.html')
    const committed = '<html>already committed</html>'
    writeFileSync(target, committed)

    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('syncBrief must not call process.exit')
    })
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

    const result = syncBrief({ source: join(dir, 'does-not-exist.html'), target })

    expect(result).toEqual({ copied: false })
    expect(readFileSync(target, 'utf8')).toBe(committed)
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('canonical brief not found'))
    expect(exitSpy).not.toHaveBeenCalled()
  })

  it('copies the source over the target when the source exists', () => {
    dir = mkdtempSync(join(tmpdir(), 'sync-brief-'))
    const source = join(dir, 'source.html')
    const target = join(dir, 'nested', 'brief.html')
    writeFileSync(source, '<html>canonical</html>')

    const result = syncBrief({ source, target })

    expect(result).toEqual({ copied: true })
    expect(readFileSync(target, 'utf8')).toBe('<html>canonical</html>')
  })
})

describe('isEntryPoint', () => {
  it('is true when argv1 resolves to the same file as the module url, spaces included', () => {
    // Mirrors this project's own directory names, which contain spaces -- the
    // exact case a raw `'file://' + argv1` string compare would get wrong.
    const argv1 = '/Users/example/My Folder/scripts/sync-brief.mjs'
    const moduleUrl = pathToFileURL(argv1).href

    expect(isEntryPoint(moduleUrl, argv1)).toBe(true)
  })

  it('is true for a relative argv1, resolved against cwd, as Node provides when run as `node scripts/sync-brief.mjs`', () => {
    const moduleUrl = pathToFileURL(resolve('scripts/sync-brief.mjs')).href

    expect(isEntryPoint(moduleUrl, 'scripts/sync-brief.mjs')).toBe(true)
  })

  it('is false when argv1 points at a different file (module merely imported)', () => {
    const moduleUrl = pathToFileURL('/a/sync-brief.mjs').href

    expect(isEntryPoint(moduleUrl, '/a/some-other-entry.mjs')).toBe(false)
  })

  it('is false when there is no argv1 at all', () => {
    const moduleUrl = pathToFileURL('/a/sync-brief.mjs').href

    expect(isEntryPoint(moduleUrl, undefined)).toBe(false)
  })
})
