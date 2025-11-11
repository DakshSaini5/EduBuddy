import React, { useState, useEffect } from 'react';
import '../styles/Profile.css';
import PersonalityQuiz from './PersonalityQuiz';
import { 
  FaGithub, FaLinkedin, FaDiscord, FaTwitter, 
  FaInstagram, FaWhatsapp, FaBrain 
} from 'react-icons/fa';
// --- REMOVED: Imports for TRAIT_DEFINITIONS and TITLE_DEFINITIONS ---

// CheckboxGrid Component (Unchanged)
const CheckboxGrid = ({ title, prefix, items, selectedItems, onChange }) => (
  <div className="form-group">
    <label className="form-section-title">{title}</label>
    <div className="tag-grid">
      {items.map(item => {
        const id = (prefix === 'subject') ? item.subject_id : item.hobby_id;
        const name = (prefix === 'subject') ? item.subject_name : item.hobby_name;
        const isChecked = selectedItems.some(s => (prefix === 'subject' && s.subject_id === id) || (prefix === 'hobby' && s.hobby_id === id));
        return (
          <div key={`${prefix}-${id}`} className="tag-checkbox">
            <input type="checkbox" id={`${prefix}-${id}`} checked={isChecked} onChange={(e) => onChange(e, item)} />
            <label htmlFor={`${prefix}-${id}`}>{name}</label>
          </div>
        );
      })}
    </div>
  </div>
);

// RadioGroup Component (Unchanged)
const RadioGroup = ({ title, name, options, selectedValue, onChange }) => (
  <div className="form-group">
    <label className="form-section-title">{title}</label>
    <div className="tag-grid">
      {options.map(opt => (
        <div key={opt.value} className="tag-checkbox">
          <input type="radio" id={`${name}-${opt.value}`} name={name} value={opt.value} checked={selectedValue === opt.value} onChange={onChange} />
          <label htmlFor={`${name}-${opt.value}`}>{opt.label}</label>
        </div>
      ))}
    </div>
  </div>
);

// --- REMOVED: PersonalityCard Component ---

