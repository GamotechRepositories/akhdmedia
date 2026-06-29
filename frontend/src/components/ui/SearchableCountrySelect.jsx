import { useEffect, useMemo, useRef, useState } from 'react';
import { getCountryCallingCode } from 'react-phone-number-input';

const SearchableCountrySelect = ({
  value,
  onChange,
  options,
  disabled = false,
  readOnly = false,
  iconComponent: Icon,
  onFocus,
  onBlur,
}) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const containerRef = useRef(null);
  const searchRef = useRef(null);
  const isDisabled = disabled || readOnly;

  const selectableOptions = useMemo(
    () => options.filter((option) => !option.divider && option.value),
    [options],
  );

  const selectedOption = useMemo(
    () => selectableOptions.find((option) => option.value === value),
    [selectableOptions, value],
  );

  const filteredOptions = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase().replace(/^\+/, '');
    if (!normalizedQuery) return selectableOptions;

    return selectableOptions.filter((option) => {
      const callingCode = getCountryCallingCode(option.value);
      const label = option.label?.toLowerCase() || '';

      return (
        label.includes(normalizedQuery) ||
        option.value.toLowerCase().includes(normalizedQuery) ||
        callingCode.includes(normalizedQuery)
      );
    });
  }, [query, selectableOptions]);

  useEffect(() => {
    if (!open) return undefined;

    const handlePointerDown = (event) => {
      if (!containerRef.current?.contains(event.target)) {
        setOpen(false);
        setQuery('');
      }
    };

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setOpen(false);
        setQuery('');
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [open]);

  useEffect(() => {
    if (open) {
      searchRef.current?.focus();
    }
  }, [open]);

  const handleToggle = () => {
    if (isDisabled) return;
    setOpen((current) => !current);
    if (open) setQuery('');
  };

  const handleSelect = (country) => {
    onChange(country);
    setOpen(false);
    setQuery('');
  };

  const callingCode = value ? getCountryCallingCode(value) : '';

  return (
    <div ref={containerRef} className="PhoneInputCountry searchable-country-select">
      <button
        type="button"
        className="searchable-country-select__trigger"
        onClick={handleToggle}
        onFocus={onFocus}
        onBlur={onBlur}
        disabled={isDisabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={selectedOption?.label || 'Select country'}
      >
        {value && Icon ? (
          <Icon aria-hidden country={value} label={selectedOption?.label} />
        ) : null}
        <span className="searchable-country-select__code">{callingCode ? `+${callingCode}` : '+--'}</span>
        <span className="PhoneInputCountrySelectArrow" aria-hidden />
      </button>

      {open && (
        <div className="searchable-country-select__dropdown" role="listbox">
          <div className="searchable-country-select__search-wrap">
            <input
              ref={searchRef}
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search country or code"
              className="searchable-country-select__search"
            />
          </div>

          <div className="searchable-country-select__list">
            {filteredOptions.length === 0 ? (
              <p className="searchable-country-select__empty">No countries found</p>
            ) : (
              filteredOptions.map((option) => {
                const optionCode = getCountryCallingCode(option.value);

                return (
                  <button
                    key={option.value}
                    type="button"
                    role="option"
                    aria-selected={option.value === value}
                    className={`searchable-country-select__option${
                      option.value === value ? ' searchable-country-select__option--selected' : ''
                    }`}
                    onClick={() => handleSelect(option.value)}
                  >
                    {Icon ? (
                      <Icon aria-hidden country={option.value} label={option.label} />
                    ) : null}
                    <span className="searchable-country-select__option-label">{option.label}</span>
                    <span className="searchable-country-select__option-code">+{optionCode}</span>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchableCountrySelect;
