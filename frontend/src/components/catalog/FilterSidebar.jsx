import { useState } from 'react';
import { SORT_OPTIONS } from '../../constants/catalog';

const ChevronIcon = ({ isOpen }) => (
  <svg
    className={`h-4 w-4 text-gray-500 transition-all duration-300 ${isOpen ? 'rotate-180 text-gray-900' : ''}`}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2.5}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
  </svg>
);

const FilterSection = ({ title, isOpen, onToggle, activeCount, children, icon: Icon }) => (
  <div className="border-b border-gray-200 last:border-0">
    <button
      type="button"
      onClick={onToggle}
      className="group flex w-full items-center justify-between px-6 py-4 transition-all hover:bg-gray-50/50"
    >
      <div className="flex items-center gap-3">
        {Icon && <Icon active={isOpen} />}
        <h3 className={`text-sm font-semibold tracking-wide ${isOpen ? 'text-gray-900' : 'text-gray-600'}`}>
          {title}
        </h3>
        {activeCount > 0 && (
          <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-gray-900 px-1.5 text-[10px] font-bold text-white">
            {activeCount}
          </span>
        )}
      </div>
      <ChevronIcon isOpen={isOpen} />
    </button>
    <div className={`overflow-hidden transition-all duration-300 ${isOpen ? 'max-h-[600px] pb-4 opacity-100' : 'max-h-0 opacity-0'}`}>
      <div className="px-6 pt-2">{children}</div>
    </div>
  </div>
);

const CustomRadio = ({ label, checked, onChange }) => (
  <label className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-2.5 transition hover:bg-gray-50">
    <input type="radio" className="sr-only" checked={checked} onChange={onChange} />
    <span className={`flex h-5 w-5 items-center justify-center rounded-full border-2 ${checked ? 'border-gray-900' : 'border-gray-300'}`}>
      <span className={`h-2.5 w-2.5 rounded-full bg-gray-900 transition ${checked ? 'scale-100' : 'scale-0'}`} />
    </span>
    <span className={`text-sm ${checked ? 'font-semibold text-gray-900' : 'text-gray-600'}`}>{label}</span>
  </label>
);

