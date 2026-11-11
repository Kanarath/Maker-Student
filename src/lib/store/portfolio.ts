// «Mis montajes»: tu foto y una nota por cada montaje, guardadas SOLO en este navegador (IndexedDB).
// Nada se sube a ningún sitio. Si IndexedDB no está disponible, las funciones fallan con un error claro
// y la interfaz avisa; la web sigue funcionando.
export interface Piece {
  id: string;
  lessonId: string;
  note: string;
  image?: Blob;
  created: string; // ISO
}

const DB = "maker-student";
const STORE = "pieces";

function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") return reject(new Error("Este navegador no permite guardar fotos."));
    const req = indexedDB.open(DB, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE, { keyPath: "id" });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error("No se pudo abrir el almacén."));
  });
}

const run = <T>(db: IDBDatabase, mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> =>
  new Promise((resolve, reject) => {
    const req = fn(db.transaction(STORE, mode).objectStore(STORE));
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });

export async function addPiece(p: Omit<Piece, "id" | "created">): Promise<Piece> {
  const db = await open();
  const piece: Piece = { ...p, id: `p_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`, created: new Date().toISOString() };
  await run(db, "readwrite", (s) => s.put(piece));
  return piece;
}

export async function listPieces(lessonId?: string): Promise<Piece[]> {
  const db = await open();
  const all = await run<Piece[]>(db, "readonly", (s) => s.getAll());
  return all.filter((p) => !lessonId || p.lessonId === lessonId).sort((a, b) => b.created.localeCompare(a.created));
}

export async function deletePiece(id: string): Promise<void> {
  const db = await open();
  await run(db, "readwrite", (s) => s.delete(id));
}

/** Reduce una foto a un máximo de `max` px para que no ocupe media memoria del móvil. */
export async function shrinkImage(file: File, max = 1280): Promise<Blob> {
  const bmp = await createImageBitmap(file);
  const k = Math.min(1, max / Math.max(bmp.width, bmp.height));
  const c = document.createElement("canvas");
  c.width = Math.round(bmp.width * k);
  c.height = Math.round(bmp.height * k);
  c.getContext("2d")!.drawImage(bmp, 0, 0, c.width, c.height);
  return new Promise((resolve, reject) => c.toBlob((b) => (b ? resolve(b) : reject(new Error("No se pudo procesar la foto."))), "image/jpeg", 0.85));
}
