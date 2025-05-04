import React from 'react';
import Header from '../components/header';
import '../styles/global.css';
import '../styles/form.css';

function Chat() {
  return (
    <>
      <Header />
      <div style={{ height: '100px' }} />

      <div className="container mt-5">
        <h1>Página de Chat</h1>
        {/* Conteúdo do chat aqui */}
      </div>
    </>
  );
}

export default Chat;
