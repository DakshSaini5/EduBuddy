import React, { useState, useEffect, useMemo } from 'react';
import '../styles/Dashboard.css'; 
import '../styles/Matchcard.css'; 
import avatar from '/avatar.png'; // Make sure this is in /public/avatar.png
import { TITLE_DEFINITIONS } from '../utils/personalityDefs'; // Import definitions

// --- ComparisonCard Component (Unchanged) ---
// This component is now driven by the filtered list
const ComparisonCard = ({ match, onInteract }) => {
  const handleInteract = async (action) => {
    try {
      const res = await fetch('/api/matches/interact.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          target_user_id: match.user_id,
          action: action
        })
      });
      const data = await res.json();
      if (data.success) {
        if (data.match_status === 'accepted') {
          alert("It's a match! You can find them in your Sessions tab.");
        }
        onInteract(match.user_id); 
      } else {
        alert("Error: " + data.message);
      }
    } catch (err) {
      alert("A network error occurred.");
    }
  };

  return (
    <div className="card match-card">
      <img src={avatar} alt={match.full_name} className='match-image' />
      <div className="match-info">
        <div className="match-name">{match.full_name}</div>
        <div className="match-detail">{match.college}</div>
        {match.personality_title && (
            <div className="match-personality">{match.personality_title}</div>
        )}
      </div>
      <div className="match-comparison-data">
        <div className="match-data-point">
          <strong>Goal:</strong> {match.goal || 'Not specified'}
        </div>
        <div className="match-data-point">
          <strong>Common Subjects:</strong>
          <span className="common-list">{match.common_subjects_list || 'None'}</span>
        </div>
        <div className="match-data-point">
          <strong>Common Hobbies:</strong>
          <span className="common-list">{match.common_hobbies_list || 'None'}</span>
        </div>
      </div>
      <div className="match-card-actions">
        <button className="match-btn connect" onClick={() => handleInteract('connect')}>
          Connect
        </button>
        <button className="match-btn dismiss" onClick={() => handleInteract('dismiss')}>
          Dismiss
        </button>
      </div>
    </div>
  );
};


// --- Main MatchCard Page (Heavily Updated) ---
const MatchCardPage = () => {
  const [allMatches, setAllMatches] = useState([]); // The original list
  const [loading, setLoading] = useState(true);
  
  // --- NEW: Data for filters ---
  const [allSubjects, setAllSubjects] = useState([]);
  const [allHobbies, setAllHobbies] = useState([]);
  
  // --- NEW: State to hold filter values ---
  const [filters, setFilters] = useState({
    subject: 'all',
    hobby: 'all',
    personality: 'all'
  });

  // --- 1. Fetch ALL data on page load ---
  useEffect(() => {
    const fetchAllData = async () => {
      try {
        setLoading(true);
        // Fetch matches, subjects, and hobbies all at once
        const [matchesRes, subjectsRes, hobbiesRes] = await Promise.all([
          fetch('/api/matches.php'), // Fetches ALL matches
          fetch('/api/subjects.php'),
          fetch('/api/hobbies.php')
        ]);
        
        const matchesData = await matchesRes.json();
        if (matchesData.success) setAllMatches(matchesData.data);
        
        const subjectsData = await subjectsRes.json();
        if (subjectsData.success) setAllSubjects(subjectsData.data);
        
        const hobbiesData = await hobbiesRes.json();
        if (hobbiesData.success) setAllHobbies(hobbiesData.data);
        
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchAllData();
  }, []);

  // --- 2. NEW: Filter logic ---
  // `useMemo` recalculates the list only when matches or filters change
  const filteredMatches = useMemo(() => {
    return allMatches.filter(match => {
      // Check Subject Filter
      if (filters.subject !== 'all') {
        // The common_subjects_list is a string: "Physics, Math"
        // We need to check if our filter string is inside it.
        if (!match.common_subjects_list || !match.common_subjects_list.includes(filters.subject)) {
          return false; // Hide this match
        }
      }
      
      // Check Hobby Filter
      if (filters.hobby !== 'all') {
        if (!match.common_hobbies_list || !match.common_hobbies_list.includes(filters.hobby)) {
          return false; // Hide this match
        }
      }
      
      // Check Personality Filter
      if (filters.personality !== 'all') {
        if (match.personality_title !== filters.personality) {
          return false; // Hide this match
        }
      }
      
      // If it passed all checks, show it
      return true;
    });
  }, [allMatches, filters]);

  // --- 3. NEW: Handler to update filter state ---
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prevFilters => ({
      ...prevFilters,
      [name]: value
    }));
  };
  
  const resetFilters = () => {
    setFilters({ subject: 'all', hobby: 'all', personality: 'all' });
  };

  // --- 4. Handler to remove card from list ---
  const handleInteraction = (removedUserId) => {
    setAllMatches(prevMatches => 
      prevMatches.filter(match => match.user_id !== removedUserId)
    );
  };

  // --- 5. UPDATED: Render logic ---
  return (
    <div className="dash-main">
      <div className="dash-header">
        <h2>Explore Matches</h2>
      </div>

      {loading && <p>Finding potential buddies...</p>}
      
      {/* --- NEW: Filter Bar --- */}
      {!loading && (
        <div className="filter-bar">
          <div className="filter-group">
            <label htmlFor="subject-filter">Filter by Common Subject</label>
            <select id="subject-filter" name="subject" value={filters.subject} onChange={handleFilterChange}>
              <option value="all">All Subjects</option>
              {allSubjects.map(s => (
                <option key={s.subject_id} value={s.subject_name}>{s.subject_name}</option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label htmlFor="hobby-filter">Filter by Common Hobby</label>
            <select id="hobby-filter" name="hobby" value={filters.hobby} onChange={handleFilterChange}>
              <option value="all">All Hobbies</option>
              {allHobbies.map(h => (
                <option key={h.hobby_id} value={h.hobby_name}>{h.hobby_name}</option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label htmlFor="personality-filter">Filter by Personality</label>
            <select id="personality-filter" name="personality" value={filters.personality} onChange={handleFilterChange}>
              <option value="all">All Types</option>
              {/* We get the list of titles from our imported definitions */}
              {Object.values(TITLE_DEFINITIONS).map(([title]) => (
                <option key={title} value={title}>{title}</option>
              ))}
            </select>
          </div>
          
          <button onClick={resetFilters} className="filter-reset-btn">Reset Filters</button>
        </div>
      )}
      
      {/* --- This grid now shows FILTERED matches --- */}
      {!loading && filteredMatches.length === 0 && (
        <p>No matches found with these filters. Try expanding your search!</p>
      )}

      <div className="match-grid-container">
        {filteredMatches.map(match => (
          <ComparisonCard 
            key={match.user_id} 
            match={match} 
            onInteract={handleInteraction} 
          />
        ))}
      </div>
    </div>
  );
};

export default MatchCardPage;