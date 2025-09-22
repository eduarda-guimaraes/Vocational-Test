import React, { useState } from 'react';
import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
  signInWithPopup,
  fetchSignInMethodsForEmail,
  signOut
} from 'firebase/auth';
import { auth, db, provider } from '../services/firebase';
import { collection, doc, setDoc, getDoc } from 'firebase/firestore';
import { useNavigate, Link } from 'react-router-dom';

export default function Cadastro() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmSenha, setConfirmSenha] = useState('');
  const [nome, setNome] = useState('');
  const [dataNascimento, setDataNascimento] = useState('');
  const [fotoPreview, setFotoPreview] = useState(null);
  const [fotoFile, setFotoFile] = useState(null);
  const [erro, setErro] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [mostrarConfirmSenha, setMostrarConfirmSenha] = useState(false);
  const navigate = useNavigate();
  const emailEhValido = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const senhaEhForte = (senha) =>
    /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{6,}$/.test(senha);
  const uploadParaCloudinary = async (file) => {
    const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', uploadPreset);

    const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) throw new Error('Erro ao enviar imagem para o Cloudinary');

    const data = await response.json();
    return data.secure_url; 
  };

  const handleFotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setFotoPreview(reader.result);
      reader.readAsDataURL(file);
      setFotoFile(file);
    }
  };

  const handleCadastro = async (e) => {
    e.preventDefault();
    setErro('');

    if (!emailEhValido(email)) return setErro('Formato de email inválido.');
    if (senha !== confirmSenha) return setErro('As senhas não coincidem.');
    if (!senhaEhForte(senha)) return setErro('A senha deve ter no mínimo 6 caracteres, com letras, números e símbolo.');
    if (!dataNascimento) return setErro('A data de nascimento é obrigatória.');

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, senha);
      const usuario = userCredential.user;

      await sendEmailVerification(usuario);

      let fotoURL = null;
      if (fotoFile) {
        fotoURL = await uploadParaCloudinary(fotoFile);
      }

      await setDoc(doc(db, "usuarios", usuario.uid), {
        nome,
        email,
        dataNascimento, 
        fotoPerfil: fotoURL, 
        criadoEm: new Date(),
        emailVerificado: false, 
      });

      localStorage.setItem('nomeUsuario', nome);
      sessionStorage.setItem('emailTemp', email);
      sessionStorage.setItem('senhaTemp', senha);

      navigate('/aguardando-verificacao');
    } catch (err) {
      console.error('Erro Firebase:', err.code);
      if (err.code === 'auth/email-already-in-use') {
        setErro('Este e-mail já está cadastrado. Faça login ou use outro e-mail.');
      } else {
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
        setErro('Este e-mail já possui conta com senha. Faça login com email e senha.');
        await signOut(auth);
        return;
      }

      const userRef = doc(db, "usuarios", user.uid);
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
      navigate('/definir-senha'); // ou '/perfil'
    } catch (error) {
      console.error('Erro no login com Google:', error);
      setErro('Erro ao cadastrar com o Google. Tente novamente.');
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
          <div className="mb-3">
            <input type="date" className="form-control" placeholder="Data de Nascimento" value={dataNascimento} onChange={(e) => setDataNascimento(e.target.value)} required />
          </div>
          <div className="mb-3">
            <input type="file" className="form-control" accept="image/*" onChange={handleFotoChange} />
            {fotoPreview && <img src={fotoPreview} alt="Preview" style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: '50%', marginTop: '10px' }} />}
          </div>
          {erro && <p className="text-danger mb-3">{erro}</p>}
          <button type="submit" className="btn w-100 mb-2" style={{ backgroundColor: '#447EB8', color: '#fff' }}>Cadastrar</button>
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
