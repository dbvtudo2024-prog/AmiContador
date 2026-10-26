// IndexedDB storage for PDF pattern files attached to Amigurumi projects

const DB_NAME = 'AmiContadorPdfDB';
const DB_VERSION = 1;
const STORE_NAME = 'project_pdfs';

interface StoredPdfRecord {
  projectId: string;
  fileName: string;
  fileType: string;
  fileData: Blob;
  updatedAt: string;
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB não suportado'));
      return;
    }
    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'projectId' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// In-memory cache for the latest active PDF to prevent loss between views and modals
let memoryCachedPdf: { fileName: string; blob: Blob; url: string } | null = null;

export const PdfStorageService = {
  async savePdf(projectId: string, file: File | Blob, fileNameParam?: string): Promise<void> {
    const actualFileName = (file as File).name || fileNameParam || 'receita-amigurumi.pdf';
    
    // Store in memory cache immediately for instantaneous access
    try {
      if (memoryCachedPdf?.url) {
        URL.revokeObjectURL(memoryCachedPdf.url);
      }
      memoryCachedPdf = {
        fileName: actualFileName,
        blob: file,
        url: URL.createObjectURL(file),
      };
    } catch {
      // url creation fallback
    }

    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);

      const record: StoredPdfRecord = {
        projectId,
        fileName: actualFileName,
        fileType: file.type || 'application/pdf',
        fileData: file,
        updatedAt: new Date().toISOString(),
      };

      store.put(record);

      // Also persist as latest_pdf fallback so splitting never loses the file
      const latestRecord: StoredPdfRecord = {
        ...record,
        projectId: 'latest_pdf',
      };
      store.put(latestRecord);

      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  },

  async getPdf(projectId: string): Promise<{ fileName: string; blob: Blob; url: string } | null> {
    try {
      const db = await openDB();
      return new Promise((resolve) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);

        // 1. Try project-specific ID
        const req = store.get(projectId);
        req.onsuccess = () => {
          let res: StoredPdfRecord = req.result;
          if (res && res.fileData) {
            const blob = res.fileData;
            const url = URL.createObjectURL(blob);
            memoryCachedPdf = { fileName: res.fileName, blob, url };
            resolve({ fileName: res.fileName, blob, url });
            return;
          }

          // 2. Fallback: Check latest_pdf or any available PDF in the store
          const latestReq = store.get('latest_pdf');
          latestReq.onsuccess = () => {
            const latestRes: StoredPdfRecord = latestReq.result;
            if (latestRes && latestRes.fileData) {
              // Copy to current project so it sticks
              store.put({ ...latestRes, projectId });
              const blob = latestRes.fileData;
              const url = URL.createObjectURL(blob);
              resolve({ fileName: latestRes.fileName, blob, url });
              return;
            }

            // 3. Fallback: search all records in store
            const allReq = store.getAll();
            allReq.onsuccess = () => {
              const all: StoredPdfRecord[] = allReq.result || [];
              if (all.length > 0) {
                // Pick the most recently updated
                const mostRecent = all.sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''))[0];
                if (mostRecent && mostRecent.fileData) {
                  store.put({ ...mostRecent, projectId });
                  const blob = mostRecent.fileData;
                  const url = URL.createObjectURL(blob);
                  memoryCachedPdf = { fileName: mostRecent.fileName, blob, url };
                  resolve({ fileName: mostRecent.fileName, blob, url });
                  return;
                }
              }
              resolve(memoryCachedPdf || null);
            };
            allReq.onerror = () => resolve(memoryCachedPdf || null);
          };
          latestReq.onerror = () => resolve(memoryCachedPdf || null);
        };
        req.onerror = () => resolve(memoryCachedPdf || null);
      });
    } catch {
      return memoryCachedPdf || null;
    }
  },

  async deletePdf(projectId: string): Promise<void> {
    try {
      const db = await openDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const request = store.delete(projectId);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    } catch {
      // Ignored
    }
  },
};
