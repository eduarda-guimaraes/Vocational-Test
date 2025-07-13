// Perfil.jsx
import React, { useState, useEffect } from 'react';
import Header from '../components/header';
import '../styles/global.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import { auth } from '../services/firebase';
import { signOut } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useUser } from './contexts/UserContext';

function Perfil() {
  const { setUserData: setUserGlobal } = useUser();
  const [view, setView] = useState('perfil');
  const [userData, setUserData] = useState({
    nome: '',
    email: '',
    senha: '********',
    dataNascimento: '',
    foto: '/iconevazio.png'
  });

  const [editData, setEditData] = useState({ ...userData });
  const [historico, setHistorico] = useState([]);

  useEffect(() => {
    const fetchUserData = async () => {
      const currentUser = auth.currentUser;
      if (currentUser) {
        try {
          const docRef = doc(db, 'usuarios', currentUser.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const dados = docSnap.data();
            const dadosUsuario = {
              nome: dados.nome,
              email: currentUser.email,
              senha: '********',
              dataNascimento: dados.dataNascimento || '',
              foto: dados.fotoPerfil || '/iconevazio.png'
            };
            setUserData(dadosUsuario);
            setEditData(dadosUsuario);
          }
        } catch (error) {
          console.error('Erro ao buscar dados do Firestore:', error);
        }
      }
      const dadosSalvos = JSON.parse(localStorage.getItem('historico')) || [];
      setHistorico(dadosSalvos);
    };
    fetchUserData();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setEditData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    try {
      const userRef = doc(db, 'usuarios', currentUser.uid);
      await setDoc(userRef, {
        nome: editData.nome,
        dataNascimento: editData.dataNascimento,
        fotoPerfil: editData.foto || '/iconevazio.png'
      }, { merge: true });

      const updatedUser = {
        nome: editData.nome,
        email: editData.email,
        senha: '********',
        dataNascimento: editData.dataNascimento,
        foto: editData.foto || '/iconevazio.png'
      };

      setUserData(updatedUser);
      setEditData(updatedUser);
      setUserGlobal({
        nome: editData.nome,
        email: editData.email,
        fotoPerfil: editData.foto || '/iconevazio.png'
      });

      setView('perfil');
    } catch (error) {
      console.error('Erro ao salvar alterações:', error);
    }
  };

  const navigate = useNavigate();
  const handleLogout = async () => {
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
          <h5 className="card-title text-center">Informações Pessoais</h5>
          <div className="mb-3"><strong>Nome:</strong> {userData.nome}</div>
          <div className="mb-3"><strong>Email:</strong> {userData.email}</div>
          <div className="mb-4"><strong>Senha:</strong> {userData.senha}</div>
          <div className="mb-3"><strong>Data de Nascimento:</strong> {userData.dataNascimento}</div>
          <button className="btn-perfil w-100 mb-3" onClick={() => { setEditData(userData); setView('editar'); }}>
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
            <div className="mb-3 text-center">
              <label className="form-label">Foto de Perfil</label>
              <input type="file" className="form-control" accept="image/*" onChange={(e) => {
                const file = e.target.files[0];
                if (file) {
                  const reader = new FileReader();
                  reader.onloadend = () => {
                    setEditData((prev) => ({ ...prev, foto: reader.result }));
                  };
                  reader.readAsDataURL(file);
                }
              }} />
              {editData.foto && (
                <img
                  src={editData.foto}
                  alt="Preview"
                  className="mt-2"
                  style={{ width: '100px', height: '100px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #447eb8' }}
                />
              )}
            </div>
            <div className="mb-3">
              <label className="form-label">Nome de Usuário</label>
              <input type="text" name="nome" className="form-control" value={editData.nome} onChange={handleChange} />
            </div>
            <div className="mb-3">
              <label className="form-label">Email</label>
              <input type="email" name="email" className="form-control" value={editData.email} disabled />
            </div>
            <div className="mb-3">
              <label className="form-label">Senha</label>
              <input type="password" name="senha" className="form-control" value={editData.senha} disabled />
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
            style={{ width: '100px', height: '100px', borderRadius: '50%', objectFit: 'cover', border: '3px solid #447eb8' }}
          />
        </div>
        <h5 className="card-title text-center mb-4">Olá, {userData.nome}!</h5>
        <button className="btn-perfil w-100 mb-3" onClick={() => setView('info')}>
          Ver Informações Pessoais
        </button>
        <button className="btn-perfil w-100 mb-3" onClick={() => setView('historico')}>
          Histórico de Testes
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
    </>
  );
}

export default Perfil;