import { afterEach, describe, expect, it, vi } from 'vitest'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { syncBrief } from './sync-brief.mjs'

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
