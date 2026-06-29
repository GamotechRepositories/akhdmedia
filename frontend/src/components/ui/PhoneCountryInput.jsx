import PhoneInput, { isValidPhoneNumber, parsePhoneNumber } from 'react-phone-number-input';
import flags from 'react-phone-number-input/flags';
import SearchableCountrySelect from './SearchableCountrySelect';

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

const PhoneCountryInput = ({
  value,
  onChange,
  disabled = false,
  id,
  name,
  className = 'phone-country-input',
  inputClassName,
}) => (
  <PhoneInput
    id={id}
    name={name}
    defaultCountry="IN"
    international={false}
    countryCallingCodeEditable={false}
    flags={flags}
    countrySelectComponent={SearchableCountrySelect}
    value={formatPhoneForDisplay(value)}
    onChange={(nextValue) => onChange(nextValue || '')}
    disabled={disabled}
    className={className}
    numberInputProps={{
      className: inputClassName || inputClass,
      placeholder: 'Mobile number',
    }}
  />
);

export default PhoneCountryInput;
