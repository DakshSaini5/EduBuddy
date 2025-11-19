import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext'; // 1. Import useTheme
import '../styles/Sidebar.css'; // This will be your *new* CSS from below
import '../styles/ThemeToggle.css'; // 2. Import toggle CSS

// --- NEW: Theme Toggle Component ---
const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();
  
  return (
    <div className="theme-toggle-container">
      <span className="theme-toggle-label">Dark Mode</span>
      <label className="theme-toggle-switch">
        <input 
          type="checkbox" 
          onChange={toggleTheme}
          checked={theme === 'dark'}
        />
        <span className="theme-toggle-slider"></span>
      </label>
    </div>
  );
};


const Sidebar = () => {
  const { handleLogout } = useAuth();
  const navigate = useNavigate();

  const onLogoutClick = async () => {
    await fetch('/api/auth/logout.php');
    handleLogout();
    navigate('/');
  };

  return (
    // The sidebar div itself is now styled by the new SideBar.css
    <div className='sidebar'>
      <div> {/* Wrap nav in a div to push toggle to bottom */}
        <div className='logo-container'>
          <span className='logo-text'>EduBuddy</span>
        </div>
        <nav className='nav'>
          <NavLink
            to="/dashboard"
            className={({ isActive }) => (isActive ? "nav-link active-link" : "nav-link")}>
            Dashboard
          </NavLink>
          <NavLink
            to="/profile"
            className={({ isActive }) => (isActive ? "nav-link active-link" : "nav-link")}>
            Profile
          </NavLink>
          <NavLink
            to="/matchcard"
            className={({ isActive }) => (isActive ? "nav-link active-link" : "nav-link")}>
            MatchCard
          </NavLink>
          <NavLink
            to="/session"
            className={({ isActive }) => (isActive ? "nav-link active-link" : "nav-link")}>
            Session
          </NavLink>
          <button 
            onClick={onLogoutClick} 
            className="nav-link" 
            style={{background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer', width: '100%'}}
          >
            Log Out
          </button>
        </nav>
      </div>
      
      {/* 3. Add the toggle switch to the bottom */}
      <ThemeToggle />
    </div>
  );
};

export default Sidebar;