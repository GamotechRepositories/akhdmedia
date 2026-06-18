import { BRAND } from '../config/brand';
import { roundUpPayableAmount } from './money';

export const formatCurrency = (amount) => {
  if (!amount || amount <= 0) return 'Price on request';
  return `${BRAND.currencySymbol}${amount.toLocaleString('en-IN')}`;
};

export const formatPayableCurrency = (amount) => formatCurrency(roundUpPayableAmount(amount));

/** Helvetica in jsPDF cannot render ₹ — use Rs. for PDF output */
export const formatCurrencyForPdf = (amount) => {
  if (!amount || amount <= 0) return 'Price on request';
  return `Rs. ${amount.toLocaleString('en-IN')}`;
};

export const capitalize = (value = '') =>
  value.charAt(0).toUpperCase() + value.slice(1);
