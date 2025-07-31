import React, { useState, useEffect } from 'react';
import Header from '../components/header';
import '../styles/global.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import { auth, db } from '../services/firebase';
import { signOut } from 'firebase/auth';
import { useNavigate, useLocation } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';

function Perfil() {
  const [view, setView] = useState('perfil');
  const [userData, setUserData] = useState({
    nome: '',
    email: '',
    senha: '********',
    foto: '/iconevazio.png', // Foto de perfil padrão
    dataNascimento: '' // Adicionando data de nascimento
  });
  const [historico, setHistorico] = useState([]);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const fetchUserData = async () => {
      const currentUser = auth.currentUser;
      await currentUser?.reload(); // Recarrega os dados do usuário para garantir que as atualizações sejam refletidas

      if (currentUser) {
        try {
          const docRef = doc(db, 'usuarios', currentUser.uid);
          const docSnap = await getDoc(docRef);
          const dados = docSnap.exists() ? docSnap.data() : {};

          const dadosUsuario = {
            nome: currentUser.displayName || dados.nome || '',
            email: currentUser.email,
            senha: '********',
            foto: currentUser.photoURL || dados.fotoPerfil || '/iconevazio.png',
            dataNascimento: dados.dataNascimento || '' // Recuperando a data de nascimento
          };

          setUserData(dadosUsuario);
        } catch (error) {
          console.error('Erro ao buscar dados do Firestore:', error);
        }
      }

      const dadosSalvos = JSON.parse(localStorage.getItem('historico')) || [];
      setHistorico(dadosSalvos);
    };

    fetchUserData();

    const voltarPara = location.state?.voltarPara;
    if (voltarPara) {
      setView(voltarPara);
    }
  }, [location.state]);

  const confirmarLogout = async () => {
    try {
      await signOut(auth);
      navigate('/');
    } catch (error) {
      console.error('Erro ao sair:', error);
    }
  };

  const renderContent = () => {
    if (view === 'info') {
      return (
        <div className="card p-4 shadow-sm mx-auto" style={{ maxWidth: '500px' }}>
          <h5 className="card-title text-center mb-3">Informações Pessoais</h5>

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

          <div className="mb-3"><strong>Nome:</strong> {userData.nome}</div>
          <div className="mb-3"><strong>Email:</strong> {userData.email}</div>
          <div className="mb-3"><strong>Data de Nascimento:</strong> {userData.dataNascimento || 'Não fornecida'}</div>
          <div className="mb-4"><strong>Senha:</strong> {userData.senha}</div>

          <button
            className="btn-perfil w-100 mb-3"
            onClick={() => navigate('/editar-perfil', { state: { voltarPara: 'info' } })}
          >
            Editar Informações
          </button>
          <button className="btn btn-secondary w-100" onClick={() => setView('perfil')}>
            Voltar
          </button>
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
          <button className="btn btn-secondary w-100 mt-3" onClick={() => setView('perfil')}>
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
        <button className="btn-perfil w-100 mb-3" onClick={() => navigate('/historico')}>
          Histórico de Testes
        </button>
        <button className="btn btn-danger w-100" onClick={() => setShowLogoutModal(true)}>
          Sair
        </button>
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Header />

      <main style={{ flex: 1, paddingTop: '90px' }}>
        <div className="container py-4">
          {renderContent()}
        </div>
      </main>

      {showLogoutModal && (
        <div className="modal d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Confirmar saída</h5>
                <button type="button" className="btn-close" onClick={() => setShowLogoutModal(false)}></button>
              </div>
              <div className="modal-body">
                <p>Tem certeza de que deseja sair da sua conta?</p>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setShowLogoutModal(false)}>
                  Cancelar
                </button>
                <button className="btn btn-danger" onClick={confirmarLogout}>
                  Confirmar saída
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Perfil;
