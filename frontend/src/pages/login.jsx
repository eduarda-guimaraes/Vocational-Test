import React, { useState } from 'react';
import { signInWithEmailAndPassword, signInWithPopup } from 'firebase/auth';
import { auth, provider } from '../services/firebase';
import { useNavigate, Link } from 'react-router-dom';

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
      const cred = await signInWithEmailAndPassword(auth, email, senha);
      // Não bloqueia por verificação de e-mail (política atual do projeto)
      // Se quiser direcionar para outra rota pós-login, ajuste aqui
      navigate('/perfil');
    } catch (err) {
      console.error('Erro no login:', err);
      let msg = 'Não foi possível entrar. ';
      switch (err.code) {
        case 'auth/invalid-credential':
        case 'auth/wrong-password':
          msg += 'E-mail ou senha incorretos.';
          break;
        case 'auth/user-not-found':
          msg += 'Usuário não encontrado.';
          break;
        case 'auth/too-many-requests':
          msg += 'Muitas tentativas. Tente novamente mais tarde.';
          break;
        case 'auth/network-request-failed':
          msg += 'Falha de rede. Verifique sua conexão.';
          break;
        default:
          msg += err.message || 'Tente novamente.';
      }
      setErro(msg);
    }
  };

  const loginComGoogle = async () => {
    try {
      await signInWithPopup(auth, provider);
      navigate('/perfil');
    } catch (error) {
      console.error(error);
      setErro('Erro ao fazer login com o Google.');
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
              onClick={() => setMostrarSenha(!mostrarSenha)} 
              style={{ backgroundColor: 'transparent', border: 'none', padding: 0, cursor: 'pointer' }}
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
          <button type="submit" className="btn w-100 mb-2" style={{ backgroundColor: '#447EB8', color: '#fff' }}>
            Entrar
          </button>
        </form>

        <button type="button" onClick={loginComGoogle} className="btn btn-outline-danger w-100 mb-3">
          <i className="bi bi-google me-2"></i> Entrar com Google
        </button>

        <div className="text-center">
          <p className="mb-0">
            Não tem uma conta? <Link to="/cadastro" className="btn btn-link p-0" style={{ color: '#447EB8' }}>Criar Conta</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
