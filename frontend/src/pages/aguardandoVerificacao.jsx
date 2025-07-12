import React, { useState, useEffect } from 'react';
import { auth } from '../services/firebase';
import { useNavigate } from 'react-router-dom';
import {
  sendEmailVerification,
  deleteUser,
  signInWithEmailAndPassword,
  onAuthStateChanged,
} from 'firebase/auth';

export default function AguardandoVerificacao() {
  const [mensagem, setMensagem] = useState('');
  const [loadingExcluir, setLoadingExcluir] = useState(false);
  const [usuarioLogado, setUsuarioLogado] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Escuta o usuário logado e inicia verificação automática
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUsuarioLogado(user);
        await user.reload();

        if (user.emailVerified) {
          navigate('/perfil'); // Redireciona automaticamente
        } else {
          setMensagem('Seu e-mail ainda não foi verificado.');
          // Inicia verificação automática a cada 5 segundos
          const interval = setInterval(async () => {
            await user.reload();
            if (user.emailVerified) {
              clearInterval(interval);
              setMensagem('Email verificado com sucesso! Redirecionando...');
              setTimeout(() => navigate('/perfil'), 1500);
            }
          }, 5000);
          return () => clearInterval(interval);
        }
      } else {
        setMensagem('Usuário não autenticado. Faça login novamente.');
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  const reenviar = async () => {
    if (!usuarioLogado) {
      setMensagem('Usuário não autenticado. Faça login novamente.');
      return;
    }

    try {
      await usuarioLogado.reload(); // Força atualização dos dados
      const user = auth.currentUser;

      if (user.emailVerified) {
        setMensagem('Este e-mail já foi verificado. Redirecionando...');
        setTimeout(() => navigate('/perfil'), 2000);
        return;
      }

      await sendEmailVerification(user);
      setMensagem('E-mail de verificação reenviado com sucesso!');
    } catch (error) {
      console.error('Erro ao reenviar email:', error.code, error.message);
      if (error.code === 'auth/too-many-requests') {
        setMensagem('Você está tentando reenviar muitas vezes. Tente mais tarde.');
      } else {
        setMensagem('Erro ao reenviar e-mail. Tente novamente mais tarde.');
      }
    }
  };


  const excluirConta = async () => {
    const email = sessionStorage.getItem('emailTemp');
    const senha = sessionStorage.getItem('senhaTemp');

    if (!email || !senha) {
      setMensagem('Para excluir a conta, faça login novamente.');
      return;
    }

    try {
      setLoadingExcluir(true);
      const result = await signInWithEmailAndPassword(auth, email, senha);
      await deleteUser(result.user);
      setMensagem('Conta excluída com sucesso.');
      sessionStorage.removeItem('emailTemp');
      sessionStorage.removeItem('senhaTemp');
      setTimeout(() => navigate('/cadastro'), 1000);
    } catch (error) {
      console.error('Erro ao excluir conta:', error);
      setMensagem('Erro ao excluir conta. Faça login novamente.');
    } finally {
      setLoadingExcluir(false);
    }
  };

  return (
    <div className="container d-flex justify-content-center align-items-center vh-100">
      <div className="card p-4 shadow rounded-4 text-center w-100" style={{ maxWidth: '480px' }}>
        <h3 className="mb-3 text-primary">Verifique seu e-mail</h3>
        <p className="mb-4 text-muted" style={{ fontSize: '0.95rem' }}>
          Enviamos um link de verificação para o seu e-mail.<br />
          Você precisa confirmar antes de continuar.
        </p>

        {mensagem && (
          <div className="alert alert-info py-2" style={{ fontSize: 14 }}>
            {mensagem}
          </div>
        )}

        <div className="d-grid gap-2 mt-3">
          <button className="btn btn-outline-secondary" onClick={reenviar}>
            Reenviar e-mail
          </button>
          <button
            className="btn btn-outline-danger"
            onClick={excluirConta}
            disabled={loadingExcluir}
          >
            {loadingExcluir ? 'Excluindo...' : 'Excluir minha conta'}
          </button>
        </div>
      </div>
    </div>
  );
}
