import React, { useState } from 'react';
import {
  updateProfile,
  updatePassword,
  updateEmail,
  reauthenticateWithCredential,
  EmailAuthProvider,
  deleteUser,
  reauthenticateWithPopup,
  sendEmailVerification
} from 'firebase/auth';
import { auth, db, provider } from '../services/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { useNavigate, useLocation } from 'react-router-dom';

export default function EditarPerfil() {
  const user = auth.currentUser;
  const navigate = useNavigate();
  const location = useLocation();
  const voltarPara = location.state?.voltarPara || 'perfil';

  const [nome, setNome] = useState(user?.displayName || '');
  const [email, setEmail] = useState(user?.email || '');
  const [novaSenha, setNovaSenha] = useState('');
  const [senhaAtual, setSenhaAtual] = useState('');
  const [erro, setErro] = useState('');
  const [mensagem, setMensagem] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [senhaExcluir, setSenhaExcluir] = useState('');
  const [erroExcluir, setErroExcluir] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [mostrarSenhaAtual, setMostrarSenhaAtual] = useState(false);
  const [mostrarSenhaExcluir, setMostrarSenhaExcluir] = useState(false);
  const [fotoPreview, setFotoPreview] = useState(user?.photoURL || '/iconevazio.png');
  const [novaFotoFile, setNovaFotoFile] = useState(null);

  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

  const handleFotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setFotoPreview(reader.result);
      reader.readAsDataURL(file);
      setNovaFotoFile(file);
    }
  };

  const uploadParaCloudinary = async (file) => {
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

const handleSalvar = async () => {
  setMensagem('');
  setErro('');
  try {
    const user = auth.currentUser;
    const isSenha = user.providerData[0]?.providerId === 'password';

    // Verifica se e-mail será alterado
    const emailAlterado = email !== user.email;

    // Reautenticando o usuário caso o e-mail ou senha tenha sido alterado
    if (emailAlterado && isSenha) {
      await user.reload(); // Garante dados atualizados
      if (!user.emailVerified) {
        setMensagem('Verifique seu e-mail atual antes de alterá-lo.');
        return;
      }

      const cred = EmailAuthProvider.credential(user.email, senhaAtual);
      await reauthenticateWithCredential(user, cred);
    }

    // Verifica se a foto foi alterada e faz upload
    let fotoURL = user.photoURL;
    if (novaFotoFile) {
      fotoURL = await uploadParaCloudinary(novaFotoFile);
    }

    // Atualizando o nome e foto de perfil
    await updateProfile(user, {
      displayName: nome,
      photoURL: fotoURL,
    });

    // Atualizando dados no Firestore
    const docRef = doc(db, 'usuarios', user.uid);
    await updateDoc(docRef, {
      nome,
      email,
      fotoPerfil: fotoURL,
    });

    // Atualizando e-mail
    if (emailAlterado) {
      await updateEmail(user, email);
      await sendEmailVerification(user); // Envia o e-mail de verificação para o novo e-mail
      setMensagem('Enviamos um e-mail de confirmação para seu novo endereço de e-mail.');
    }

    // Atualizando senha
    if (novaSenha.length >= 6 && isSenha) {
      await updatePassword(user, novaSenha);
    }

    setMensagem('Alterações salvas com sucesso!');
  } catch (error) {
    console.error(error);
    setErro('Erro ao atualizar: ' + error.message);
  }
};

  const confirmarExclusao = async () => {
    setErroExcluir('');
    try {
      const isSenha = user.providerData[0]?.providerId === 'password';
      if (isSenha) {
        const cred = EmailAuthProvider.credential(user.email, senhaExcluir);
        await reauthenticateWithCredential(user, cred);
      } else {
        await reauthenticateWithPopup(user, provider);
      }
      await deleteUser(user);
      await auth.signOut();
      navigate('/');
    } catch (error) {
      setErroExcluir('Erro ao excluir conta: ' + error.message);
    }
  };

  return (
    <div className="container d-flex justify-content-center align-items-center py-5">
      <div className="card p-4 shadow-sm" style={{ maxWidth: '450px', width: '100%' }}>
        <h4 className="mb-4 text-center">Editar Perfil</h4>
        <div className="text-center mb-3">
          <img src={fotoPreview} alt="Foto de perfil" style={{ width: '100px', height: '100px', borderRadius: '50%', objectFit: 'cover', border: '3px solid #447eb8' }} />
        </div>
        <div className="mb-3">
          <input type="file" className="form-control" accept="image/*" onChange={handleFotoChange} />
        </div>
        <form onSubmit={handleSalvar}>
          <div className="mb-3">
            <input type="text" className="form-control" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Nome" required />
          </div>
          <div className="mb-3">
            <input type="email" className="form-control" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" required />
          </div>
          <div className="mb-3 position-relative">
            <input type={mostrarSenha ? 'text' : 'password'} className="form-control" value={novaSenha} onChange={(e) => setNovaSenha(e.target.value)} placeholder="Nova senha (opcional)" />
            <button type="button" className="position-absolute top-50 end-0 translate-middle-y me-2" onClick={() => setMostrarSenha(!mostrarSenha)} style={{ backgroundColor: 'transparent', border: 'none' }}>
              <i className={`bi ${mostrarSenha ? 'bi-eye' : 'bi-eye-slash'}`} style={{ color: '#447EB8' }}></i>
            </button>
          </div>
          {user.providerData[0]?.providerId === 'password' && (
            <div className="mb-3 position-relative">
              <input type={mostrarSenhaAtual ? 'text' : 'password'} className="form-control" value={senhaAtual} onChange={(e) => setSenhaAtual(e.target.value)} placeholder="Senha atual (obrigatória)" required />
              <button type="button" className="position-absolute top-50 end-0 translate-middle-y me-2" onClick={() => setMostrarSenhaAtual(!mostrarSenhaAtual)} style={{ backgroundColor: 'transparent', border: 'none' }}>
                <i className={`bi ${mostrarSenhaAtual ? 'bi-eye' : 'bi-eye-slash'}`} style={{ color: '#447EB8' }}></i>
              </button>
            </div>
          )}
          {erro && <p className="text-danger">{erro}</p>}
          {mensagem && <p className="text-success">{mensagem}</p>}
          <button type="submit" className="btn w-100 mb-2" style={{ backgroundColor: '#447EB8', color: '#fff' }}>Salvar alterações</button>
          <button type="button" className="btn btn-secondary w-100 mb-3" onClick={() => navigate('/perfil', { state: { voltarPara } })}>Voltar</button>
        </form>
        <hr />
        <button className="btn btn-outline-danger w-100 mt-2" onClick={() => setShowModal(true)}>Excluir Conta</button>
        {showModal && (
          <div className="modal d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Confirmar Exclusão</h5>
                  <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
                </div>
                <div className="modal-body">
                  {user.providerData[0]?.providerId === 'password' ? (
                    <>
                      <p>Digite sua senha para confirmar a exclusão:</p>
                      <div className="position-relative">
                        <input type={mostrarSenhaExcluir ? 'text' : 'password'} className="form-control" value={senhaExcluir} onChange={(e) => setSenhaExcluir(e.target.value)} placeholder="Senha" />
                        <button type="button" className="position-absolute top-50 end-0 translate-middle-y me-2" onClick={() => setMostrarSenhaExcluir((prev) => !prev)} style={{ backgroundColor: 'transparent', border: 'none', padding: 0, cursor: 'pointer' }}>
                          <i className={`bi ${mostrarSenhaExcluir ? 'bi-eye' : 'bi-eye-slash'}`} style={{ color: '#447EB8' }}></i>
                        </button>
                      </div>
                    </>
                  ) : (
                    <p>Você será reautenticado com o Google antes de excluir sua conta.</p>
                  )}
                  {erroExcluir && <p className="text-danger mt-2">{erroExcluir}</p>}
                </div>
                <div className="modal-footer">
                  <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
                  <button className="btn btn-danger" onClick={confirmarExclusao}>Confirmar Exclusão</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}  
