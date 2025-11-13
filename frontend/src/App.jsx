import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import HomePage from './pages/HomePage'
import Hub from './pages/Hub'
import Pipeline from './pages/Pipeline'
import DealDetail from './pages/DealDetail'
import Dashboard from './pages/Dashboard'
import PropertyDatabase from './pages/PropertyDatabase'
import AddProperty from './pages/AddProperty'
import EditProperty from './pages/EditProperty'
import Profile from './pages/Profile'
import Clients from './pages/Clients'
import ExchangeEnrollment from './pages/ExchangeEnrollment'
import ExchangeList from './pages/ExchangeList'
import Leadership from './pages/Leadership'
import Contact from './pages/Contact'
import Process from './pages/Process'
import Replacement from './pages/Replacement'
import Assets from './pages/Assets'
import Identified from './pages/Identified'
import Partners from './pages/Partners'
import Pure from './pages/Pure'
import OwnDeed from './pages/OwnDeed'
import Sins from './pages/Sins'
import IRS from './pages/IRS'
import Newsletter from './pages/Newsletter'
import Blog from './pages/Blog'
import Alpha from './pages/Alpha'
import Login from './pages/Login'
import NotFound from './pages/NotFound'

function App() {
  return (
    <Routes>
      {/* Parent /SE route; children define relative paths for proper /SE/xyz URLs */}
      <Route path="/SE" element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="Hub" element={<Hub />} />
        <Route path="Pipe" element={<Pipeline />} />
        <Route path="deal-detail/:referenceNumber" element={<DealDetail />} />
        <Route path="PD" element={<PropertyDatabase />} />
        <Route path="PD/add" element={<AddProperty />} />
        <Route path="PD/:referenceNumber/edit" element={<EditProperty />} />
        <Route path="Profile" element={<Profile />} />
        <Route path="Clients" element={<Clients />} />
        <Route path="enrollment" element={<ExchangeEnrollment />} />
        <Route path="exchange-ids" element={<ExchangeList />} />
        <Route path="leadership" element={<Leadership />} />
        <Route path="contact" element={<Contact />} />
        <Route path="process" element={<Process />} />
        <Route path="replacement" element={<Replacement />} />
        <Route path="Assets" element={<Assets />} />
        <Route path="identified" element={<Identified />} />
        <Route path="partners" element={<Partners />} />
        <Route path="Pure" element={<Pure />} />
        <Route path="OwnDeed" element={<OwnDeed />} />
        <Route path="Sins" element={<Sins />} />
        <Route path="IRS" element={<IRS />} />
        <Route path="Newsletter" element={<Newsletter />} />
        <Route path="Blog" element={<Blog />} />
        <Route path="Alpha" element={<Alpha />} />
        <Route path="login" element={<Login />} />
        <Route path="*" element={<NotFound />} />
      </Route>
      {/* Redirect legacy root and any stray non-SE paths to /SE */}
      <Route path="/" element={<Navigate to="/SE" replace />} />
      <Route path="*" element={<Navigate to="/SE" replace />} />
    </Routes>
  )
}

export default App

