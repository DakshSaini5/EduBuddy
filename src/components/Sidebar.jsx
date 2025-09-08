import React from 'react';
import { NavLink } from 'react-router-dom';
import Logo from '../assets/Logo.png';
import { useNavigate } from 'react-router-dom';
import '../styles/SideBar.css'

const Sidebar = () => {

  function backToHome() {
    const navigate = useNavigate();

    const goHome = () => {
      navigate('/')
    }
  }

  return (
    <div className='sidebar'>
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

        <NavLink
          to="/"
          className={({ isActive }) => (isActive ? "nav-link active-link" : "nav-link")}>
          Go Back to Home
        </NavLink>

      </nav>
    </div>
  )
}

export default Sidebar;