const CustomCheckbox = ({ label, checked, onChange }) => (
  <label className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-2.5 transition hover:bg-gray-50">
    <input type="checkbox" className="sr-only" checked={checked} onChange={onChange} />
    <span className={`flex h-5 w-5 items-center justify-center rounded border-2 ${checked ? 'border-gray-900 bg-gray-900' : 'border-gray-300 bg-white'}`}>
      {checked && (
        <svg className="h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      )}
    </span>
    <span className={`text-sm ${checked ? 'font-semibold text-gray-900' : 'text-gray-600'}`}>{label}</span>
  </label>
);

const FilterSidebar = ({
  filters,
  onFilterChange,
  onClearFilters,
  brands = [],
  resolutions = [],
  fpsOptions = [],
}) => {
  const [openSections, setOpenSections] = useState({
    sort: true,
    price: true,
    brand: true,
    resolution: true,
    fps: false,
  });

  const toggle = (section) =>
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));

  const update = (key, value) => onFilterChange({ ...filters, [key]: value });

  const toggleListItem = (key, item) => {
    const list = filters[key] || [];
    const next = list.includes(item) ? list.filter((i) => i !== item) : [...list, item];
    update(key, next);
  };

  const activeCount =
    (filters.priceRange ? 1 : 0) +
    (filters.brands?.length || 0) +
    (filters.resolutions?.length || 0) +
    (filters.fps?.length || 0) +
    (filters.sortBy && filters.sortBy !== 'default' ? 1 : 0);

  return (
    <div className="sticky top-[48px] mt-0 flex max-h-[calc(100vh-48px)] w-full flex-col overflow-hidden border border-gray-200 bg-white shadow-sm transition-shadow duration-300 hover:shadow-md">
      <div className="flex items-center justify-between border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white px-6 py-3">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-gray-900 p-2">
            <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">Filters</h2>
            {activeCount > 0 && (
              <p className="mt-0.5 text-xs text-gray-500">{activeCount} active</p>
            )}
          </div>
        </div>
        {activeCount > 0 && (
          <button
            type="button"
            onClick={onClearFilters}
            className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700 transition hover:bg-gray-100"
          >
            Clear All
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto py-2 scrollbar-hide">
        <FilterSection
          title="Sort By"
          isOpen={openSections.sort}
          onToggle={() => toggle('sort')}
          activeCount={filters.sortBy && filters.sortBy !== 'default' ? 1 : 0}
          icon={({ active }) => (
            <svg className={`h-4 w-4 ${active ? 'text-gray-900' : 'text-gray-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
            </svg>
          )}
        >
          <div className="space-y-1">
            {SORT_OPTIONS.map((opt) => (
              <CustomRadio
                key={opt.id}
                label={opt.label}
                checked={filters.sortBy === opt.id}
                onChange={() => update('sortBy', opt.id)}
              />
            ))}
          </div>
        </FilterSection>

        <FilterSection
          title="Price Range"
          isOpen={openSections.price}
          onToggle={() => toggle('price')}
          activeCount={filters.priceRange ? 1 : 0}
          icon={({ active }) => (
            <svg className={`h-4 w-4 ${active ? 'text-gray-900' : 'text-gray-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )}
        >
          <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
            <div className="flex items-center gap-3">
              <input
                type="number"
                placeholder="Min"
                value={filters.priceRange?.min ?? ''}
                onChange={(e) =>
                  update('priceRange', {
                    ...filters.priceRange,
                    min: e.target.value ? Number(e.target.value) : undefined,
                  })
                }
                className="w-full rounded-lg border-2 border-gray-200 px-3 py-2.5 text-sm font-semibold outline-none focus:border-gray-900"
              />
              <span className="font-bold text-gray-400">-</span>
              <input
                type="number"
                placeholder="Max"
                value={filters.priceRange?.max ?? ''}
                onChange={(e) =>
                  update('priceRange', {
                    ...filters.priceRange,
                    max: e.target.value ? Number(e.target.value) : undefined,
                  })
                }
                className="w-full rounded-lg border-2 border-gray-200 px-3 py-2.5 text-sm font-semibold outline-none focus:border-gray-900"
              />
            </div>
          </div>
        </FilterSection>

        {brands.length > 0 && (
          <FilterSection
            title="Contributors"
            isOpen={openSections.brand}
            onToggle={() => toggle('brand')}
            activeCount={filters.brands?.length || 0}
            icon={({ active }) => (
              <svg className={`h-4 w-4 ${active ? 'text-gray-900' : 'text-gray-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
            )}
          >
            <div className="max-h-56 space-y-0.5 overflow-y-auto scrollbar-hide">
              {brands.map((brand) => (
                <CustomCheckbox
                  key={brand}
                  label={brand}
                  checked={(filters.brands || []).includes(brand)}
                  onChange={() => toggleListItem('brands', brand)}
                />
              ))}
            </div>
          </FilterSection>
        )}

        {resolutions.length > 0 && (
          <FilterSection
            title="Resolution"
            isOpen={openSections.resolution}
            onToggle={() => toggle('resolution')}
            activeCount={filters.resolutions?.length || 0}
            icon={({ active }) => (
              <svg className={`h-4 w-4 ${active ? 'text-gray-900' : 'text-gray-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1h-4a1 1 0 01-1-1V5z" />
              </svg>
            )}
          >
            <div className="flex flex-wrap gap-2.5">
              {resolutions.map((res) => {
                const active = (filters.resolutions || []).includes(res);
                return (
                  <button
                    key={res}
                    type="button"
                    onClick={() => toggleListItem('resolutions', res)}
                    className={`min-w-[44px] rounded-lg border-2 px-4 py-2.5 text-sm font-bold transition ${
                      active
                        ? 'border-gray-900 bg-gray-900 text-white shadow-lg'
                        : 'border-gray-300 bg-white text-gray-700 hover:border-gray-500'
                    }`}
                  >
                    {res}
                  </button>
                );
              })}
            </div>
          </FilterSection>
        )}

        {fpsOptions.length > 0 && (
          <FilterSection
            title="Frame Rate"
            isOpen={openSections.fps}
            onToggle={() => toggle('fps')}
            activeCount={filters.fps?.length || 0}
            icon={({ active }) => (
              <svg className={`h-4 w-4 ${active ? 'text-gray-900' : 'text-gray-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            )}
          >
            <div className="space-y-0.5">
              {fpsOptions.map((fps) => (
                <CustomCheckbox
                  key={fps}
                  label={fps}
                  checked={(filters.fps || []).includes(fps)}
                  onChange={() => toggleListItem('fps', fps)}
                />
              ))}
            </div>
          </FilterSection>
        )}
      </div>
    </div>
  );
};

export default FilterSidebar;
