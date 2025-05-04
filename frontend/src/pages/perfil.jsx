import React, { useState } from 'react';
import Header from '../components/header';
import '../styles/global.css';
import 'bootstrap/dist/css/bootstrap.min.css';

function Perfil() {
  const [view, setView] = useState('perfil');

  // Estado com dados do usuário
  const [userData, setUserData] = useState({
    nome: 'Eduarda Guimarães',
    email: 'eduarda@email.com',
    senha: '********',
  });

  // Estado para edição temporária
  const [editData, setEditData] = useState({ ...userData });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setEditData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    setUserData(editData);
    setView('perfil');
  };

  const renderContent = () => {
    if (view === 'info') {
      return (
        <div className="card p-4 shadow-sm mx-auto" style={{ maxWidth: '500px' }}>
          <h5 className="card-title text-center">Informações Pessoais</h5>
          <div className="mb-3"><strong>Nome:</strong> {userData.nome}</div>
          <div className="mb-3"><strong>Email:</strong> {userData.email}</div>
          <div className="mb-4"><strong>Senha:</strong> {userData.senha}</div>
          <button
            className="btn w-100 mb-3"
            style={{ backgroundColor: '#447EB8', color: '#fff' }}
            onClick={() => {
              setEditData(userData);
              setView('editar');
            }}
          >
            Editar Informações
          </button>
          <button
            className="btn w-100"
            style={{ backgroundColor: '#447EB8', color: '#fff' }}
            onClick={() => setView('perfil')}
          >
            Voltar
          </button>
        </div>
      );
    } else if (view === 'editar') {
      return (
        <div className="card p-4 shadow-sm mx-auto" style={{ maxWidth: '500px' }}>
          <h5 className="card-title text-center">Editar Informações</h5>
          <form>
            <div className="mb-3">
              <label className="form-label">Nome de Usuário</label>
              <input
                type="text"
                name="nome"
                className="form-control"
                value={editData.nome}
                onChange={handleChange}
              />
            </div>
            <div className="mb-3">
              <label className="form-label">Email</label>
              <input
                type="email"
                name="email"
                className="form-control"
                value={editData.email}
                onChange={handleChange}
              />
            </div>
            <div className="mb-3">
              <label className="form-label">Senha</label>
              <input
                type="password"
                name="senha"
                className="form-control"
                value={editData.senha}
                onChange={handleChange}
              />
            </div>
            <button
              type="button"
              className="btn w-100"
              style={{ backgroundColor: '#447EB8', color: '#fff' }}
              onClick={handleSave}
            >
              Salvar e Voltar
            </button>
          </form>
        </div>
      );
    } else if (view === 'historico') {
      return (
        <div className="card p-4 shadow-sm mx-auto" style={{ maxWidth: '500px' }}>
          <h5 className="card-title text-center">Histórico</h5>
          <p className="text-muted text-center">Histórico de testes realizados aparecerá aqui.</p>
          <button
            className="btn w-100 mt-3"
            style={{ backgroundColor: '#447EB8', color: '#fff' }}
            onClick={() => setView('perfil')}
          >
            Voltar
          </button>
        </div>
      );
    }

    return (
      <div className="card p-4 shadow-sm mx-auto" style={{ maxWidth: '500px' }}>
        <h5 className="card-title text-center mb-4">Olá, {userData.nome}!</h5>
        <button
          className="btn w-100 mb-3"
          style={{ backgroundColor: '#447EB8', color: '#fff' }}
          onClick={() => setView('info')}
        >
          Ver Informações Pessoais
        </button>
        <button
          className="btn w-100"
          style={{ backgroundColor: '#447EB8', color: '#fff' }}
          onClick={() => setView('historico')}
        >
          Histórico de Testes
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
