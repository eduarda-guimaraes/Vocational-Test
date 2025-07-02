import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword, deleteUser, signOut } from 'firebase/auth';
import { auth } from '../services/firebase'; // este é seu auth configurado corretamente

export default function AcessoNegado() {
  const [mensagem, setMensagem] = useState('');
  const [temCredenciais, setTemCredenciais] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const email = sessionStorage.getItem('emailTemp');
    const senha = sessionStorage.getItem('senhaTemp');
    setTemCredenciais(!!email && !!senha);
  }, []);

  const voltarParaLogin = async () => {
  try {
    if (auth.currentUser) {
      await signOut(auth);
    }
  } catch (error) {
    console.error('Erro ao sair:', error);
  } finally {
    // Força a navegação para login
    sessionStorage.removeItem('emailTemp');
    sessionStorage.removeItem('senhaTemp');
    navigate('/login', { replace: true });
  }
};

  const excluirConta = async () => {
    try {
      const email = sessionStorage.getItem('emailTemp');
      const senha = sessionStorage.getItem('senhaTemp');

      if (!email || !senha) {
        setMensagem('Credenciais não encontradas. Faça login novamente.');
        return;
      }

      await signInWithEmailAndPassword(auth, email, senha);
      await deleteUser(auth.currentUser);
      sessionStorage.removeItem('emailTemp');
      sessionStorage.removeItem('senhaTemp');
      navigate('/cadastro');
    } catch (err) {
      console.error('Erro ao excluir conta:', err);
      setMensagem('Erro ao excluir conta. Tente novamente.');
    }
  };

  return (
    <div className="container text-center mt-5">
      <h4 className="mb-3 text-primary">
        Acesso negado. Verifique seu e-mail antes de continuar.
      </h4>

      {mensagem && <div className="alert alert-info">{mensagem}</div>}

      <div className="d-flex justify-content-center gap-2 flex-wrap">
        <button className="btn btn-outline-primary" onClick={voltarParaLogin}>
          Voltar para login
        </button>

        {temCredenciais && (
          <button className="btn btn-outline-danger" onClick={excluirConta}>
            Excluir conta e tentar novamente
          </button>
        )}
      </div>
    </div>
  );
}
