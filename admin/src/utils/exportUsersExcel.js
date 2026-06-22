import * as XLSX from 'xlsx'

const formatExportDate = (value) => {
  if (!value) return ''
  return new Date(value).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export const downloadUsersExcel = (users = [], { scope = 'all' } = {}) => {
  const rows = users.map((user, index) => ({
    '#': index + 1,
    Name: user.name || '',
    Email: user.email || '',
    Phone: user.phone || '',
    Role: 'Customer',
    Joined: formatExportDate(user.createdAt),
    'Last updated': formatExportDate(user.updatedAt),
  }))

  const worksheet = XLSX.utils.json_to_sheet(rows)
  worksheet['!cols'] = [
    { wch: 5 },
    { wch: 28 },
    { wch: 34 },
    { wch: 16 },
    { wch: 12 },
    { wch: 22 },
    { wch: 22 },
  ]

  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Users')

  const date = new Date().toISOString().slice(0, 10)
  const suffix = scope === 'filtered' ? 'filtered' : 'all'
  XLSX.writeFile(workbook, `akhdmedia-users-${suffix}-${date}.xlsx`)
}
