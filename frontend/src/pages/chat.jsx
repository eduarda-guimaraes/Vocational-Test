import React, { useState, useEffect, useRef } from 'react';
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
  const [loading, setLoading] = useState(false);
  const [respostasAnteriores, setRespostasAnteriores] = useState([]);
  const [isUserLoggedIn, setIsUserLoggedIn] = useState(true); // Verificação de conta

  const textareaRef = useRef(null);
  const [textareaHeight, setTextareaHeight] = useState(50); // Define altura inicial do textarea

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setIsUserLoggedIn(false); // Usuário não está logado
        return;
      }

      setUserId(user.uid);
      setUserPhoto(user.photoURL || '/iconevazio.png');

      if (!chatId) {
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
      }
      setIsUserLoggedIn(true); 
    });

    return () => unsubscribe();
  }, [chatId]);

  const enviarParaIA = async (mensagem) => {
    const backendUrl = import.meta.env.VITE_API_URL;

    try {
      const response = await fetch(`${backendUrl}/api/chat-vocacional`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mensagem,
          respostas_anteriores: respostasAnteriores,
          chat_id: chatId
        })
      });

      return await response.json();
    } catch (error) {
      console.error('Erro ao enviar para IA:', error);
      return {
        resposta: 'Houve um erro ao se conectar com a IA.',
        pergunta_aleatoria: null
      };
    }
  };

  const handleSend = async () => {
    if (!input.trim() || !chatId || !isUserLoggedIn) return;

    const userMessage = { sender: 'user', text: input };
    setMessages((prev) => [...prev, userMessage]);
    setRespostasAnteriores((prev) => [...prev, input]);
    setInput('');
    setLoading(true);

    const data = await enviarParaIA(input);
    setLoading(false);

    const respostaIA = data.resposta || 'Não consegui entender, pode reformular?';
    const botMessage = { sender: 'bot', text: respostaIA };
    setMessages((prev) => [...prev, botMessage]);

    if (data.pergunta_aleatoria === null) {
      console.log('Teste encerrado. Resultado salvo pelo backend.');
    }

    // Scroll automático
    setTimeout(() => {
      const chatContainer = document.getElementById('chatContainer');
      if (chatContainer) {
        chatContainer.scrollTop = chatContainer.scrollHeight;
      }
    }, 100);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      handleSend();
    }
  };

  const handleInput = () => {
    // Ajusta a altura do textarea uma única vez
    if (textareaRef.current && textareaHeight === 50) { 
      setTextareaHeight(textareaRef.current.scrollHeight);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Header />

      <main style={{ flex: 1, minHeight: 'calc(100vh - 90px)' }}>
        <div className="container py-4" style={{ paddingTop: '30px' }}>
          {isUserLoggedIn ? null : (
            <div className="alert alert-warning text-center">
              <strong>Atenção!</strong> Você precisa estar logado para utilizar o chat.
            </div>
          )}

          <div className="alert text-center rounded-4 shadow-sm p-4" style={{ backgroundColor: '#e3f2fd', color: '#0d47a1' }}>
            <h5 className="mb-2 fw-bold">Como funciona o teste vocacional?</h5>
            <p className="mb-0">
              Converse com nosso assistente sobre seus interesses. A inteligência artificial analisará suas respostas
              e recomendará áreas profissionais ideais para você.<br />
              <strong>Dica:</strong> você pode digitar <strong>"encerrar teste"</strong> a qualquer momento para terminar e ver o resultado.
            </p>
          </div>

          <div
            className="chat-box p-3 mt-4"
            style={{
              backgroundColor: '#f9f9f9',
              borderRadius: '15px',
              maxHeight: '65vh',
              overflowY: 'auto',
              scrollBehavior: 'smooth',
              display: 'flex',
              flexDirection: 'column',
              paddingRight: '1000px',
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
                    onError={(e) => { e.target.src = '/iconevazio.png'; }}
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

          <div className="d-flex mt-4">
            <textarea
              ref={textareaRef}
              className="form-control rounded-pill px-4 text-start"
              placeholder="Digite algo..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyPress}
              onInput={handleInput} 
              disabled={!chatId || loading || !isUserLoggedIn}
              rows="1" 
              style={{
                border: '1px solid #ccc',
                marginRight: '10px',
                resize: 'none', 
                minHeight: '50px',  
                height: `${textareaHeight}px`,
                paddingTop: '10px',
                paddingBottom: '10px',
                paddingLeft: '12px', 
              }}
            />
            <button
              className="btn btn-primary rounded-pill px-4"
              onClick={handleSend}
              disabled={!chatId || loading || !isUserLoggedIn}
            >
              {loading ? 'Enviando...' : 'Enviar'}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

export default Chat;
