import React, { useState, useEffect } from 'react';
import '../styles/Dashboard.css'; // We can reuse the dashboard styles
import avatar from '/avatar.png';
import { FaUserPlus, FaCalendarCheck, FaCheck, FaTimes } from 'react-icons/fa';

// --- Re-using Dashboard components ---
const PendingRequestCard = ({ request, onRespond }) => (
  <div className="session-card">
    <img src={avatar} alt={request.full_name} className='match-image-mini' />
    <div className="session-info">
      <strong>{request.full_name}</strong> wants to connect!
    </div>
    <div className="session-actions">
      <button className="respond-btn accept" onClick={() => onRespond(request.user_id, 'connect')}>
        <FaCheck /> Accept
      </button>
      <button className="respond-btn dismiss" onClick={() => onRespond(request.user_id, 'dismiss')}>
        <FaTimes /> Dismiss
      </button>
    </div>
  </div>
);

const UpcomingSessionCard = ({ session }) => (
  <div className="session-card">
    <img src={avatar} alt={session.buddy_full_name} className='match-image-mini' />
    <div className="session-info">
      Study session with <strong>{session.buddy_full_name}</strong>
    </div>
    <div className="session-actions">
      <a href={session.google_meet_link} target="_blank" rel="noopener noreferrer" className="meet-link-btn">
        <FaCalendarCheck /> Join Meet
      </a>
    </div>
  </div>
);

const Session = () => {
  const [sessionData, setSessionData] = useState({ pending_requests: [], upcoming_sessions: [] });
  const [loading, setLoading] = useState(true);

  // Function to fetch all session data
  const fetchSessionData = async () => {
    try {
      setLoading(true);
      const sessionsRes = await fetch('/api/sessions.php');
      const data = await sessionsRes.json();
      if (data.success) {
        setSessionData(data.data);
      }
    } catch (error) {
      console.error("Failed to fetch session data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessionData();
  }, []);

  // Handler to accept/dismiss requests
  const handleRequestResponse = async (targetUserId, action) => {
    try {
      const res = await fetch('/api/matches/interact.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target_user_id: targetUserId, action: action })
      });
      const data = await res.json();
      
      if (data.success) {
        // Refresh all data on the page
        fetchSessionData(); 
      } else {
        alert("Error: " + data.message);
      }
    } catch (err) {
      alert("A network error occurred.");
    }
  };

  if (loading) {
    return <div className="dash-main"><h2>Loading Sessions...</h2></div>;
  }

  return (
    <div className="dash-main">
      <div className="dash-header">
        <h2>My Sessions</h2>
      </div>

      {/* --- SECTION 1: Pending Requests --- */}
      <div className="dashboard-section">
        <h3><FaUserPlus /> New Buddy Requests</h3>
        <div className='session-list'>
          {sessionData.pending_requests.length > 0 ? (
            sessionData.pending_requests.map(req => (
              <PendingRequestCard key={req.user_id} request={req} onRespond={handleRequestResponse} />
            ))
          ) : (
            <p>You have no new buddy requests.</p>
          )}
        </div>
      </div>

      {/* --- SECTION 2: Upcoming Sessions --- */}
      <div className="dashboard-section">
        <h3><FaCalendarCheck /> Upcoming Sessions</h3>
        <div className='session-list'>
          {sessionData.upcoming_sessions.length > 0 ? (
            sessionData.upcoming_sessions.map(sess => (
              <UpcomingSessionCard key={sess.buddy_user_id} session={sess} />
            ))
          ) : (
            <p>You have no upcoming sessions. Go to the "MatchCard" page to connect with buddies!</p>
          )}
        </div>
      </div>

      {/* You could add a 3rd section here: "Past Sessions" */}
    </div>
  );
};

export default Session;