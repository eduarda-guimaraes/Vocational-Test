import React, { useState, useEffect } from 'react';
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
    foto: '/iconevazio.png'
  });

  const [editData, setEditData] = useState({ ...userData });
  const [historico, setHistorico] = useState([]);

  // Carrega o histórico do localStorage ao abrir o componente
  useEffect(() => {
    const dadosSalvos = JSON.parse(localStorage.getItem('historico')) || [];
    setHistorico(dadosSalvos);
  }, []);

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
          <button className="btn-perfil w-100 mb-3"  onClick={() => { setEditData(userData); setView('editar'); }}>
            Editar Informações
          </button>
          <button className="btn-perfil w-100" onClick={() => setView('perfil')}>
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
              <input type="text" name="nome" className="form-control" value={editData.nome} onChange={handleChange} />
            </div>
            <div className="mb-3">
              <label className="form-label">Email</label>
              <input type="email" name="email" className="form-control" value={editData.email} onChange={handleChange} />
            </div>
            <div className="mb-3">
              <label className="form-label">Senha</label>
              <input type="password" name="senha" className="form-control" value={editData.senha} onChange={handleChange} />
            </div>
            <button type="button" className="btn-perfil w-100" style={{ backgroundColor: '#447EB8', color: '#fff' }} onClick={handleSave}>
              Salvar e Voltar
            </button>
          </form>
        </div>
      );
    } else if (view === 'historico') {
      return (
        <div className="card p-4 shadow-sm mx-auto" style={{ maxWidth: '600px' }}>
          <h5 className="card-title text-center">Histórico de Testes</h5>
          {historico.length === 0 ? (
            <p className="text-muted text-center">Nenhum teste realizado ainda.</p>
          ) : (
            <ul className="list-group">
              {historico.map((item, index) => (
                <li key={index} className="list-group-item">
                  <strong>Respostas:</strong>
                  <ul>
                    {item.respostas.map((r, i) => (
                      <li key={i}>{r}</li>
                    ))}
                  </ul>
                  <strong>Resultado:</strong> {item.resultado}
                </li>
              ))}
            </ul>
          )}
          <button className="btn-perfil w-100 mt-3" onClick={() => setView('perfil')}>
            Voltar
          </button>
        </div>
      );
    }

    return (
      <div className="card p-4 shadow-sm mx-auto" style={{ maxWidth: '500px' }}>
        <div className="text-center mb-3">
        <img
          src={userData.foto}
          alt="Foto de perfil"
          style={{
            width: '100px',
            height: '100px',
            borderRadius: '50%',
            objectFit: 'cover',
            border: '3px solid #447eb8'
          }}
        />
      </div>
      <h5 className="card-title text-center mb-4">Olá, {userData.nome}!</h5>
        <button className="btn-perfil w-100 mb-3" onClick={() => setView('info')}>
          Ver Informações Pessoais
        </button>
        <button className="btn-perfil w-100" onClick={() => setView('historico')}>
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
