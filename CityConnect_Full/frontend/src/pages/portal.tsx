import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Area, AreaChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { api, trendOf, fmt, isOverdue, slaState, STATUSES, PRIORITIES, DONE, Ticket } from '../lib/api'
import { useApi, State, StatusBadge, PriorityBadge, Metric, ComplaintTable, Head, useAuth, Role, ROLE_LABEL } from '../ui'

const TITLE:Record<Role,string>={citizen:'My dashboard',agent:'Agent dashboard',admin:'System administration'}
const SUB:Record<Role,string>={citizen:'Only your own tickets are shown',agent:'Tickets assigned to you',admin:'All tickets in the system'}

export const Dashboard=({role}:{role:Role})=>{
  const s=useApi(api.summary); const c=useApi(api.complaints)
  return <><Head title={TITLE[role]} sub={SUB[role]}/>
  <div className="grid">
   <State s={s} empty="No summary available.">{(m:any)=><div className="grid g4">
     <Metric label="Open" value={m.open_tickets} hint="Awaiting assignment"/>
     <Metric label="Assigned / in progress" value={m.assigned_tickets+m.in_progress_tickets} hint="Being worked on"/>
     <Metric label="Resolved / closed" value={m.resolved_tickets+m.closed_tickets} hint="Completed"/>
     <Metric label="SLA breached" value={m.breached_slas} hint={`${m.urgent_tickets} urgent · ${m.total_tickets} total`}/></div>}</State>
   <State s={c} empty="No tickets yet.">{(d:Ticket[])=><>
     <div className="grid g2"><div className="card"><h3>Ticket trend</h3><div style={{height:260}} role="img" aria-label="Received versus resolved tickets per month"><ResponsiveContainer><AreaChart data={trendOf(d)}><CartesianGrid stroke="#D9CFC7"/><XAxis dataKey="m"/><YAxis allowDecimals={false}/><Tooltip/><Legend/><Area dataKey="received" stroke="#2B2622" fill="#C9B59C"/><Area dataKey="resolved" stroke="#3f6b4a" fill="#D9CFC7"/></AreaChart></ResponsiveContainer></div>
       <details><summary>View as table</summary><table><thead><tr><th>Month</th><th>Received</th><th>Resolved</th></tr></thead><tbody>{trendOf(d).map(r=><tr key={r.key}><td>{r.m}</td><td>{r.received}</td><td>{r.resolved}</td></tr>)}</tbody></table></details></div>
      <div className="card"><h3>By priority</h3>{[...PRIORITIES].reverse().map(k=>{const v=d.filter(x=>x.priority===k).length;return <div className="bar-row" key={k}><span style={{width:90,fontSize:'.85rem',textTransform:'capitalize'}}>{k}</span><i style={{width:`${v*40+6}px`}}/><b>{v}</b></div>})}</div></div>
     <div className="card"><h3>Recent tickets</h3><ComplaintTable rows={d.slice(0,5)} base={`/${role}/complaints`}/></div></>}</State></div></>
}

export const Complaints=({role}:{role:Role})=>{
  const c=useApi(api.complaints); const [q,setQ]=useState(''); const [st,setSt]=useState('')
  return <><Head title={role==='citizen'?'My tickets':role==='agent'?'Assigned tickets':'All tickets'} sub={SUB[role]}/>
  <div className="row" style={{marginBottom:16}}><div><label htmlFor="s">Search</label><input id="s" value={q} onChange={e=>setQ(e.target.value)}/></div><div><label htmlFor="f">Status</label><select id="f" value={st} onChange={e=>setSt(e.target.value)}><option value="">All</option>{STATUSES.map(s=><option key={s}>{s}</option>)}</select></div>
   {role==='citizen'&&<Link className="btn pri" style={{alignSelf:'flex-end'}} to="/complaints/new">New complaint</Link>}</div>
  <div className="card"><State s={c} empty={role==='agent'?'No tickets are assigned to you yet.':'No tickets yet.'}>{(d:Ticket[])=>{const f=d.filter(x=>(x.title+x.summary).toLowerCase().includes(q.toLowerCase())&&(!st||x.status===st));return f.length?<ComplaintTable rows={f} base={`/${role}/complaints`}/>:<p>No tickets match these filters.</p>}}</State></div></>
}

