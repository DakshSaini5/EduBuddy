import React, { useState, useEffect } from 'react';
import '../styles/Quiz.css';

// All 10 questions
const quizQuestions = [
  { q: "When working on a group project, what’s your natural role?", o: ["I take the lead and organize everyone’s tasks.", "I quietly handle my part and make sure it’s solid.", "I bring energy, ideas, and keep the group motivated."] },
  { q: "How do you usually prefer to study?", o: ["Alone — I focus better that way.", "With a few people — I like discussion and idea exchange.", "In a larger group — I need the energy around me."] },
  { q: "If you and your partner disagree on how to approach a topic, you…", o: ["Try to explain your reasoning with logic and examples.", "Hear them out and try to find a middle ground.", "Go with the flow — it’s not worth arguing."] },
  { q: "What’s your ideal study environment?", o: ["Quiet and organized — minimal distractions.", "Background music or café noise helps me focus.", "I’m fine anywhere, even with a bit of chaos."] },
  { q: "How do you usually prepare for exams or deadlines?", o: ["I make a plan or timetable and stick to it.", "I start late but focus intensely when it matters.", "I review with friends — we motivate each other."] },
  { q: "How do you usually communicate during study sessions?", o: ["I give detailed explanations or help others understand.", "I like short, direct exchanges — keep it efficient.", "I joke around and keep the vibe light."] },
  { q: "What kind of people do you usually get along with best?", o: ["Chill and kind — good listeners.", "Talkative and positive — full of energy.", "Organized and ambitious — they push me to do better."] },
  { q: "When working on something creative or open-ended, you…", o: ["Brainstorm lots of wild ideas first.", "Look for real examples and logic to guide you.", "Wait to see what others suggest before adding your touch."] },
  { q: "If a session partner is stressed, you usually…", o: ["Try to lighten the mood with jokes or distractions.", "Calmly listen and reassure them.", "Help them plan or find a solution."] },
  { q: "How do you like your weekends?", o: ["Quiet — rest, hobbies, maybe light studying.", "Out and about — meetups, hangouts, fun sessions.", "Depends — sometimes I socialize, sometimes I recharge."] }
];

const PersonalityQuiz = ({ onClose, onComplete }) => {
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState(Array(10).fill(null));
  const [submitting, setSubmitting] = useState(false);

  // Fetch user's previous answers if they exist
  useEffect(() => {
    fetch('/api/quiz/get.php')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          const loadedAnswers = Object.values(data.data); // ['A', 'B', 'C', ...]
          setAnswers(loadedAnswers);
        }
      })
      .catch(err => console.error("Failed to fetch old answers", err));
  }, []);

  const handleSelect = (option) => {
    const newAnswers = [...answers];
    newAnswers[currentQ] = option; // 'A', 'B', or 'C'
    setAnswers(newAnswers);
  };

  const handleNext = () => {
    if (currentQ < 9) {
      setCurrentQ(currentQ + 1);
    }
  };

  const handleFinish = async () => {
    setSubmitting(true);
    try {
      const res = await fetch('/api/quiz/save.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers }),
      });
      const data = await res.json();
      if (data.success) {
        onComplete(data.data); // Pass new {type, title} back to Profile page
      } else {
        alert("Error: " + data.message);
      }
    } catch (err) {
      alert("An error occurred while saving.");
    } finally {
      setSubmitting(false);
    }
  };

  const currentAnswer = answers[currentQ];
  const question = quizQuestions[currentQ];
  const allAnswered = answers.every(ans => ans !== null);

  return (
    <div className="quiz-modal-backdrop">
      <div className="quiz-modal-content">
        <div className="quiz-header">
          <h2>EduBuddy Personality Quiz</h2>
          <button onClick={onClose} className="quiz-close-btn">&times;</button>
        </div>
        
        <div className="quiz-question-container">
          <p className="quiz-question">({currentQ + 1}/10) {question.q}</p>
          <div className="quiz-options">
            <label className={`quiz-option ${currentAnswer === 'A' ? 'selected' : ''}`}>
              <input type="radio" name={`q${currentQ}`} value="A" checked={currentAnswer === 'A'} onChange={() => handleSelect('A')} hidden />
              {question.o[0]}
            </label>
            <label className={`quiz-option ${currentAnswer === 'B' ? 'selected' : ''}`}>
              <input type="radio" name={`q${currentQ}`} value="B" checked={currentAnswer === 'B'} onChange={() => handleSelect('B')} hidden />
              {question.o[1]}
            </label>
            <label className={`quiz-option ${currentAnswer === 'C' ? 'selected' : ''}`}>
              <input type="radio" name={`q${currentQ}`} value="C" checked={currentAnswer === 'C'} onChange={() => handleSelect('C')} hidden />
              {question.o[2]}
            </label>
          </div>
        </div>

        <div className="quiz-navigation">
          <span className="quiz-progress">Question {currentQ + 1} of 10</span>
          {currentQ < 9 ? (
            <button onClick={handleNext} disabled={currentAnswer === null} className="quiz-nav-btn">
              Next
            </button>
          ) : (
            <button onClick={handleFinish} disabled={!allAnswered || submitting} className="quiz-nav-btn finish">
              {submitting ? 'Saving...' : 'Finish & Get My Type'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default PersonalityQuiz;  