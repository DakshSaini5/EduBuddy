import React, { useState, useEffect, useMemo } from 'react';
import '../styles/Dashboard.css'; 
import '../styles/MatchCard.css'; 
import avatar from '/avatar.png';
// --- NEW: Import definitions and your profile hook ---
import { TITLE_DEFINITIONS, TRAIT_DEFINITIONS } from '../utils/personalityDefs'; 

// --- UPDATED ComparisonCard Component ---
const ComparisonCard = ({ match, onInteract, currentUserProfile }) => {
  const handleInteract = async (action) => {
    // ... (Your existing handleInteract function is perfect)
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

  // --- NEW: Logic to find common traits ---
  const commonTraits = useMemo(() => {
    if (!currentUserProfile || !match.personality_type || !currentUserProfile.personality_type) {
      return [];
    }
    
    const myType = currentUserProfile.personality_type; // e.g., "IFNL"
    const matchType = match.personality_type; // e.g., "IFAC"
    const matches = [];
    
    for (let i = 0; i < 4; i++) {
      if (myType[i] && myType[i] === matchType[i]) {
        const letter = myType[i];
        const definition = TRAIT_DEFINITIONS[letter];
        if (definition) {
          // e.g., { letter: 'I', name: 'Introverted' }
          matches.push({ letter: letter, name: definition[0] }); 
        }
      }
    }
    return matches;
  }, [currentUserProfile, match.personality_type]);
  // --- End of new logic ---

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
          <strong>Study Style:</strong>
          <span className="common-list">{match.focus_time.replace('_', ' ')}</span>
        </div>
        <div className="match-data-point">
          <strong>Common Subjects:</strong>
          <span className="common-list">{match.common_subjects_list || 'None'}</span>
        </div>
        <div className="match-data-point">
          <strong>Common Hobbies:</strong>
          <span className="common-list">{match.common_hobbies_list || 'None'}</span>
        </div>
        
        {/* --- NEW: Display common traits --- */}
        <div className="match-data-point">
          <strong>Common Traits:</strong>
          {commonTraits.length > 0 ? (
            <ul className="common-traits-list">
              {commonTraits.map(trait => (
                <li key={trait.letter} className="common-trait-item">
                  {trait.name} ({trait.letter})
                </li>
              ))}
            </ul>
          ) : (
            <span className="common-list">None</span>
          )}
        </div>
        {/* --- End of new section --- */}
        
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


// --- UPDATED Main MatchCard Page ---
const MatchCardPage = () => {
  const [allMatches, setAllMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // --- NEW: State for current user's profile ---
  const [currentUserProfile, setCurrentUserProfile] = useState(null);
  
  const [allSubjects, setAllSubjects] = useState([]);
  const [allHobbies, setAllHobbies] = useState([]);
  
  const [filters, setFilters] = useState({
    subject: 'all',
    hobby: 'all',
    personality: 'all'
  });

  // --- UPDATED: Fetch all data (matches AND profile) ---
  useEffect(() => {
    const fetchAllData = async () => {
      try {
        setLoading(true);
        // Fetch matches, subjects, hobbies, and OWN profile
        const [matchesRes, subjectsRes, hobbiesRes, profileRes] = await Promise.all([
          fetch('/api/matches.php'), // Fetches ALL matches
          fetch('/api/subjects.php'),
          fetch('/api/hobbies.php'),
          fetch('/api/profile.php') // <-- NEW
        ]);
        
        const matchesData = await matchesRes.json();
        if (matchesData.success) setAllMatches(matchesData.data);
        
        const subjectsData = await subjectsRes.json();
        if (subjectsData.success) setAllSubjects(subjectsData.data);
        
        const hobbiesData = await hobbiesRes.json();
        if (hobbiesData.success) setAllHobbies(hobbiesData.data);

        const profileData = await profileRes.json(); // <-- NEW
        if (profileData.success) setCurrentUserProfile(profileData.data);
        
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchAllData();
  }, []);

  // --- (Filter logic is unchanged, but now works with the API's 'HAVING' clause) ---
  const filteredMatches = useMemo(() => {
    return allMatches.filter(match => {
      if (filters.subject !== 'all') {
        if (!match.common_subjects_list || !match.common_subjects_list.includes(filters.subject)) {
          return false;
        }
      }
      if (filters.hobby !== 'all') {
        if (!match.common_hobbies_list || !match.common_hobbies_list.includes(filters.hobby)) {
          return false;
        }
      }
      if (filters.personality !== 'all') {
        if (match.personality_title !== filters.personality) {
          return false;
        }
      }
      return true;
    });
  }, [allMatches, filters]);

  // (All handlers are unchanged)
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

  const handleInteraction = (removedUserId) => {
    setAllMatches(prevMatches => 
      prevMatches.filter(match => match.user_id !== removedUserId)
    );
  };

  return (
    <div className="dash-main">
      <div className="dash-header">
        <h2>Explore Matches</h2>
      </div>

      {loading && <p>Finding potential buddies...</p>}
      
      {!loading && (
        <div className="filter-bar">
          {/* ... (Your filter bar JSX is perfect) ... */}
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
              {Object.values(TITLE_DEFINITIONS).map(([title]) => (
                <option key={title} value={title}>{title}</option>
              ))}
            </select>
          </div>
          
          <button onClick={resetFilters} className="filter-reset-btn">Reset Filters</button>
        </div>
      )}
      
      {!loading && filteredMatches.length === 0 && (
        <p>No matches found with these filters. Try expanding your search!</p>
      )}

      <div className="match-grid-container">
        {filteredMatches.map(match => (
          <ComparisonCard 
            key={match.user_id} 
            match={match} 
            onInteract={handleInteraction}
            currentUserProfile={currentUserProfile} // <-- Pass profile down
          />
        ))}
      </div>
    </div>
  );
};

export default MatchCardPage;