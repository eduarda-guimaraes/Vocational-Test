import React, { useState } from 'react';
import { createUserWithEmailAndPassword, sendEmailVerification } from 'firebase/auth';
import { auth, db } from '../services/firebase';
import { collection, doc, setDoc } from 'firebase/firestore';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

export default function Cadastro() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmSenha, setConfirmSenha] = useState('');
  const [nome, setNome] = useState('');
  const [dataNascimento, setDataNascimento] = useState('');
  const [imagem, setImagem] = useState(null);
  const [preview, setPreview] = useState(null);
  const [erro, setErro] = useState('');
  const navigate = useNavigate();

  const CLOUDINARY_URL = import.meta.env.CLOUDINARY_URL;
  const UPLOAD_PRESET = import.meta.env.UPLOAD_PRESET;

  const emailEhValido = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const senhaEhForte = (senha) =>
    /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{6,}$/.test(senha);

  const handleImagemChange = (e) => {
    const file = e.target.files[0];
    setImagem(file);
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result);
      reader.readAsDataURL(file);
    } else {
      setPreview(null);
    }
  };

  const uploadParaCloudinary = async () => {
    if (!imagem) return '/iconevazio.png';

    const formData = new FormData();
    formData.append('file', imagem);
    formData.append('upload_preset', UPLOAD_PRESET);

    try {
      const response = await axios.post(CLOUDINARY_URL, formData);
      return response.data.secure_url;
    } catch (err) {
      console.error('Erro ao fazer upload no Cloudinary:', err);
      return '/iconevazio.png';
    }
  };

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

      const fotoURL = await uploadParaCloudinary();

      const usuarioRef = doc(collection(db, "usuarios"), usuario.uid);
      await setDoc(usuarioRef, {
        nome,
        email,
        dataNascimento,
        fotoPerfil: fotoURL,
        criadoEm: new Date(),
        emailVerificado: false,
      });

      sessionStorage.setItem('emailTemp', email);
      sessionStorage.setItem('senhaTemp', senha);
      localStorage.setItem('nomeUsuario', nome);

      navigate('/aguardando-verificacao');
    } catch (err) {
      console.error('Erro Firebase:', err.code, err.message);
      setErro('Erro ao cadastrar. Tente novamente.');
    }
  };

  return (
    <div className="container d-flex justify-content-center align-items-center vh-100">
      <div className="card p-4 shadow-sm" style={{ maxWidth: '450px', width: '100%' }}>
        <h2 className="mb-4 text-center" style={{ color: '#447EB8' }}>Criar Conta</h2>
        <form onSubmit={handleCadastro}>
          <div className="mb-3">
            <input type="text" className="form-control" placeholder="Nome" value={nome} onChange={(e) => setNome(e.target.value)} required />
          </div>
          <div className="mb-3">
            <input type="date" className="form-control" value={dataNascimento} onChange={(e) => setDataNascimento(e.target.value)} required />
          </div>
          <div className="mb-3">
            <label className="form-label">Foto de perfil</label>
            <input type="file" className="form-control" accept="image/*" capture="user" onChange={handleImagemChange} />
            {preview && (
              <img
                src={preview}
                alt="Preview"
                className="mt-2"
                style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: '50%' }}
              />
            )}
          </div>
          <div className="mb-3">
            <input type="email" className="form-control" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="mb-3">
            <input type="password" className="form-control" placeholder="Senha" value={senha} onChange={(e) => setSenha(e.target.value)} required />
          </div>
          <div className="mb-3">
            <input type="password" className="form-control" placeholder="Confirmar Senha" value={confirmSenha} onChange={(e) => setConfirmSenha(e.target.value)} required />
          </div>
          {erro && <p className="text-danger text-center">{erro}</p>}
          <button type="submit" className="btn w-100" style={{ backgroundColor: '#447EB8', color: '#fff' }}>
            Cadastrar
          </button>
        </form>
        <div className="text-center mt-3">
          <Link to="/login" style={{ color: '#447EB8' }}>Já tenho uma conta</Link>
        </div>
      </div>
    </div>
  );
}
