import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './app';
import { BrowserRouter } from 'react-router-dom';
import { UserProvider } from '/contexts/UserContext'; // <-- Novo

// Bootstrap
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <UserProvider> {/* Envolve tudo com o contexto */}
        <App />
      </UserProvider>
    </BrowserRouter>
  </React.StrictMode>
);