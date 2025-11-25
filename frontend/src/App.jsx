import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import { useState, useEffect } from 'react';
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
import ReplacementCandidates from './pages/ReplacementCandidates'
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
import DeadlySins from './pages/DeadlySins'
import DSTProcess from './pages/DSTProcess'
import UsVsThem from './pages/UsVsThem'
import IRS from './pages/IRS'
import Newsletter from './pages/Newsletter'
import Blog from './pages/Blog'
import Alpha from './pages/Alpha'
import Login from './pages/Login'
import NotFound from './pages/NotFound'
import AiAssistantWidget from './components/AiAssistantWidget';
import TICShelf from './pages/TICShelf';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Check if user is authenticated (same logic as Navigation.jsx)
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/se/current-user/', {
          credentials: 'include'
        });
        setIsAuthenticated(response.ok);
      } catch (error) {
        setIsAuthenticated(false);
      }
    };
    checkAuth();
  }, []);

  return (
    <>
      <Routes>
        <Route path="/SE" element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="Hub" element={
            <ProtectedRoute isAuthenticated={isAuthenticated}><Hub /></ProtectedRoute>
          } />
          <Route path="Pipe" element={
            <ProtectedRoute isAuthenticated={isAuthenticated}><Pipeline /></ProtectedRoute>
          } />
          <Route path="deal-detail/:referenceNumber" element={
            <ProtectedRoute isAuthenticated={isAuthenticated}><DealDetail /></ProtectedRoute>
          } />
          <Route path="PD" element={
            <ProtectedRoute isAuthenticated={isAuthenticated}><PropertyDatabase /></ProtectedRoute>
          } />
          <Route path="PD/add" element={
            <ProtectedRoute isAuthenticated={isAuthenticated}><AddProperty /></ProtectedRoute>
          } />
          <Route path="PD/:referenceNumber/edit" element={
            <ProtectedRoute isAuthenticated={isAuthenticated}><EditProperty /></ProtectedRoute>
          } />
          <Route path="Profile" element={
            <ProtectedRoute isAuthenticated={isAuthenticated}><Profile /></ProtectedRoute>
          } />
          <Route path="Clients" element={
            <ProtectedRoute isAuthenticated={isAuthenticated}><Clients /></ProtectedRoute>
          } />
          <Route path="enrollment" element={
            <ProtectedRoute isAuthenticated={isAuthenticated}><ExchangeEnrollment /></ProtectedRoute>
          } />
          <Route path="exchange-ids" element={
            <ProtectedRoute isAuthenticated={isAuthenticated}><ExchangeList /></ProtectedRoute>
          } />
          <Route path="replacement-candidates" element={
            <ProtectedRoute isAuthenticated={isAuthenticated}><ReplacementCandidates /></ProtectedRoute>
          } />
          {/* About routes and public routes remain unprotected */}
          <Route path="leadership" element={<Leadership />} />
          <Route path="contact" element={<Contact />} />
          <Route path="process" element={<Process />} />
          <Route path="replacement" element={<Replacement />} />
          <Route path="Assets" element={
            <ProtectedRoute isAuthenticated={isAuthenticated}><Assets /></ProtectedRoute>
          } />
          <Route path="identified" element={
            <ProtectedRoute isAuthenticated={isAuthenticated}><Identified /></ProtectedRoute>
          } />
          <Route path="partners" element={
            <ProtectedRoute isAuthenticated={isAuthenticated}><Partners /></ProtectedRoute>
          } />
          <Route path="Pure" element={<Pure />} />
          <Route path="OwnDeed" element={<OwnDeed />} />
          <Route path="Sins" element={<DeadlySins />} />
          <Route path="DST-Process" element={<DSTProcess />} />
          <Route path="US-v-THEM" element={<UsVsThem />} />
          <Route path="IRS" element={<IRS />} />
          <Route path="Newsletter" element={<Newsletter />} />
          <Route path="Blog" element={<Blog />} />
          <Route path="Alpha" element={<Alpha />} />
          <Route path="login" element={<Login />} />
        </Route>
        <Route path="/" element={<Navigate to="/SE" replace />} />
        <Route path="SE" element={<Layout />}>
          ...existing routes...
          <Route path="ticshelf" element={<TICShelf />} />
        </Route>
        <Route path="*" element={<Navigate to="/SE" replace />} />
      </Routes>
      <AiAssistantWidget />
    </>
  );
}

export default App

