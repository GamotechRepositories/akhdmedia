export const cardClass = 'rounded-2xl border border-slate-200/80 bg-white shadow-sm shadow-slate-200/50'
export const sectionClass = `${cardClass} p-4 sm:p-6 lg:p-7`
export const primaryBtnClass =
  'inline-flex w-full items-center justify-center rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 sm:w-auto sm:px-5'
export const secondaryBtnClass =
  'inline-flex w-full items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 sm:w-auto sm:px-5'
export const exportBtnClass =
  'inline-flex w-full items-center justify-center rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto sm:px-5'
export const inputClass =
  'mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10'

export const compactFormClass =
  'overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm'

export const tableWrapClass = `${cardClass} admin-scrollbar overflow-x-auto`
export const tableScrollClass = `${tableWrapClass} max-h-[min(65vh,720px)] overflow-y-auto`

export const tableClass = 'w-full min-w-[36rem] divide-y divide-slate-200 text-sm'
export const tableWideClass = 'w-full min-w-[48rem] divide-y divide-slate-200 text-sm'
export const tableHeadClass = 'sticky top-0 z-10 bg-slate-50/95 backdrop-blur-sm'
export const tableBodyClass = 'divide-y divide-slate-100 bg-white'

export const thClass =
  'whitespace-nowrap px-3 py-2.5 text-left text-[11px] font-bold uppercase tracking-wide text-slate-500 sm:px-4 sm:py-3'
export const thRightClass = `${thClass} text-right`
export const thHideSm = `${thClass} hidden sm:table-cell`
export const thHideMd = `${thClass} hidden md:table-cell`
export const thHideLg = `${thClass} hidden lg:table-cell`

export const tdClass = 'px-3 py-2.5 align-middle text-slate-700 sm:px-4 sm:py-3'
export const tdPrimaryClass = `${tdClass} font-medium text-slate-900`
export const tdRightClass = `${tdClass} text-right`
export const tdHideSm = `${tdClass} hidden sm:table-cell`
export const tdHideMd = `${tdClass} hidden md:table-cell`
export const tdHideLg = `${tdClass} hidden lg:table-cell`

export const tableRowClass = 'transition-colors hover:bg-slate-50/80'
export const tableEmptyClass = 'px-4 py-10 text-center text-sm text-slate-500'

export const actionGroupClass =
  'flex flex-col items-end gap-1.5 sm:inline-flex sm:flex-row sm:flex-nowrap sm:items-center sm:justify-end sm:gap-2'
const actionBtnBase =
  'inline-flex h-8 w-[6.5rem] shrink-0 items-center justify-center rounded-lg border px-2 text-xs font-semibold transition'
export const actionEditClass = `${actionBtnBase} border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50`
export const actionDeleteClass = `${actionBtnBase} border-red-200 bg-white text-red-600 hover:bg-red-50`
export const actionViewClass = `${actionBtnBase} w-[4.5rem] border-transparent bg-slate-900 text-white hover:bg-slate-800`

export const actionIconBase =
  'inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border transition disabled:cursor-not-allowed disabled:opacity-50'
export const actionViewIconClass = `${actionIconBase} border-transparent bg-slate-900 text-white hover:bg-slate-800`
export const actionDeleteIconClass = `${actionIconBase} border-red-200 bg-white text-red-600 hover:bg-red-50`

export const paginationBtnClass =
  'rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 sm:text-sm'
export const paginationWrapClass = `${cardClass} flex flex-col gap-3 p-3 sm:flex-row sm:items-center sm:justify-between sm:p-4`

export const pageToolbarClass = 'flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between'
export const statGridClass = 'grid gap-3 sm:grid-cols-2 xl:grid-cols-3'
export const filterGridClass = 'grid gap-3 sm:grid-cols-2 lg:grid-cols-4'
