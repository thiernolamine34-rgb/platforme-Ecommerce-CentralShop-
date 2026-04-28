import axios from 'axios';

/**
 * Instance axios configurée avec :
 * - Injection automatique du header X-Session-Id sur chaque requête
 * - Déconnexion automatique si le serveur répond 401 (session expirée)
 *
 * TOUTES les pages doivent importer depuis ici au lieu d'importer axios directement.
 */
const api = axios.create();

// ─── Intercepteur requêtes ─────────────────────────────────────
api.interceptors.request.use((config) => {
  const sessionId = localStorage.getItem('sessionId');
  if (sessionId) {
    config.headers['X-Session-Id'] = sessionId;
  }
  return config;
});

// ─── Intercepteur réponses ─────────────────────────────────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Session expirée → déconnexion automatique
    if (error.response?.status === 401) {
      localStorage.removeItem('sessionId');
      localStorage.removeItem('username');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

export default api;
