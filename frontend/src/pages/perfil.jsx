import React from 'react';
import Header from '../components/header';
import '../styles/global.css';
import '../styles/form.css';

function Perfil() {
  return (
    <>
      <Header />
      <div style={{ height: '100px' }} />

      <div className="container mt-5">
        <h1>Seu Perfil</h1>
        {/* Informações do perfil aqui */}
      </div>
    </>
  );
}

export default Perfil;
