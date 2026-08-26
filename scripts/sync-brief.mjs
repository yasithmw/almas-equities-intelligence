import { copyFileSync, existsSync, mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

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

// Portable "is this the entry point" check. import.meta.main only exists from
// Node 24.2 onward; on any older runtime (e.g. Node 22, common on Vercel) it is
// undefined, the guard below would read false, and sync:brief/prebuild/predev
// would silently no-op -- no copy, no warning, worse than the crash R9 fixed.
// Comparing resolved file:// URLs (not raw fs paths) works on every Node ESM
// version and is not tripped up by this project's space-containing directory
// names, unlike a raw `import.meta.url === 'file://' + process.argv[1]` compare.
export function isEntryPoint(moduleUrl, argv1) {
  return Boolean(argv1) && pathToFileURL(argv1).href === moduleUrl
}

if (isEntryPoint(import.meta.url, process.argv[1])) {
  const here = dirname(fileURLToPath(import.meta.url))
  syncBrief({
    source: resolve(here, '..', '..', 'Almas Equities - Executive Summary.html'),
    target: resolve(here, '..', 'public', 'brief.html'),
  })
}
