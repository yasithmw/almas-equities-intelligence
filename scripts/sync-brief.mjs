import { copyFileSync, existsSync, mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

// Ruling R9: the canonical brief lives outside this repo (two directories up), so a
// Vercel build that only checks out almas-demo/ will never find it there. Warn and
// fall back to the committed public/brief.html instead of failing the build --
// do not change this back to a nonzero exit.
export function syncBrief({ source, target }) {
  if (!existsSync(source)) {
    console.warn(
      `sync-brief: canonical brief not found at ${source}. The build will use the committed ${target} as-is.`,
    )
    return { copied: false }
  }

  mkdirSync(dirname(target), { recursive: true })
  copyFileSync(source, target)
  console.log(`sync-brief: copied ${source} -> ${target}`)
  return { copied: true }
}

if (import.meta.main) {
  const here = dirname(fileURLToPath(import.meta.url))
  syncBrief({
    source: resolve(here, '..', '..', 'Almas Equities - Executive Summary.html'),
    target: resolve(here, '..', 'public', 'brief.html'),
  })
}
