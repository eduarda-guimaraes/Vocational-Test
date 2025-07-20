import React, { useState, useEffect } from 'react';
import Header from '../components/header';
import '../styles/global.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import { auth, db } from '../services/firebase';
import { signOut } from 'firebase/auth';
import { useNavigate, useLocation } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
<<<<<<< HEAD
import { db } from '../services/firebase';

function Perfil() {
  const [view, setView] = useState('perfil');
  const [showLogoutPopup, setShowLogoutPopup] = useState(false);

=======

function Perfil() {
  const [view, setView] = useState('perfil');
>>>>>>> 3070575fbc6b1b90eb7bf2ecb90263fde89b0681
  const [userData, setUserData] = useState({
    nome: '',
    email: '',
    senha: '********',
    foto: '/iconevazio.png'
  });
  const [historico, setHistorico] = useState([]);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserData = async () => {
      const currentUser = auth.currentUser;

      if (currentUser) {
        try {
<<<<<<< HEAD
          const docRef = doc(db, "usuarios", currentUser.uid);
          const docSnap = await getDoc(docRef);

          if (docSnap.exists()) {
            const dados = docSnap.data();
            const dadosUsuario = {
              nome: dados.nome,
              email: currentUser.email,
              senha: '********',
              foto: currentUser.photoURL || '/iconevazio.png'
            };

            setUserData(dadosUsuario);
            setEditData(dadosUsuario);
          }
=======
          const docRef = doc(db, 'usuarios', currentUser.uid);
          const docSnap = await getDoc(docRef);
          const dados = docSnap.exists() ? docSnap.data() : {};

          const dadosUsuario = {
            nome: currentUser.displayName || dados.nome || '',
            email: currentUser.email,
            senha: '********',
            foto: currentUser.photoURL || '/iconevazio.png'
          };

          setUserData(dadosUsuario);
>>>>>>> 3070575fbc6b1b90eb7bf2ecb90263fde89b0681
        } catch (error) {
          console.error('Erro ao buscar dados do Firestore:', error);
        }
      }
<<<<<<< HEAD

      const dadosSalvos = JSON.parse(localStorage.getItem('historico')) || [];
      setHistorico(dadosSalvos);
    };

    fetchUserData();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setEditData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    setUserData(editData);
    setView('perfil');
  };

  const handleLogout = async () => {
=======

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
>>>>>>> 3070575fbc6b1b90eb7bf2ecb90263fde89b0681
    try {
      await signOut(auth);
      navigate('/');
    } catch (error) {
      console.error('Erro ao sair:', error);
    }
  };

  const renderContent = () => {
    if (view === 'info') {
<<<<<<< HEAD
      return (
        <div className="card p-4 shadow-sm mx-auto" style={{ maxWidth: '500px' }}>
          <h5 className="card-title text-center mb-4">Informações Pessoais</h5>
          <div className="text-center mb-4">
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
          <div className="mb-4"><strong>Senha:</strong> {userData.senha}</div>
          <button className="btn-perfil w-100 mb-3" onClick={() => navigate('/editar-perfil')}>
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
=======
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
>>>>>>> 3070575fbc6b1b90eb7bf2ecb90263fde89b0681
            </div>

            <div className="mb-3"><strong>Nome:</strong> {userData.nome}</div>
            <div className="mb-3"><strong>Email:</strong> {userData.email}</div>
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
      }
      else if (view === 'historico') {
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
        <button className="btn-perfil w-100 mb-3" onClick={() => setView('historico')}>
          Histórico de Testes
        </button>
<<<<<<< HEAD
        <button className="btn btn-danger w-100" onClick={() => setShowLogoutPopup(true)}>
=======
        <button className="btn btn-danger w-100" onClick={() => setShowLogoutModal(true)}>
>>>>>>> 3070575fbc6b1b90eb7bf2ecb90263fde89b0681
          Sair
        </button>
      </div>
    );
  };

  return (
    <>
      <Header />
      <div style={{ marginTop: '90px' }} />
      <div className="container">{renderContent()}</div>

<<<<<<< HEAD
      {/* Modal de confirmação */}
      {showLogoutPopup && (
        <div className="modal fade show d-block" tabIndex="-1" role="dialog" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered" role="document">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Sair da Conta</h5>
                <button type="button" className="btn-close" onClick={() => setShowLogoutPopup(false)} />
              </div>
              <div className="modal-body">
                <p>Tem certeza que deseja sair da sua conta?</p>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowLogoutPopup(false)}>
                  Cancelar
                </button>
                <button type="button" className="btn btn-danger" onClick={handleLogout}>
                  Sim, sair
=======
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
>>>>>>> 3070575fbc6b1b90eb7bf2ecb90263fde89b0681
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default Perfil;
