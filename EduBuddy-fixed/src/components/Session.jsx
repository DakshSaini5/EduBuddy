import React, { useState, useEffect } from 'react';
import '../styles/Dashboard.css'; // We reuse the dashboard styles
import defaultAvatar from '/avatar.png';
import { FaUserPlus, FaCalendarCheck, FaCheck, FaTimes, FaComments, FaLink, FaSave } from 'react-icons/fa';
import PlanSessionModal from './PlanSessionModal'; 

// Helper function to get the correct image path
const getImagePath = (url) => {
  if (url) return `/api/${url}`;
  return defaultAvatar;
};

// Pending Request Card (Unchanged)
const PendingRequestCard = ({ request, onRespond }) => (
  <div className="session-card">
    <img src={getImagePath(request.profile_pic_url)} alt={request.full_name} className='match-image-mini' />
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
        onLinkSaved(); // This will refresh the session page
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

// Connection Card (Unchanged)
const ConnectionCard = ({ buddy, onPlan }) => (
  <div className="connection-card">
    <img src={getImagePath(buddy.buddy_profile_pic)} alt={buddy.buddy_full_name} className='match-image-mini' />
    <div className="connection-info">
      <strong>{buddy.buddy_full_name}</strong>
      <span>{buddy.college}</span>
      {buddy.personality_title && (
        <span className="connection-personality">{buddy.personality_title}</span>
      )}
    </div>
    <div className="connection-actions">
      <button className="plan-btn" onClick={() => onPlan(buddy)}>
        <FaComments /> Plan Session
      </button>
    </div>
  </div>
);


// --- Main Session Component (Updated) ---
const Session = () => {
  const [sessionData, setSessionData] = useState({ 
    pending_requests: [], 
    planned_sessions: [],
    my_connections: [] 
  });
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [buddyToPlan, setBuddyToPlan] = useState(null);

  const fetchSessionData = async () => {
    // ... (This function is unchanged) ...
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
        fetchSessionData(); 
      } else {
        alert("Error: " + data.message);
      }
    } catch (err) {
      alert("A network error occurred.");
    }
  };

  // --- (Modal handlers are unchanged) ---
  const handleOpenModal = (buddy) => {
    setBuddyToPlan(buddy);
    setShowModal(true);
  };
  const handleCloseModal = () => {
    setShowModal(false);
    setBuddyToPlan(null);
  };
  const handlePlanSuccess = () => {
    handleCloseModal();
    fetchSessionData(); 
  };

  if (loading) {
    return <div className="dash-main"><h2>Loading Sessions...</h2></div>;
  }

  return (
    <>
      {showModal && (
        <PlanSessionModal 
          buddy={buddyToPlan}
          onClose={handleCloseModal}
          onPlanSuccess={handlePlanSuccess}
        />
      )}
    
      <div className="dash-main">
        <div className="dash-header">
          <h2>My Sessions</h2>
        </div>

        {sessionData.pending_requests.length > 0 && (
          <div className="dashboard-section">
            {/* ... (Pending Requests section is unchanged) ... */}
            <h3><FaUserPlus /> New Buddy Requests</h3>
            <div className='session-list'>
              {sessionData.pending_requests.map(req => (
                <PendingRequestCard key={req.user_id} request={req} onRespond={handleRequestResponse} />
              ))}
            </div>
          </div>
        )}

        <div className="dashboard-section">
          <h3><FaCalendarCheck /> Upcoming Planned Sessions</h3>
          <div className='session-list'>
            {sessionData.planned_sessions.length > 0 ? (
              sessionData.planned_sessions.map(sess => (
                // Pass the refresh function down
                <UpcomingSessionCard 
                  key={sess.buddy_user_id} 
                  session={sess} 
                  onLinkSaved={fetchSessionData} 
                />
              ))
            ) : (
              <p>You have no sessions planned. Plan one with a connection below!</p>
            )}
          </div>
        </div>

        <div className="dashboard-section">
          {/* ... (My Connections section is unchanged) ... */}
          <h3><FaComments /> My Connections</h3>
          <div className='connection-grid'>
            {sessionData.my_connections.length > 0 ? (
              sessionData.my_connections.map(buddy => (
                <ConnectionCard key={buddy.buddy_user_id} buddy={buddy} onPlan={handleOpenModal} />
              ))
            ) : (
              <p>You haven't matched with anyone yet. Go to the "MatchCard" page to find buddies!</p>
            )}
          </div>
        </div>

      </div>
    </>
  );
};

export default Session;