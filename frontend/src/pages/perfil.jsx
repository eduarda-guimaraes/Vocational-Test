import React, { useState } from 'react';
import Header from '../components/header';
import '../styles/global.css';
import 'bootstrap/dist/css/bootstrap.min.css';

function Perfil() {
  const [view, setView] = useState('perfil');

  const renderContent = () => {
    if (view === 'info') {
      return (
        <div className="card p-4 shadow-sm mx-auto" style={{ maxWidth: '500px' }}>
          <h5 className="card-title text-center">Nome Usuário</h5>
          <form>
            <div className="mb-3">
              <label className="form-label">Nome de Usuário</label>
              <input type="text" className="form-control" placeholder="Digite seu nome" />
            </div>
            <div className="mb-3">
              <label className="form-label">Email</label>
              <input type="email" className="form-control" placeholder="email@exemplo.com" />
            </div>
            <div className="mb-3">
              <label className="form-label">Senha</label>
              <input type="password" className="form-control" placeholder="*******" />
            </div>
            <button
              type="button"
              className="btn btn-secondary w-100"
              onClick={() => setView('perfil')}
            >
              Voltar
            </button>
          </form>
        </div>
      );
    } else if (view === 'historico') {
      return (
        <div className="card p-4 shadow-sm mx-auto" style={{ maxWidth: '500px' }}>
          <h5 className="card-title text-center">Nome Usuário</h5>
          <p className="text-muted text-center">Histórico de testes realizados aparecerá aqui.</p>
          <button
            type="button"
            className="btn btn-secondary w-100 mt-3"
            onClick={() => setView('perfil')}
          >
            Voltar
          </button>
        </div>
      );
    }

    return (
      <div className="card p-4 shadow-sm mx-auto" style={{ maxWidth: '500px' }}>
        <h5 className="card-title text-center mb-4">Nome Usuário</h5>
        <button
          className="btn btn-primary w-100 mb-3"
          onClick={() => setView('info')}
        >
          Editar informações pessoais
        </button>
        <button
          className="btn btn-primary w-100"
          onClick={() => setView('historico')}
        >
          Histórico de testes realizados
        </button>
      </div>
    );
  };

  return (
    <>
      <Header />
      <div style={{ marginTop: '90px' }} />
      <div className="container">{renderContent()}</div>
    </>
  );
}

export default Perfil;