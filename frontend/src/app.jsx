import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Login from './pages/login';
import Cadastro from './pages/cadastro';
import Perfil from './pages/perfil';
import Home from './pages/home';
import Chat from './pages/chat';
import RecuperarSenha from './pages/recuperarSenha';
import AguardandoVerificacao from './pages/aguardandoVerificacao';
import DefinirSenha from './pages/DefinirSenha';       // ✅ novo import
import EditarPerfil from './pages/EditarPerfil';       // ✅ novo import

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
          <Route path="/definir-senha" element={<DefinirSenha />} />          {/* ✅ nova rota */}
          <Route
            path="/perfil"
            element={
              <ProtectedRoute>
                <Perfil />
              </ProtectedRoute>
            }
          />
          <Route
            path="/editar-perfil"
            element={
              <ProtectedRoute>
                <EditarPerfil />
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
