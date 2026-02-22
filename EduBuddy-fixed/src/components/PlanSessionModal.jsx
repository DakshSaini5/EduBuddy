import React, { useState } from 'react';
import '../styles/PlanSessionModal.css'; // We will create this file next

const PlanSessionModal = ({ buddy, onClose, onPlanSuccess }) => {
  const [topic, setTopic] = useState('');
  const [datetime, setDatetime] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Get current datetime in "YYYY-MM-DDTHH:MM" format
  const getMinDatetime = () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    return now.toISOString().slice(0, 16);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!topic || !datetime) {
      setError('Please fill out both fields.');
      return;
    }
    setError('');
    setSubmitting(true);

    try {
      const res = await fetch('/api/sessions/plan.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          target_user_id: buddy.buddy_user_id,
          session_topic: topic,
          session_datetime: datetime,
        }),
      });
      const data = await res.json();

      if (data.success) {
        onPlanSuccess(); // This will close the modal and refresh the list
      } else {
        setError(data.message || 'Failed to plan session.');
      }
    } catch (err) {
      setError('A network error occurred.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={onClose}>&times;</button>
        <h3>Plan a Session with {buddy.buddy_full_name}</h3>
        
        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label htmlFor="topic">Session Topic</label>
            <input
              type="text"
              id="topic"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g., Physics Midterm Review"
            />
          </div>
          <div className="form-group">
            <label htmlFor="datetime">Date and Time</label>
            <input
              type="datetime-local"
              id="datetime"
              value={datetime}
              onChange={(e) => setDatetime(e.target.value)}
              min={getMinDatetime()}
            />
          </div>
          {error && <p className="modal-error">{error}</p>}
          <button type="submit" className="modal-submit-btn" disabled={submitting}>
            {submitting ? 'Planning...' : 'Schedule Session'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default PlanSessionModal;