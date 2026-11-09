export const money = (value) => new Intl.NumberFormat('en-IN', {
  style: 'currency', currency: 'INR', maximumFractionDigits: 0
}).format(Number(value || 0))

export const makeId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

export const blankEvent = () => ({
  id: makeId(), name: 'Wedding', date: '', startTime: '', endTime: '',
  venue: '', city: '', photographers: 2, videographers: 1, notes: '',
  items: [
    { id: makeId(), name: 'Photography coverage', qty: 1, rate: 0 },
    { id: makeId(), name: 'Videography coverage', qty: 1, rate: 0 }
  ]
})

export const eventTotal = (event) => (event.items || []).reduce(
  (sum, item) => sum + Number(item.qty || 0) * Number(item.rate || 0), 0
)

export const quoteTotal = (quote) => (quote.events || []).reduce(
  (sum, event) => sum + eventTotal(event), 0
) - Number(quote.discount || 0)

export const initialQuote = () => ({
  id: makeId(), quoteNo: `MC-${new Date().getFullYear()}-${String(Date.now()).slice(-5)}`,
  clientName: '', phone: '', email: '', address: '', occasion: 'Wedding',
  quoteDate: new Date().toISOString().slice(0, 10), validUntil: '',
  notes: '', terms: '50% advance to confirm the booking. Remaining balance to be cleared as agreed before delivery.',
  discount: 0, events: [blankEvent()], status: 'Draft', createdAt: new Date().toISOString()
})