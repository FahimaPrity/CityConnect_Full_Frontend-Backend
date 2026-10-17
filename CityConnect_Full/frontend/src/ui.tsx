import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { Link, NavLink, Navigate, Outlet, useNavigate } from 'react-router-dom'
import { LayoutDashboard, FileText, User, Inbox, Clock, Bell, LogOut, Menu, Landmark, History, PlusCircle } from 'lucide-react'
import { session, fmt, slaState, detectRole, Role, Ticket } from './lib/api'
export type { Role }
const AuthCtx = createContext<any>(null)
export const useAuth = () => useContext(AuthCtx)
export function AuthProvider({children}:{children:ReactNode}){
  const [user,setUser]=useState<any>(()=>{try{return session.access?JSON.parse(sessionStorage.getItem('cc_user')||'null'):null}catch{return null}})
  const login=(u:{role:Role;name:string})=>{sessionStorage.setItem('cc_user',JSON.stringify(u));setUser(u)}
  const logout=()=>{session.clear();setUser(null)}
  useEffect(()=>{const f=()=>setUser(null);window.addEventListener('cc-auth-expired',f);return()=>window.removeEventListener('cc-auth-expired',f)},[])
  // Page reload e role abar verify kori (jemon agent pore admin hole / ticket asar por)
  useEffect(()=>{if(!user)return;detectRole().then(role=>{if(role!==user.role)login({...user,role})},()=>{})},[])
  return <AuthCtx.Provider value={{user,login,logout}}>{children}</AuthCtx.Provider>
}
export const HOME:Record<Role,string>={citizen:'/citizen/dashboard',agent:'/agent/dashboard',admin:'/admin/dashboard'}
export const ROLE_LABEL:Record<Role,string>={citizen:'Citizen (customer)',agent:'Support agent',admin:'Administrator'}
// UX-only guard. Backend authorization is the source of truth.
export function RoleGuard({role}:{role:Role}){
  const {user}=useAuth()
  if(!user) return <Navigate to="/login" replace/>
  return user.role===role ? <DashboardLayout role={role}/> : <Navigate to="/unauthorized" replace/>
}

