import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { initStaticApiFallback } from './utils/staticApiFallback';

// Initialize static fallback interceptor for GitHub Pages/standalone client-side execution
initStaticApiFallback();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
