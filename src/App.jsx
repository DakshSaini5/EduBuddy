import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

// Page Components
import Home from './components/Home';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Profile from './components/Profile';
import Login from './components/Login';       
import Register from './components/Register'; 
import Session from './components/Session';
import MatchCardPage from './components/Matchcard';

// --- NEW: A loading screen component ---
const AppLoading = () => (
  <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', backgroundColor: '#f9fafb'}}>
    <h2>Loading EduBuddy...</h2>
  </div>
);

function App() {
  // --- UPDATED: Get 'isLoggedIn' AND 'loading' ---
  const { isLoggedIn, loading } = useAuth();
  const location = useLocation();

  // --- NEW: Show loading screen while checking session ---
  if (loading) {
    return <AppLoading />;
  }

  // --- (The rest of your App.jsx logic) ---
  const showSidebar = isLoggedIn && location.pathname !== '/';
  
  if (isLoggedIn) {
    return (
      <div className="app-container" style={{ display: 'flex', height: '100vh' }}>
        {showSidebar && <Sidebar />}
        <main className="main-content-area" style={{ flexGrow: 1, padding: '20px', overflowY: 'auto' }}>
          <Routes>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/matchcard" element={<MatchCardPage />} />
            <Route path="/session" element={<Session />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </main>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function AppWrapper() {
  return (
    <Router>
      <App />
    </Router>
  );
}