import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import '../styles/Dashboard.css';
import avatar from '/avatar.png'; // Make sure this is in /public/avatar.png
import { Link } from 'react-router-dom';
import { FaUserPlus, FaCalendarCheck, FaCheck, FaTimes, FaBrain } from 'react-icons/fa';
// --- NEW: Import definitions ---
import { TRAIT_DEFINITIONS, TITLE_DEFINITIONS } from '../utils/personalityDefs';

// --- NEW: Personality Banner Component ---
const PersonalityDisplay = ({ profile }) => {
  // Don't show anything if user hasn't taken the quiz
  if (!profile.personality_title) {
    return null; 
  }

  // Get description
  const description = TITLE_DEFINITIONS[profile.personality_type]
    ? TITLE_DEFINITIONS[profile.personality_type][1]
    : "Your unique personality type.";

  // Get decoded traits
  const decodedTraits = profile.personality_type.split('').map(letter => ({
    letter,
    name: TRAIT_DEFINITIONS[letter] ? TRAIT_DEFINITIONS[letter][0] : 'Unknown'
  }));

  return (
    <div className="personality-banner">
      <div className="personality-banner-header">
        <FaBrain className="icon" />
        <h3>{profile.personality_title}</h3>
        <span>({profile.personality_type})</span>
      </div>
      <p>{description}</p>
      <ul className="personality-trait-list">
        {decodedTraits.map(trait => (
          <li key={trait.letter} className="personality-trait-item">
            <strong>{trait.name}</strong> <span>({trait.letter})</span>
          </li>
        ))}
      </ul>
    </div>
  );
};


// --- (MiniMatchCard, PendingRequestCard, UpcomingSessionCard are unchanged) ---
const MiniMatchCard = ({ match }) => (
  <div className='card mini-match-card'>
    <img src={avatar} alt={match.full_name} className='match-image-mini' />
    <div className="match-info">
      <div className="match-name">{match.full_name}</div>
      <div className="match-detail">{match.college}</div>
    </div>
  </div>
);
const PendingRequestCard = ({ request, onRespond }) => (
  <div className="session-card">
    <img src={avatar} alt={request.full_name} className='match-image-mini' />
    <div className="session-info"><strong>{request.full_name}</strong> wants to connect!</div>
    <div className="session-actions">
      <button className="respond-btn accept" onClick={() => onRespond(request.user_id, 'connect')}><FaCheck /> Accept</button>
      <button className="respond-btn dismiss" onClick={() => onRespond(request.user_id, 'dismiss')}><FaTimes /> Dismiss</button>
    </div>
  </div>
);
const UpcomingSessionCard = ({ session }) => (
  <div className="session-card">
    <img src={avatar} alt={session.buddy_full_name} className='match-image-mini' />
    <div className="session-info">Study session with <strong>{session.buddy_full_name}</strong></div>
    <div className="session-actions">
      <a href={session.google_meet_link} target="_blank" rel="noopener noreferrer" className="meet-link-btn"><FaCalendarCheck /> Join Meet</a>
    </div>
  </div>
);


// --- UPDATED: Dashboard Component ---
const Dashboard = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null); // --- NEW: To store full profile
  const [topMatches, setTopMatches] = useState([]);
  const [sessionData, setSessionData] = useState({ pending_requests: [], upcoming_sessions: [] });
  const [loading, setLoading] = useState(true);

  // --- UPDATED: Function to fetch all dashboard data ---
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // We'll fetch all data in parallel
      const [matchesRes, sessionsRes, profileRes] = await Promise.all([
        fetch('/api/matches.php?limit=5'), // 1. Top 5 Matches
        fetch('/api/sessions.php'),      // 2. Sessions & Requests
        fetch('/api/profile.php')        // 3. User's own profile
      ]);

      const matchesData = await matchesRes.json();
      if (matchesData.success) setTopMatches(matchesData.data);

      const sessionsData = await sessionsRes.json();
      if (sessionsData.success) setSessionData(sessionsData.data);
      
      const profileData = await profileRes.json();
      if (profileData.success) setProfile(profileData.data);

    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // --- (handleRequestResponse is unchanged) ---
  const handleRequestResponse = async (targetUserId, action) => {
    try {
      const res = await fetch('/api/matches/interact.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target_user_id: targetUserId, action: action })
      });
      const data = await res.json();
      if (data.success) {
        fetchDashboardData(); 
      } else {
        alert("Error: " + data.message);
      }
    } catch (err) {
      alert("A network error occurred.");
    }
  };

  if (loading) {
    return <div className='dash-main'><h2>Loading your dashboard...</h2></div>;
  }

  return (
    <div className='dash-main'>
      <div className='dash-header'>
        <h2>Hey there, {user?.full_name || 'Buddy'}! 👋</h2>
        <Link to="/profile" className='about-btn'>Edit Profile</Link>
      </div>

      {/* --- NEW: Personality Banner --- */}
      {/* It will only show if profile is loaded and user has a type */}
      {profile && <PersonalityDisplay profile={profile} />}

      {/* --- (Rest of the dashboard sections are unchanged) --- */}
      {sessionData.pending_requests.length > 0 && (
        <div className="dashboard-section">
          <h3><FaUserPlus /> New Buddy Requests</h3>
          <div className='session-list'>
            {sessionData.pending_requests.map(req => (
              <PendingRequestCard key={req.user_id} request={req} onRespond={handleRequestResponse} />
            ))}
          </div>
        </div>
      )}

      {sessionData.upcoming_sessions.length > 0 && (
        <div className="dashboard-section">
          <h3><FaCalendarCheck /> Upcoming Sessions</h3>
          <div className='session-list'>
            {sessionData.upcoming_sessions.map(sess => (
              <UpcomingSessionCard key={sess.buddy_user_id} session={sess} />
            ))}
          </div>
        </div>
      )}

      <div className="dashboard-section">
        <div className="dashboard-section-header">
          <h3>Top New Matches for You</h3>
          <Link to="/matchcard" className="view-all-link">View All &rarr;</Link>
        </div>
        <div className='matches-row'>
          {topMatches.length > 0 ? (
            topMatches.map((m) => (
              <MiniMatchCard match={m} key={m.user_id} />
            ))
          ) : (
            <p>No new matches. Complete your profile to get more!</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;