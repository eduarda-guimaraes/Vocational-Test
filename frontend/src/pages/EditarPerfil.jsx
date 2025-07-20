import React, { useState } from 'react';
import { auth, db, provider } from '../services/firebase';
import {
  updateProfile,
  updateEmail,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
  deleteUser,
  reauthenticateWithPopup,
} from 'firebase/auth';
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

  const handleSalvar = async (e) => {
    e.preventDefault();
    setErro('');
    setMensagem('');

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
      }

      setMensagem('Dados atualizados com sucesso!');
      setTimeout(() => navigate('/perfil', { state: { voltarPara } }), 1500);
    } catch (error) {
      console.error(error);
      setErro('Erro ao atualizar dados. Verifique sua senha ou tente novamente.');
    }
  };

  const confirmarExclusao = async () => {
    setErroExcluir('');

    try {
      if (user.providerData[0]?.providerId === 'password') {
        const credential = EmailAuthProvider.credential(user.email, senhaExcluir);
        await reauthenticateWithCredential(user, credential);
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

  return (
    <div className="container d-flex justify-content-center align-items-center py-5">
      <div className="card p-4 shadow-sm" style={{ maxWidth: '450px', width: '100%' }}>
        <h4 className="mb-4 text-center">Editar Perfil</h4>

        <div className="text-center mb-3">
          <img
            src={fotoPreview}
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

        <div className="mb-3">
          <input type="file" className="form-control" accept="image/*" onChange={handleFotoChange} />
        </div>

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
        )}
      </div>
    </div>
  );
}
