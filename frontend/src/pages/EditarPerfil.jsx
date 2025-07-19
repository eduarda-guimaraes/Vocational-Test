import React, { useState, useEffect } from 'react';
import { auth, db } from '../services/firebase';
import {
  updateProfile,
  updateEmail,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
  deleteUser,
  fetchSignInMethodsForEmail
} from 'firebase/auth';
import { doc, deleteDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';

export default function EditarPerfil() {
  const user = auth.currentUser;
  const [nome, setNome] = useState(user?.displayName || '');
  const [email, setEmail] = useState(user?.email || '');
  const [senhaAtual, setSenhaAtual] = useState('');
  const [senhaNova, setSenhaNova] = useState('');
  const [erro, setErro] = useState('');
  const [mensagem, setMensagem] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [senhaExcluir, setSenhaExcluir] = useState('');
  const [temSenha, setTemSenha] = useState(false);
  const [erroExclusao, setErroExclusao] = useState('');
  const navigate = useNavigate();

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
      }

      setMensagem('Dados atualizados com sucesso!');
      setTimeout(() => navigate('/perfil'), 1500);
    } catch (error) {
      console.error(error);
      // Mensagens específicas para cada erro
      if (error.code === 'auth/wrong-password') {
        setErro('Senha atual incorreta.');
      } else if (error.code === 'auth/requires-recent-login') {
        setErro('Por segurança, faça login novamente para atualizar.');
      } else if (error.code === 'auth/email-already-in-use') {
        setErro('Este email já está em uso.');
      } else {
        setErro('Erro ao atualizar dados.');
      }
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
    <div className="container d-flex justify-content-center align-items-center vh-100">
      <div className="card p-4 shadow-sm" style={{ maxWidth: '450px', width: '100%' }}>
        <h4 className="mb-4 text-center">Editar Perfil</h4>

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
        )}
      </div>
    </div>
  );
}
