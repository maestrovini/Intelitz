/**
 * Utility functions for formatting numbers, currency, and percentages in pt-BR locale.
 */

export function formatPercentBR(value: number | undefined | null, decimals = 2): string {
  if (value === undefined || value === null || isNaN(value)) {
    return (0).toLocaleString('pt-BR', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  }
  if (!isFinite(value)) {
    return '∞';
  }
  return value.toLocaleString('pt-BR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export function formatBRL(value: number | undefined | null): string {
  if (value === undefined || value === null || isNaN(value)) {
    return 'R$ 0,00';
  }
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/**
  * Formats string so that the first letter of each word is capitalized and all remaining letters are lowercase.
  * Preserves spaces and punctuation, handling Brazilian accents properly.
  */
export function toTitleCase(str: string | undefined | null): string {
  if (str === undefined || str === null) return '';
  const text = String(str);
  if (!text) return '';

  return text.replace(/[\p{L}\p{M}]+/gu, (word) => {
    return word.charAt(0).toLocaleUpperCase('pt-BR') + word.slice(1).toLocaleLowerCase('pt-BR');
  });
}