// Main Profile Component
const Profile = () => {
  const [profile, setProfile] = useState({
    full_name: "", college: "", bio: "", preferred_study_time: "00:00:00",
    goal: "", focus_time: "flexible", session_length: "flexible",
    personality_type: "", personality_title: "", 
    course: "", year_of_passing: "", 
    whatsapp: "", instagram: "", discord: "", github: "", linkedin: "", twitter: "",
    subjects: [], hobbies: [] 
  });
  
  const [allSubjects, setAllSubjects] = useState([]); 
  const [allHobbies, setAllHobbies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [showQuiz, setShowQuiz] = useState(false);

  // --- fetchProfile is now SIMPLER (it still fetches the data, just doesn't use it for a card) ---
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch('/api/profile.php');
        const data = await res.json();
        if (data.success) {
          setProfile(data.data); // Just set the data
        } else {
          setMessage("Error: " + data.message); setMessageType('error');
        }
      } catch (error) {
        setMessage("Error: Could not load profile."); setMessageType('error');
      }
    };
    const fetchAllSubjects = async () => { 
      try {
        const res = await fetch('/api/subjects.php');
        const data = await res.json();
        if (data.success) setAllSubjects(data.data);
      } catch (error) { console.error("Could not load subjects", error); }
    };
    const fetchAllHobbies = async () => {
      try {
        const res = await fetch('/api/hobbies.php');
        const data = await res.json();
        if (data.success) setAllHobbies(data.data);
      } catch (error) { console.error("Could not load hobbies", error); }
    };
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchProfile(), fetchAllSubjects(), fetchAllHobbies()]);
      setLoading(false);
    };
    loadData();
  }, []); 

  // --- All handlers (handleChange, handleSubmit, etc.) are UNCHANGED ---
  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfile(prev => ({ ...prev, [name]: value }));
  };
  const handleSubjectChange = (e, subject) => {
    const { checked } = e.target;
    setProfile(prev => ({...prev, subjects: checked ? [...prev.subjects, subject] : prev.subjects.filter(s => s.subject_id !== subject.subject_id)}));
  };
  const handleHobbyChange = (e, hobby) => {
    const { checked } = e.target;
    setProfile(prev => ({...prev, hobbies: checked ? [...prev.hobbies, hobby] : prev.hobbies.filter(h => h.hobby_id !== hobby.hobby_id)}));
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("Saving..."); setMessageType("");
    try {
      const res = await fetch('/api/profile.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile), 
      });
      const result = await res.json();
      if (result.success) {
        setMessage("Profile saved successfully!"); setMessageType('success');
      } else {
        setMessage(`Error: ${result.message || 'Could not save profile.'}`); setMessageType('error');
      }
    } catch (error) {
      setMessage("Error: An unexpected error occurred."); setMessageType('error');
    }
  };
  // --- UPDATED: handleQuizComplete now also refetches the profile ---
  const handleQuizComplete = (quizData) => {
    // Optimistically update the profile state
    setProfile(prev => ({
      ...prev,
      personality_type: quizData.personality_type,
      personality_title: quizData.personality_title
    }));
    setShowQuiz(false);
    setMessage("Your personality type has been updated!");
    setMessageType("success");
  };

  if (loading) {
    return <div className='profile-container'><h2>Loading Profile...</h2></div>
  }

  return (
    <> 
      {showQuiz && <PersonalityQuiz onComplete={handleQuizComplete} onClose={() => setShowQuiz(false)} />}
      
      <div className="profile-container">
        <div className="profile-header">
          <h2>Edit Your Profile</h2>
          <p>This information will be used to find your perfect study buddies.</p>
        </div>
        
        {message && <p className={`profile-message ${messageType}`}>{message}</p>}
        
        <form onSubmit={handleSubmit} className="profile-form">
          
          <div className="form-section">
            <h3 className="form-section-title">Academic Details</h3>
            <div className="form-group"><label htmlFor="full_name">Full Name:</label><input id="full_name" type="text" name="full_name" value={profile.full_name} onChange={handleChange} required /></div>
            <div className="form-group"><label htmlFor="college">College/University:</label><input id="college" type="text" name="college" value={profile.college} onChange={handleChange} /></div>
            <div className="input-grid-2">
              <div className="form-group"><label htmlFor="course">Course:</label><input id="course" type="text" name="course" value={profile.course} onChange={handleChange} placeholder="e.g., B.Tech (CSE)" /></div>
              <div className="form-group"><label htmlFor="year_of_passing">Passing Year:</label><input id="year_of_passing" type="number" name="year_of_passing" value={profile.year_of_passing} onChange={handleChange} placeholder="e.g., 2026" /></div>
            </div>
          </div>

          <div className="form-section">
            <h3 className="form-section-title">Study Goals & Personality</h3>
            <div className="form-group"><label htmlFor="bio">Bio / About Me:</label><textarea id="bio" name="bio" value={profile.bio} onChange={handleChange} placeholder="What are you studying? What are your goals?" /></div>
            <div className="form-group"><label htmlFor="goal">My Primary Goal:</label><textarea id="goal" name="goal" value={profile.goal} onChange={handleChange} placeholder="e.g., 'Find a partner for a hackathon', 'Ace my physics exam', or 'Build a startup'" style={{minHeight: '60px'}}/></div>
            
            {/* --- UPDATED: This section is now just the CTA card --- */}
            <div className="form-group">
              <label className="form-section-title">My EduBuddy Type</label>
              <div className="quiz-cta-card" onClick={() => setShowQuiz(true)}>
                <FaBrain className="quiz-cta-icon" />
                <div className="quiz-cta-text">
                  <h4>{profile.personality_type ? `You are: ${profile.personality_title}` : "Take the Personality Quiz"}</h4>
                  <p>{profile.personality_type ? "Click here to retake the quiz." : "Find your study type in 2 minutes to get the best matches."}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="form-section">
            <h3 className="form-section-title">Study Preferences</h3>
            <RadioGroup
              title="I'm a..." name="focus_time" selectedValue={profile.focus_time} onChange={handleChange}
              options={[
                { label: '☀️ Early Bird (Morning)', value: 'early_bird' },
                { label: '😎 Day Tripper (Afternoon)', value: 'day_tripper' },
                { label: '🌙 Night Owl (Evening/Night)', value: 'night_owl' },
                { label: '🤸‍♂️ Anytime', value: 'flexible' }
              ]}
            />
            <RadioGroup
              title="I prefer..." name="session_length" selectedValue={profile.session_length} onChange={handleChange}
              options={[
                { label: '⏱️ Pomodoros (25m)', value: 'pomodoro' },
                { label: '📚 Study Blocks (1-2hr)', value: 'medium' },
                { label: '🏋️‍♂️ Marathon (2hr+)', value: 'marathon' },
                { label: '🤸‍♂️ Flexible', value: 'flexible' }
              ]}
            />
            <div className="form-group" style={{marginTop: '1.5rem'}}>
              <label htmlFor="study_time">My usual study time starts around:</label>
              <input id="study_time" type="time" name="preferred_study_time" value={profile.preferred_study_time} onChange={handleChange} />
            </div>
          </div>

          <div className="form-section">
            <CheckboxGrid title="My Study Subjects" prefix="subject" items={allSubjects} selectedItems={profile.subjects} onChange={handleSubjectChange} />
          </div>
          <div className="form-section">
            <CheckboxGrid title="My Hobbies & Interests" prefix="hobby" items={allHobbies} selectedItems={profile.hobbies} onChange={handleHobbyChange} />
          </div>

          <div className="form-section">
            <h3 className="form-section-title">Social Links</h3>
            <div className="social-input-group">
              <div className="social-input"><FaGithub className="social-icon" /><input type="text" name="github" value={profile.github} onChange={handleChange} placeholder="GitHub Username" /></div>
              <div className="social-input"><FaLinkedin className="social-icon" /><input type="text" name="linkedin" value={profile.linkedin} onChange={handleChange} placeholder="LinkedIn Profile URL" /></div>
              <div className="social-input"><FaDiscord className="social-icon" /><input type="text" name="discord" value={profile.discord} onChange={handleChange} placeholder="Discord Username#1234" /></div>
              <div className="social-input"><FaTwitter className="social-icon" /><input type="text" name="twitter" value={profile.twitter} onChange={handleChange} placeholder="Twitter @handle" /></div>
              <div className="social-input"><FaInstagram className="social-icon" /><input type="text" name="instagram" value={profile.instagram} onChange={handleChange} placeholder="Instagram Username" /></div>
              <div className="social-input"><FaWhatsapp className="social-icon" /><input type="text" name="whatsapp" value={profile.whatsapp} onChange={handleChange} placeholder="Whatsapp +91..." /></div>
            </div>
          </div>

          <button type='submit'>Save Profile</button>
        </form>
      </div>
    </>
  );
};

export default Profile;