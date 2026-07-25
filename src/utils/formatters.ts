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
