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
  serverTimestamp
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
  const [userPhoto, setUserPhoto] = useState('/iconevazio.png');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        console.warn('Usuário não autenticado.');
        return;
      }

      setUserId(user.uid);
      setUserPhoto(user.photoURL || '/iconevazio.png');

      try {
        const chatRef = await addDoc(collection(db, 'chats'), {
          usuario_id: user.uid,
          criado_em: serverTimestamp(),
        });

        setChatId(chatRef.id);
      } catch (error) {
        console.error('Erro ao criar chat no Firestore:', error);
        alert('Erro ao iniciar o chat. Tente novamente.');
      }
    });

    return () => unsubscribe();
  }, []);

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

  const salvarMensagem = async (autor, conteudo) => {
    if (!chatId || !userId) return;

    try {
      const mensagensRef = collection(db, 'chats', chatId, 'mensagens');
      await addDoc(mensagensRef, {
        autor,
        conteudo,
        criada_em: serverTimestamp(),
      });
    } catch (error) {
      console.error('Erro ao salvar mensagem:', error);
      alert('Erro ao salvar mensagem. Verifique sua conexão.');
    }
  };

  const salvarResultado = async (texto) => {
    if (!userId) return;

    try {
      await addDoc(collection(db, 'historico'), {
        uid: userId,
        resultado: texto,
        criadoEm: serverTimestamp(),
      });
      console.log('Resultado salvo:', texto);
    } catch (error) {
      console.error('Erro ao salvar no histórico:', error);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || !chatId) return;

    const userMessage = { sender: 'user', text: input };
    setMessages((prev) => {
      const newMessages = [...prev, userMessage];
      setTimeout(() => {
        const chatContainer = document.getElementById('chatContainer');
        if (chatContainer) {
          chatContainer.scrollTop = chatContainer.scrollHeight;
        }
      }, 100);
      return newMessages;
    });
    await salvarMensagem('user', input);

    const respostaIA = await enviarParaIA(input);
    const botMessage = { sender: 'bot', text: respostaIA };
    setMessages((prev) => {
      const newMessages = [...prev, botMessage];
      setTimeout(() => {
        const chatContainer = document.getElementById('chatContainer');
        if (chatContainer) {
          chatContainer.scrollTop = chatContainer.scrollHeight;
        }
      }, 100);
      return newMessages;
    });
    await salvarMensagem('bot', respostaIA);

    await salvarResultado(respostaIA);

    setInput('');
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') handleSend();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Header />

      <main style={{ flex: 1, minHeight: 'calc(100vh - 90px)' }}>
        <div className="container py-4" style={{ paddingTop: '30px' }}>
          {/* MENSAGEM EXPLICATIVA */}
          <div className="alert text-center rounded-4 shadow-sm p-4" style={{ backgroundColor: '#e3f2fd', color: '#0d47a1' }}>
            <h5 className="mb-2 fw-bold">Como funciona o teste vocacional?</h5>
            <p className="mb-0">
              Converse com nosso assistente sobre seus interesses. A inteligência artificial analisará suas respostas e recomendará áreas profissionais ideais para você.
            </p>
          </div>

          {/* ÁREA DO CHAT */}
          <div
            className="chat-box p-3 mt-4"
            style={{
              backgroundColor: '#f9f9f9',
              borderRadius: '15px',
              maxHeight: '65vh',
              overflowY: 'auto',
              scrollBehavior: 'smooth',
              display: 'flex',
              flexDirection: 'column'
            }}
            id="chatContainer"
          >
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
                    margin: '0 10px',
                    overflow: 'hidden'
                  }}
                >
                  <img
                    src={msg.sender === 'user' ? userPhoto : '/logo.png'}
                    alt={msg.sender === 'user' ? 'Você' : 'Bot'}
                    style={{
                      width: '30px',
                      height: '30px',
                      borderRadius: '50%',
                      objectFit: 'cover',
                      margin: 'auto'
                    }}
                  />
                </div>
                <div
                  style={{
                    backgroundColor: msg.sender === 'user' ? '#bbdefb' : '#cfd8dc',
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

          {/* INPUT DE MENSAGEM */}
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
              className="btn btn-primary rounded-pill px-4"
              onClick={handleSend}
              disabled={!chatId}
            >
              Enviar
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

export default Chat;
