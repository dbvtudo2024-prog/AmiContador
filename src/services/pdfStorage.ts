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

export const PdfStorageService = {
  async savePdf(projectId: string, file: File): Promise<void> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);

      const record: StoredPdfRecord = {
        projectId,
        fileName: file.name,
        fileType: file.type || 'application/pdf',
        fileData: file,
        updatedAt: new Date().toISOString(),
      };

      const request = store.put(record);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  },

  async getPdf(projectId: string): Promise<{ fileName: string; blob: Blob; url: string } | null> {
    try {
      const db = await openDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const request = store.get(projectId);

        request.onsuccess = () => {
          const res: StoredPdfRecord = request.result;
          if (!res || !res.fileData) {
            resolve(null);
            return;
          }
          const blob = res.fileData;
          const url = URL.createObjectURL(blob);
          resolve({ fileName: res.fileName, blob, url });
        };

        request.onerror = () => reject(request.error);
      });
    } catch {
      return null;
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
