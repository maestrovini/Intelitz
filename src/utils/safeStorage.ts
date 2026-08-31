/**
 * Safe LocalStorage wrapper to prevent crashes in sandbox/iframe/mobile secret-mode environments
 * where direct access to window.localStorage is blocked by security policies.
 */
const memStore: Record<string, string> = {};

let storageAvailable: boolean | null = null;

function getLocalStorage(): Storage | null {
  if (storageAvailable === false) return null;
  try {
    if (typeof window === 'undefined') return null;
    const storage = window.localStorage;
    if (!storage) return null;
    // Verify working read/write
    if (storageAvailable === null) {
      const testKey = '__intelitz_test__';
      storage.setItem(testKey, '1');
      storage.removeItem(testKey);
      storageAvailable = true;
    }
    return storage;
  } catch (e) {
    storageAvailable = false;
    return null;
  }
}

export const safeStorage = {
  getItem(key: string): string | null {
    try {
      const storage = getLocalStorage();
      if (storage) {
        return storage.getItem(key);
      }
    } catch (e) {
      console.warn(`[SafeStorage] Falha ao ler "${key}" do localStorage:`, e);
    }
    return memStore[key] !== undefined ? memStore[key] : null;
  },

  setItem(key: string, value: string): void {
    try {
      const storage = getLocalStorage();
      if (storage) {
        storage.setItem(key, value);
        return;
      }
    } catch (e) {
      console.warn(`[SafeStorage] Falha ao gravar "${key}" no localStorage:`, e);
    }
    memStore[key] = String(value);
  },

  removeItem(key: string): void {
    try {
      const storage = getLocalStorage();
      if (storage) {
        storage.removeItem(key);
        return;
      }
    } catch (e) {
      console.warn(`[SafeStorage] Falha ao remover "${key}" do localStorage:`, e);
    }
    delete memStore[key];
  },

  clear(): void {
    try {
      const storage = getLocalStorage();
      if (storage) {
        storage.clear();
        return;
      }
    } catch (e) {
      console.warn("[SafeStorage] Falha ao limpar o localStorage:", e);
    }
    for (const key in memStore) {
      delete memStore[key];
    }
  }
};
