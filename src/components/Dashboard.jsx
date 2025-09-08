import React from 'react';
import '../styles/Dashboard.css';
import avatar from '../assets/avatar.png'; // Make sure this path is correct

const matches = [
  {
    name: "Daksh Saini",
    Sub: "CS, DWD",
    Course: "BCA",
    img: avatar
  },
  {
    name: "Gaurav Singh",
    Sub: "CS, MATHS",
    Course: "BCA",
    img: avatar,
  },
  {
    name: "Chetan Singh",
    Sub: "Physics, Chemistry",
    Course: "B.tech(CSE)",
    img: avatar
  },
  {
    name: "Ojas Pahadia",
    Sub: "Architecture",
    Course: "B.Arch",
    img: avatar
  },
];

const sessions = [
  "21 Sept : Data Structures And Algorithm",
  "22 Sept : Dynamic Web Designing"
];

const Dashboard = ({ user }) => {
  return (
    <div className='dash-main'>
      <div className='dash-header'>
        <h2>Hey there, {user = "Daksh"}! 👋</h2>
        <button className='about-btn'> About </button>
      </div>

      <h3>Study Mate Matches</h3>
      <div className='matches-row'>
        {matches.map((m, i) => (
          <div className='card' key={i}>
            <img src={m.img} alt={m.name} className='match-image' />
            <div className="match-info">
              <div className="match-name">{m.name}</div>
              <div className="match-detail">{m.Sub}</div>
              <div className="match-detail">{m.Course}</div>
            </div>
          </div>
        ))}
      </div>

      <h3>Upcoming Sessions</h3>
      <div className='session-list'>
        {sessions.map((s,i) => (
          <div className='session' key={i}>
            {s}
            <button className='btn-mark'>Mark It</button>
          </div>
        ))}
      </div>
    </div>
  );
};


export default Dashboard;