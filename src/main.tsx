import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import ErrorBoundary from './components/ErrorBoundary';
import './index.css';
import { initStaticApiFallback } from './utils/staticApiFallback';

// Initialize static fallback interceptor safely for mobile/standalone client-side execution
try {
  initStaticApiFallback();
} catch (e) {
  console.warn('Falha ao inicializar interceptor estático:', e);
}

const rootEl = document.getElementById('root');
if (rootEl) {
  createRoot(rootEl).render(
    <StrictMode>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </StrictMode>,
  );
}

