import { useEffect, useMemo, useRef, useState } from 'react'
import { inputClass } from './ui/adminUi'

const matchesQuery = (option, query) => {
  if (option.label.toLowerCase().includes(query)) return true

  return (option.keywords || []).some((keyword) =>
    String(keyword).toLowerCase().includes(query),
  )
}

const SearchableMultiSelect = ({
  value = [],
  onChange,
  options = [],
  placeholder = 'Select actors...',
  searchPlaceholder = 'Search...',
  disabled = false,
}) => {
  const containerRef = useRef(null)
  const searchInputRef = useRef(null)
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')

  const selectedValues = Array.isArray(value) ? value : []

  const selectedLabels = useMemo(
    () =>
      selectedValues
        .map((selectedValue) => options.find((option) => option.value === selectedValue)?.label)
        .filter(Boolean),
    [options, selectedValues],
  )

  const displayLabel = selectedLabels.length
    ? selectedLabels.join(', ')
    : placeholder

  const filteredOptions = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return options
    return options.filter((option) => matchesQuery(option, query))
  }, [options, search])

  useEffect(() => {
    if (!open) return undefined

    const handleClickOutside = (event) => {
      if (!containerRef.current?.contains(event.target)) {
        setOpen(false)
        setSearch('')
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  useEffect(() => {
    if (!open) return
    searchInputRef.current?.focus()
  }, [open])

  const toggleValue = (nextValue) => {
    if (selectedValues.includes(nextValue)) {
      onChange(selectedValues.filter((item) => item !== nextValue))
      return
    }

    onChange([...selectedValues, nextValue])
  }

  const clearAll = () => {
    onChange([])
    setOpen(false)
    setSearch('')
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((current) => !current)}
        className={`${inputClass} flex w-full items-center justify-between gap-2 text-left disabled:cursor-not-allowed disabled:bg-slate-100`}
      >
        <span
          className={`truncate ${selectedValues.length ? 'text-slate-900' : 'text-slate-500'}`}
        >
          {displayLabel}
        </span>
        <svg
          className={`h-4 w-4 shrink-0 text-slate-500 transition ${open ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open ? (
        <div className="absolute z-50 mt-1 w-full overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg">
          <div className="border-b border-slate-100 p-2">
            <input
              ref={searchInputRef}
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={searchPlaceholder}
              className="w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-sm text-slate-900 outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10"
            />
          </div>

          <ul className="max-h-56 overflow-y-auto py-1">
            <li>
              <button
                type="button"
                onClick={clearAll}
                className={`block w-full px-3 py-2 text-left text-sm transition hover:bg-slate-50 ${
                  selectedValues.length === 0
                    ? 'bg-slate-100 font-medium text-slate-900'
                    : 'text-slate-700'
                }`}
              >
                No actors
              </button>
            </li>

            {filteredOptions.map((option) => {
              const isSelected = selectedValues.includes(option.value)

              return (
                <li key={option.value}>
                  <button
                    type="button"
                    onClick={() => toggleValue(option.value)}
                    className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition hover:bg-slate-50 ${
                      isSelected ? 'bg-slate-100 font-medium text-slate-900' : 'text-slate-700'
                    }`}
                  >
                    <span
                      className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                        isSelected
                          ? 'border-slate-900 bg-slate-900 text-white'
                          : 'border-slate-300 bg-white'
                      }`}
                    >
                      {isSelected ? (
                        <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={3}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      ) : null}
                    </span>
                    <span className="truncate">{option.label}</span>
                  </button>
                </li>
              )
            })}

            {filteredOptions.length === 0 ? (
              <li className="px-3 py-2 text-xs text-slate-500">No matches found</li>
            ) : null}
          </ul>
        </div>
      ) : null}
    </div>
  )
}

export default SearchableMultiSelect
