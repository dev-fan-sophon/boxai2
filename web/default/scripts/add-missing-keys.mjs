/*
Copyright (C) 2023-2026 QuantumNous

Add English source keys to en.json translation map, then run:
  bun run i18n:sync

Usage:
  node scripts/add-missing-keys.mjs "Key one" "Key two"
  node scripts/add-missing-keys.mjs --file keys.txt
  echo '["Key"]' | node scripts/add-missing-keys.mjs --stdin
*/
import fs from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'

const EN_PATH = path.resolve('src/i18n/locales/en.json')

function sortKeys(obj) {
  const out = {}
  for (const key of Object.keys(obj).sort((a, b) => a.localeCompare(b))) {
    out[key] = obj[key]
  }
  return out
}

async function readKeysFromArgs(argv) {
  if (argv.includes('--stdin')) {
    const chunks = []
    for await (const chunk of process.stdin) chunks.push(chunk)
    const text = Buffer.concat(chunks).toString('utf8').trim()
    if (!text) return []
    try {
      const parsed = JSON.parse(text)
      if (Array.isArray(parsed)) return parsed.map(String)
    } catch {
      /* fall through */
    }
    return text
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
  }

  const fileIdx = argv.indexOf('--file')
  if (fileIdx !== -1) {
    const filePath = argv[fileIdx + 1]
    if (!filePath) throw new Error('--file requires a path')
    const text = await fs.readFile(filePath, 'utf8')
    return text
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
  }

  return argv.filter((arg) => !arg.startsWith('-'))
}

async function main() {
  const keys = await readKeysFromArgs(process.argv.slice(2))
  if (keys.length === 0) {
    console.error('No keys provided.')
    process.exit(1)
  }

  const raw = await fs.readFile(EN_PATH, 'utf8')
  const json = JSON.parse(raw)
  if (!json.translation || typeof json.translation !== 'object') {
    throw new Error('en.json missing translation object')
  }

  let added = 0
  let skipped = 0
  for (const key of keys) {
    if (!key || typeof key !== 'string') continue
    if (Object.prototype.hasOwnProperty.call(json.translation, key)) {
      skipped += 1
      continue
    }
    json.translation[key] = key
    added += 1
  }

  json.translation = sortKeys(json.translation)
  await fs.writeFile(EN_PATH, `${JSON.stringify(json, null, 2)}\n`, 'utf8')
  console.log(`Added ${added} key(s), skipped ${skipped} existing.`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
