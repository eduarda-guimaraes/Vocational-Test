import React, { useState, useEffect } from 'react';
import { auth } from '../services/firebase';
import { updateProfile, updateEmail, updatePassword, reauthenticateWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';

export default function EditarPerfil() {
  const user = auth.currentUser;
  const [nome, setNome] = useState(user?.displayName || '');
  const [email, setEmail] = useState(user?.email || '');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [mensagem, setMensagem] = useState('');
  const navigate = useNavigate();

  const handleSalvar = async (e) => {
    e.preventDefault();
    setErro('');
    setMensagem('');

    try {
      if (nome !== user.displayName) {
        await updateProfile(user, { displayName: nome });
      }

      if (email !== user.email) {
        await updateEmail(user, email);
      }

      if (senha.length >= 6) {
        await updatePassword(user, senha);
      }

      setMensagem('Dados atualizados com sucesso!');
      setTimeout(() => navigate('/perfil'), 1500);
    } catch (error) {
      console.error(error);
      if (error.code === 'auth/requires-recent-login') {
        try {
          const provider = new GoogleAuthProvider();
          await reauthenticateWithPopup(user, provider);
          setMensagem('Reautenticado. Clique novamente em salvar.');
        } catch (reauthErr) {
          setErro('Reautenticação falhou. Faça login novamente.');
        }
      } else {
        setErro('Erro ao atualizar dados.');
      }
    }
  };

  return (
    <div className="container d-flex justify-content-center align-items-center vh-100">
      <div className="card p-4 shadow-sm" style={{ maxWidth: '450px', width: '100%' }}>
        <h4 className="mb-4 text-center">Editar Perfil</h4>
        <form onSubmit={handleSalvar}>
          <div className="mb-3">
            <input type="text" className="form-control" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Nome" />
          </div>
          <div className="mb-3">
            <input type="email" className="form-control" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" />
          </div>
          <div className="mb-3">
            <input type="password" className="form-control" value={senha} onChange={(e) => setSenha(e.target.value)} placeholder="Nova senha (opcional)" />
          </div>
          {erro && <p className="text-danger">{erro}</p>}
          {mensagem && <p className="text-success">{mensagem}</p>}
          <button type="submit" className="btn btn-primary w-100">Salvar alterações</button>
        </form>
      </div>
    </div>
  );
}
