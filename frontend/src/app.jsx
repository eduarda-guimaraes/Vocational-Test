import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Login from './pages/login';
import Cadastro from './pages/cadastro';
import Perfil from './pages/perfil';
import Home from './pages/home';
import Chat from './pages/chat';
import ProtectedRoute from './components/ProtectedRoute';

import Header from './components/header';
import Footer from './components/footer';

function App() {
  return (
    <>
      <Header /> {/* aparece em todas as páginas */}

      <main style={{ minHeight: 'calc(100vh - 120px)', paddingTop: '70px' }}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/cadastro" element={<Cadastro />} />
          <Route
            path="/perfil"
            element={
              <ProtectedRoute>
                <Perfil />
              </ProtectedRoute>
            }
          />
          <Route path="/chat" element={<Chat />} />
          <Route path="/home" element={<Home />} />
        </Routes>
      </main>

      <Footer /> {/* aparece em todas as páginas */}
    </>
  );
}

export default App;
