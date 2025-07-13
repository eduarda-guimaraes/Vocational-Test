import React, { useState, useEffect } from 'react';
import Header from '../components/header';
import '../styles/global.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import { auth, db } from '../services/firebase';
import {
  signOut,
  deleteUser,
  EmailAuthProvider,
  reauthenticateWithCredential,
  fetchSignInMethodsForEmail
} from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { doc, getDoc, deleteDoc } from 'firebase/firestore';
import ConfirmarExclusao from '../pages/ConfirmarExclusao';

function Perfil() {
  const [view, setView] = useState('perfil');
  const [mostrarConfirmacao, setMostrarConfirmacao] = useState(false);
  const [temSenha, setTemSenha] = useState(false);
  const [userData, setUserData] = useState({
    nome: '',
    email: '',
    senha: '********',
    foto: '/iconevazio.png'
  });
  const [historico, setHistorico] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserData = async () => {
      const currentUser = auth.currentUser;
      if (!currentUser) return;

      try {
        const docRef = doc(db, "usuarios", currentUser.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const dados = docSnap.data();
          setUserData({
            nome: dados.nome,
            email: currentUser.email,
            senha: '********',
            foto: currentUser.photoURL || '/iconevazio.png'
          });
        }

        const methods = await fetchSignInMethodsForEmail(auth, currentUser.email);
        setTemSenha(methods.includes('password'));
      } catch (error) {
        console.error('Erro ao buscar dados do Firestore:', error);
      }

      const dadosSalvos = JSON.parse(localStorage.getItem('historico')) || [];
      setHistorico(dadosSalvos);
    };

    fetchUserData();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/');
    } catch (error) {
      console.error('Erro ao sair:', error);
    }
  };

  const handleExcluirConta = async (senhaDigitada) => {
    const user = auth.currentUser;
    if (!user) return;

    try {
      if (temSenha) {
        if (!senhaDigitada) {
          alert('Senha necessária para excluir a conta.');
          return;
        }
        const credential = EmailAuthProvider.credential(user.email, senhaDigitada);
        await reauthenticateWithCredential(user, credential);
      }

      await deleteDoc(doc(db, 'usuarios', user.uid));
      await deleteUser(user);
      alert('Conta excluída com sucesso.');
      navigate('/');
    } catch (error) {
      console.error('Erro ao excluir conta:', error);
      if (error.code === 'auth/wrong-password') {
        alert('Senha incorreta. Tente novamente.');
      } else if (error.code === 'auth/requires-recent-login') {
        alert('Por segurança, faça login novamente antes de excluir sua conta.');
        handleLogout();
      } else {
        alert('Erro ao excluir conta. Tente novamente mais tarde.');
      }
    }
  };

  const renderContent = () => {
    if (view === 'info') {
      return (
        <div className="card p-4 shadow-sm mx-auto" style={{ maxWidth: '500px' }}>
          <h5 className="card-title text-center">Informações Pessoais</h5>
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
    }

    if (view === 'historico') {
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
        <button className="btn-perfil w-100 mb-3" onClick={() => setView('historico')}>
          Histórico de Testes
        </button>
        <button className="btn btn-outline-danger w-100 mb-3" onClick={() => setMostrarConfirmacao(true)}>
          Excluir Conta
        </button>
        <button className="btn btn-danger w-100" onClick={handleLogout}>
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
      {mostrarConfirmacao && (
        <ConfirmarExclusao
          temSenha={temSenha}
          onConfirmar={handleExcluirConta}
          onCancelar={() => setMostrarConfirmacao(false)}
        />
      )}
    </>
  );
}

export default Perfil;
