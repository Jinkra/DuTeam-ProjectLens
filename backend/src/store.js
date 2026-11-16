import { mkdir, readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import Database from 'better-sqlite3'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const dataDir = path.join(root, 'data')
const databaseFile = path.join(dataDir, 'database.db')
const legacyDataFile = path.join(dataDir, 'store.json')
const initialData = { users: [], projects: [], aiProviders: {} }

let database

async function openDatabase() {
  if (database) return database
  await mkdir(dataDir, { recursive: true })
  database = new Database(databaseFile)
  database.pragma('journal_mode = WAL')
  database.exec(`
    CREATE TABLE IF NOT EXISTS app_state (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      data TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `)

  const existing = database.prepare('SELECT id FROM app_state WHERE id = 1').get()
  if (!existing) {
    let data = structuredClone(initialData)
    try {
      data = JSON.parse(await readFile(legacyDataFile, 'utf8'))
      console.log('Migrated backend/data/store.json to backend/data/database.db')
    } catch (error) {
      if (error.code !== 'ENOENT') throw error
    }
    database.prepare('INSERT INTO app_state (id, data, updated_at) VALUES (1, ?, ?)').run(JSON.stringify(data), new Date().toISOString())
  }

  return database
}

export async function readStore() {
  const db = await openDatabase()
  const row = db.prepare('SELECT data FROM app_state WHERE id = 1').get()
  return row ? JSON.parse(row.data) : structuredClone(initialData)
}

export async function writeStore(data) {
  const db = await openDatabase()
  db.prepare(`
    INSERT INTO app_state (id, data, updated_at) VALUES (1, ?, ?)
    ON CONFLICT(id) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at
  `).run(JSON.stringify(data), new Date().toISOString())
}

export async function updateStore(mutator) {
  const data = await readStore()
  const result = await mutator(data)
  await writeStore(data)
  return result
}
