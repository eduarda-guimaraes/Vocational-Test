import React, { useState, useEffect } from 'react';
import { auth } from '../services/firebase';
import { useNavigate } from 'react-router-dom';
import {
  sendEmailVerification,
  deleteUser,
  signInWithEmailAndPassword,
} from 'firebase/auth';

export default function AguardandoVerificacao() {
  const [mensagem, setMensagem] = useState('');
  const [loadingExcluir, setLoadingExcluir] = useState(false);
  const [usuarioLogado, setUsuarioLogado] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(user => {
      setUsuarioLogado(user);
    });
    return unsubscribe;
  }, []);

  const reenviar = async () => {
    if (!usuarioLogado) {
      setMensagem('Usuário não autenticado. Faça login novamente.');
      return;
    }
    try {
      await sendEmailVerification(usuarioLogado);
      setMensagem('E-mail de verificação reenviado com sucesso!');
    } catch (error) {
      console.error('Erro ao reenviar email:', error);
      setMensagem('Erro ao reenviar email. Tente novamente mais tarde.');
    }
  };

  const verificar = async () => {
    if (!usuarioLogado) {
      setMensagem('Usuário não autenticado. Faça login novamente.');
      return;
    }
    await usuarioLogado.reload();
    if (usuarioLogado.emailVerified) {
      setMensagem('Email verificado com sucesso! Redirecionando...');
      setTimeout(() => navigate('/perfil'), 2000);
    } else {
      setMensagem('Seu email ainda não foi verificado.');
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
          <button className="btn btn-outline-primary" onClick={verificar}>
            Já verifiquei
          </button>
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
