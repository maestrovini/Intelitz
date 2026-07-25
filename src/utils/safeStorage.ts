/**
 * Safe LocalStorage wrapper to prevent crashes in sandbox/iframe environments
 * where direct access to window.localStorage is blocked by security policies.
 */
const memStore: Record<string, string> = {};

export const safeStorage = {
  getItem(key: string): string | null {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        return window.localStorage.getItem(key);
      }
    } catch (e) {
      console.warn(`[SafeStorage] Falha ao ler "${key}" do localStorage (provavelmente bloqueado no iframe):`, e);
    }
    return memStore[key] !== undefined ? memStore[key] : null;
  },

  setItem(key: string, value: string): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(key, value);
        return;
      }
    } catch (e) {
      console.warn(`[SafeStorage] Falha ao gravar "${key}" no localStorage (provavelmente bloqueado no iframe):`, e);
    }
    memStore[key] = String(value);
  },

  removeItem(key: string): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(key);
        return;
      }
    } catch (e) {
      console.warn(`[SafeStorage] Falha ao remover "${key}" do localStorage (provavelmente bloqueado no iframe):`, e);
    }
    delete memStore[key];
  },

  clear(): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.clear();
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
