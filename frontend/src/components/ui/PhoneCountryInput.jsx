import PhoneInput, { isValidPhoneNumber, parsePhoneNumber } from 'react-phone-number-input';
import flags from 'react-phone-number-input/flags';

const inputClass =
  'w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none transition focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10';

export const normalizePhoneValue = (value = '') => {
  const trimmed = String(value).trim();
  if (!trimmed) return '';

  if (trimmed.startsWith('+')) {
    return trimmed;
  }

  const digits = trimmed.replace(/\D/g, '');
  if (digits.length === 10) {
    return `+91${digits}`;
  }

  if (digits.length === 12 && digits.startsWith('91')) {
    return `+${digits}`;
  }

  return trimmed;
};

export const formatPhoneForDisplay = (value = '') => {
  const normalized = normalizePhoneValue(value);
  if (!normalized) return '';

  try {
    const parsed = parsePhoneNumber(normalized);
    return parsed?.number || normalized;
  } catch {
    return normalized;
  }
};

export const isPhoneNumberValid = (value = '') => {
  const normalized = normalizePhoneValue(value);
  if (!normalized) return false;
  return isValidPhoneNumber(normalized);
};

const PhoneCountryInput = ({ value, onChange, disabled = false, id, name }) => (
  <PhoneInput
    id={id}
    name={name}
    defaultCountry="IN"
    international
    countryCallingCodeEditable={false}
    flags={flags}
    value={formatPhoneForDisplay(value)}
    onChange={(nextValue) => onChange(nextValue || '')}
    disabled={disabled}
    className="phone-country-input"
    numberInputProps={{
      className: inputClass,
      placeholder: 'Mobile number',
    }}
  />
);

export default PhoneCountryInput;
