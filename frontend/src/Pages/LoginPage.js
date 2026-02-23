import React, { useState } from 'react';
import LoginForm from '../Components/LoginForm';
import { auth } from '../api';

function LoginPage({ onLogin }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (credentials) => {
    setLoading(true);
    setError('');
    try {
      const res = await auth.login(credentials.username, credentials.password);
      if (res.success && res.data) {
        const { user, token } = res.data;
        const { id, username, nom_complet, email } = user;
        localStorage.setItem(
          'user',
          JSON.stringify({
            id,
            username,
            nom_complet,
            email,
            token,
            isAuthenticated: true,
          })
        );
        onLogin(user);
      } else {
        throw new Error(res.message || 'Connexion échouée');
      }
    } catch (err) {
      const msg = err.message || "Nom d'utilisateur ou mot de passe incorrect";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-header">
          <div className="logo-container" style={{ margin: '0 auto 20px auto', width: '60px', height: '60px' }}>
            <img src="/logo.png" alt="Logo" className="app-logo" />
          </div>
          <h1> Gestion de Caisse</h1>
          <p>Veuillez vous connecter pour accéder au système</p>
        </div>
        <LoginForm
          onSubmit={handleLogin}
          loading={loading}
          error={error}
        />
      </div>
    </div>
  );
}

export default LoginPage;
