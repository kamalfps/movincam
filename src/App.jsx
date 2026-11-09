import React, { useEffect, useMemo, useState } from 'react'
import { supabase, isSupabaseConfigured } from './lib/supabase'
import { blankEvent, eventTotal, initialQuote, money, quoteTotal, makeId } from './lib/quotes'
import { jsPDF } from 'jspdf'
import {
  Aperture, Plus, FileText, LayoutDashboard, Settings, Search, Download,
  Eye, Pencil, Trash2, Copy, X, ChevronRight, CalendarDays, MapPin,
  Camera, Video, IndianRupee, CheckCircle2, Clock3, Menu, Save, Sparkles
} from 'lucide-react'

const LOCAL_KEY = 'movincam_quotes_v1'
const defaultServices = [
  { name: 'Traditional photography', rate: 8000 },
  { name: 'Candid photography', rate: 12000 },
  { name: 'Traditional videography', rate: 10000 },
  { name: 'Cinematic videography', rate: 15000 },
  { name: 'Drone coverage', rate: 5000 },
  { name: 'LED screen', rate: 7000 },
  { name: 'Photo album', rate: 6000 },
  { name: 'Reel / teaser edit', rate: 3000 },
  { name: 'Pre-wedding film', rate: 18000 }
]

function App() {
  const [page, setPage] = useState('dashboard')
  const [quotes, setQuotes] = useState([])
  const [services, setServices] = useState(defaultServices)
  const [activeQuote, setActiveQuote] = useState(null)
  const [search, setSearch] = useState('')
  const [toast, setToast] = useState('')
  const [mobileNav, setMobileNav] = useState(false)
  const [company, setCompany] = useState({ name: 'MOVINCAM.ART', phone: '', email: '', address: '', instagram: '@movincam.art' })

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem(LOCAL_KEY) || 'null')
    if (saved?.quotes) setQuotes(saved.quotes)
    if (saved?.services) setServices(saved.services)
    if (saved?.company) setCompany(saved.company)
    if (isSupabaseConfigured) loadFromSupabase()
  }, [])

  useEffect(() => {
    localStorage.setItem(LOCAL_KEY, JSON.stringify({ quotes, services, company }))
  }, [quotes, services, company])

  async function loadFromSupabase() {
    const { data, error } = await supabase.from('quotations').select('*').order('created_at', { ascending: false })
    if (!error && data?.length) setQuotes(data.map(row => row.data))
  }

  async function persistQuote(quote) {
    const exists = quotes.some(q => q.id === quote.id)
    const next = exists ? quotes.map(q => q.id === quote.id ? quote : q) : [quote, ...quotes]
    setQuotes(next)
    if (isSupabaseConfigured) {
      const { error } = await supabase.from('quotations').upsert({
        id: quote.id, quote_no: quote.quoteNo, client_name: quote.clientName,
        status: quote.status, total: quoteTotal(quote), data: quote
      })
      if (error) notify('Saved locally. Supabase: ' + error.message)
      else notify('Quotation saved')
    } else notify('Quotation saved on this device')
  }

  function notify(message) {
    setToast(message)
    window.setTimeout(() => setToast(''), 3200)
  }

  function createNew() {
    setActiveQuote(initialQuote())
    setPage('editor')
  }

  function editQuote(q) { setActiveQuote(structuredClone(q)); setPage('editor') }
  function duplicateQuote(q) {
    const copy = { ...structuredClone(q), id: makeId(), quoteNo: `MC-${new Date().getFullYear()}-${String(Date.now()).slice(-5)}`, clientName: q.clientName + ' (Copy)', status: 'Draft', createdAt: new Date().toISOString() }
    setActiveQuote(copy); setPage('editor')
  }
  function deleteQuote(id) {
    if (!confirm('Delete this quotation permanently?')) return
    setQuotes(prev => prev.filter(q => q.id !== id))
    if (isSupabaseConfigured) supabase.from('quotations').delete().eq('id', id)
    notify('Quotation deleted')
  }

  const filtered = useMemo(() => quotes.filter(q =>
    `${q.clientName} ${q.quoteNo} ${q.occasion}`.toLowerCase().includes(search.toLowerCase())
  ), [quotes, search])

  function updateQuote(key, value) { setActiveQuote(q => ({ ...q, [key]: value })) }
  function updateEvent(eventId, key, value) {
    updateQuote('events', activeQuote.events.map(e => e.id === eventId ? { ...e, [key]: value } : e))
  }
  function updateItem(eventId, itemId, key, value) {
    updateQuote('events', activeQuote.events.map(e => e.id === eventId ? {
      ...e, items: e.items.map(item => item.id === itemId ? { ...item, [key]: value } : item)
    } : e))
  }
  function addEvent() { updateQuote('events', [...activeQuote.events, blankEvent()]) }
  function removeEvent(id) { updateQuote('events', activeQuote.events.filter(e => e.id !== id)) }
  function addItem(eventId) {
    updateQuote('events', activeQuote.events.map(e => e.id === eventId ? {
      ...e, items: [...e.items, { id: makeId(), name: '', qty: 1, rate: 0 }]
    } : e))
  }
  function removeItem(eventId, itemId) {
    updateQuote('events', activeQuote.events.map(e => e.id === eventId ? {
      ...e, items: e.items.filter(i => i.id !== itemId)
    } : e))
  }
  function addCatalogueItem(eventId, service) {
    updateQuote('events', activeQuote.events.map(e => e.id === eventId ? {
      ...e, items: [...e.items, { id: makeId(), name: service.name, qty: 1, rate: service.rate }]
    } : e))
  }

  function generatePdf(q) {
    const doc = new jsPDF({ unit: 'mm', format: 'a4' })
    const pageW = 210, margin = 17
    let y = 18
    doc.setFillColor(17, 18, 20); doc.rect(0, 0, pageW, 48, 'F')
    doc.setTextColor(255, 255, 255); doc.setFont('helvetica', 'bold'); doc.setFontSize(22)
    doc.text(company.name || 'MOVINCAM.ART', margin, 22)
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(216, 190, 139)
    doc.text('PHOTOGRAPHY  /  CINEMATOGRAPHY', margin, 30)
    doc.setTextColor(255, 255, 255); doc.setFontSize(9)
    doc.text(`QUOTATION  ${q.quoteNo}`, pageW - margin, 22, { align: 'right' })
    doc.text(`DATE  ${q.quoteDate || '—'}`, pageW - margin, 29, { align: 'right' })
    y = 61
    doc.setTextColor(24, 25, 27); doc.setFont('helvetica', 'bold'); doc.setFontSize(13)
    doc.text('QUOTATION FOR', margin, y)
    doc.setFont('helvetica', 'normal'); doc.setFontSize(10); y += 8
    doc.text(q.clientName || 'Client name', margin, y)
    if (q.phone) { y += 5; doc.text(q.phone, margin, y) }
    if (q.email) { y += 5; doc.text(q.email, margin, y) }
    y += 10
    doc.setDrawColor(220, 220, 220); doc.line(margin, y, pageW - margin, y); y += 9
    doc.setFont('helvetica', 'bold'); doc.setFontSize(12); doc.text('EVENT DETAILS & COVERAGE', margin, y); y += 8
    q.events.forEach((event, index) => {
      if (y > 245) { doc.addPage(); y = 20 }
      doc.setFillColor(246, 243, 237); doc.roundedRect(margin, y - 5, pageW - margin * 2, 9, 2, 2, 'F')
      doc.setFont('helvetica', 'bold'); doc.setFontSize(10); doc.setTextColor(38, 38, 38)
      doc.text(`${index + 1}. ${event.name || 'Event'}`, margin + 3, y + 1)
      y += 10
      doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(90, 90, 90)
      const details = [event.date, event.startTime && `${event.startTime}${event.endTime ? ' – ' + event.endTime : ''}`, [event.venue, event.city].filter(Boolean).join(', ')].filter(Boolean).join('  |  ')
      if (details) { doc.text(details, margin + 2, y); y += 6 }
      doc.text(`Photography team: ${event.photographers || 0}   •   Videography team: ${event.videographers || 0}`, margin + 2, y); y += 7
      if (event.notes) { doc.text(doc.splitTextToSize(`Notes: ${event.notes}`, pageW - margin * 2 - 4), margin + 2, y); y += 8 }
      if (y > 258) { doc.addPage(); y = 20 }
    })
    y += 3
    if (y > 230) { doc.addPage(); y = 20 }
    doc.setDrawColor(210, 210, 210); doc.line(margin, y, pageW - margin, y); y += 10
    doc.setFont('helvetica', 'bold'); doc.setFontSize(12); doc.setTextColor(24, 25, 27)
    doc.text('QUOTATION SUMMARY', margin, y); y += 8
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9)
    doc.text('Complete photography & videography coverage for the events listed above.', margin, y); y += 8
    const total = quoteTotal(q)
    doc.setFillColor(17, 18, 20); doc.roundedRect(margin, y, pageW - margin * 2, 20, 2, 2, 'F')
    doc.setTextColor(255, 255, 255); doc.setFont('helvetica', 'bold'); doc.setFontSize(10)
    doc.text('GRAND TOTAL', margin + 5, y + 12)
    doc.setFontSize(16); doc.setTextColor(216, 190, 139)
    doc.text(money(total), pageW - margin - 5, y + 13, { align: 'right' })
    y += 30
    if (q.notes) { doc.setTextColor(40,40,40); doc.setFontSize(10); doc.setFont('helvetica','bold'); doc.text('Additional notes', margin, y); y += 6; doc.setFont('helvetica','normal'); doc.setFontSize(9); doc.text(doc.splitTextToSize(q.notes, pageW - margin * 2), margin, y); y += 12 }
    doc.setTextColor(40,40,40); doc.setFont('helvetica','bold'); doc.setFontSize(10); doc.text('TERMS & CONDITIONS', margin, y); y += 6
    doc.setFont('helvetica','normal'); doc.setFontSize(8); doc.text(doc.splitTextToSize(q.terms || '', pageW - margin * 2), margin, y)
    const pages = doc.getNumberOfPages()
    for (let p = 1; p <= pages; p++) {
      doc.setPage(p); doc.setDrawColor(220,220,220); doc.line(margin, 282, pageW - margin, 282)
      doc.setFontSize(8); doc.setTextColor(130,130,130); doc.text(company.name || 'MOVINCAM.ART', margin, 288)
      doc.text(`Page ${p} of ${pages}`, pageW - margin, 288, { align: 'right' })
    }
    doc.save(`${(q.clientName || 'Client').replace(/[^a-z0-9]/gi, '-')}-${q.quoteNo}.pdf`)
  }

  const nav = [
    { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
    { id: 'quotations', label: 'Quotations', icon: FileText },
    { id: 'catalogue', label: 'Price catalogue', icon: IndianRupee },
    { id: 'settings', label: 'Company settings', icon: Settings }
  ]

  return <div className="app-shell">
    <aside className={`sidebar ${mobileNav ? 'open' : ''}`}>
      <div className="brand"><div className="brand-mark"><Aperture size={21}/></div><div><b>MOVINCAM<span>.ART</span></b><small>QUOTATION STUDIO</small></div></div>
      <div className="side-label">WORKSPACE</div>
      <nav>{nav.map(item => <button key={item.id} className={`nav-item ${page === item.id ? 'active' : ''}`} onClick={() => { setPage(item.id); setMobileNav(false) }}><item.icon size={17}/>{item.label}{page === item.id && <ChevronRight size={15} className="nav-arrow"/>}</button>)}</nav>
      <div className="sidebar-bottom"><div className="avatar">MC</div><div><b>Studio owner</b><small>Administrator</small></div><span className="online-dot"/></div>
    </aside>
    <main className="main-area">
      <header className="topbar"><button className="icon-button mobile-menu" onClick={() => setMobileNav(!mobileNav)}><Menu/></button><div className="breadcrumb">Workspace <ChevronRight size={14}/> <b>{nav.find(n => n.id === page)?.label || 'Create quotation'}</b></div><div className="top-actions"><span className={`connection ${isSupabaseConfigured ? 'connected' : ''}`}><i/>{isSupabaseConfigured ? 'Supabase connected' : 'Local preview mode'}</span><button className="new-button" onClick={createNew}><Plus size={16}/> New quotation</button></div></header>
      <div className="content">
        {page === 'dashboard' && <Dashboard quotes={quotes} onCreate={createNew} onOpen={editQuote} onAll={() => setPage('quotations')}/>}
        {page === 'quotations' && <section><div className="page-heading"><div><span className="eyebrow">YOUR DOCUMENTS</span><h1>Quotations</h1><p>Manage, update and send your client quotations.</p></div><button className="primary-button" onClick={createNew}><Plus size={16}/> Create quotation</button></div><div className="toolbar"><div className="searchbox"><Search size={17}/><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search client or quotation number..."/></div><span className="muted">{filtered.length} quotations</span></div><QuoteTable quotes={filtered} onEdit={editQuote} onPdf={generatePdf} onDuplicate={duplicateQuote} onDelete={deleteQuote}/></section>}
        {page === 'editor' && activeQuote && <Editor quote={activeQuote} services={services} onChange={updateQuote} onEvent={updateEvent} onItem={updateItem} onAddEvent={addEvent} onRemoveEvent={removeEvent} onAddItem={addItem} onRemoveItem={removeItem} onAddCatalogue={addCatalogueItem} onSave={() => persistQuote(activeQuote)} onPdf={() => generatePdf(activeQuote)} onBack={() => setPage('quotations')}/>}
        {page === 'catalogue' && <Catalogue services={services} setServices={setServices} notify={notify}/>}
        {page === 'settings' && <SettingsPage company={company} setCompany={setCompany} notify={notify}/>}
      </div>
    </main>
    {toast && <div className="toast"><CheckCircle2 size={17}/>{toast}</div>}
  </div>
}

function Dashboard({ quotes, onCreate, onOpen, onAll }) {
  const totalValue = quotes.reduce((s, q) => s + quoteTotal(q), 0)
  const stats = [
    { label: 'Total quotations', value: quotes.length, icon: FileText, tone: 'lavender' },
    { label: 'Accepted', value: quotes.filter(q => q.status === 'Accepted').length, icon: CheckCircle2, tone: 'green' },
    { label: 'Pending', value: quotes.filter(q => q.status === 'Pending').length, icon: Clock3, tone: 'amber' },
    { label: 'Quoted value', value: money(totalValue), icon: IndianRupee, tone: 'blue' }
  ]
  return <section><div className="welcome-row"><div><span className="eyebrow">STUDIO WORKSPACE</span><h1>Good work starts<br/>with a great proposal.</h1><p>Create clear, elegant quotations for every celebration.</p></div><div className="welcome-art"><div className="art-ring ring-one"/><div className="art-ring ring-two"/><Aperture size={68}/><span>THE ART OF<br/>EVERY FRAME</span></div></div>
    <div className="stats-grid">{stats.map(s => <div className="stat-card" key={s.label}><div className={`stat-icon ${s.tone}`}><s.icon size={18}/></div><span>{s.label}</span><b>{s.value}</b></div>)}</div>
    <div className="section-title"><div><h2>Recent quotations</h2><p>Your latest client proposals</p></div><button className="text-button" onClick={onAll}>View all <ChevronRight size={15}/></button></div>
    {quotes.length ? <QuoteTable quotes={quotes.slice(0,5)} onEdit={onOpen} onPdf={q => {}} compact/> : <div className="empty-state"><div className="empty-icon"><FileText size={25}/></div><h3>No quotations yet</h3><p>Create your first client quotation to get started.</p><button className="primary-button" onClick={onCreate}><Plus size={16}/> Create first quotation</button></div>}
  </section>
}

function QuoteTable({ quotes, onEdit, onPdf, onDuplicate, onDelete, compact = false }) {
  if (!quotes.length) return <div className="empty-state small-empty"><p>No matching quotations found.</p></div>
  return <div className="table-wrap"><table><thead><tr><th>QUOTATION</th><th>CLIENT</th><th>EVENTS</th><th>GRAND TOTAL</th><th>STATUS</th><th></th></tr></thead><tbody>{quotes.map(q => <tr key={q.id}><td><b className="quote-number">{q.quoteNo}</b><small>{q.quoteDate || '—'}</small></td><td><b>{q.clientName || 'Untitled client'}</b><small>{q.occasion || 'Event'}</small></td><td>{q.events?.length || 0} event(s)</td><td><b>{money(quoteTotal(q))}</b></td><td><span className={`status ${String(q.status).toLowerCase()}`}>{q.status}</span></td><td><div className="row-actions"><button title="Edit" onClick={() => onEdit(q)}><Pencil size={15}/></button>{!compact && <><button title="Download PDF" onClick={() => onPdf(q)}><Download size={15}/></button><button title="Duplicate" onClick={() => onDuplicate(q)}><Copy size={15}/></button><button title="Delete" onClick={() => onDelete(q.id)}><Trash2 size={15}/></button></>}</div></td></tr>)}</tbody></table></div>
}

function Editor({ quote, services, onChange, onEvent, onItem, onAddEvent, onRemoveEvent, onAddItem, onRemoveItem, onAddCatalogue, onSave, onPdf, onBack }) {
  const [expanded, setExpanded] = useState(quote.events?.[0]?.id)
  const [preview, setPreview] = useState(false)
  return <section><div className="page-heading editor-heading"><div><button className="back-link" onClick={onBack}>← Back to quotations</button><span className="eyebrow">QUOTATION BUILDER</span><h1>{quote.clientName ? `Quotation for ${quote.clientName}` : 'Create quotation'}</h1><p>Build one complete proposal with multiple event schedules.</p></div><div className="heading-actions"><button className="secondary-button" onClick={() => setPreview(!preview)}><Eye size={16}/>{preview ? 'Edit details' : 'Preview'}</button><button className="primary-button" onClick={onSave}><Save size={16}/> Save quotation</button></div></div>
    {preview ? <QuotePreview quote={quote}/> : <div className="editor-layout"><div className="editor-main">
      <div className="form-card"><div className="card-heading"><div className="step-number">01</div><div><h2>Client information</h2><p>Who is this quotation prepared for?</p></div></div><div className="form-grid"><Field label="Client full name" value={quote.clientName} onChange={v => onChange('clientName',v)} placeholder="e.g. Rahul Sharma"/><Field label="Mobile number" value={quote.phone} onChange={v => onChange('phone',v)} placeholder="+91 00000 00000"/><Field label="Email address" value={quote.email} onChange={v => onChange('email',v)} placeholder="client@email.com"/><Field label="Occasion / package" value={quote.occasion} onChange={v => onChange('occasion',v)} placeholder="Wedding celebration"/><Field label="Quotation date" type="date" value={quote.quoteDate} onChange={v => onChange('quoteDate',v)}/><Field label="Valid until" type="date" value={quote.validUntil} onChange={v => onChange('validUntil',v)}/><div className="field full"><label>Client address (optional)</label><input value={quote.address || ''} onChange={e => onChange('address',e.target.value)} placeholder="Address / city"/></div></div></div>
      <div className="events-heading"><div><span className="eyebrow">EVENT SCHEDULE</span><h2>Events & coverage</h2><p>Add each function separately. All events roll into one grand total.</p></div><button className="secondary-button" onClick={onAddEvent}><Plus size={16}/> Add event</button></div>
      {(quote.events || []).map((event, index) => <div className="event-card" key={event.id}><button className="event-top" onClick={() => setExpanded(expanded === event.id ? null : event.id)}><div className="event-index">{String(index+1).padStart(2,'0')}</div><div className="event-top-info"><b>{event.name || `Event ${index+1}`}</b><small>{event.date || 'Date not selected'} · {[event.venue,event.city].filter(Boolean).join(', ') || 'Location not added'}</small></div><strong>{money(eventTotal(event))}</strong><ChevronRight className={expanded === event.id ? 'rotate' : ''} size={18}/></button>
        {expanded === event.id && <div className="event-body"><div className="form-grid"><Field label="Event name" value={event.name} onChange={v => onEvent(event.id,'name',v)} placeholder="Haldi / Wedding / Reception"/><Field label="Event date" type="date" value={event.date} onChange={v => onEvent(event.id,'date',v)}/><Field label="Start time" type="time" value={event.startTime} onChange={v => onEvent(event.id,'startTime',v)}/><Field label="End time" type="time" value={event.endTime} onChange={v => onEvent(event.id,'endTime',v)}/><Field label="Venue / location" value={event.venue} onChange={v => onEvent(event.id,'venue',v)} placeholder="Venue name"/><Field label="City" value={event.city} onChange={v => onEvent(event.id,'city',v)} placeholder="City"/></div>
          <div className="team-grid"><div className="team-field"><Camera size={17}/><div><label>Photographers</label><input type="number" min="0" value={event.photographers} onChange={e => onEvent(event.id,'photographers',Number(e.target.value))}/></div></div><div className="team-field"><Video size={17}/><div><label>Videographers</label><input type="number" min="0" value={event.videographers} onChange={e => onEvent(event.id,'videographers',Number(e.target.value))}/></div></div></div>
          <div className="service-head"><div><h3>Services & pricing</h3><p>Prices are unique to this quotation and won't change your catalogue.</p></div><select onChange={e => { const svc = services.find(s => s.name === e.target.value); if (svc) onAddCatalogue(event.id,svc); e.target.value = '' }}><option value="">+ Add from catalogue</option>{services.map(s => <option key={s.name} value={s.name}>{s.name} — {money(s.rate)}</option>)}</select></div>
          <div className="line-items"><div className="line-header"><span>DESCRIPTION</span><span>QTY</span><span>RATE (₹)</span><span>AMOUNT</span><span/></div>{event.items.map(item => <div className="line-row" key={item.id}><input value={item.name} onChange={e => onItem(event.id,item.id,'name',e.target.value)} placeholder="Service description"/><input type="number" min="0" value={item.qty} onChange={e => onItem(event.id,item.id,'qty',Number(e.target.value))}/><input type="number" min="0" value={item.rate} onChange={e => onItem(event.id,item.id,'rate',Number(e.target.value))}/><b>{money(Number(item.qty)*Number(item.rate))}</b><button onClick={() => onRemoveItem(event.id,item.id)} title="Remove service"><X size={15}/></button></div>)}</div>
          <button className="add-line" onClick={() => onAddItem(event.id)}><Plus size={15}/> Add custom service</button>
          <div className="event-total"><span>Event subtotal</span><b>{money(eventTotal(event))}</b></div>
          <div className="field"><label>Event-specific notes (optional)</label><textarea value={event.notes || ''} onChange={e => onEvent(event.id,'notes',e.target.value)} placeholder="Special requirements, coverage instructions..."/></div>
          {quote.events.length > 1 && <button className="remove-event" onClick={() => onRemoveEvent(event.id)}><Trash2 size={14}/> Remove this event</button>}
        </div>}
      </div>)}
      <div className="form-card"><div className="card-heading"><div className="step-number">02</div><div><h2>Quotation notes & terms</h2><p>Optional information to include in the PDF.</p></div></div><div className="field"><label>Additional notes</label><textarea value={quote.notes || ''} onChange={e => onChange('notes',e.target.value)} placeholder="Any additional details for the client..."/></div><div className="field"><label>Terms & conditions</label><textarea value={quote.terms || ''} onChange={e => onChange('terms',e.target.value)}/></div></div>
    </div><aside className="summary-sticky"><div className="summary-card"><span className="eyebrow">LIVE SUMMARY</span><h3>Quotation total</h3><div className="summary-line"><span>Events added</span><b>{quote.events.length}</b></div><div className="summary-line"><span>Services</span><b>{quote.events.reduce((s,e)=>s+e.items.length,0)}</b></div><div className="summary-line"><span>Subtotal</span><b>{money(quote.events.reduce((s,e)=>s+eventTotal(e),0))}</b></div><div className="field discount-field"><label>Overall discount (₹)</label><input type="number" min="0" value={quote.discount || 0} onChange={e => onChange('discount',Number(e.target.value))}/></div><div className="grand-total"><span>GRAND TOTAL</span><b>{money(quoteTotal(quote))}</b></div><p className="summary-note"><CheckCircle2 size={14}/> PDF will show one combined total only.</p><button className="primary-button full-button" onClick={onSave}><Save size={16}/> Save quotation</button><button className="secondary-button full-button" onClick={onPdf}><Download size={16}/> Download PDF</button></div></aside></div>}
  </section>
}

function Field({ label, value, onChange, placeholder, type = 'text' }) {
  return <div className="field"><label>{label}</label><input type={type} value={value || ''} placeholder={placeholder || ''} onChange={e => onChange(e.target.value)}/></div>
}

function QuotePreview({ quote }) {
  return <div className="pdf-preview"><div className="pdf-banner"><b>MOVINCAM<span>.ART</span></b><small>PHOTOGRAPHY / CINEMATOGRAPHY</small><span>QUOTATION · {quote.quoteNo}</span></div><div className="pdf-content"><span className="eyebrow">PREPARED FOR</span><h2>{quote.clientName || 'Client name'}</h2><p>{quote.phone} {quote.email && ' · ' + quote.email}</p><hr/><h3>EVENT DETAILS & COVERAGE</h3>{quote.events.map((e,i)=><div className="preview-event" key={e.id}><b>{i+1}. {e.name}</b><p>{e.date || 'Date'} · {[e.venue,e.city].filter(Boolean).join(', ')}</p><small>{e.photographers} photographers · {e.videographers} videographers</small></div>)}<div className="preview-total"><span>GRAND TOTAL</span><b>{money(quoteTotal(quote))}</b></div><p className="preview-terms">{quote.terms}</p></div></div>
}

function Catalogue({ services, setServices, notify }) {
  const [draft, setDraft] = useState({ name: '', rate: '' })
  function add() {
    if (!draft.name.trim()) return
    setServices(prev => [...prev, { name: draft.name.trim(), rate: Number(draft.rate || 0) }])
    setDraft({ name: '', rate: '' }); notify('Service added to catalogue')
  }
  function update(index, key, value) { setServices(prev => prev.map((s,i) => i === index ? { ...s, [key]: value } : s)) }
  return <section><div className="page-heading"><div><span className="eyebrow">REUSABLE PRICING</span><h1>Price catalogue</h1><p>Save your standard rates. You can override them inside any quotation.</p></div></div><div className="catalogue-layout"><div className="form-card"><div className="card-heading"><div className="step-number">+</div><div><h2>Add a service</h2><p>New services can be added to event quotations.</p></div></div><div className="catalogue-add"><Field label="Service name" value={draft.name} onChange={v => setDraft(d => ({...d,name:v}))} placeholder="e.g. Candid photographer"/><Field label="Standard rate (₹)" type="number" value={draft.rate} onChange={v => setDraft(d => ({...d,rate:v}))} placeholder="12000"/><button className="primary-button" onClick={add}><Plus size={16}/> Add service</button></div></div><div className="form-card"><div className="section-title"><div><h2>Saved services</h2><p>{services.length} standard rates</p></div></div>{services.map((s,i)=><div className="catalogue-row" key={i}><input value={s.name} onChange={e => update(i,'name',e.target.value)}/><div className="rate-input"><span>₹</span><input type="number" value={s.rate} onChange={e => update(i,'rate',Number(e.target.value))}/></div><button className="row-delete" onClick={() => setServices(prev => prev.filter((_,j)=>j!==i))}><Trash2 size={15}/></button></div>)}</div></div></section>
}

function SettingsPage({ company, setCompany, notify }) {
  const update = (k,v) => setCompany(c => ({...c,[k]:v}))
  return <section><div className="page-heading"><div><span className="eyebrow">BRAND IDENTITY</span><h1>Company settings</h1><p>These details appear on your quotation PDFs.</p></div></div><div className="form-card settings-card"><div className="card-heading"><div className="step-number">MC</div><div><h2>Company information</h2><p>Keep your quotation header and contact details up to date.</p></div></div><div className="form-grid"><Field label="Company name" value={company.name} onChange={v => update('name',v)}/><Field label="Contact number" value={company.phone} onChange={v => update('phone',v)}/><Field label="Email address" value={company.email} onChange={v => update('email',v)}/><Field label="Instagram handle" value={company.instagram} onChange={v => update('instagram',v)}/><div className="field full"><label>Studio address</label><textarea value={company.address} onChange={e => update('address',e.target.value)} placeholder="Business address"/></div></div><button className="primary-button" onClick={() => notify('Company settings saved')}><Save size={16}/> Save settings</button></div><div className="info-banner"><Sparkles size={18}/><div><b>PDF style</b><p>The quotation PDF currently uses the MOVINCAM dark charcoal and champagne-gold visual theme. More PDF themes can be added in a later version.</p></div></div></section>
}

export default App