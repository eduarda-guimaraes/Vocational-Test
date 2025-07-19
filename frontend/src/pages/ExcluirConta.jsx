import React, { useEffect, useState } from 'react';
import {
  fetchSignInMethodsForEmail,
  EmailAuthProvider,
  reauthenticateWithCredential,
  deleteUser,
} from 'firebase/auth';
import { auth, db } from '../services/firebase';
import { doc, deleteDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';

export default function ExcluirConta() {
  const [temSenha, setTemSenha] = useState(false);
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(true);
  const [confirmando, setConfirmando] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const verificarMetodoLogin = async () => {
      const user = auth.currentUser;
      if (!user) return;

      try {
        const methods = await fetchSignInMethodsForEmail(auth, user.email);
        const temMetodoSenha = methods.includes('password');
        setTemSenha(temMetodoSenha);
      } catch (error) {
        console.error('Erro ao verificar métodos de login:', error);
      } finally {
        setCarregando(false);
      }
    };

    verificarMetodoLogin();
  }, []);

  const excluirConta = async () => {
    setErro('');
    setConfirmando(true);

    const user = auth.currentUser;
    if (!user) return;

    try {
      if (temSenha) {
        if (!senha || senha.length < 6) {
          setErro('Digite sua senha corretamente para confirmar a exclusão.');
          setConfirmando(false);
          return;
        }
        const credencial = EmailAuthProvider.credential(user.email, senha);
        await reauthenticateWithCredential(user, credencial);
      }

      await deleteDoc(doc(db, 'usuarios', user.uid));
      await deleteUser(user);
      localStorage.clear();
      sessionStorage.clear();
      navigate('/');
    } catch (error) {
      console.error('Erro ao excluir conta:', error);
      if (error.code === 'auth/wrong-password') {
        setErro('Senha incorreta. Tente novamente.');
      } else if (error.code === 'auth/requires-recent-login') {
        setErro('Faça login novamente para confirmar esta ação.');
      } else {
        setErro('Não foi possível excluir a conta. Tente novamente mais tarde.');
      }
    } finally {
      setConfirmando(false);
    }
  };

  if (carregando) return <p>Carregando...</p>;

  return (
    <div className="container mt-5" style={{ maxWidth: '500px' }}>
      <h3 className="mb-4">Excluir Conta</h3>

      {temSenha && (
        <div className="mb-3">
          <label htmlFor="senha" className="form-label">Digite sua senha para confirmar:</label>
          <input
            type="password"
            className="form-control"
            id="senha"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            required
          />
        </div>
      )}

      {erro && <p className="text-danger">{erro}</p>}

      <button
        className="btn btn-danger"
        onClick={excluirConta}
        disabled={(temSenha && senha.trim() === '') || confirmando}
      >
        {confirmando ? 'Excluindo...' : 'Excluir minha conta'}
      </button>
    </div>
  );
}