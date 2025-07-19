import React, { useState, useEffect } from 'react';
import Header from '../components/header';
import '../styles/global.css';
import '../styles/form.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import { db } from '../services/firebase';
import {
  doc,
  collection,
  setDoc,
  addDoc,
  getDocs,
  query,
  orderBy,
  serverTimestamp
} from 'firebase/firestore';

function Chat() {
  const [chatId, setChatId] = useState(null);
  const [messages, setMessages] = useState([
    {
      sender: 'bot',
      text: 'Olá! Bem-vindo ao teste vocacional. Vou fazer algumas perguntas sobre seus interesses e habilidades e, no final, sugerir as áreas de carreira ideais para você. Vamos começar! Com o que você mais se identifica?'
    }
  ]);
  const [input, setInput] = useState('');

  useEffect(() => {
    let id = localStorage.getItem('chatId');
    if (!id) {
      id = 'chat-' + Date.now();
      localStorage.setItem('chatId', id);
      criarChatNoFirestore(id);
    } else {
      carregarMensagensDoFirestore(id);
    }
    setChatId(id);
  }, []);

  // Cria o documento do chat e salva a mensagem inicial
  const criarChatNoFirestore = async (id) => {
    try {
      const chatRef = doc(db, 'chats', id);
      await setDoc(chatRef, { createdAt: serverTimestamp() });
      const msgsRef = collection(chatRef, 'messages');
      await addDoc(msgsRef, {
        sender: 'bot',
        text: messages[0].text,
        timestamp: serverTimestamp()
      });
    } catch (error) {
      console.error('Erro ao criar chat no Firestore:', error);
    }
  };

  // Recupera mensagens ordenadas por timestamp (sobrescreve o estado)
  const carregarMensagensDoFirestore = async (id) => {
    try {
      const msgsRef = collection(db, 'chats', id, 'messages');
      const q = query(msgsRef, orderBy('timestamp'));
      const snapshot = await getDocs(q);
      const loaded = snapshot.docs.map(doc => doc.data());
      // Se não houver mensagens, mantém a saudação inicial
      if (loaded.length > 0) setMessages(loaded);
    } catch (error) {
      console.error('Erro ao carregar mensagens:', error);
    }
  };

  const enviarParaIA = async (mensagem) => {
    try {
      const response = await fetch('http://localhost:5000/api/chat-vocacional', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mensagem, chat_id: chatId })
      });
      const data = await response.json();
      return data.resposta || 'Não consegui entender, pode reformular?';
    } catch (error) {
      console.error('Erro ao enviar para IA:', error);
      return 'Houve um erro ao se conectar com a IA.';
    }
  };

  const salvarMensagemNoFirestore = async (msg) => {
    try {
      const chatRef = doc(db, 'chats', chatId);
      const msgsRef = collection(chatRef, 'messages');
      await addDoc(msgsRef, {
        sender: msg.sender,
        text: msg.text,
        timestamp: serverTimestamp()
      });
    } catch (error) {
      console.error('Erro ao salvar mensagem:', error);
    }
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = { sender: 'user', text: input };
    setMessages(prev => [...prev, userMessage]);
    await salvarMensagemNoFirestore(userMessage);

    const respostaIA = await enviarParaIA(input);
    const botMessage = { sender: 'bot', text: respostaIA };
    setMessages(prev => [...prev, botMessage]);
    await salvarMensagemNoFirestore(botMessage);

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
            style={{
              height: '50px',
              border: '1px solid #ccc',
              marginRight: '10px'
            }}
          />
          <button
            className="btn-enviar btn btn-primary rounded-pill px-4"
            onClick={handleSend}>
            Enviar
          </button>
        </div>
      </div>
    </>
  );
}

export default Chat;
