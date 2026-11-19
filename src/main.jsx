import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './fonts.css';
import './index.css';
import App from './App.jsx';
import { listenForTaps } from './lib/taps.js';
import { USAGE_ON, start } from './lib/usage.js';

listenForTaps();

// The anonymous counts (web build only). Behind one compile-time guard, so the artifact's files
// hold no counting code at all.
if (USAGE_ON) start();

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
