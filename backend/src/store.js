import { mkdir, readFile, rename, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const dataDir = path.join(root, 'data')
const dataFile = path.join(dataDir, 'store.json')

const initialData = { users: [], projects: [], aiProviders: {} }

export async function readStore() {
  await mkdir(dataDir, { recursive: true })
  try {
    return JSON.parse(await readFile(dataFile, 'utf8'))
  } catch (error) {
    if (error.code !== 'ENOENT') throw error
    await writeStore(initialData)
    return structuredClone(initialData)
  }
}

export async function writeStore(data) {
  await mkdir(dataDir, { recursive: true })
  const tempFile = `${dataFile}.tmp`
  await writeFile(tempFile, JSON.stringify(data, null, 2), 'utf8')
  await rename(tempFile, dataFile)
}

export async function updateStore(mutator) {
  const data = await readStore()
  const result = await mutator(data)
  await writeStore(data)
  return result
}
