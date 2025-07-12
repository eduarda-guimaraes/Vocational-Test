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
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const navigate = useNavigate();

  const handleCadastro = async (e) => {
    e.preventDefault();
    setErro('');

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, senha);
      const usuario = userCredential.user;

      await sendEmailVerification(usuario);

      await setDoc(doc(db, 'usuarios', usuario.uid), {
        nome,
        email,
        emailVerificado: false,
        criadoEm: new Date(),
      });

      localStorage.setItem('nomeUsuario', nome);
      sessionStorage.setItem('emailTemp', email);
      sessionStorage.setItem('senhaTemp', senha);

      navigate('/aguardando-verificacao');
    } catch (err) {
      console.error('Erro Firebase:', err.code);
      switch (err.code) {
        case 'auth/email-already-in-use':
          setErro('Este e-mail já está cadastrado.');
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
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      const methods = await fetchSignInMethodsForEmail(auth, user.email);
      if (methods.includes('password')) {
        setErro('Este e-mail já possui cadastro com senha. Faça login com e-mail e senha.');
        await auth.signOut();
        return;
      }

      const userRef = doc(db, 'usuarios', user.uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        await setDoc(userRef, {
          nome: user.displayName || '',
          email: user.email,
          criadoEm: new Date(),
          emailVerificado: user.emailVerified,
          foto: user.photoURL || null,
        });
      }

      localStorage.setItem('nomeUsuario', user.displayName || '');
      navigate('/definir-senha');
    } catch (error) {
      console.error('Erro no login com Google:', error);
      setErro('Não foi possível cadastrar com o Google.');
    }
  };

  return (
    <div className="container d-flex justify-content-center align-items-center vh-100">
      <div className="card p-4 shadow-sm rounded-4" style={{ maxWidth: '400px', width: '100%' }}>
        <h2 className="mb-4 text-center" style={{ color: '#447EB8' }}>Cadastro</h2>

        <form onSubmit={handleCadastro}>
          <div className="mb-3">
            <input
              type="text"
              className="form-control"
              placeholder="Nome completo"
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
            />
          </div>

          {erro && <p className="text-danger mb-3 text-center">{erro}</p>}

          <button
            type="submit"
            className="btn w-100 mb-3"
            style={{ backgroundColor: '#447EB8', color: '#fff' }}
          >
            Cadastrar
          </button>
        </form>

        <button
          type="button"
          onClick={loginComGoogle}
          className="btn btn-outline-danger w-100 mb-3"
        >
          <i className="bi bi-google me-2"></i> Cadastrar com Google
        </button>

        <div className="text-center">
          <Link to="/login" className="btn btn-link" style={{ color: '#447EB8' }}>
            Já tenho uma conta
          </Link>
        </div>
      </div>
    </div>
  );
}
