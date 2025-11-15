import React, { useState } from 'react';
import { auth } from '../services/firebase';
import { updatePassword } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';

export default function DefinirSenha() {
  const [senha, setSenha] = useState('');
  const [confirmSenha, setConfirmSenha] = useState('');
  const [erro, setErro] = useState('');
  const [mensagem, setMensagem] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [mostrarConfirmSenha, setMostrarConfirmSenha] = useState(false);
  const navigate = useNavigate();

  const senhaEhForte = (senha) =>
    /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{6,}$/.test(senha);

  const handleSalvarSenha = async (e) => {
    e.preventDefault();
    setErro('');
    setMensagem('');

    if (senha !== confirmSenha) {
      setErro('As senhas não coincidem.');
      return;
    }

    if (!senhaEhForte(senha)) {
      setErro('A senha deve ter no mínimo 6 caracteres, incluindo letras, números e um caractere especial.');
      return;
    }

    try {
      await updatePassword(auth.currentUser, senha);
      setMensagem('Senha definida com sucesso!');
      setTimeout(() => navigate('/chat'), 1500);
    } catch (error) {
      console.error('Erro ao definir senha:', error);
      setErro('Não foi possível definir a senha. Faça login novamente.');
    }
  };

  const pularEtapa = () => {
    navigate('/chat');
  };

  return (
    <div className="container d-flex justify-content-center align-items-center vh-100">
      <div className="card p-4 shadow-sm rounded-4" style={{ maxWidth: '400px', width: '100%' }}>
        <h4 className="mb-3 text-center">Deseja criar uma senha?</h4>
        <p className="text-center mb-4" style={{ fontSize: '0.9rem' }}>
          Isso é opcional. Com uma senha, você poderá acessar sua conta mesmo sem usar o Google.
        </p>

        <form onSubmit={handleSalvarSenha}>
          <div className="mb-3 position-relative">
            <input
              type={mostrarSenha ? 'text' : 'password'}
              className="form-control"
              placeholder="Nova senha"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              required
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

          <div className="mb-3 position-relative">
            <input
              type={mostrarConfirmSenha ? 'text' : 'password'}
              className="form-control"
              placeholder="Confirmar senha"
              value={confirmSenha}
              onChange={(e) => setConfirmSenha(e.target.value)}
              required
            />
            <button
              type="button"
              className="position-absolute top-50 end-0 translate-middle-y me-2"
              onClick={() => setMostrarConfirmSenha(!mostrarConfirmSenha)}
              style={{ backgroundColor: 'transparent', border: 'none' }}
            >
              <i className={`bi ${mostrarConfirmSenha ? 'bi-eye' : 'bi-eye-slash'}`} style={{ color: '#447EB8' }}></i>
            </button>
          </div>

          {erro && <p className="text-danger">{erro}</p>}
          {mensagem && <p className="text-success">{mensagem}</p>}

          <button
            type="submit"
            className="btn w-100 mb-2"
            style={{ backgroundColor: '#447EB8', color: '#fff' }}
          >
            Salvar senha
          </button>


          <button type="button" onClick={pularEtapa} className="btn btn-outline-secondary w-100">
            Pular por enquanto
          </button>
        </form>
      </div>
    </div>
  );
}
