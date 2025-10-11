import React, { useEffect, useState } from 'react';
import {
  updateProfile,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
  deleteUser,
  reauthenticateWithPopup
} from 'firebase/auth';
import { auth, db, provider } from '../services/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { useNavigate, useLocation } from 'react-router-dom';

export default function EditarPerfil() {
  const navigate = useNavigate();
  const location = useLocation();
  const voltarPara = location.state?.voltarPara || 'perfil';

  const user = auth.currentUser;

  const [nome, setNome] = useState(user?.displayName || '');
  const [dataNascimento, setDataNascimento] = useState('');
  const [fotoPreview, setFotoPreview] = useState(user?.photoURL || '/iconevazio.png');
  const [novaFotoFile, setNovaFotoFile] = useState(null);

  const [novaSenha, setNovaSenha] = useState('');
  const [senhaAtual, setSenhaAtual] = useState('');

  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [mostrarSenhaAtual, setMostrarSenhaAtual] = useState(false);

  const [showModalExcluir, setShowModalExcluir] = useState(false);
  const [senhaExcluir, setSenhaExcluir] = useState('');
  const [mostrarSenhaExcluir, setMostrarSenhaExcluir] = useState(false);

  const [mensagem, setMensagem] = useState('');
  const [erro, setErro] = useState('');
  const [erroExcluir, setErroExcluir] = useState('');
  const [salvando, setSalvando] = useState(false);

  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

  // Conta com provedor 'password'?
  const ehContaComSenha = (auth.currentUser?.providerData || []).some(p => p.providerId === 'password');

  useEffect(() => {
    const carregarFirestore = async () => {
      try {
        const u = auth.currentUser;
        if (!u) return;
        const ref = doc(db, 'usuarios', u.uid);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          const dados = snap.data();
          if (!nome && (u.displayName || dados.nome)) {
            setNome(u.displayName || dados.nome || '');
          }
          if (dados.dataNascimento) {
            setDataNascimento(dados.dataNascimento);
          }
          if (!u.photoURL && dados.fotoPerfil) {
            setFotoPreview(dados.fotoPerfil);
          }
        }
      } catch (e) {
        console.error('Falha ao buscar Firestore:', e);
      }
    };
    carregarFirestore();
  }, []);

  // ====== Helpers ======
  const senhaEhForte = (valor) =>
    !valor || /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{6,}$/.test(valor);

  const dataValida = (valor) => {
    if (!valor) return true;
    const hoje = new Date().toISOString().slice(0, 10);
    return valor <= hoje;
  };

  // ====== Cloudinary upload ======
  const uploadParaCloudinary = async (file) => {
    if (!file) throw new Error('Nenhum arquivo selecionado.');
    if (!cloudName || !uploadPreset) {
      throw new Error('Cloudinary não configurado. Verifique VITE_CLOUDINARY_CLOUD_NAME e VITE_CLOUDINARY_UPLOAD_PRESET.');
    }
    if (!file.type?.startsWith('image/')) {
      throw new Error('Selecione um arquivo de imagem válido.');
    }
    const LIMITE_MB = 5;
    if (file.size > LIMITE_MB * 1024 * 1024) {
      throw new Error(`Imagem muito grande. Máximo ${LIMITE_MB}MB.`);
    }

    const form = new FormData();
    form.append('file', file);
    form.append('upload_preset', uploadPreset);

    const resp = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: 'POST',
      body: form
    });

    if (!resp.ok) {
      let detalhe = '';
      try {
        const txt = await resp.text();
        detalhe = txt?.slice(0, 400);
      } catch {}
      throw new Error(`Falha no upload Cloudinary (HTTP ${resp.status}). ${detalhe}`);
    }

    const data = await resp.json();
    if (!data?.secure_url) {
      throw new Error('Resposta do Cloudinary sem secure_url.');
    }
    return data.secure_url;
  };

  // ====== Manipulação de imagem ======
  const handleFotoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setErro('Selecione um arquivo de imagem válido.');
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => setFotoPreview(reader.result);
    reader.readAsDataURL(file);
    setNovaFotoFile(file);
  };

  // ====== Utilitário de mensagem de erro amigável ======
  const mapearMensagemErro = (error) => {
    const code = error?.code || '';
    const raw = error?.message || '';
    if (code.startsWith('auth/')) {
      switch (code) {
        case 'auth/requires-recent-login':
          return `Você precisa entrar novamente para concluir esta ação. [${code}] ${raw}`;
        case 'auth/invalid-credential':
          return `Senha atual incorreta ou credenciais inválidas. [${code}] ${raw}`;
        case 'auth/missing-password':
          return `Informe sua senha atual. [${code}] ${raw}`;
        default:
          return `Erro de autenticação. [${code}] ${raw}`;
      }
    }
    if (raw.includes('No document to update') || raw.includes('NOT_FOUND')) {
      return `Seu perfil ainda não existia no banco. Criamos/atualizamos automaticamente. [${code || 'firestore/not-found'}] ${raw}`;
    }
    return `Ocorreu um erro. [${code || 'desconhecido'}] ${raw}`;
  };

  // ====== Salvar ======
  const handleSalvar = async (e) => {
    e.preventDefault();
    if (salvando) return;
    setMensagem('');
    setErro('');
    setSalvando(true);

    try {
      const u = auth.currentUser;
      if (!u) throw new Error('auth/user-not-logged: Usuário não autenticado.');

      const nomeNovo = (nome || '').trim();

      // Validações de formulário
      if (!dataValida(dataNascimento)) {
        throw new Error('Data de nascimento inválida (não pode ser futura).');
      }
      if (!senhaEhForte(novaSenha)) {
        throw new Error('A nova senha (se informada) deve ter 6+ caracteres com letras, números e símbolo.');
      }

      // >>> REAUTENTICAÇÃO ANTES DE QUALQUER AÇÃO <<<
      if (ehContaComSenha) {
        if (!senhaAtual) {
          // interrompe aqui — nada é salvo
          const err = new Error('Senha atual é obrigatória para salvar.');
          err.code = 'auth/missing-password';
          throw err;
        }
        try {
          const cred = EmailAuthProvider.credential(u.email, senhaAtual);
          await reauthenticateWithCredential(u, cred);
        } catch (reauthErr) {
          // interrompe aqui — nada é salvo
          throw reauthErr;
        }
      }

      // A partir daqui a senha atual está validada (para contas com senha)

      // Upload de foto (se nova)
      let fotoURL = u.photoURL || null;
      if (novaFotoFile) {
        fotoURL = await uploadParaCloudinary(novaFotoFile);
      }

      // Atualiza displayName e photoURL no Auth
      await updateProfile(u, { displayName: nomeNovo, photoURL: fotoURL });

      // Atualiza senha (se informada e conta com senha)
      if (novaSenha && ehContaComSenha) {
        await updatePassword(u, novaSenha);
      }

      // Upsert no Firestore
      const ref = doc(db, 'usuarios', u.uid);
      const dados = {
        nome: nomeNovo,
        fotoPerfil: fotoURL || null
      };
      if (dataNascimento) dados.dataNascimento = dataNascimento;

      await setDoc(ref, dados, { merge: true });

      setMensagem('Alterações salvas com sucesso!');
      setTimeout(() => navigate('/perfil', { state: { voltarPara } }), 300);
    } catch (error) {
      console.error('Erro ao salvar perfil:', error);
      setErro(mapearMensagemErro(error));
    } finally {
      setSalvando(false);
    }
  };

  // ====== Exclusão de conta ======
  const confirmarExclusao = async () => {
    setErroExcluir('');
    try {
      const u = auth.currentUser;
      if (!u) throw new Error('auth/user-not-logged: Usuário não autenticado.');

      const temPassword = (u.providerData || []).some(p => p.providerId === 'password');

      if (temPassword) {
        const cred = EmailAuthProvider.credential(u.email, senhaExcluir);
        await reauthenticateWithCredential(u, cred);
      } else {
        await reauthenticateWithPopup(u, provider);
      }

      await deleteUser(u);
      await auth.signOut();
      navigate('/');
    } catch (error) {
      setErroExcluir(mapearMensagemErro(error));
    }
  };

  return (
    <div className="container d-flex justify-content-center align-items-center py-5">
      <div className="card p-4 shadow-sm" style={{ maxWidth: '480px', width: '100%' }}>
        <h4 className="mb-4 text-center">Editar Perfil</h4>

        <div className="text-center mb-3">
          <img
            src={fotoPreview}
            alt="Foto de perfil"
            style={{ width: '100px', height: '100px', borderRadius: '50%', objectFit: 'cover', border: '3px solid #447eb8' }}
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
              required
            />
          </div>

          <div className="mb-3">
            <input
              type="date"
              className="form-control"
              value={dataNascimento}
              onChange={(e) => setDataNascimento(e.target.value)}
              placeholder="Data de Nascimento"
            />
          </div>

          {/* Senha atual — OBRIGATÓRIA para contas com senha */}
          {ehContaComSenha && (
            <div className="mb-3 position-relative">
              <input
                type={mostrarSenhaAtual ? 'text' : 'password'}
                className="form-control"
                value={senhaAtual}
                onChange={(e) => setSenhaAtual(e.target.value)}
                placeholder="Senha atual (obrigatória para salvar)"
              />
              <button
                type="button"
                className="position-absolute top-50 end-0 translate-middle-y me-2"
                onClick={() => setMostrarSenhaAtual(!mostrarSenhaAtual)}
                style={{ backgroundColor: 'transparent', border: 'none' }}
              >
                <i className={`bi ${mostrarSenhaAtual ? 'bi-eye' : 'bi-eye-slash'}`} style={{ color: '#447EB8' }}></i>
              </button>
            </div>
          )}

          {/* Nova senha (opcional) */}
          <div className="mb-3 position-relative">
            <input
              type={mostrarSenha ? 'text' : 'password'}
              className="form-control"
              value={novaSenha}
              onChange={(e) => setNovaSenha(e.target.value)}
              placeholder="Nova senha (opcional)"
            />
            <button
              type="button"
              className="position-absolute top-50 end-0 translate-middle-y me-2"
              onClick={() => setMostrarSenha(!mostrarSenha)}
              style={{ backgroundColor: 'transparent', border: 'none' }}
            >
              <i className={`bi ${mostrarSenha ? 'bi-eye' : 'bi-eye-slash'}`} style={{ color: '#447EB8' }}></i>
            </button>
          </div>

          {erro && <p className="text-danger" style={{ whiteSpace: 'pre-wrap' }}>{erro}</p>}
          {mensagem && <p className="text-success">{mensagem}</p>}

          <button
            type="submit"
            className="btn w-100 mb-2"
            style={{ backgroundColor: '#447EB8', color: '#fff' }}
            disabled={salvando}
          >
            {salvando ? 'Salvando...' : 'Salvar alterações'}
          </button>
          <button
            type="button"
            className="btn btn-secondary w-100 mb-3"
            onClick={() => navigate('/perfil', { state: { voltarPara } })}
            disabled={salvando}
          >
            Voltar
          </button>
        </form>

        <hr />

        <button className="btn btn-outline-danger w-100 mt-2" onClick={() => setShowModalExcluir(true)}>
          Excluir Conta
        </button>

        {showModalExcluir && (
          <div className="modal d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Confirmar Exclusão</h5>
                  <button type="button" className="btn-close" onClick={() => setShowModalExcluir(false)}></button>
                </div>
                <div className="modal-body">
                  {ehContaComSenha ? (
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
                          style={{ backgroundColor: 'transparent', border: 'none', padding: 0, cursor: 'pointer' }}
                        >
                          <i className={`bi ${mostrarSenhaExcluir ? 'bi-eye' : 'bi-eye-slash'}`} style={{ color: '#447EB8' }}></i>
                        </button>
                      </div>
                    </>
                  ) : (
                    <p>Você será reautenticado(a) com o Google antes de excluir sua conta.</p>
                  )}
                  {erroExcluir && <p className="text-danger mt-2" style={{ whiteSpace: 'pre-wrap' }}>{erroExcluir}</p>}
                </div>
                <div className="modal-footer">
                  <button className="btn btn-secondary" onClick={() => setShowModalExcluir(false)}>Cancelar</button>
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
