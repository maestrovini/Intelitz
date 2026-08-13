import { safeStorage } from './safeStorage';

export const DOMAIN_STORAGE_KEY = 'imobhall_custom_domain';
export const DEFAULT_DOMAIN = 'imobhall.com.br';

/**
 * Sanitizes a raw user input domain string (e.g. "https://imobhall.com.br/" -> "imobhall.com.br")
 */
export function sanitizeDomain(rawDomain: string): string {
  if (!rawDomain) return DEFAULT_DOMAIN;
  let cleaned = rawDomain.trim();
  // Remove protocol if present
  cleaned = cleaned.replace(/^https?:\/\//i, '');
  // Remove path, search, query, trailing slashes
  cleaned = cleaned.split('/')[0].split('?')[0].split('#')[0].trim();
  return cleaned || DEFAULT_DOMAIN;
}

/**
 * Retrieves the currently saved custom domain from LocalStorage (or fallback)
 */
export function getCustomDomain(): string {
  const stored = safeStorage.getItem(DOMAIN_STORAGE_KEY);
  if (stored && stored.trim() !== '') {
    return sanitizeDomain(stored);
  }
  return DEFAULT_DOMAIN;
}

/**
 * Saves a new custom domain into LocalStorage
 */
export function setCustomDomain(domain: string): string {
  const cleaned = sanitizeDomain(domain);
  safeStorage.setItem(DOMAIN_STORAGE_KEY, cleaned);
  // Dispatch custom event so listeners can update UI in real-time
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('domain-changed', { detail: cleaned }));
  }
  return cleaned;
}

/**
 * Resets the saved custom domain back to default (imobhall.com.br)
 */
export function resetCustomDomain(): string {
  safeStorage.removeItem(DOMAIN_STORAGE_KEY);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('domain-changed', { detail: DEFAULT_DOMAIN }));
  }
  return DEFAULT_DOMAIN;
}

/**
 * Formats an internal path or URL using the saved custom domain.
 * Example: formatInternalUrl('/imoveis') => "https://imobhall.com.br/imoveis"
 */
export function formatInternalUrl(pathOrUrl: string, protocol: 'https' | 'http' = 'https'): string {
  if (!pathOrUrl) return `${protocol}://${getCustomDomain()}`;
  
  const domain = getCustomDomain();

  // If it's already an absolute URL
  if (pathOrUrl.startsWith('http://') || pathOrUrl.startsWith('https://')) {
    try {
      const url = new URL(pathOrUrl);
      // If it's github.io, localhost, or imobhall or any previously mapped internal host
      if (
        url.hostname.includes('github.io') ||
        url.hostname.includes('imobhall') ||
        url.hostname.includes('run.app') ||
        url.hostname.includes('localhost')
      ) {
        return `${protocol}://${domain}${url.pathname}${url.search}${url.hash}`;
      }
      return pathOrUrl;
    } catch (e) {
      return pathOrUrl;
    }
  }

  // Ensure path starts with slash
  const cleanPath = pathOrUrl.startsWith('/') ? pathOrUrl : `/${pathOrUrl}`;
  return `${protocol}://${domain}${cleanPath}`;
}

/**
 * Verifies if a target URL or path should be converted to the saved custom domain.
 */
export function verifyAndRewriteUrl(targetPathOrUrl: string): string {
  if (!targetPathOrUrl) return targetPathOrUrl;
  const customDomain = getCustomDomain();

  if (targetPathOrUrl.startsWith('http://') || targetPathOrUrl.startsWith('https://')) {
    try {
      const url = new URL(targetPathOrUrl);
      if (
        url.hostname.includes('github.io') || 
        url.hostname.includes('imobhall.com.br') ||
        url.hostname.includes('intelitz')
      ) {
        return `${url.protocol}//${customDomain}${url.pathname}${url.search}${url.hash}`;
      }
    } catch (e) {
      // Ignored
    }
  }

  return targetPathOrUrl;
}
