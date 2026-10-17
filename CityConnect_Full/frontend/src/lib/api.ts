// Real Django REST backend (Eutropia ComplaintManagement) er sathe connect kora API layer.
// Auth: JWT (POST /api/token/). Backend roles: customer | agent | admin.

const BASE = (import.meta.env.VITE_API_BASE_URL as string) || '/api'
const K = { access: 'cc_access', refresh: 'cc_refresh', user: 'cc_user' }

export type Role = 'citizen' | 'agent' | 'admin'
export const STATUSES = ['OPEN', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED']
export const PRIORITIES = ['low', 'medium', 'high', 'urgent']
export const DONE = ['RESOLVED', 'CLOSED']

export class ApiError extends Error {
  status: number
  data: any
  constructor(m: string, s: number, d?: any) { super(m); this.status = s; this.data = d }
}

/** DRF error body ke readable string e convert kore */
function errText(data: any, fallback: string): string {
  if (!data) return fallback
  if (typeof data === 'string') return data
  if (typeof data.detail === 'string') return data.detail
  if (typeof data === 'object') {
    const parts = Object.entries(data).map(([k, v]) => `${k === 'non_field_errors' ? '' : k + ': '}${Array.isArray(v) ? v.join(' ') : String(v)}`)
    if (parts.length) return parts.join(' · ')
  }
  return fallback
}

export const session = {
  get access() { return sessionStorage.getItem(K.access) },
  get refresh() { return sessionStorage.getItem(K.refresh) },
  set(access: string, refresh?: string) { sessionStorage.setItem(K.access, access); if (refresh) sessionStorage.setItem(K.refresh, refresh) },
  clear() { sessionStorage.removeItem(K.access); sessionStorage.removeItem(K.refresh); sessionStorage.removeItem(K.user) },
}

async function refreshAccess(): Promise<boolean> {
  const refresh = session.refresh
  if (!refresh) return false
  try {
    const res = await fetch(BASE + '/token/refresh/', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ refresh }) })
    if (!res.ok) return false
    const d = await res.json()
    session.set(d.access, d.refresh)
    return true
  } catch { return false }
}

export async function request<T = any>(path: string, init: RequestInit = {}, opts: { auth?: boolean } = {}, retried = false): Promise<T> {
  const auth = opts.auth !== false
  const headers: Record<string, string> = { 'Content-Type': 'application/json', ...((init.headers as any) || {}) }
  if (auth && session.access) headers.Authorization = `Bearer ${session.access}`
  let res: Response
  try { res = await fetch(BASE + path, { ...init, headers }) }
  catch { throw new ApiError('Cannot reach the server. Is the Django backend running on http://127.0.0.1:8000 ?', 0) }
  if (res.status === 401 && auth && !retried) {
    if (await refreshAccess()) return request<T>(path, init, opts, true)
    session.clear()
    window.dispatchEvent(new Event('cc-auth-expired'))
  }
  if (!res.ok) {
    let data: any; try { data = await res.json() } catch { /* non-JSON error (e.g. Django HTML 500) */ }
    throw new ApiError(errText(data, `Request failed (HTTP ${res.status})`), res.status, data)
  }
  if (res.status === 204) return null as T
  return res.json()
}

const body = (o: any, method = 'POST') => ({ method, body: JSON.stringify(o) })

// ---------- mapping helpers ----------
export type Ticket = {
  id: string; title: string; summary: string; status: string; priority: string
  date: string; updated: string; resolvedAt: string | null
  customer: string; agent: string | null; agentId: number | null
  deadline?: string; breached?: boolean
}
const day = (s?: string | null) => (s ? s.slice(0, 10) : '')
const fromTicket = (t: any): Ticket => ({
  id: String(t.id), title: t.subject, summary: t.description, status: String(t.status).toUpperCase(), priority: t.priority,
  date: day(t.created_at), updated: day(t.updated_at), resolvedAt: t.resolved_at || null,
  customer: t.customer_name, agent: t.assigned_agent_name || null, agentId: t.assigned_agent ?? null,
})
export const fmt = (iso?: string | null) => (iso ? new Date(iso).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : '—')
export const isOverdue = (t: Ticket) => !DONE.includes(t.status) && (!!t.breached || (!!t.deadline && new Date(t.deadline).getTime() < Date.now()))
export const slaState = (t: Ticket) => (t.breached ? 'Breached' : DONE.includes(t.status) ? 'Met' : isOverdue(t) ? 'Overdue' : t.deadline ? 'On track' : '—')

