import { useState, FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Landmark, CheckCircle2 } from 'lucide-react'
import { api, PRIORITIES, fmt, slaState, Ticket } from '../lib/api'
import { Photo } from '../motion'
import { useApi, State, StatusBadge, PriorityBadge, useAuth, HOME, Head } from '../ui'

const Resolved=({c}:{c:Ticket})=><article className="card"><StatusBadge status={c.status}/> <PriorityBadge priority={c.priority}/><h3 style={{marginTop:10}}>{c.title}</h3><p>{c.summary.length>160?c.summary.slice(0,160)+'…':c.summary}</p><small className="mute">Resolved {c.resolvedAt?c.resolvedAt.slice(0,10):c.updated}</small></article>
const NeedLogin=({what}:{what:string})=><div className="wrap sec" style={{maxWidth:560}}><div className="card"><h1>Sign in required</h1><p>{what}</p><div className="row"><Link className="btn pri" to="/login">Log in</Link><Link className="btn" to="/register">Create account</Link></div></div></div>

export function About(){return <div className="wrap sec" style={{maxWidth:760}}><h1>About City Connect</h1><p>City Connect helps citizens report local problems as tickets and follow them until they are resolved, with clear deadlines (SLA) for every ticket.</p>
  <h3>Workflow</h3><p>Open → Assigned → In progress → Resolved → Closed.</p><h3>Deadlines</h3><p>Every ticket gets a resolution deadline based on priority: urgent 8 hours, high 24 hours, medium 48 hours, low 72 hours.</p><h3>Roles</h3><p>Citizens submit and follow their own tickets. Administrators assign tickets to support agents, and agents update the status and priority of the tickets assigned to them.</p></div>}

export function ResolvedList(){
  const {user}=useAuth(); const r=useApi(()=>user?api.resolved():Promise.resolve([]),[user]); const [q,setQ]=useState('')
  if(!user) return <NeedLogin what="Resolved tickets are available after you sign in."/>
  return <div className="wrap sec"><Head title="Resolved complaints" sub="Resolved and closed tickets visible to your account."/>
   <label htmlFor="q">Search by subject</label><input id="q" value={q} onChange={e=>setQ(e.target.value)} style={{maxWidth:420,marginBottom:20}}/>
   <State s={r} empty="No resolved tickets yet.">{(d:Ticket[])=>{const f=d.filter(c=>(c.title+c.summary).toLowerCase().includes(q.toLowerCase()));return f.length?<div className="grid g3">{f.map(c=><Resolved key={c.id} c={c}/>)}</div>:<div className="card">No matches for "{q}".</div>}}</State></div>
}

