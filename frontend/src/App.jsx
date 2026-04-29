import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Navbar       from './components/Navbar';
import Login        from './pages/Login';
import Register     from './pages/Register';
import Produits     from './pages/Produits';
import ProduitDetail from './pages/ProduitDetail';
import Vendeur      from './pages/Vendeur';
import Panier       from './pages/Panier';
import Stats        from './pages/Stats';
import Commandes    from './pages/Commandes';

function ProtectedRoute({ session, children }) {
  return session ? children : <Navigate to="/login" replace />;
}

export default function App() {
  const [session, setSession] = useState(localStorage.getItem('sessionId'));

  const handleLogin = (sessionId, username) => {
    localStorage.setItem('sessionId', sessionId);
    localStorage.setItem('username',  username);
    setSession(sessionId);
  };

  const handleLogout = () => {
    localStorage.removeItem('sessionId');
    localStorage.removeItem('username');
    setSession(null);
  };

  return (
    <BrowserRouter>
      <Navbar session={session} onLogout={handleLogout} />
      <Routes>
        {/* ── Routes publiques ── */}
        <Route path="/"              element={<Navigate to="/produits" replace />} />
        <Route path="/produits"      element={<Produits  session={session} />} />
        <Route path="/produits/:id"  element={<ProduitDetail session={session} />} />
        <Route path="/vendeur/:nom"  element={<Vendeur />} />
        <Route path="/login"         element={session ? <Navigate to="/produits" replace /> : <Login onLogin={handleLogin} />} />
        <Route path="/register"      element={<Register />} />

        {/* ── Routes protégées ── */}
        <Route path="/panier"    element={<ProtectedRoute session={session}><Panier /></ProtectedRoute>} />
        <Route path="/commandes" element={<ProtectedRoute session={session}><Commandes /></ProtectedRoute>} />
        <Route path="/stats"     element={<ProtectedRoute session={session}><Stats /></ProtectedRoute>} />
      </Routes>
    </BrowserRouter>
  );
}
