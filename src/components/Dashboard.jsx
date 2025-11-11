import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import '../styles/Dashboard.css';
import defaultAvatar from '/avatar.png'; 
import { Link } from 'react-router-dom';
import { FaUserPlus, FaCalendarCheck, FaCheck, FaTimes, FaBrain, FaLink, FaSave } from 'react-icons/fa';
import { TRAIT_DEFINITIONS, TITLE_DEFINITIONS } from '../utils/personalityDefs';

// Helper function to get the correct image path
const getImagePath = (url) => {
  if (url) return `/api/${url}`;
  return defaultAvatar;
};

// Personality Banner (Unchanged)
const PersonalityDisplay = ({ profile }) => {
  // ... (This component is fine, no changes needed)
  if (!profile.personality_title) return null; 
  const description = TITLE_DEFINITIONS[profile.personality_type] ? TITLE_DEFINITIONS[profile.personality_type][1] : "Your unique personality type.";
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

// MiniMatchCard (Unchanged)
const MiniMatchCard = ({ match }) => (
  <div className='card mini-match-card'>
    <img src={getImagePath(match.profile_pic_url)} alt={match.full_name} className='match-image-mini' />
    <div className="match-info">
      <div className="match-name">{match.full_name}</div>
      <div className="match-detail">{match.college}</div>
    </div>
  </div>
);

// PendingRequestCard (Unchanged)
const PendingRequestCard = ({ request, onRespond }) => (
  <div className="session-card">
    <img src={getImagePath(request.profile_pic_url)} alt={request.full_name} className='match-image-mini' />
    <div className="session-info"><strong>{request.full_name}</strong> wants to connect!</div>
    <div className="session-actions">
      <button className="respond-btn accept" onClick={() => onRespond(request.user_id, 'connect')}><FaCheck /> Accept</button>
      <button className="respond-btn dismiss" onClick={() => onRespond(request.user_id, 'dismiss')}><FaTimes /> Dismiss</button>
    </div>
  </div>
);

// --- *** NEW: Heavily Updated UpcomingSessionCard *** ---
const UpcomingSessionCard = ({ session, onLinkSaved }) => {
  const [linkInput, setLinkInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  
  const formatDate = (datetime) => {
    try {
      const date = new Date(datetime);
      return date.toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });
    } catch (e) { return datetime; }
  };

  const handleSaveLink = async () => {
    if (!linkInput.includes('meet.google.com/')) {
      alert('Please paste a valid Google Meet link.');
      return;
    }
    setIsSaving(true);
    try {
      const res = await fetch('/api/sessions/update_link.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          buddy_user_id: session.buddy_user_id,
          meet_link: linkInput
        })
      });
      const data = await res.json();
      if (data.success) {
        onLinkSaved(); // This will refresh the dashboard
      } else {
        alert("Error: " + data.message);
      }
    } catch (err) {
      alert('A network error occurred.');
    }
    setIsSaving(false);
  };

  return (
    <div className="session-card">
      <img src={getImagePath(session.buddy_profile_pic)} alt={session.buddy_full_name} className='match-image-mini' />
      
      <div className="session-info">
        <div className="session-text">
          <strong>{session.session_topic}</strong>
          <span>with {session.buddy_full_name}</span>
          <span className="session-time">{formatDate(session.session_datetime)}</span>
        </div>
      </div>
      
      <div className="session-actions-vertical">
        {session.google_meet_link ? (
          // State 1: Link Exists
          <a href={session.google_meet_link} target="_blank" rel="noopener noreferrer" className="meet-link-btn">
            <FaCalendarCheck /> Join Meet
          </a>
        ) : (
          // State 2: No Link Exists
          <>
            <a href="https://meet.google.com/new" target="_blank" rel="noopener noreferrer" className="meet-link-btn create">
              <FaLink /> Create Meet & Copy Link
            </a>
            <div className="save-link-wrapper">
              <input 
                type="text" 
                placeholder="Paste Google Meet link here"
                value={linkInput}
                onChange={(e) => setLinkInput(e.target.value)}
              />
              <button onClick={handleSaveLink} disabled={isSaving}>
                <FaSave />
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};


// --- Dashboard Component (Updated) ---
const Dashboard = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [topMatches, setTopMatches] = useState([]);
  const [sessionData, setSessionData] = useState({ 
    pending_requests: [], 
    planned_sessions: [] 
  });
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    // ... (This function is unchanged, it just fetches all data) ...
    try {
      setLoading(true);
      const [matchesRes, sessionsRes, profileRes] = await Promise.all([
        fetch('/api/matches.php?limit=5'), 
        fetch('/api/sessions.php'),      
        fetch('/api/profile.php')        
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

  const handleRequestResponse = async (targetUserId, action) => {
    // ... (This function is unchanged) ...
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
      {profile && <PersonalityDisplay profile={profile} />}

      {sessionData.pending_requests && sessionData.pending_requests.length > 0 && (
        <div className="dashboard-section">
          <h3><FaUserPlus /> New Buddy Requests</h3>
          <div className='session-list'>
            {sessionData.pending_requests.map(req => (
              <PendingRequestCard key={req.user_id} request={req} onRespond={handleRequestResponse} />
            ))}
          </div>
        </div>
      )}

      {sessionData.planned_sessions && sessionData.planned_sessions.length > 0 && (
        <div className="dashboard-section">
          <h3><FaCalendarCheck /> Upcoming Sessions</h3>
          <div className='session-list'>
            {sessionData.planned_sessions.map(sess => (
              // Pass the refresh function down
              <UpcomingSessionCard 
                key={sess.buddy_user_id} 
                session={sess} 
                onLinkSaved={fetchDashboardData} 
              />
            ))}
          </div>
        </div>
      )}

      <div className="dashboard-section">
        {/* ... (Top Matches section is unchanged) ... */}
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