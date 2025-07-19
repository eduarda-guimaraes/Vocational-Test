import React, { useState } from 'react';
import { sendPasswordResetEmail, fetchSignInMethodsForEmail } from 'firebase/auth';
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
      const methods = await fetchSignInMethodsForEmail(auth, email);
      if (!methods.includes('password')) {
        setErro('Este e-mail não está associado a uma conta com senha.');
        return;
      }

      await sendPasswordResetEmail(auth, email);
      setSucesso('Link de recuperação enviado para o seu e-mail.');
      setTimeout(() => navigate('/login'), 5000);
    } catch (err) {
      console.error('Erro ao enviar link de recuperação:', err);
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
      </div>
    </div>
  );
}