export const Detail=({role}:{role:Role})=>{
  const {id}=useParams(); const c=useApi(()=>api.complaint(id!),[id])
  const [msg,setMsg]=useState(''); const [err,setErr]=useState(''); const [busy,setBusy]=useState(false)
  const [status,setStatus]=useState(''); const [prio,setPrio]=useState(''); const [agent,setAgent]=useState('')
  const staff=role==='agent'||role==='admin'
  const act=(fn:()=>Promise<any>,ok:string)=>async()=>{setBusy(true);setMsg('');setErr('');try{await fn();setMsg(ok);c.retry()}catch(e:any){setErr(e.message)}setBusy(false)}
  return <><Link to={`/${role}/complaints`} className="btn sm">← Back</Link><div style={{height:12}}/><State s={c}>{(d:Ticket)=><div className="grid g2">
    <div className="card"><h1>{d.title}</h1><p><StatusBadge status={d.status}/> <PriorityBadge priority={d.priority}/> <span className="mute">#{d.id} · submitted by {d.customer}</span></p><p style={{whiteSpace:'pre-wrap'}}>{d.summary}</p>
      <p className="mute">Assigned agent: {d.agent||'Not assigned yet'}<br/>SLA deadline: {fmt(d.deadline)} · {slaState(d)}{isOverdue(d)&&' ⚠'}</p>
      <h3>Progress</h3><div className="tl"><div><b>{fmt(d.date)}</b><br/>Ticket created</div>{d.agent&&<div><b>Assigned</b><br/>{d.agent}</div>}<div><b>Current</b><br/><StatusBadge status={d.status}/></div>{d.resolvedAt&&<div><b>{fmt(d.resolvedAt)}</b><br/>Resolved</div>}</div></div>
    {staff&&<div className="card"><h3>Manage ticket</h3><p className="mute">Signed in as {ROLE_LABEL[role]}. The server enforces permissions.</p>
      <label htmlFor="st">Status</label><div className="row"><select id="st" value={status||d.status} onChange={e=>setStatus(e.target.value)}>{STATUSES.map(s=><option key={s}>{s}</option>)}</select><button className="btn pri" disabled={busy||(status||d.status)===d.status} onClick={act(()=>api.setStatus(d.id,status),'Status updated.')}>Update status</button></div>
      <label htmlFor="pr">Priority</label><div className="row"><select id="pr" value={prio||d.priority} onChange={e=>setPrio(e.target.value)}>{PRIORITIES.map(s=><option key={s}>{s}</option>)}</select><button className="btn pri" disabled={busy||(prio||d.priority)===d.priority} onClick={act(()=>api.setPriority(d.id,prio),'Priority updated.')}>Update priority</button></div>
      {role==='admin'&&<><label htmlFor="ag">Assign to support agent (agent user ID)</label><div className="row"><input id="ag" inputMode="numeric" value={agent} onChange={e=>setAgent(e.target.value.replace(/\D/g,''))} placeholder="e.g. 2"/><button className="btn pri" disabled={busy||!agent} onClick={act(()=>api.assign(d.id,Number(agent)),'Ticket assigned.')}>Assign</button></div></>}
      {msg&&<p role="status" className="mute" style={{marginTop:12}}>{msg}</p>}{err&&<div className="err" role="alert" style={{marginTop:12}}>{err}</div>}</div>}</div>}</State></>
}

export const Deadlines=({role}:{role:Role})=>{
  const c=useApi(api.complaints)
  return <><Head title="SLA & deadlines" sub="Resolution deadlines: urgent 8h · high 24h · medium 48h · low 72h"/><div className="card"><State s={c} empty="No tickets yet.">{(d:Ticket[])=><div className="scroll"><table><thead><tr><th>ID</th><th>Subject</th><th>Priority</th><th>Status</th><th>Deadline</th><th>SLA</th></tr></thead><tbody>{[...d].sort((a,b)=>Number(DONE.includes(a.status))-Number(DONE.includes(b.status))||(a.deadline||'').localeCompare(b.deadline||'')).map(t=><tr key={t.id}><td><Link to={`/${role}/complaints/${t.id}`}>#{t.id}</Link></td><td>{t.title}</td><td><PriorityBadge priority={t.priority}/></td><td><StatusBadge status={t.status}/></td><td>{fmt(t.deadline)}</td><td className={isOverdue(t)?'err':''}>{slaState(t)}</td></tr>)}</tbody></table></div>}</State></div></>
}

export const Notifications=()=>{
  const n=useApi(api.notifications)
  return <><Head title="Notifications"/><div className="card"><State s={n} empty="No notifications yet.">{(d:any[])=><ul style={{listStyle:'none',padding:0,margin:0}}>{d.map(x=><li key={x.id} style={{padding:'10px 0',borderBottom:'1px solid var(--line, #D9CFC7)'}}><b>{(x.notification_type||'').replace(/_/g,' ')}</b>{x.is_read===false&&<span className="badge" style={{marginLeft:8}}>new</span>}<br/>{x.message}<br/><small className="mute">{fmt(x.created_at)}{x.ticket_subject?` · ${x.ticket_subject}`:''}</small></li>)}</ul>}</State></div></>
}

export const Activity=()=>{
  const a=useApi(api.logs)
  return <><Head title="Activity log" sub="Recent actions on your tickets"/><div className="card"><State s={a} empty="No activity yet.">{(d:any[])=><div className="scroll"><table><thead><tr><th>When</th><th>Ticket</th><th>By</th><th>Action</th><th>Details</th></tr></thead><tbody>{d.map(x=><tr key={x.id}><td>{fmt(x.created_at)}</td><td>#{x.ticket} {x.ticket_subject}</td><td>{x.actor_name||'—'}</td><td>{String(x.action).replace(/_/g,' ')}</td><td>{x.description}</td></tr>)}</tbody></table></div>}</State></div></>
}

export const Profile=()=>{const {user}=useAuth();return <><Head title="Profile"/><div className="card" style={{maxWidth:480}}><label htmlFor="pn">Username</label><input id="pn" defaultValue={user?.name} readOnly/><label htmlFor="pr">Role</label><input id="pr" defaultValue={user?ROLE_LABEL[user.role as Role]:''} readOnly/><p className="note" style={{marginTop:14}}>The backend has no profile-update endpoint yet.</p></div></>}