/** Last 6 months e received vs resolved (tickets theke client-side calculate) */
export function trendOf(ts: Ticket[]) {
  const out: { m: string; key: string; received: number; resolved: number }[] = []
  const now = new Date()
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    out.push({ m: d.toLocaleString([], { month: 'short' }), key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`, received: 0, resolved: 0 })
  }
  ts.forEach(t => {
    out.find(o => o.key === t.date.slice(0, 7)) && out.find(o => o.key === t.date.slice(0, 7))!.received++
    const r = t.resolvedAt && out.find(o => o.key === t.resolvedAt!.slice(0, 7)); if (r) r.resolved++
  })
  return out
}

// ---------- role detection ----------
// Backend e "me" endpoint nai, tai role ta probe kore bujhi (kono data change hoy na):
//  1) /tickets/tickets/queue/  -> customer hole 403
//  2) agent vs admin: kono ticket e PATCH assign_agent {} -> admin: 400, agent: 403
export async function detectRole(): Promise<Role> {
  try { await request('/tickets/tickets/queue/') } catch (e: any) { if (e.status === 403) return 'citizen'; throw e }
  try {
    const list: any[] = await request('/tickets/tickets/')
    if (list.length) {
      try { await request(`/tickets/tickets/${list[0].id}/assign_agent/`, body({}, 'PATCH')) }
      catch (e: any) { if (e.status === 400) return 'admin'; if (e.status === 403) return 'agent' }
    }
  } catch { /* fall through */ }
  return 'agent' // ticket nai hole bhul hole-o safe (read-only subset); pore refresh e abar detect hoy
}

// ---------- endpoints ----------
export const api = {
  async login(username: string, password: string) {
    const t = await request<{ access: string; refresh: string }>('/token/', body({ username, password }), { auth: false })
    session.set(t.access, t.refresh)
    try { return { role: await detectRole(), name: username } }
    catch (e) { session.clear(); throw e }
  },
  register: (b: { username: string; email: string; first_name: string; last_name: string; password: string }) =>
    request('/accounts/register/', body(b), { auth: false }),

  async complaints(): Promise<Ticket[]> {
    const [tickets, slas] = await Promise.all([request<any[]>('/tickets/tickets/'), request<any[]>('/sla/').catch(() => [] as any[])])
    const sla = new Map(slas.map(s => [String(s.ticket), s]))
    return tickets.map(fromTicket).map(t => { const s = sla.get(t.id); return s ? { ...t, deadline: s.deadline, breached: s.is_breached } : t })
      .sort((a, b) => Number(b.id) - Number(a.id))
  },
  async complaint(id: string): Promise<Ticket> {
    const [t, slas] = await Promise.all([request<any>(`/tickets/tickets/${id}/`), request<any[]>('/sla/').catch(() => [] as any[])])
    const s = slas.find(x => String(x.ticket) === String(t.id))
    return { ...fromTicket(t), ...(s ? { deadline: s.deadline, breached: s.is_breached } : {}) }
  },
  async resolved(): Promise<Ticket[]> { return (await api.complaints()).filter(t => DONE.includes(t.status)) },
  submit: (b: { subject: string; description: string; priority: string }) => request<any>('/tickets/tickets/', body(b)).then(fromTicket),
  setStatus: (id: string, status: string) => request(`/tickets/tickets/${id}/update_status/`, body({ status: status.toLowerCase() }, 'PATCH')),
  setPriority: (id: string, priority: string) => request(`/tickets/tickets/${id}/update_priority/`, body({ priority }, 'PATCH')),
  assign: (id: string, agent_id: number) => request(`/tickets/tickets/${id}/assign_agent/`, body({ agent_id }, 'PATCH')),
  summary: () => request<Record<string, number>>('/dashboard/summary/'),
  notifications: () => request<any[]>('/notifications/'),
  logs: () => request<any[]>('/logs/'),
}