export function useApi<T>(fn:()=>Promise<T>,deps:any[]=[]){
  const [s,set]=useState<{data?:T;error?:string;loading:boolean}>({loading:true})
  const load=()=>{set({loading:true});fn().then(data=>set({data,loading:false}),e=>set({error:e.message,loading:false}))}
  useEffect(load,deps)
  return {...s,retry:load}
}
export function State({s,children,empty}:{s:any;children:(d:any)=>ReactNode;empty?:string}){
  if(s.loading) return <div className="grid" aria-busy="true"><div className="skel"/><div className="skel"/></div>
  if(s.error) return <div className="card" role="alert"><h3>Could not load data</h3><p className="mute">{s.error}</p><button className="btn" onClick={s.retry}>Try again</button></div>
  if(!s.data||(Array.isArray(s.data)&&!s.data.length)) return <div className="card"><h3>Nothing here yet</h3><p className="mute">{empty||'No records found.'}</p></div>
  return <>{children(s.data)}</>
}
export const PriorityBadge=({priority}:{priority:string})=><span className={`badge b-${priority}`}>{priority}</span>
export const StatusBadge=({status}:{status:string})=><span className={`badge b-${status}`}>{status.replace('_',' ').toLowerCase()}</span>
export const Metric=({label,value,hint}:{label:string;value:number;hint?:string})=><div className="card kpi"><span className="mute">{label}</span><b>{value}</b><small className="mute">{hint}</small></div>
export const Flap=({value}:{value:number})=><span className="flap" role="img" aria-label={String(value)}>{String(value).split('').map((d,i)=><span key={i} aria-hidden>{d}</span>)}</span>
export function ComplaintTable({rows,base}:{rows:Ticket[];base:string}){
  return <div className="scroll"><table><caption className="mute" style={{textAlign:'left'}}>Ticket list</caption><thead><tr><th>ID</th><th>Subject</th><th>Priority</th><th>Status</th><th>Created</th><th>Deadline</th><th/></tr></thead>
  <tbody>{rows.map(c=><tr key={c.id}><td>#{c.id}</td><td>{c.title}</td><td><PriorityBadge priority={c.priority}/></td><td><StatusBadge status={c.status}/></td><td>{c.date}</td><td>{fmt(c.deadline)} {slaState(c)==='Overdue'||slaState(c)==='Breached'?<small className="err">({slaState(c)})</small>:null}</td><td><Link className="btn sm" to={`${base}/${c.id}`}>Open</Link></td></tr>)}</tbody></table></div>
}

export function PublicLayout(){
  const {user}=useAuth()
  const L=[['/','Home'],['/resolved-complaints','Resolved Complaints'],['/about','About'],['/track','Track Ticket']]
  return <>
  <header className="top"><div className="wrap"><Link to="/" className="brand"><Landmark size={22}/>City Connect</Link>
    <nav className="nav" aria-label="Main">{L.map(([to,t])=><NavLink key={to} to={to} end>{t}</NavLink>)}</nav>
    {user?<Link className="btn" to={HOME[user.role]}>Dashboard</Link>:<Link className="btn" to="/login">Login</Link>}
    <Link className="btn pri" to="/complaints/new">Submit complaint</Link></div></header>
  <main><Outlet/></main>
  <footer><div className="wrap grid g3"><div><Link to="/" className="brand"><Landmark size={22}/>City Connect</Link><p className="mute">A Complaint Management Platform. Report, track and resolve local issues together.</p></div><div><b>Services</b><p><Link to="/complaints/new">Submit complaint</Link><br/><Link to="/track">Track ticket</Link><br/><Link to="/resolved-complaints">Resolved complaints</Link></p></div><div><b>Platform</b><p><Link to="/about">About &amp; privacy</Link><br/><Link to="/login">Staff &amp; citizen login</Link><br/><Link to="/register">Create account</Link></p></div></div><div className="wrap mute" style={{marginTop:18,fontSize:'.85rem'}}>© 2026 City Connect · Internship project</div></footer></>
}
const NAV:Record<Role,[string,string,any][]>={
 citizen:[['/citizen/dashboard','Dashboard',LayoutDashboard],['/citizen/complaints','My tickets',FileText],['/complaints/new','New complaint',PlusCircle],['/citizen/profile','Profile',User]],
 agent:[['/agent/dashboard','Dashboard',LayoutDashboard],['/agent/complaints','Assigned tickets',Inbox],['/agent/deadlines','SLA & deadlines',Clock],['/agent/profile','Profile',User]],
 admin:[['/admin/dashboard','Dashboard',LayoutDashboard],['/admin/complaints','All tickets',Inbox],['/admin/deadlines','SLA & deadlines',Clock],['/admin/profile','Profile',User]]}
export function DashboardLayout({role}:{role:Role}){
  const {user,logout}=useAuth(); const [open,setOpen]=useState(false); const nav=useNavigate()
  return <div className="shell">
    <aside className={`side ${open?'open':''}`} aria-label="Sidebar" onClick={()=>setOpen(false)}>
      <Link to="/" className="brand" style={{marginBottom:18}}><Landmark size={22}/>City Connect</Link>
      {NAV[role].map(([to,t,I])=><NavLink key={to} to={to}><I size={18}/>{t}</NavLink>)}
      <NavLink to="/notifications"><Bell size={18}/>Notifications</NavLink><NavLink to="/activity"><History size={18}/>Activity log</NavLink>
      <button style={{marginTop:'auto'}} onClick={()=>{logout();nav('/')}}><LogOut size={18}/>Sign out</button></aside>
    <div className="main">
      <div className="bar"><button className="btn menu" aria-label="Open menu" onClick={()=>setOpen(true)}><Menu size={18}/></button><span id="page-title" className="mute">{user?.name} · {ROLE_LABEL[role as Role]}</span></div>
      <Outlet/></div></div>
}
export const Head=({title,sub}:{title:string;sub?:string})=><div style={{marginBottom:18}}><h1>{title}</h1>{sub&&<p className="mute">{sub}</p>}</div>
