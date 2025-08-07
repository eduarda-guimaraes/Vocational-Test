import React, { useState } from 'react';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../services/firebase';
import { useNavigate } from 'react-router-dom';

export default function RecuperarSenha() {
  const [email, setEmail] = useState('');
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');
  const navigate = useNavigate();

  const handleRecuperarSenha = async (e) => {
    e.preventDefault();
    setErro('');
    setSucesso('');

    try {
      // Configuração do redirecionamento personalizado após a redefinição
      const actionCodeSettings = {
        // URL personalizada para onde o usuário será redirecionado após a redefinição
        url: `${window.location.origin}/login`, 
        handleCodeInApp: true,  // Indica que o link será processado no seu app
      };

      // Envia o link de redefinição com a configuração personalizada
      await sendPasswordResetEmail(auth, email, actionCodeSettings);
      setSucesso('Link de recuperação enviado para o seu e-mail.');
      setTimeout(() => navigate('/login'), 5000);  // Redireciona para a página de login após 5 segundos
    } catch (err) {
      setErro('Erro ao enviar o link. Verifique o e-mail inserido.');
    }
  };

  return (
    <div className="container d-flex justify-content-center align-items-center vh-100">
      <div className="card p-4 shadow-sm" style={{ maxWidth: '400px', width: '100%' }}>
        <h2 className="mb-4 text-center" style={{ color: '#447EB8' }}>Recuperar Senha</h2>
        <form onSubmit={handleRecuperarSenha}>
          <div className="mb-3">
            <input
              type="email"
              className="form-control"
              placeholder="Digite seu e-mail"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          {erro && <p className="text-danger mb-3">{erro}</p>}
          {sucesso && <p className="text-success mb-3">{sucesso}</p>}
          <button
            type="submit"
            className="btn w-100 mb-3"
            style={{ backgroundColor: '#447EB8', color: '#fff' }}
          >
            Enviar
          </button>
        </form>
        <div className="text-center">
          <p>
            Lembrou sua senha?{' '}
            <a href="/login" className="btn btn-link p-0" style={{ color: '#447EB8' }}>
              Voltar para Login
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
