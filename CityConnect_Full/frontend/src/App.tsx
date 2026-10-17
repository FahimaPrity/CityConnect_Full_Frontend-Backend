import { Navigate, Route, Routes } from 'react-router-dom'
import { PublicLayout, RoleGuard, useAuth, DashboardLayout } from './ui'
import * as P from './pages/public'
import * as D from './pages/portal'
import Home from './pages/home'
import { RevealWatcher } from './motion'
const R=(role:any,paths:[string,JSX.Element][])=><Route key={role} element={<RoleGuard role={role}/>}>{paths.map(([p,e])=><Route key={p} path={p} element={e}/>)}</Route>
function Shared({el}:{el:JSX.Element}){const {user}=useAuth();return user?<DashboardLayout role={user.role}/>:<Navigate to="/login" replace/>}
export default function App(){
  return <><RevealWatcher/><Routes>
    <Route element={<PublicLayout/>}><Route index element={<Home/>}/><Route path="about" element={<P.About/>}/><Route path="complaints/new" element={<P.Submit/>}/><Route path="track" element={<P.Track/>}/>
      <Route path="resolved-complaints" element={<P.ResolvedList/>}/><Route path="login" element={<P.Login/>}/><Route path="register" element={<P.Register/>}/><Route path="unauthorized" element={<P.Unauthorized/>}/></Route>
    {R('citizen',[['/citizen/dashboard',<D.Dashboard role="citizen"/>],['/citizen/complaints',<D.Complaints role="citizen"/>],['/citizen/complaints/:id',<D.Detail role="citizen"/>],['/citizen/profile',<D.Profile/>]])}
    {R('agent',[['/agent/dashboard',<D.Dashboard role="agent"/>],['/agent/complaints',<D.Complaints role="agent"/>],['/agent/complaints/:id',<D.Detail role="agent"/>],['/agent/deadlines',<D.Deadlines role="agent"/>],['/agent/profile',<D.Profile/>]])}
    {R('admin',[['/admin/dashboard',<D.Dashboard role="admin"/>],['/admin/complaints',<D.Complaints role="admin"/>],['/admin/complaints/:id',<D.Detail role="admin"/>],['/admin/deadlines',<D.Deadlines role="admin"/>],['/admin/profile',<D.Profile/>]])}
    <Route path="/notifications" element={<Shared el={<D.Notifications/>}/>}><Route index element={<D.Notifications/>}/></Route>
    <Route path="/activity" element={<Shared el={<D.Activity/>}/>}><Route index element={<D.Activity/>}/></Route>
    <Route path="*" element={<Navigate to="/" replace/>}/>
  </Routes></>
}
