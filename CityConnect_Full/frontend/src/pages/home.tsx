import { useState, FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ShieldCheck, Eye, Scale, Send, Search, Wrench, CheckCircle2, Route, Trash2, HeartPulse, Bus, Building2, Home as HomeIcon, ArrowRight, Lock } from 'lucide-react'
import { api, Ticket } from '../lib/api'
import { useApi, State, StatusBadge, Flap, useAuth } from '../ui'
import { Photo, Rotator } from '../motion'
import { HeroScene, ReportScene, CommunityScene, TeamScene } from '../art'

const CATS:[any,string,string][]=[[Route,'Road & Engineering','Potholes, streetlights, drains, footpaths'],[Trash2,'Waste Management','Missed collection, overflowing bins'],[HeartPulse,'Health','Public health and sanitation concerns'],[Bus,'Transport','Traffic, parking and public transport'],[Building2,'Urban Planning','Unsafe or unauthorised construction'],[HomeIcon,'Estate & Property','City-owned property and buildings']]
const Sky=()=><svg viewBox="0 0 520 340" role="img" aria-label="Illustration of a city skyline" style={{width:'100%',display:'block'}}>
 <defs><linearGradient id="sg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#EFE9E3"/><stop offset="1" stopColor="#D9CFC7"/></linearGradient></defs>
 <rect width="520" height="340" fill="url(#sg)"/><circle cx="400" cy="80" r="38" fill="#C9B59C"/>
 {[[30,170,60],[100,120,70],[180,150,55],[245,80,80],[335,140,60],[405,110,75],[485,170,40]].map(([x,y,w],i)=><g key={i}><rect x={x} y={y} width={w} height={340-y} fill={i%2?'#6B6159':'#2B2622'}/>{Array.from({length:Math.floor((340-y)/34)}).map((_,k)=><rect key={k} x={x+10} y={y+14+k*34} width={w-20} height="8" rx="2" fill="#C9B59C" opacity=".55"/>)}</g>)}
 <rect y="312" width="520" height="28" fill="#2B2622"/></svg>

export default function Home(){
  const {user}=useAuth(); const r=useApi(()=>user?api.resolved():Promise.resolve([]),[user]); const nav=useNavigate(); const [tk,setTk]=useState('')
  const go=(e:FormEvent)=>{e.preventDefault();nav('/track')}
  return <>
  <section className="hero2"><div className="wrap hero2g"><div>
    <span className="pill"><ShieldCheck size={16}/>Secure ticket-based reporting</span>
    <h1>Your city. Your voice. Better together.</h1>
    <p className="rot">Report <Rotator words={["a broken road","missed garbage collection","a faulty streetlight","unsafe construction"]}/></p><p className="lead">City Connect is a complaint management platform. Report a local problem in minutes and follow it publicly until it is resolved.</p>
    <div className="row"><Link to="/complaints/new" className="btn pri lg"><Send size={18}/>Submit a complaint</Link><Link to="/track" className="btn lg"><Search size={18}/>Track a complaint</Link></div>
    <form className="trackbar" onSubmit={go}><Lock size={18}/><label htmlFor="ht" className="sr">Tracking token</label><input id="ht" placeholder="Enter your ticket number" inputMode="numeric" value={tk} onChange={e=>setTk(e.target.value.replace(/\D/g,''))}/><button className="btn pri sm">Track <ArrowRight size={14}/></button></form></div>
   <div className="art card"><Photo name="hero" alt="Citizens in a city neighbourhood" ratio="4/3.7" fallback={<HeroScene/>}/><div className="chip c1"><ShieldCheck size={16}/>Secure sign-in</div><div className="chip c2"><CheckCircle2 size={16}/>Public progress</div></div></div></section>

  <section className="band"><div className="wrap grid g3 stats">{[[5,'Clear ticket stages'],[4,'Priority levels'],[8,'Hour SLA for urgent issues']].map(([v,l]:any)=><div key={l}><Flap value={v}/><p>{l}</p></div>)}</div></section>

  <section className="sec wrap"><div className="head"><h2>How City Connect works</h2><p className="mute">From report to resolution, every step is visible.</p></div>
   <ol className="grid g4 steps">{[[Send,'Submit','Describe the problem and pin the location.'],[Search,'Review & route','An admin assigns it to a support agent.'],[Wrench,'Work in progress','The agent works on it and updates the status.'],[CheckCircle2,'Resolution','The ticket is marked resolved and you are notified.']].map(([I,t,d]:any,i)=><li className="card" key={t}><span className="ic"><I size={22}/></span><h3>{t}</h3><p className="mute">{d}</p></li>)}</ol></section>

  <section className="sec wrap"><div className="head"><h2>What you can report</h2><p className="mute">One simple form for every kind of issue.</p></div>
   <div className="grid g3">{CATS.map(([I,t,d])=><Link to="/complaints/new" className="card cat" key={t}><span className="ic"><I size={22}/></span><div><h3>{t}</h3><p className="mute">{d}</p></div><ArrowRight size={18}/></Link>)}</div></section>

  <section className="sec wrap"><div className="head"><h2>Real people. Real places.</h2><p className="mute">Complaints are about everyday life in your neighbourhood.</p></div><div className="collage"><Photo name="report" fallback={<ReportScene/>} alt="Citizen reporting an issue on a phone" ratio="4/3" cap="Report from your phone"/><Photo name="community" fallback={<CommunityScene/>} alt="Neighbourhood street" ratio="4/3" cap="Drop your complaint, we route it"/><Photo name="team" fallback={<TeamScene/>} alt="City service team at work" ratio="4/3" cap="Teams that respond"/></div></section>
<div className="marq" aria-hidden><div>{[...CATS,...CATS].map(([I,t],i)=><span key={i}><I size={18}/>{t}</span>)}</div></div>
{user&&<section className="sec wrap"><div className="head row" style={{justifyContent:'space-between'}}><div><h2>Recently resolved</h2><p className="mute">Your latest resolved tickets.</p></div><Link className="btn" to="/resolved-complaints">View all <ArrowRight size={14}/></Link></div>
   <State s={r} empty="No resolved tickets yet.">{(d:Ticket[])=><div className="grid g3">{d.slice(0,3).map(c=><article className="card" key={c.id}><StatusBadge status={c.status}/><h3 style={{marginTop:10}}>{c.title}</h3><p>{c.summary.length>140?c.summary.slice(0,140)+'…':c.summary}</p><small className="mute">Ticket #{c.id}</small></article>)}</div>}</State></section>}

<section className="sec wrap grid s2 trust"><div><h2>Built on accountability</h2><p className="lead">Every ticket has an owner, a status and a deadline.</p></div>
   <div className="grid">{[[ShieldCheck,'Secure accounts','Sign in to submit and follow your own tickets.'],[Eye,'Transparent progress','Status updates and notifications for every ticket.'],[Scale,'Accountable resolution','SLA deadlines are tracked and breaches are flagged.']].map(([I,t,d]:any)=><div className="row trow" key={t}><span className="ic"><I size={20}/></span><div><b>{t}</b><br/><span className="mute">{d}</span></div></div>)}</div></section>

  <section className="wrap"><div className="cta"><div><h2>See something that needs fixing?</h2><p>It takes about two minutes to report.</p></div><Link className="btn lg" to="/complaints/new">Submit a complaint <ArrowRight size={16}/></Link></div></section></>
}
