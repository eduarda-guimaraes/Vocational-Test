import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Login from './pages/login';
import Cadastro from './pages/cadastro';
import Perfil from './pages/perfil';
import Home from './pages/home';
import Chat from './pages/chat';
import RecuperarSenha from './pages/recuperarSenha';
import AguardandoVerificacao from './pages/AguardandoVerificacao';

import ProtectedRoute from './components/ProtectedRoute';
import Header from './components/header';
import Footer from './components/footer';

function App() {
  return (
    <>
      <Header />

      <main style={{ minHeight: 'calc(100vh - 120px)', paddingTop: '70px' }}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/cadastro" element={<Cadastro />} />
          <Route path="/aguardando-verificacao" element={<AguardandoVerificacao />} />
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
          <Route path="/recuperarSenha" element={<RecuperarSenha />} />
        </Routes>
      </main>

      <Footer />
    </>
  );
}

export default App;
