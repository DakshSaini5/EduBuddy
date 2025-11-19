import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext'; // 1. Import ThemeProvider

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeProvider> {/* 2. Wrap your app in ThemeProvider */}
      <AuthProvider>
        <App />
      </AuthProvider>
    </ThemeProvider>
  </StrictMode>,
)