import { copyFileSync, existsSync, mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const source = resolve(here, '..', '..', 'Almas Equities - Executive Summary.html')
const target = resolve(here, '..', 'public', 'brief.html')

if (!existsSync(source)) {
  console.error(`sync-brief: canonical brief not found at ${source}`)
  process.exit(1)
}

mkdirSync(dirname(target), { recursive: true })
copyFileSync(source, target)
console.log(`sync-brief: copied ${source} -> ${target}`)