export function Track(){
  const {user}=useAuth(); const [t,setT]=useState(''); const [res,setRes]=useState<Ticket>(); const [err,setErr]=useState(''); const [busy,setBusy]=useState(false)
  if(!user) return <NeedLogin what="Sign in to look up the status of your tickets."/>
  const go=async(e:FormEvent)=>{e.preventDefault();setErr('');setRes(undefined)
    if(!/^\d+$/.test(t)){setErr('Enter your ticket number (digits only).');return}
    setBusy(true);try{setRes(await api.complaint(t))}catch(er:any){setErr(er.status===404?'We could not find that ticket in your account.':er.message)}setBusy(false)}
  return <div className="wrap sec" style={{maxWidth:640}}><h1>Track a ticket</h1><form className="card" onSubmit={go} noValidate><label htmlFor="tk">Ticket number</label>
    <input id="tk" value={t} inputMode="numeric" onChange={e=>setT(e.target.value.trim())} autoComplete="off" aria-invalid={!!err} aria-describedby="tke" placeholder="e.g. 12"/><div id="tke" className="err" role="alert">{err}</div>
    <button className="btn pri" style={{marginTop:14}} disabled={busy}>{busy?'Checking…':'Track ticket'}</button></form>
    {res&&<div className="card" style={{marginTop:20}}><h3>#{res.id} · {res.title}</h3><p>Status: <StatusBadge status={res.status}/> <PriorityBadge priority={res.priority}/></p><div className="tl"><div><b>{fmt(res.date)}</b><br/>Ticket created</div>{res.agent&&<div><b>Assigned</b><br/>{res.agent}</div>}<div><b>Last update</b><br/>{res.updated}</div>{res.resolvedAt&&<div><b>{fmt(res.resolvedAt)}</b><br/>Resolved</div>}</div><p className="mute">SLA deadline: {fmt(res.deadline)} · {slaState(res)}</p></div>}</div>
}

export function Submit(){
  const {user}=useAuth(); const [f,setF]=useState<any>({priority:'medium'}); const [e,setE]=useState<any>({}); const [done,setDone]=useState<Ticket>(); const [busy,setBusy]=useState(false)
  const set=(k:string)=>(ev:any)=>setF({...f,[k]:ev.target.value})
  if(!user) return <NeedLogin what="Sign in as a citizen to submit a complaint. Your tickets are linked to your account so you can track them."/>
  if(user.role!=='citizen') return <div className="wrap sec" style={{maxWidth:560}}><div className="card"><h1>Citizens only</h1><p>Only citizen accounts can submit complaints. Staff accounts manage existing tickets.</p><Link className="btn pri" to={HOME[user.role as keyof typeof HOME]}>Go to dashboard</Link></div></div>
  const submit=async(ev:FormEvent)=>{ev.preventDefault();const x:any={}
    if((f.subject||'').trim().length<5)x.subject='Subject needs at least 5 characters.';if((f.description||'').trim().length<20)x.description='Describe the problem in at least 20 characters.'
    setE(x);if(Object.keys(x).length)return;setBusy(true)
    try{setDone(await api.submit({subject:f.subject.trim(),description:f.description.trim(),priority:f.priority}))}catch(er:any){setE({form:er.message})}setBusy(false)}
  if(done)return <div className="wrap sec" style={{maxWidth:600}}><div className="card"><CheckCircle2 size={32}/><h1>Complaint submitted</h1><p>Your ticket number is:</p>
    <p style={{fontSize:'1.6rem',fontFamily:'Fraunces'}}>#{done.id}</p><p className="mute">Priority {done.priority}. You will be notified when its status changes.</p>
    <div className="row"><Link className="btn pri" to={`/citizen/complaints/${done.id}`}>View ticket</Link><button className="btn" onClick={()=>{setDone(undefined);setF({priority:'medium'})}}>Submit another</button></div></div></div>
  const Fld=(k:string,l:string,el?:any)=><div><label htmlFor={k}>{l}</label>{el||<input id={k} value={f[k]||''} onChange={set(k)}/>}{e[k]&&<div className="err" role="alert">{e[k]}</div>}</div>
  return <div className="wrap sec" style={{maxWidth:720}}><h1>Submit a complaint</h1><form className="card" onSubmit={submit} noValidate>
    {Object.keys(e).length>0&&<div className="note" role="alert">Please fix the issue(s) below.</div>}
    {Fld('subject','Subject')}{Fld('description','Description',<textarea id="description" rows={5} value={f.description||''} onChange={set('description')}/>)}
    {Fld('priority','Priority',<select id="priority" value={f.priority} onChange={set('priority')}>{PRIORITIES.map(p=><option key={p}>{p}</option>)}</select>)}
    <p className="note" style={{marginTop:16}}>Resolution deadline depends on priority: urgent 8h · high 24h · medium 48h · low 72h.</p>
    {e.form&&<div className="err" role="alert">{e.form}</div>}<button className="btn pri" disabled={busy} style={{marginTop:14}}>{busy?'Submitting…':'Submit complaint'}</button></form></div>
}

const Side=()=><aside className="authside"><Photo name="feedback" alt="Citizen feedback and support" ratio="16/10" fallback={<Landmark size={34}/>}/><h2>Welcome to City Connect</h2><p>Report problems, follow progress and see your city get fixed.</p></aside>

export function Login(){
  const {login}=useAuth(); const nav=useNavigate(); const [u,setU]=useState(''); const [p,setP]=useState(''); const [err,setErr]=useState(''); const [busy,setBusy]=useState(false)
  const go=async(ev:FormEvent)=>{ev.preventDefault();setErr('');if(!u||!p){setErr('Enter your username and password.');return}
    setBusy(true);try{const r=await api.login(u.trim(),p);login(r);nav(HOME[r.role])}catch(er:any){setErr(er.status===401?'Wrong username or password.':er.message)}setBusy(false)}
  return <div className="wrap sec auth"><Side/><div><h1>Log in</h1><form className="card" onSubmit={go}><label htmlFor="u">Username</label><input id="u" value={u} autoComplete="username" onChange={e=>setU(e.target.value)}/>
    <label htmlFor="p">Password</label><input id="p" type="password" value={p} autoComplete="current-password" onChange={e=>setP(e.target.value)}/>{err&&<div className="err" role="alert">{err}</div>}<button className="btn pri" style={{marginTop:14}} disabled={busy}>{busy?'Signing in…':'Log in'}</button>
    <p className="mute">New citizen? <Link to="/register">Create an account</Link></p></form></div></div>
}

export function Register(){
  const {login}=useAuth(); const nav=useNavigate(); const [f,setF]=useState<any>({}); const [err,setErr]=useState(''); const [busy,setBusy]=useState(false)
  const set=(k:string)=>(ev:any)=>setF({...f,[k]:ev.target.value})
  const go=async(ev:FormEvent)=>{ev.preventDefault();setErr('')
    if((f.password||'').length<8){setErr('Password must be at least 8 characters.');return}
    setBusy(true);try{await api.register({username:f.username.trim(),email:f.email.trim(),first_name:f.first_name||'',last_name:f.last_name||'',password:f.password})
      const r=await api.login(f.username.trim(),f.password);login(r);nav(HOME[r.role])}catch(er:any){setErr(er.message)}setBusy(false)}
  return <div className="wrap sec auth"><Side/><div><h1>Create a citizen account</h1>
  <form className="card" onSubmit={go}><label htmlFor="un">Username</label><input id="un" required onChange={set('username')} autoComplete="username"/>
  <div className="grid s2"><div><label htmlFor="fn">First name</label><input id="fn" onChange={set('first_name')}/></div><div><label htmlFor="ln">Last name</label><input id="ln" onChange={set('last_name')}/></div></div>
  <label htmlFor="em">Email</label><input id="em" type="email" required onChange={set('email')}/><label htmlFor="pw">Password (min 8 characters)</label><input id="pw" type="password" minLength={8} required onChange={set('password')} autoComplete="new-password"/>
  <p className="note" style={{marginTop:14}}>Staff accounts (agents, admins) are created by a system administrator. Public sign-up is for citizens only.</p>{err&&<div className="err" role="alert">{err}</div>}<button className="btn pri" style={{marginTop:14}} disabled={busy}>{busy?'Creating…':'Register'}</button></form></div></div>
}

export const Unauthorized=()=><div className="wrap sec" style={{maxWidth:560}}><div className="card"><h1>Access denied</h1><p>Your account does not have permission to view this page.</p><Link className="btn pri" to="/">Back to home</Link></div></div>
