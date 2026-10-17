import { useEffect, useState, ReactNode } from 'react'
import { useLocation } from 'react-router-dom'
import { Camera } from 'lucide-react'
// Scroll-reveal for cards/headings on every page (respects reduced motion via CSS)
export function RevealWatcher(){
  const {pathname}=useLocation()
  useEffect(()=>{
    const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}}),{threshold:.12})
    const t=setTimeout(()=>document.querySelectorAll('.card,.head,.steps li,.cat,.trow,.cta,.photo.rv').forEach((el,i)=>{el.classList.add('rv');(el as HTMLElement).style.setProperty('--d',`${(i%4)*80}ms`);io.observe(el)}),60)
    return()=>{clearTimeout(t);io.disconnect()}
  },[pathname])
  return null
}
export function Rotator({words}:{words:string[]}){
  const [i,set]=useState(0)
  useEffect(()=>{const t=setInterval(()=>set(n=>(n+1)%words.length),2400);return()=>clearInterval(t)},[])
  return <span className="rotw" key={i} aria-live="polite">{words[i]}</span>
}
// Put real photos in public/images/<name>.jpg — falls back to a placeholder if missing
export function Photo({name,alt,ratio='4/3',fallback,cap}:{name:string;alt:string;ratio?:string;fallback?:ReactNode;cap?:string}){
  const [ok,setOk]=useState(true)
  return <figure className="photo rv" style={{aspectRatio:ratio}}>{ok?<img src={`/images/${name}.jpg`} alt={alt} loading="lazy" onError={()=>setOk(false)}/>:(fallback||<div className="ph"><Camera size={28}/><small>Add photo: public/images/{name}.jpg</small></div>)}{cap&&<figcaption>{cap}</figcaption>}</figure>
}
