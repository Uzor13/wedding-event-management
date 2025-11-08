interface Guest {
  _id: string
  name: string
  phoneNumber: string
  rsvpStatus: boolean
  isUsed: boolean
  code: string
  uniqueId: string
}

export function exportToCSV(guests: Guest[], filename: string = 'guests.csv') {
  const headers = ['Name', 'Phone Number', 'RSVP Status', 'Verified', 'Code', 'Unique ID']

  const rows = guests.map(g => [
    g.name,
    g.phoneNumber,
    g.rsvpStatus ? 'Confirmed' : 'Pending',
    g.isUsed ? 'Yes' : 'No',
    g.code,
    g.uniqueId
  ])

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n')

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)

  link.setAttribute('href', url)
  link.setAttribute('download', filename)
  link.style.visibility = 'hidden'

  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}
