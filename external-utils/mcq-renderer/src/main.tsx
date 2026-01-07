/**
 * MCQ QTI Renderer - Entry Point
 * 
 * This is the main entry point for the standalone MCQ renderer application.
 * It imports the necessary styles and mounts the React app.
 */

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

// Import QTI renderer styles for proper rendering
import '@alphalearn/qti-renderer/styles.css';

// Basic styles for the demo
import './styles.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);

