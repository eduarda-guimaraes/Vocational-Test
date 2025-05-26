import React, { useState } from 'react';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../services/firebase';
import { useNavigate, Link } from 'react-router-dom';

export default function Cadastro() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmSenha, setConfirmSenha] = useState('');
  const [nome, setNome] = useState('');
  const [erro, setErro] = useState('');
  const navigate = useNavigate();

  const handleCadastro = async (e) => {
    e.preventDefault();
    setErro('');

    if (senha !== confirmSenha) {
      setErro('As senhas não coincidem.');
      return;
    }

    try {
      // Cria o usuário com email e senha
      const userCredential = await createUserWithEmailAndPassword(auth, email, senha);

      // Atualiza o perfil do usuário com o nome
      await updateProfile(auth.currentUser, {
        displayName: nome
      });

      // Salva no Firestore
      await setDoc(doc(db, 'usuarios', userCredential.user.uid), {
        nome: nome,
        email: email,
        foto: '',
        areaInteresse: [],
        teste: {}
      });

      navigate('/perfil');
    } catch (err) {
      console.error('Erro Firebase:', err.code);
      switch (err.code) {
        case 'auth/email-already-in-use':
          setErro('Email já está em uso. Tente outro.');
          break;
        case 'auth/invalid-email':
          setErro('Formato de email inválido.');
          break;
        case 'auth/weak-password':
          setErro('A senha deve ter pelo menos 6 caracteres.');
          break;
        default:
          setErro('Erro ao cadastrar. Tente novamente.');
      }
    }
  };

  return (
    <div className="container d-flex justify-content-center align-items-center vh-100">
      <div className="card p-4 shadow-sm" style={{ maxWidth: '400px', width: '100%' }}>
        <h2 className="mb-4 text-center" style={{ color: '#447EB8' }}>Criar Conta</h2>
        <form onSubmit={handleCadastro}>
          <div className="mb-3">
            <input
              type="text"
              className="form-control"
              placeholder="Nome"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              required
            />
          </div>
          <div className="mb-3">
            <input
              type="email"
              className="form-control"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="mb-3">
            <input
              type="password"
              className="form-control"
              placeholder="Senha"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              required
              minLength={6}
            />
          </div>
          <div className="mb-3">
            <input
              type="password"
              className="form-control"
              placeholder="Confirmar Senha"
              value={confirmSenha}
              onChange={(e) => setConfirmSenha(e.target.value)}
              required
              minLength={6}
            />
          </div>
          {erro && <p className="text-danger mb-3">{erro}</p>}
          <button
            type="submit"
            className="btn w-100 mb-3"
            style={{ backgroundColor: '#447EB8', color: '#fff' }}
          >
            Cadastrar
          </button>
        </form>
        <div className="text-center">
          <p>
            Já tem uma conta?{' '}
            <Link to="/" className="btn btn-link p-0" style={{ color: '#447EB8' }}>
              Entrar
            </Link>
          </p>
          <Link to="/home" className="btn btn-link" style={{ color: '#447EB8' }}>
            Voltar para Home
          </Link>
        </div>
      </div>
    </div>
  );
}