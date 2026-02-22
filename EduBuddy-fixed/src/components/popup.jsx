import React from 'react';

const Popup = ({ show, onClose }) => {
  return (
    <div
      style={{
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        display: 'flex', justifyContent: 'center', alignItems: 'center',
        zIndex: 9999,
        opacity: show ? 1 : 0,
        pointerEvents: show ? 'auto' : 'none',
        transition: 'opacity 0.4s ease',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#fff',
          padding: '2rem',
          borderRadius: '12px',
          maxWidth: '400px',
          boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
          position: 'relative',
          textAlign: 'center',
          transform: show ? 'scale(1)' : 'scale(0.8)',
          transition: 'transform 0.4s ease',
        }}
        onClick={e => e.stopPropagation()}
      >
        <h2>Welcome to Our Website!</h2>
        <p>Enjoy your visit and explore our content.</p>
        <button
          style={{
            position: 'absolute',
            top: '10px',
            right: '15px',
            background: 'transparent',
            border: 'none',
            fontSize: '1.5rem',
            cursor: 'pointer',
            color: '#333',
          }}
          onClick={onClose}
        >
          × Close
        </button>
      </div>
    </div>
  );
};

export default Popup;
