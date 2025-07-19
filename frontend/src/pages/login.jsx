import React, { useState } from 'react';
import {
  signInWithEmailAndPassword,
  signInWithPopup,
  fetchSignInMethodsForEmail,
} from 'firebase/auth';
import { auth, provider, db } from '../services/firebase';
import { useNavigate, Link } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';

export default function Login() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setErro('');

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, senha);
      const user = userCredential.user;

      await user.reload();

      if (user.emailVerified) {
        navigate('/perfil');
      } else {
        navigate('/aguardando-verificacao');
      }
    } catch (err) {
      console.error('Erro no login:', err);
      setErro('Email ou senha incorretos.');
    }
  };

  const toggleMostrarSenha = () => {
    setMostrarSenha(!mostrarSenha);
  };

const loginComGoogle = async () => {
  setErro('');

  try {
    const result = await signInWithPopup(auth, provider);
    const user = result.user;

    // Verifica se o e-mail já está associado a outro método de login
    const methods = await fetchSignInMethodsForEmail(auth, user.email);
    
    // Se o usuário tiver login com senha, bloqueia o login com Google
    if (methods.includes('password') && !methods.includes('google.com')) {
      setErro('Este e-mail já está cadastrado com senha. Faça login com e-mail e senha.');
      await auth.signOut(); // importante para deslogar o Google
      return;
    }

    // Verifica se o usuário já existe no Firestore
    const userDoc = await getDoc(doc(db, 'usuarios', user.uid));
    if (!userDoc.exists()) {
      setErro('Sua conta do Google não está vinculada a um perfil. Crie uma conta ou utilize outro login.');
      await auth.signOut(); // desconecta o usuário
      return;
    }


    // Caso já tenha cadastro, redireciona normalmente
    navigate('/perfil');
  } catch (error) {
    console.error('Erro no login com Google:', error);
    if (error.code === 'auth/account-exists-with-different-credential') {
      setErro('Este e-mail já está vinculado a outra forma de login. Use seu e-mail e senha.');
    } else {
      setErro('Não foi possível fazer login com o Google.');
    }
  }
};


  return (
    <div className="container d-flex justify-content-center align-items-center vh-100">
      <div className="card p-4 shadow-sm rounded-4" style={{ maxWidth: '400px', width: '100%' }}>
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

          <div className="mb-1 position-relative">
            <input
              type={mostrarSenha ? 'text' : 'password'}
              className="form-control"
              placeholder="Senha"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              required
            />
            <button
              type="button"
              className="position-absolute top-50 end-0 translate-middle-y me-2"
              onClick={toggleMostrarSenha}
              tabIndex={-1}
              style={{
                backgroundColor: 'transparent',
                border: 'none',
                padding: 0,
                cursor: 'pointer',
              }}
            >
              <i className={`bi ${mostrarSenha ? 'bi-eye' : 'bi-eye-slash'}`} style={{ color: '#447EB8' }}></i>
            </button>
          </div>

          <div className="text-end mb-3">
            <Link to="/recuperarSenha" className="small text-decoration-none" style={{ color: '#447EB8' }}>
              Esqueci minha senha
            </Link>
          </div>

          {erro && <p className="text-danger mb-3 text-center">{erro}</p>}

          <button
            type="submit"
            className="btn w-100 mb-2"
            style={{ backgroundColor: '#447EB8', color: '#fff' }}
          >
            Entrar
          </button>
        </form>

        <button
          type="button"
          onClick={loginComGoogle}
          className="btn btn-outline-danger w-100 mb-3"
        >
          <i className="bi bi-google me-2"></i> Entrar com Google
        </button>

        <div className="text-center">
          <p className="mb-0">
            Não tem uma conta?{' '}
            <Link to="/cadastro" className="btn btn-link p-0" style={{ color: '#447EB8' }}>
              Criar Conta
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
