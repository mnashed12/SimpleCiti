import { Routes, Route } from 'react-router-dom'
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
      {/* All routes now explicitly prefixed with /SE to match deployment catch-all */}
      <Route path="/SE/" element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="SE/Hub" element={<Hub />} />
        <Route path="SE/Pipe" element={<Pipeline />} />
        <Route path="SE/deal-detail/:referenceNumber" element={<DealDetail />} />
        <Route path="SE/PD" element={<PropertyDatabase />} />
        <Route path="SE/PD/add" element={<AddProperty />} />
        <Route path="SE/PD/:referenceNumber/edit" element={<EditProperty />} />
        <Route path="SE/Profile" element={<Profile />} />
        <Route path="SE/Clients" element={<Clients />} />
        <Route path="SE/enrollment" element={<ExchangeEnrollment />} />
        <Route path="SE/exchange-ids" element={<ExchangeList />} />
        <Route path="SE/leadership" element={<Leadership />} />
        <Route path="SE/contact" element={<Contact />} />
        <Route path="SE/process" element={<Process />} />
        <Route path="SE/replacement" element={<Replacement />} />
        <Route path="SE/Assets" element={<Assets />} />
        <Route path="SE/identified" element={<Identified />} />
        <Route path="SE/partners" element={<Partners />} />
        <Route path="SE/Pure" element={<Pure />} />
        <Route path="SE/OwnDeed" element={<OwnDeed />} />
        <Route path="SE/Sins" element={<Sins />} />
        <Route path="SE/IRS" element={<IRS />} />
        <Route path="SE/Newsletter" element={<Newsletter />} />
        <Route path="SE/Blog" element={<Blog />} />
        <Route path="SE/Alpha" element={<Alpha />} />
        <Route path="SE/login" element={<Login />} />
        <Route path="SE/*" element={<NotFound />} />
      </Route>
    </Routes>
  )
}

export default App

