import React, { useEffect, useState } from 'react';
import { auth, db } from '../services/firebase';
import {
  updateProfile,
  updateEmail,
  updatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential,
  sendEmailVerification,
} from 'firebase/auth';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';

export default function EditarPerfil() {
  const user = auth.currentUser;
  const navigate = useNavigate();

  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarNovaSenha, setConfirmarNovaSenha] = useState('');
  const [senhaAtual, setSenhaAtual] = useState('');
  const [erro, setErro] = useState('');
  const [mensagem, setMensagem] = useState('');

  useEffect(() => {
    const carregarDados = async () => {
      if (user) {
        const docRef = doc(db, 'usuarios', user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const dados = docSnap.data();
          setNome(dados.nome || user.displayName || '');
          setEmail(user.email || '');
        }
      }
    };
    carregarDados();
  }, [user]);

  const senhaEhForte = (senha) =>
    /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{6,}$/.test(senha);

  const handleSalvar = async (e) => {
    e.preventDefault();
    setErro('');
    setMensagem('');

    const temSenhaDefinida = user.providerData.some(p => p.providerId === 'password');
    const temNovaSenha = novaSenha.trim() !== '';

    if (temNovaSenha) {
      if (novaSenha !== confirmarNovaSenha) {
        return setErro('As senhas não coincidem.');
      }
      if (!senhaEhForte(novaSenha)) {
        return setErro('A nova senha deve ter no mínimo 6 caracteres, com letra, número e caractere especial.');
      }
    }

    try {
      // Atualiza nome
      if (nome !== user.displayName) {
        await updateProfile(user, { displayName: nome });
        await updateDoc(doc(db, 'usuarios', user.uid), { nome });
      }

      // Atualiza senha
      if (temNovaSenha) {
        if (temSenhaDefinida) {
          if (!senhaAtual) return setErro('Informe sua senha atual para alterar a senha.');
          const cred = EmailAuthProvider.credential(user.email, senhaAtual);
          await reauthenticateWithCredential(user, cred);
        }
        await updatePassword(user, novaSenha);
        setMensagem((prev) => prev + 'Senha atualizada com sucesso. ');
      }

      // Atualiza email
      if (email !== user.email) {
        if (!senhaAtual && temSenhaDefinida) {
          return setErro('Informe sua senha atual para alterar o e-mail.');
        }

        if (temSenhaDefinida) {
          const cred = EmailAuthProvider.credential(user.email, senhaAtual);
          await reauthenticateWithCredential(user, cred);
        }

        await updateEmail(user, email);
        await sendEmailVerification(user);

        await updateDoc(doc(db, 'usuarios', user.uid), {
          email,
          emailVerificado: false,
        });

        setMensagem((prev) => prev + 'E-mail atualizado. Verifique sua nova caixa de entrada.');
      }

      setTimeout(() => navigate('/perfil'), 2000);
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
      if (error.code === 'auth/wrong-password') {
        setErro('Senha atual incorreta.');
      } else if (error.code === 'auth/email-already-in-use') {
        setErro('Este e-mail já está em uso por outro usuário.');
      } else if (error.code === 'auth/invalid-email') {
        setErro('E-mail inválido.');
      } else if (error.code === 'auth/requires-recent-login') {
        setErro('Reautenticação necessária. Faça login novamente.');
      } else if (error.code === 'auth/operation-not-allowed') {
        setErro('Operação não permitida. Defina uma senha antes de alterar o e-mail.');
      } else {
        setErro('Erro inesperado: ' + error.message);
      }
    }
  };

  return (
    <div className="container d-flex justify-content-center align-items-center vh-100">
      <div className="card p-4 shadow-sm" style={{ maxWidth: '500px', width: '100%' }}>
        <h4 className="mb-4 text-center">Editar Perfil</h4>
        <form onSubmit={handleSalvar}>
          <div className="mb-3">
            <input
              type="text"
              className="form-control"
              placeholder="Nome"
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

          <hr />

          <div className="mb-3">
            <input
              type="password"
              className="form-control"
              placeholder="Senha atual (se necessário)"
              value={senhaAtual}
              onChange={(e) => setSenhaAtual(e.target.value)}
            />
          </div>

          <div className="mb-3">
            <input
              type="password"
              className="form-control"
              placeholder="Nova senha (opcional)"
              value={novaSenha}
              onChange={(e) => setNovaSenha(e.target.value)}
            />
          </div>

          <div className="mb-3">
            <input
              type="password"
              className="form-control"
              placeholder="Confirmar nova senha"
              value={confirmarNovaSenha}
              onChange={(e) => setConfirmarNovaSenha(e.target.value)}
            />
          </div>

          {erro && <p className="text-danger text-center">{erro}</p>}
          {mensagem && <p className="text-success text-center">{mensagem}</p>}

          <button
            type="submit"
            className="btn w-100 mb-2"
            style={{ backgroundColor: '#447EB8', color: '#fff' }}
          >
            Salvar alterações
          </button>
          <button
            type="button"
            onClick={() => navigate('/perfil')}
            className="btn btn-outline-secondary w-100"
          >
            Cancelar e voltar
          </button>
        </form>
      </div>
    </div>
  );
}
