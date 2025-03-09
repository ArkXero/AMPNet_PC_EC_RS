import React from 'react';
import ReactDOM from 'react-dom/client';
import './styles/App.css';
import App from './App'; // This will now find App.jsx

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);