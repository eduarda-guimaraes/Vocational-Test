import React, { useState, useEffect } from 'react';
import Header from '../components/header';
import '../styles/global.css';
import '../styles/form.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import { db, auth } from '../services/firebase';
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
import { onAuthStateChanged } from 'firebase/auth';

import { auth, db } from '../services/firebase';
import {
  collection,
  addDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

function Chat() {
  const [chatId, setChatId] = useState(null);
  const [messages, setMessages] = useState([
    {
      sender: 'bot',
<<<<<<< HEAD
      text: 'Olá! Bem-vindo ao teste vocacional. Vou fazer algumas perguntas sobre seus interesses e habilidades e, no final, sugerir as áreas de carreira ideais para você. Vamos começar! Com o que você mais se identifica?'
=======
      text: 'Olá! Vamos começar seu teste vocacional. Me diga com o que você mais se identifica ou tem interesse profissional.'
>>>>>>> 3070575fbc6b1b90eb7bf2ecb90263fde89b0681
    }
  ]);
  const [input, setInput] = useState('');
  const [chatId, setChatId] = useState(null);
  const [userId, setUserId] = useState(null);

  // Verifica o usuário e cria o chat
  useEffect(() => {
<<<<<<< HEAD
    const unsubscribe = onAuthStateChanged(auth, user => {
      if (user) {
        const uid = user.uid;
        setChatId(uid);
        inicializarChatFirestore(uid);
      } else {
        console.log('Usuário não autenticado');
      }
    });
    return unsubscribe;
  }, []);

  const inicializarChatFirestore = async (uid) => {
    try {
      const chatRef = doc(db, 'chats', uid);
      const msgsRef = collection(chatRef, 'messages');
      const snapshot = await getDocs(query(msgsRef, orderBy('timestamp')));
      if (snapshot.empty) {
        // cria o documento de chat com o UID do usuário e salva a saudação
        await setDoc(chatRef, { userId: uid, createdAt: serverTimestamp() });
        await addDoc(msgsRef, {
          sender: 'bot',
          text: messages[0].text,
          timestamp: serverTimestamp()
        });
        setMessages([messages[0]]);
      } else {
        // carrega histórico existente
        const loaded = snapshot.docs.map(d => d.data());
        setMessages(loaded);
      }
    } catch (error) {
      console.error('Erro ao inicializar chat no Firestore:', error);
    }
  };

=======
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

        setChatId(chatRef.id);
      } catch (error) {
        console.error('Erro ao criar chat no Firestore:', error);
      }
    });

    return () => unsubscribe();
  }, []);

  // Envia mensagem para a IA
>>>>>>> 3070575fbc6b1b90eb7bf2ecb90263fde89b0681
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

<<<<<<< HEAD
  const salvarMensagemNoFirestore = async (msg) => {
    try {
      const chatRef = doc(db, 'chats', chatId);
      const msgsRef = collection(chatRef, 'messages');
      await addDoc(msgsRef, {
        sender: msg.sender,
        text: msg.text,
        timestamp: serverTimestamp()
=======
  // Salva mensagem no Firestore
  const salvarMensagem = async (autor, conteudo) => {
    if (!chatId || !userId) return;

    try {
      const mensagensRef = collection(db, 'chats', chatId, 'mensagens');
      await addDoc(mensagensRef, {
        autor,
        conteudo,
        criada_em: serverTimestamp(),
>>>>>>> 3070575fbc6b1b90eb7bf2ecb90263fde89b0681
      });
    } catch (error) {
      console.error('Erro ao salvar mensagem:', error);
    }
  };

<<<<<<< HEAD
=======
  // Salva resultado vocacional no Firestore
  const salvarResultado = async (areas) => {
    if (!chatId || !userId) return;

    try {
      const resultadosRef = collection(db, 'chats', chatId, 'resultados');
      await addDoc(resultadosRef, {
        areas,
        gerado_em: serverTimestamp(),
      });
    } catch (error) {
      console.error('Erro ao salvar resultado:', error);
    }
  };

  // Envia a mensagem e salva tudo
>>>>>>> 3070575fbc6b1b90eb7bf2ecb90263fde89b0681
  const handleSend = async () => {
    if (!input.trim()) return;
    const userMessage = { sender: 'user', text: input };
<<<<<<< HEAD
    setMessages(prev => [...prev, userMessage]);
    await salvarMensagemNoFirestore(userMessage);

    const respostaIA = await enviarParaIA(input);
    const botMessage = { sender: 'bot', text: respostaIA };
    setMessages(prev => [...prev, botMessage]);
    await salvarMensagemNoFirestore(botMessage);
=======
    setMessages((prev) => [...prev, userMessage]);
    await salvarMensagem('user', input);

    const respostaIA = await enviarParaIA(input);
    const botMessage = { sender: 'bot', text: respostaIA };
    setMessages((prev) => [...prev, botMessage]);
    await salvarMensagem('bot', respostaIA);

    if (respostaIA.toLowerCase().includes('suas áreas recomendadas são')) {
      await salvarResultado(respostaIA);
    }
>>>>>>> 3070575fbc6b1b90eb7bf2ecb90263fde89b0681

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
          <button className="btn-enviar btn btn-primary rounded-pill px-4" onClick={handleSend}>
            Enviar
          </button>
        </div>
      </div>
    </>
  );
}

export default Chat;
