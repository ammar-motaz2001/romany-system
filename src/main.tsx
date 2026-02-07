import ReactDOM from 'react-dom/client';
import App from '@/app/App';
import '@/styles/index.css';

// Do not clear localStorage on startup so refresh keeps the user logged in
// (authToken and user are restored from localStorage; clearing would send user to sign-in on every refresh)

// Removed React.StrictMode to fix HMR issues in development
// StrictMode can cause double-rendering which conflicts with Vite HMR
ReactDOM.createRoot(document.getElementById('root')!).render(
  <App />
);