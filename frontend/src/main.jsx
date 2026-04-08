import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

console.log('📦 Main.jsx exécuté');
console.log('🎯 Root element:', document.getElementById('root'));

const root = document.getElementById('root');
if (root) {
  ReactDOM.createRoot(root).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
  console.log('✅ React monté');
} else {
  console.error('❌ Root non trouvé');
}