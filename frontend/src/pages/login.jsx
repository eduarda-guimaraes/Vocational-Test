import React, { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../services/firebase';
import { useNavigate, Link } from 'react-router-dom';

export default function Login() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setErro('');
    try {
      await signInWithEmailAndPassword(auth, email, senha);
      navigate('/perfil');
    } catch (err) {
      setErro('Email ou senha incorretos.');
    }
  };

  return (
    <div className="container d-flex justify-content-center align-items-center vh-100">
      <div className="card p-4 shadow-sm" style={{ maxWidth: '400px', width: '100%' }}>
        <h2 className="mb-4 text-center" style={{ color: '#447EB8' }}>Login</h2>
        <form onSubmit={handleLogin}>
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
            />
          </div>
          {erro && <p className="text-danger mb-3">{erro}</p>}
          <button
            type="submit"
            className="btn w-100 mb-3"
            style={{ backgroundColor: '#447EB8', color: '#fff' }}
          >
            Entrar
          </button>
        </form>
        <div className="text-center">
          <p>
            Não tem uma conta?{' '}
            <Link to="/cadastro" className="btn btn-link p-0" style={{ color: '#447EB8' }}>
              Criar Conta
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
