// DEV ONLY. A real backend stores files in private object storage and serves presigned URLs.
const DB_NAME = "routing-mock-audio"
const STORE = "blobs"

function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1)
    req.onupgradeneeded = () => req.result.createObjectStore(STORE)
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

export async function putBlob(id: string, blob: Blob): Promise<void> {
  const db = await open()
  await new Promise<void>((resolve, reject) => {
    const t = db.transaction(STORE, "readwrite")
    t.objectStore(STORE).put(blob, id)
    t.oncomplete = () => {
      db.close()
      resolve()
    }
    t.onerror = () => reject(t.error)
    t.onabort = () => reject(t.error)
  })
}

export async function getBlob(id: string): Promise<Blob | null> {
  const db = await open()
  return new Promise((resolve, reject) => {
    const req = db.transaction(STORE, "readonly").objectStore(STORE).get(id)
    req.onsuccess = () => {
      db.close()
      resolve((req.result as Blob | undefined) ?? null)
    }
    req.onerror = () => reject(req.error)
  })
}

export async function deleteBlob(id: string): Promise<void> {
  const db = await open()
  await new Promise<void>((resolve) => {
    const t = db.transaction(STORE, "readwrite")
    t.objectStore(STORE).delete(id)
    t.oncomplete = () => {
      db.close()
      resolve()
    }
    t.onerror = () => resolve()
  })
}