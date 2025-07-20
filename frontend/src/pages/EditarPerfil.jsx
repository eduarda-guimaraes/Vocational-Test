<<<<<<< HEAD
import React, { useState, useEffect } from 'react';
import { auth, db } from '../services/firebase';
=======
import React, { useState } from 'react';
import { auth, db, provider } from '../services/firebase';
>>>>>>> 3070575fbc6b1b90eb7bf2ecb90263fde89b0681
import {
  updateProfile,
  updateEmail,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
  deleteUser,
<<<<<<< HEAD
  fetchSignInMethodsForEmail
} from 'firebase/auth';
import { doc, deleteDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
=======
  reauthenticateWithPopup,
} from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import { useNavigate, useLocation } from 'react-router-dom';
>>>>>>> 3070575fbc6b1b90eb7bf2ecb90263fde89b0681

export default function EditarPerfil() {
  const user = auth.currentUser;
  const navigate = useNavigate();
  const location = useLocation();
  const voltarPara = location.state?.voltarPara || 'perfil';

  const [nome, setNome] = useState(user?.displayName || '');
  const [email, setEmail] = useState(user?.email || '');
<<<<<<< HEAD
  const [senhaAtual, setSenhaAtual] = useState('');
  const [senhaNova, setSenhaNova] = useState('');
=======
  const [novaSenha, setNovaSenha] = useState('');
  const [senhaAtual, setSenhaAtual] = useState('');
>>>>>>> 3070575fbc6b1b90eb7bf2ecb90263fde89b0681
  const [erro, setErro] = useState('');
  const [mensagem, setMensagem] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [senhaExcluir, setSenhaExcluir] = useState('');
<<<<<<< HEAD
  const [temSenha, setTemSenha] = useState(false);
  const [erroExclusao, setErroExclusao] = useState('');
  const navigate = useNavigate();
=======
  const [erroExcluir, setErroExcluir] = useState('');
  const [mostrarSenhaExcluir, setMostrarSenhaExcluir] = useState(false);

  // Foto de perfil
  const [fotoPreview, setFotoPreview] = useState(user?.photoURL || '/iconevazio.png');
  const [novaFoto, setNovaFoto] = useState(null);

  const handleFotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFotoPreview(reader.result);
        setNovaFoto(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };
>>>>>>> 3070575fbc6b1b90eb7bf2ecb90263fde89b0681

  useEffect(() => {
    async function verificarMetodoLogin() {
      if (user?.email) {
        const methods = await fetchSignInMethodsForEmail(auth, user.email);
        setTemSenha(methods.includes('password'));
      }
    }
    verificarMetodoLogin();
  }, [user]);

  const handleSalvar = async (e) => {
    e.preventDefault();
    setErro('');
    setMensagem('');
<<<<<<< HEAD
    try {
      // --- Atualiza email, se mudou ---
      if (email !== user.email) {
        if (!senhaAtual) {
          setErro('Digite a senha atual para alterar o email.');
          return;
        }
        // Reautenticar com credencial de email/senha
        const cred = EmailAuthProvider.credential(user.email, senhaAtual);
        await reauthenticateWithCredential(user, cred);
        // Atualiza email
        await updateEmail(user, email);
        // Recarrega o usuário para atualizar auth.currentUser.email
        await user.reload();
      }

      // --- Atualiza nome, se mudou ---
      if (nome !== user.displayName) {
        await updateProfile(user, { displayName: nome });
      }

      // --- Atualiza senha, se preenchida ---
      if (senhaNova.length >= 6) {
        await updatePassword(user, senhaNova);
=======

    const isSenha = user.providerData[0]?.providerId === 'password';
    const nomeAlterado = nome !== user.displayName;
    const emailAlterado = email !== user.email;
    const senhaAlterada = novaSenha.length >= 6;
    const fotoAlterada = novaFoto !== null;

    try {
      // Reautenticação
      if (isSenha) {
        if (!senhaAtual || senhaAtual.length < 6) {
          setErro('Digite sua senha atual para confirmar as alterações.');
          return;
        }
        const credential = EmailAuthProvider.credential(user.email, senhaAtual);
        await reauthenticateWithCredential(user, credential);
      } else if (nomeAlterado || emailAlterado || fotoAlterada) {
        await reauthenticateWithPopup(user, provider);
      }

      if (nomeAlterado || fotoAlterada) {
        await updateProfile(user, {
          displayName: nome,
          ...(fotoAlterada && { photoURL: novaFoto }),
        });

        // Atualiza nome no Firestore também
        const docRef = doc(db, 'usuarios', user.uid);
        await updateDoc(docRef, { nome });
      }

      if (emailAlterado) {
        await updateEmail(user, email);
      }

      if (senhaAlterada && isSenha) {
        await updatePassword(user, novaSenha);
>>>>>>> 3070575fbc6b1b90eb7bf2ecb90263fde89b0681
      }

      setMensagem('Dados atualizados com sucesso!');
      setTimeout(() => navigate('/perfil', { state: { voltarPara } }), 1500);
    } catch (error) {
      console.error(error);
<<<<<<< HEAD
      // Mensagens específicas para cada erro
      if (error.code === 'auth/wrong-password') {
        setErro('Senha atual incorreta.');
      } else if (error.code === 'auth/requires-recent-login') {
        setErro('Por segurança, faça login novamente para atualizar.');
      } else if (error.code === 'auth/email-already-in-use') {
        setErro('Este email já está em uso.');
=======
      setErro('Erro ao atualizar dados. Verifique sua senha ou tente novamente.');
    }
  };

  const confirmarExclusao = async () => {
    setErroExcluir('');

    try {
      if (user.providerData[0]?.providerId === 'password') {
        const credential = EmailAuthProvider.credential(user.email, senhaExcluir);
        await reauthenticateWithCredential(user, credential);
>>>>>>> 3070575fbc6b1b90eb7bf2ecb90263fde89b0681
      } else {
        await reauthenticateWithPopup(user, provider);
      }

      await deleteUser(user);
      navigate('/');
    } catch (error) {
      console.error(error);
      setErroExcluir('Erro ao excluir conta. Verifique a senha ou tente novamente.');
    }
  };

  const handleConfirmExcluir = async () => {
    setErroExclusao('');
    if (temSenha) {
      if (!senhaExcluir) {
        setErroExclusao('Digite sua senha para confirmar.');
        return;
      }
      // reautenticar para exclusão
      try {
        const cred = EmailAuthProvider.credential(user.email, senhaExcluir);
        await reauthenticateWithCredential(user, cred);
      } catch {
        setErroExclusao('Senha incorreta.');
        return;
      }
    }
    // exclui usuário e documento no Firestore
    await deleteUser(user);
    await deleteDoc(doc(db, 'usuarios', user.uid));
    navigate('/');
  };

  return (
    <div className="container d-flex justify-content-center align-items-center py-5">
      <div className="card p-4 shadow-sm" style={{ maxWidth: '450px', width: '100%' }}>
        <h4 className="mb-4 text-center">Editar Perfil</h4>

<<<<<<< HEAD
        {/* FOTO DE PERFIL */}
        <div className="text-center mb-4">
          <img
            src={user?.photoURL || '/iconevazio.png'}
=======
        <div className="text-center mb-3">
          <img
            src={fotoPreview}
>>>>>>> 3070575fbc6b1b90eb7bf2ecb90263fde89b0681
            alt="Foto de perfil"
            style={{
              width: '100px',
              height: '100px',
              borderRadius: '50%',
              objectFit: 'cover',
              border: '3px solid #447eb8'
            }}
          />
        </div>

<<<<<<< HEAD
=======
        <div className="mb-3">
          <input type="file" className="form-control" accept="image/*" onChange={handleFotoChange} />
        </div>

>>>>>>> 3070575fbc6b1b90eb7bf2ecb90263fde89b0681
        <form onSubmit={handleSalvar}>
          <div className="mb-3">
            <input
              type="text"
              className="form-control"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Nome"
            />
          </div>

          <div className="mb-3">
            <input
              type="email"
              className="form-control"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
            />
          </div>

          <div className="mb-3">
            <input
              type="password"
              className="form-control"
<<<<<<< HEAD
              value={senhaAtual}
              onChange={(e) => setSenhaAtual(e.target.value)}
              placeholder="Senha atual (necessária para email)"
            />
          </div>

          <div className="mb-3">
            <input
              type="password"
              className="form-control"
              value={senhaNova}
              onChange={(e) => setSenhaNova(e.target.value)}
              placeholder="Nova senha (opcional)"
            />
          </div>

          {erro && <p className="text-danger">{erro}</p>}
          {mensagem && <p className="text-success">{mensagem}</p>}

          <div className="d-grid gap-2">
            <button
              type="submit"
              className="btn-perfil"
              style={{ backgroundColor: '#447EB8', color: '#fff' }}
            >
              Salvar e Voltar
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => navigate('/perfil')}
            >
              Voltar
            </button>
          </div>
        </form>

        <hr className="my-4" />

        <button
          onClick={() => setShowModal(true)}
          className="btn btn-outline-danger w-100"
        >
          Excluir minha conta
        </button>

        {/* Modal de exclusão */}
        {showModal && (
          <>
            <div className="modal-backdrop fade show"></div>
            <div className="modal fade show d-block" tabIndex="-1">
              <div className="modal-dialog modal-dialog-centered">
                <div className="modal-content">
                  <div className="modal-header">
                    <h5 className="modal-title text-danger">Confirmar Exclusão</h5>
                    <button
                      type="button"
                      className="btn-close"
                      onClick={() => setShowModal(false)}
                    />
                  </div>
                  <div className="modal-body">
                    <p>Tem certeza que deseja excluir sua conta?</p>
                    {temSenha && (
                      <input
                        type="password"
                        className="form-control mb-2"
                        value={senhaExcluir}
                        onChange={(e) => setSenhaExcluir(e.target.value)}
                        placeholder="Digite sua senha"
                      />
                    )}
                    {erroExclusao && <p className="text-danger">{erroExclusao}</p>}
                  </div>
                  <div className="modal-footer">
                    <button
                      className="btn btn-secondary"
                      onClick={() => setShowModal(false)}
                    >
                      Cancelar
                    </button>
                    <button
                      className="btn btn-danger"
                      onClick={handleConfirmExcluir}
                    >
                      Excluir conta
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </>
=======
              value={novaSenha}
              onChange={(e) => setNovaSenha(e.target.value)}
              placeholder="Nova senha (opcional)"
            />
          </div>
          {user.providerData[0]?.providerId === 'password' && (
            <div className="mb-3">
              <input
                type="password"
                className="form-control"
                value={senhaAtual}
                onChange={(e) => setSenhaAtual(e.target.value)}
                placeholder="Senha atual (obrigatória)"
                required
              />
            </div>
          )}
          {erro && <p className="text-danger">{erro}</p>}
          {mensagem && <p className="text-success">{mensagem}</p>}
          <button
            type="submit"
            className="btn w-100 mb-2"
            style={{ backgroundColor: '#447EB8', color: '#fff' }}
          >
            Salvar alterações
          </button>
          <button
            type="button"
            className="btn btn-secondary w-100 mb-3"
            onClick={() => navigate('/perfil', { state: { voltarPara } })}
          >
            Voltar
          </button>
        </form>

        <hr />

        <button
          className="btn btn-outline-danger w-100 mt-2"
          onClick={() => setShowModal(true)}
        >
          Excluir Conta
        </button>

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
                        <input
                          type={mostrarSenhaExcluir ? 'text' : 'password'}
                          className="form-control"
                          value={senhaExcluir}
                          onChange={(e) => setSenhaExcluir(e.target.value)}
                          placeholder="Senha"
                        />
                        <button
                          type="button"
                          className="position-absolute top-50 end-0 translate-middle-y me-2"
                          onClick={() => setMostrarSenhaExcluir((prev) => !prev)}
                          style={{
                            backgroundColor: 'transparent',
                            border: 'none',
                            padding: 0,
                            cursor: 'pointer',
                          }}
                        >
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
>>>>>>> 3070575fbc6b1b90eb7bf2ecb90263fde89b0681
        )}
      </div>
    </div>
  );
}
