import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Navbar        from './components/Navbar';
import Login         from './pages/Login';
import Register      from './pages/Register';
import Produits      from './pages/Produits';
import ProduitDetail from './pages/ProduitDetail';
import Vendeur       from './pages/Vendeur';
import Panier        from './pages/Panier';
import Stats         from './pages/Stats';
import Commandes     from './pages/Commandes';

function ProtectedRoute({ session, children }) {
  return session ? children : <Navigate to="/login" replace />;
}

export default function App() {
  // ── État global de session ─────────────────────────────────
  // On lit les trois valeurs depuis localStorage au démarrage,
  // ce qui évite la déconnexion au refresh (F5).
  const [session,  setSession]  = useState(localStorage.getItem('sessionId'));
  const [role,     setRole]     = useState(localStorage.getItem('role')     || 'user');
  const [username, setUsername] = useState(localStorage.getItem('username') || '');

  const handleLogin = (sessionId, user, userRole) => {
    localStorage.setItem('sessionId', sessionId);
    localStorage.setItem('username',  user);
    localStorage.setItem('role',      userRole);
    setSession(sessionId);
    setUsername(user);
    setRole(userRole);
  };

  const handleLogout = () => {
    localStorage.removeItem('sessionId');
    localStorage.removeItem('username');
    localStorage.removeItem('role');
    setSession(null);
    setUsername('');
    setRole('user');
  };

  // Appelé après "Devenir vendeur" — met à jour le rôle sans reconnexion
  const handleRoleUpdate = (newRole) => {
    localStorage.setItem('role', newRole);
    setRole(newRole);
  };

  return (
    <BrowserRouter>
      <Navbar
        session={session}
        role={role}
        username={username}
        onLogout={handleLogout}
        onRoleUpdate={handleRoleUpdate}
      />
      <Routes>
        {/* ── Routes publiques ───────────────────────────── */}
        <Route path="/"             element={<Navigate to="/produits" replace />} />
        <Route path="/produits"     element={<Produits session={session} role={role} username={username} />} />
        <Route path="/produits/:id" element={<ProduitDetail session={session} />} />
        <Route path="/vendeur/:nom" element={<Vendeur />} />
        <Route path="/login"        element={session ? <Navigate to="/produits" replace /> : <Login onLogin={handleLogin} />} />
        <Route path="/register"     element={<Register />} />

        {/* ── Routes protégées ───────────────────────────── */}
        <Route path="/panier"
          element={<ProtectedRoute session={session}><Panier /></ProtectedRoute>}
        />
        <Route path="/commandes"
          element={
            <ProtectedRoute session={session}>
              <Commandes role={role} username={username} onRoleUpdate={handleRoleUpdate} />
            </ProtectedRoute>
          }
        />
        <Route path="/stats"
          element={<ProtectedRoute session={session}><Stats /></ProtectedRoute>}
        />
      </Routes>
    </BrowserRouter>
  );
}
