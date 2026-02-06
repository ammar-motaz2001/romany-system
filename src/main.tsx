import ReactDOM from 'react-dom/client';
import App from '@/app/App';
import '@/styles/index.css';

// Clear all data from localStorage on startup - Fresh Start
localStorage.clear();
console.log('All data cleared - Starting fresh');

// Removed React.StrictMode to fix HMR issues in development
// StrictMode can cause double-rendering which conflicts with Vite HMR
ReactDOM.createRoot(document.getElementById('root')!).render(
  <App />
);