function escapeCsvCell(cell: string): string {
  if (/^[=+\-@\t\r]/.test(cell)) {
    cell = '\'' + cell
  }
  if (cell.includes('"') || cell.includes(';') || cell.includes('\n')) {
    return '"' + cell.replace(/"/g, '""') + '"'
  }
  return cell
}

export function downloadCsv(filename: string, headers: string[], rows: string[][]): void {
  const csvContent = [
    headers.map(escapeCsvCell).join(';'),
    ...rows.map(row => row.map(escapeCsvCell).join(';')),
  ].join('\n')

  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}
