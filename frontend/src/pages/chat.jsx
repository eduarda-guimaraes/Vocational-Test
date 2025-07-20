import React, { useState, useEffect } from 'react';
import Header from '../components/header';
import '../styles/global.css';
import '../styles/form.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';

import { auth, db } from '../services/firebase';
import {
  collection,
  addDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

function Chat() {
  const [messages, setMessages] = useState([
    {
      sender: 'bot',
      text: 'Olá! Vamos começar seu teste vocacional. Me diga com o que você mais se identifica ou tem interesse profissional.'
    }
  ]);
  const [input, setInput] = useState('');
  const [chatId, setChatId] = useState(null);
  const [userId, setUserId] = useState(null);

  // Verifica o usuário e cria o chat
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        console.warn('Usuário não autenticado.');
        return;
      }

      setUserId(user.uid);

      try {
        const chatRef = await addDoc(collection(db, 'chats'), {
          usuario_id: user.uid,
          criado_em: serverTimestamp(),
        });

        console.log('Chat criado com ID:', chatRef.id);
        setChatId(chatRef.id);
      } catch (error) {
        console.error('Erro ao criar chat no Firestore:', error);
        alert('Erro ao iniciar o chat. Tente novamente.');
      }
    });

    return () => unsubscribe();
  }, []);

  // Envia mensagem para a IA
  const enviarParaIA = async (mensagem) => {
    try {
      const response = await fetch('http://localhost:5000/api/chat-vocacional', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mensagem })
      });

      const data = await response.json();
      return data.resposta || 'Não consegui entender, pode reformular?';
    } catch (error) {
      console.error('Erro ao enviar para IA:', error);
      return 'Houve um erro ao se conectar com a IA.';
    }
  };

  // Salva mensagem no Firestore
  const salvarMensagem = async (autor, conteudo) => {
    if (!chatId || !userId) {
      console.warn('chatId ou userId não definidos.');
      return;
    }

    try {
      const mensagensRef = collection(db, 'chats', chatId, 'mensagens');
      await addDoc(mensagensRef, {
        autor,
        conteudo,
        criada_em: serverTimestamp(),
      });
      console.log('Mensagem salva:', autor, conteudo);
    } catch (error) {
      console.error('Erro ao salvar mensagem:', error);
      alert('Erro ao salvar mensagem. Verifique sua conexão.');
    }
  };

  // Salva resultado vocacional no Firestore
  const salvarResultado = async (areas) => {
    if (!chatId || !userId) return;

    try {
      const resultadosRef = collection(db, 'chats', chatId, 'resultados');
      await addDoc(resultadosRef, {
        areas,
        gerado_em: serverTimestamp(),
      });
      console.log('Resultado salvo:', areas);
    } catch (error) {
      console.error('Erro ao salvar resultado:', error);
    }
  };

  // Envia a mensagem e salva tudo
  const handleSend = async () => {
    if (!input.trim() || !chatId) return;

    const userMessage = { sender: 'user', text: input };
    setMessages((prev) => [...prev, userMessage]);
    await salvarMensagem('user', input);

    const respostaIA = await enviarParaIA(input);
    const botMessage = { sender: 'bot', text: respostaIA };
    setMessages((prev) => [...prev, botMessage]);
    await salvarMensagem('bot', respostaIA);

    if (respostaIA.toLowerCase().includes('suas áreas recomendadas são')) {
      await salvarResultado(respostaIA);
    }

    setInput('');
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') handleSend();
  };

  return (
    <>
      <Header />
      <div style={{ marginTop: '90px' }} />
      <div className="container mb-5">
        <div className="chat-box p-3" style={{ backgroundColor: '#f4f4f4', borderRadius: '15px' }}>
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`d-flex mb-4 ${msg.sender === 'user' ? 'flex-row-reverse text-end' : 'flex-row text-start'}`}
            >
              <div
                className="d-flex align-items-start justify-content-center"
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  backgroundColor: '#e0e0e0',
                  fontSize: '20px',
                  textAlign: 'center',
                  lineHeight: '40px',
                  margin: '0 10px'
                }}
              >
                <i className={`bi ${msg.sender === 'user' ? 'bi-person' : 'bi-emoji-smile'} mx-auto`}></i>
              </div>
              <div
                style={{
                  backgroundColor: msg.sender === 'user' ? '#d0d0d0' : '#ccc',
                  padding: '15px',
                  borderRadius: '20px',
                  maxWidth: '75%',
                  boxShadow: '0px 2px 4px rgba(0,0,0,0.1)',
                  fontStyle: 'italic'
                }}
              >
                {msg.text}
              </div>
            </div>
          ))}
        </div>

        <div className="d-flex mt-4">
          <input
            type="text"
            className="form-control rounded-pill px-4"
            placeholder="Digite algo..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyPress}
            disabled={!chatId}
            style={{
              height: '50px',
              border: '1px solid #ccc',
              marginRight: '10px'
            }}
          />
          <button
            className="btn-enviar btn btn-primary rounded-pill px-4"
            onClick={handleSend}
            disabled={!chatId}
          >
            Enviar
          </button>
        </div>
      </div>
    </>
  );
}

export default Chat;
