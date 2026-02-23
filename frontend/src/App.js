import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom'; // Import Link
import LoginPage from './Pages/LoginPage';
import HomePage from './Pages/HomePage';
import FormPage from './Pages/FormPage';
import UserListPage from './Pages/UserListPage'; // Import UserListPage
import './App.css';


function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  // const [apiMessage, setApiMessage] = useState(''); // Removed state for the API message

  // Removed Effect to fetch the test message from the API
  // useEffect(() => {
  //   axios.get('http://localhost:8000/api/test')
  //     .then(response => {
  //       setApiMessage(response.data.message);
  //     })
  //     .catch(error => {
  //       console.error("Error fetching data from API:", error);
  //       setApiMessage("Failed to connect to the backend. Is the Laravel server running?");
  //     });
  // }, []);

  useEffect(() => {
    // Disable auto-login from localStorage to force showing the login page first
    /*
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (user && user.token && user.isAuthenticated) {
      setIsAuthenticated(true);
    }
    */
    setLoading(false);
  }, []);

  useEffect(() => {
    const handleUnauthorized = () => setIsAuthenticated(false);
    window.addEventListener('unauthorized', handleUnauthorized);
    return () => window.removeEventListener('unauthorized', handleUnauthorized);
  }, []);

  const handleLogin = (user) => {
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    // ONLY remove user data, NOT operations!
    localStorage.removeItem('user');
    // DO NOT remove operations!
    setIsAuthenticated(false);
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading"></div>
        <p>Chargement...</p>
      </div>
    );
  }

  return (
    <Router>
      <div className="App">
        {isAuthenticated && (
          <nav className="navbar">
            <div className="nav-container">
              <div className="nav-left">
                <div className="logo-container">
                  <img src="/logo.png" alt="Logo" className="app-logo" />
                </div>
                <h2> Gestion de Caisse</h2>
              </div>
              <div className="nav-right">
                <div className="user-info">
                  <span className="user-avatar"></span>
                  <span className="user-name">
                    {JSON.parse(localStorage.getItem('user'))?.nom_complet || 'Utilisateur'}
                  </span>
                </div>
                <button 
                  className="btn btn-secondary logout-btn"
                  onClick={handleLogout}
                >
                  Déconnexion
                </button>
              </div>
            </div>
          </nav>
        )}
        
        {/* Removed Display the API message */}
        {/* {apiMessage && <p style={{ textAlign: 'center', color: 'green' }}>{apiMessage}</p>} */}

        <Routes>
          <Route 
            path="/login" 
            element={
              isAuthenticated ? 
              <Navigate to="/" /> : 
              <LoginPage onLogin={handleLogin} />
            } 
          />
          <Route 
            path="/" 
            element={
              isAuthenticated ? 
              <HomePage /> : 
              <Navigate to="/login" />
            } 
          />
          <Route 
            path="/operation/:type" 
            element={
              isAuthenticated ? 
              <FormPage /> : 
              <Navigate to="/login" />
            } 
          />
          <Route 
            path="/users" // New route for User Management
            element={
              isAuthenticated ? 
              <UserListPage /> : 
              <Navigate to="/login" />
            } 
          />
          <Route 
            path="*" 
            element={
              <Navigate to={isAuthenticated ? "/" : "/login"} />
            } 
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;