import { BRAND } from '../config/brand';

export const formatCurrency = (amount) => {
  if (!amount || amount <= 0) return 'Price on request';
  return `${BRAND.currencySymbol}${amount.toLocaleString('en-IN')}`;
};

export const capitalize = (value = '') =>
  value.charAt(0).toUpperCase() + value.slice(1);
