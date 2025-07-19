import React, { useState } from 'react';
import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
  signInWithPopup,
  fetchSignInMethodsForEmail,
} from 'firebase/auth';
import { auth, db, provider } from '../services/firebase';
import { collection, doc, setDoc, getDoc } from 'firebase/firestore';
import { useNavigate, Link } from 'react-router-dom';

export default function Cadastro() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmSenha, setConfirmSenha] = useState('');
  const [nome, setNome] = useState('');
  const [erro, setErro] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [mostrarConfirmSenha, setMostrarConfirmSenha] = useState(false);
  const navigate = useNavigate();

  const emailEhValido = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const senhaEhForte = (senha) =>
    /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{6,}$/.test(senha);

  const handleCadastro = async (e) => {
    e.preventDefault();
    setErro('');

    if (!emailEhValido(email)) {
      setErro('Formato de email inválido.');
      return;
    }

    if (senha !== confirmSenha) {
      setErro('As senhas não coincidem.');
      return;
    }

    if (!senhaEhForte(senha)) {
      setErro('A senha deve ter no mínimo 6 caracteres, incluindo letras, números e um caractere especial.');
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, senha);
      const usuario = userCredential.user;

      await sendEmailVerification(usuario);

      const usuarioRef = doc(collection(db, "usuarios"), usuario.uid);
      await setDoc(usuarioRef, {
        nome: nome,
        email: email,
        criadoEm: new Date(),
        emailVerificado: false,
      });

      localStorage.setItem('nomeUsuario', nome);
      sessionStorage.setItem('emailTemp', email);
      sessionStorage.setItem('senhaTemp', senha);

      navigate('/aguardando-verificacao');
    } catch (err) {
      console.error('Erro Firebase:', err.code);
      switch (err.code) {
        case 'auth/email-already-in-use':
          setErro('Este e-mail já está cadastrado. Tente fazer login ou use outro e-mail.');
          break;
        case 'auth/invalid-email':
          setErro('O e-mail fornecido é inválido.');
          break;
        case 'auth/weak-password':
          setErro('A senha é muito fraca. Tente uma senha mais forte.');
          break;
        default:
          setErro('Erro ao cadastrar. Tente novamente.');
      }
    }
  };

  const loginComGoogle = async () => {
    setErro('');
    try {
      // Abre popup e recupera email ANTES de salvar
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Verifica se já existe conta com senha associada a esse e-mail
      const methods = await fetchSignInMethodsForEmail(auth, user.email);
      if (methods.includes('password')) {
        setErro('Este e-mail já está registrado com senha. Faça login usando e-mail e senha.');
        await auth.signOut(); // Desloga login com Google
        return;
      }

     const userRef = doc(db, "usuarios", user.uid);
const userSnap = await getDoc(userRef);

if (userSnap.exists()) {
  setErro('Este e-mail já possui uma conta. Faça login em vez de tentar se cadastrar.');
  await auth.signOut();
  return;
}

// Redirecionar para tela de "complementar dados" antes de salvar
navigate('/completar-cadastro-google', {
  state: {
    nome: user.displayName || '',
    email: user.email,
    photo: user.photoURL || null,
    uid: user.uid,
  },
});

      localStorage.setItem('nomeUsuario', user.displayName || '');
      navigate('/definir-senha'); // ou /perfil se já quiser pular a senha
    } catch (error) {
      console.error('Erro no login com Google:', error);
      setErro('Não foi possível cadastrar com o Google.');
    }
  };

  return (
    <div className="container d-flex justify-content-center align-items-center vh-100">
      <div className="card p-4 shadow-sm" style={{ maxWidth: '400px', width: '100%' }}>
        <h2 className="mb-4 text-center" style={{ color: '#447EB8' }}>Criar Conta</h2>
        <form onSubmit={handleCadastro}>
          <div className="mb-3">
            <input type="text" className="form-control" placeholder="Nome" value={nome} onChange={(e) => setNome(e.target.value)} required />
          </div>
          <div className="mb-3">
            <input type="email" className="form-control" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="mb-3 position-relative">
            <input type={mostrarSenha ? 'text' : 'password'} className="form-control" placeholder="Senha" value={senha} onChange={(e) => setSenha(e.target.value)} required />
            <button type="button" className="position-absolute top-50 end-0 translate-middle-y me-2" onClick={() => setMostrarSenha(!mostrarSenha)} style={{ backgroundColor: 'transparent', border: 'none' }}>
              <i className={`bi ${mostrarSenha ? 'bi-eye' : 'bi-eye-slash'}`} style={{ color: '#447EB8' }}></i>
            </button>
          </div>
          <div className="mb-3 position-relative">
            <input type={mostrarConfirmSenha ? 'text' : 'password'} className="form-control" placeholder="Confirmar Senha" value={confirmSenha} onChange={(e) => setConfirmSenha(e.target.value)} required />
            <button type="button" className="position-absolute top-50 end-0 translate-middle-y me-2" onClick={() => setMostrarConfirmSenha(!mostrarConfirmSenha)} style={{ backgroundColor: 'transparent', border: 'none' }}>
              <i className={`bi ${mostrarConfirmSenha ? 'bi-eye' : 'bi-eye-slash'}`} style={{ color: '#447EB8' }}></i>
            </button>
          </div>
          {erro && <p className="text-danger mb-3">{erro}</p>}
          <button type="submit" className="btn w-100 mb-2" style={{ backgroundColor: '#447EB8', color: '#fff' }}>
            Cadastrar
          </button>
        </form>

        <button type="button" onClick={loginComGoogle} className="btn btn-outline-danger w-100 mb-3">
          <i className="bi bi-google me-2"></i> Cadastrar com Google
        </button>

        <div className="text-center">
          <Link to="/login" className="btn btn-link" style={{ color: '#447EB8' }}>Já tenho uma conta</Link>
        </div>
      </div>
    </div>
  );
}
