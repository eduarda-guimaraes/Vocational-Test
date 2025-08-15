// src/pages/chat.jsx
import React, { useState, useEffect } from 'react';
import Header from '../components/header';
import '../styles/global.css';
import '../styles/form.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';

import { auth, db } from '../services/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { Link } from 'react-router-dom';

const QUESTIONARIO = [
  {
    etapa: 'ETAPA 1 – AUTOCONHECIMENTO',
    objetivo: 'Entender o perfil pessoal, interesses e habilidades naturais.',
    perguntas: [
      'Quais são as atividades que você mais gosta de fazer no seu dia a dia?',
      'Quais matérias ou disciplinas você mais gosta (ou gostava) na escola?',
      'Você prefere trabalhar mais com pessoas, com ideias ou com objetos/máquinas?',
      'Você gosta de resolver problemas, criar coisas novas ou seguir instruções bem definidas?',
      'Prefere ambientes mais tranquilos e organizados ou agitados e desafiadores?',
      'O que você faz quando tem tempo livre? Há alguma atividade que você faz sem perceber o tempo passar?'
    ]
  },
  {
    etapa: 'ETAPA 2 – VALORES PESSOAIS E PROPÓSITO',
    objetivo: 'Identificar motivações internas e fatores que influenciam escolhas.',
    perguntas: [
      'O que é mais importante para você em uma carreira? (Ex: estabilidade, propósito, status, ajudar os outros, ganhar bem, viajar, liberdade, etc.)',
      'Você se imagina trabalhando em um escritório, ao ar livre, com o público, ou em laboratórios/ambientes técnicos?',
      'Você prefere uma rotina fixa ou ter tarefas e horários mais flexíveis?',
      'Você gostaria de trabalhar sozinho ou em equipe?'
    ]
  },
  {
    etapa: 'ETAPA 3 – OBJETIVOS E EXPECTATIVAS DE VIDA',
    objetivo: 'Entender metas e estilo de vida desejado.',
    perguntas: [
      'Você pretende fazer uma faculdade? Um curso técnico? Empreender?',
      'Está disposto(a) a fazer um curso longo ou prefere formações mais curtas e práticas?',
      'Você se imagina em cargos de liderança ou prefere colaborar em funções mais técnicas?'
    ]
  },
  {
    etapa: 'ETAPA 4 – LIMITAÇÕES E REALIDADES',
    objetivo: 'Ajustar expectativas com a realidade e contexto atual.',
    perguntas: [
      'Já trabalha ou pretende trabalhar enquanto estuda?',
      'Quais carreiras você já considerou ou descartou? Por quê?'
    ]
  }
];

function Chat() {
  const [messages, setMessages] = useState([
    {
      sender: 'bot',
      text: 'Olá! Antes de usar a IA, vamos passar por um questionário rápido para entender melhor seu perfil. Tudo bem?'
    }
  ]);
  const [input, setInput] = useState('');
  const [chatId, setChatId] = useState(null);
  const [userId, setUserId] = useState(null);
  const [userPhoto, setUserPhoto] = useState('/iconevazio.png');
  const [loading, setLoading] = useState(false);

  // Estado do fluxo
  const [modo, setModo] = useState('questionario'); // 'questionario' | 'ia'
  const [etapaIndex, setEtapaIndex] = useState(0);
  const [perguntaIndex, setPerguntaIndex] = useState(0);
  const [respostas, setRespostas] = useState([]); // [{ etapa, pergunta, resposta }]

  const backendUrl = import.meta.env.VITE_API_URL;

  // Autenticação e criação do chat
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {

      setUserId(user.uid);
      setUserPhoto(user.photoURL || '/iconevazio.png');

      if (!chatId) {
        try {
          const chatRef = await addDoc(collection(db, 'chats'), {
            usuario_id: user.uid,
            criado_em: serverTimestamp()
          });
          setChatId(chatRef.id);

          // Mensagem inicial do questionário
          const primeira = QUESTIONARIO[0];
          enqueueBot(`${primeira.etapa}\n${primeira.objetivo}\n\n${primeira.perguntas[0]}`);
        } catch (error) {
          console.error('Erro ao criar chat no Firestore:', error);
          alert('Erro ao iniciar o chat. Tente novamente.');
        }
      }
    });

    return () => unsubscribe();
  }, [chatId]);

  const scrollToBottom = () => {
    setTimeout(() => {
      const chatContainer = document.getElementById('chatContainer');
      if (chatContainer) chatContainer.scrollTop = chatContainer.scrollHeight;
    }, 80);
  };

  const enqueueBot = (text) => {
    setMessages((prev) => [...prev, { sender: 'bot', text }]);
    scrollToBottom();
  };

  const enqueueUser = (text) => {
    setMessages((prev) => [...prev, { sender: 'user', text }]);
    scrollToBottom();
  };

  const proximaPergunta = () => {
    const etapa = QUESTIONARIO[etapaIndex];
    const proxPergIndex = perguntaIndex + 1;

    if (proxPergIndex < etapa.perguntas.length) {
      setPerguntaIndex(proxPergIndex);
      enqueueBot(etapa.perguntas[proxPergIndex]);
      return;
    }

    // Avança etapa
    const proxEtapaIndex = etapaIndex + 1;
    if (proxEtapaIndex < QUESTIONARIO.length) {
      setEtapaIndex(proxEtapaIndex);
      setPerguntaIndex(0);
      const nova = QUESTIONARIO[proxEtapaIndex];
      enqueueBot(`${nova.etapa}\n${nova.objetivo}\n\n${nova.perguntas[0]}`);
      return;
    }

    // Finalizou questionário → chama análise
    finalizarQuestionario();
  };

  const finalizarQuestionario = async () => {
    setLoading(true);
    try {
      const resp = await fetch(`${backendUrl}/api/analise-perfil`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          respostas // array de { etapa, pergunta, resposta }
        })
      });

      const data = await resp.json();

      enqueueBot(
        `ETAPA 5 – SUGESTÕES E ANÁLISE DO PERFIL\n\n${data?.analise || 'Análise indisponível no momento.'}`
      );

      // Entra em modo IA livre
      setModo('ia');
      enqueueBot(
        'Agora você pode continuar conversando livremente comigo. Se quiser encerrar, digite "encerrar teste".'
      );
    } catch (e) {
      console.error('Erro ao gerar análise:', e);
      enqueueBot('Houve um erro ao gerar sua análise. Tente novamente em alguns instantes.');
    } finally {
      setLoading(false);
    }
  };

  const enviarParaIA = async (mensagem) => {
    try {
      const response = await fetch(`${backendUrl}/api/chat-vocacional`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mensagem,
          respostas_anteriores: [],
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
    if (!input.trim() || !chatId) return;

    const texto = input.trim();
    enqueueUser(texto);
    setInput('');

    if (modo === 'questionario') {
      const etapaAtual = QUESTIONARIO[etapaIndex];
      const perguntaAtual = etapaAtual.perguntas[perguntaIndex];

      setRespostas((prev) => [
        ...prev,
        {
          etapa: etapaAtual.etapa,
          pergunta: perguntaAtual,
          resposta: texto
        }
      ]);

      proximaPergunta();
      return;
    }

    // Modo IA livre
    setLoading(true);
    const data = await enviarParaIA(texto);
    setLoading(false);

    const respostaIA = data.resposta || 'Não consegui entender, pode reformular?';
    enqueueBot(respostaIA);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') handleSend();
  };

  // Progresso do questionário
  const totalPerguntas = QUESTIONARIO.reduce((acc, cur) => acc + cur.perguntas.length, 0);
  const respondidas = respostas.length;
  const emQuestionario = (modo === 'questionario');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Header />

      <main style={{ flex: 1, minHeight: 'calc(100vh - 90px)' }}>
        <div className="container py-4" style={{ paddingTop: '30px' }}>
          <div className="alert text-center rounded-4 shadow-sm p-4" style={{ backgroundColor: '#e3f2fd', color: '#0d47a1' }}>
            <h5 className="mb-2 fw-bold">Como funciona o teste vocacional?</h5>
            <p className="mb-0">
              Primeiro, você responde um questionário estruturado. Em seguida, a IA analisa seu perfil e oferece sugestões de carreiras.
              {emQuestionario ? (
                <>
                  <br />
                  <strong>Progresso:</strong> {respondidas}/{totalPerguntas}
                </>
              ) : (
                <>
                  <br />
                  <strong>Dica:</strong> você pode digitar <strong>"encerrar teste"</strong> para terminar quando quiser.
                </>
              )}
            </p>
          </div>

          {/* Aviso e CTA quando não está logado */}
          {!userId && (
            <div className="alert alert-warning rounded-4 shadow-sm d-flex flex-column align-items-center text-center">
              <div className="mb-2">⚠️ Você precisa estar logado para iniciar o teste vocacional.</div>
              <div className="d-flex gap-2">
                <Link to="/login" className="btn btn-outline-secondary rounded-pill px-4">Ir para o perfil</Link>
              </div>
            </div>
          )}

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
                    whiteSpace: 'pre-wrap',
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
              placeholder={emQuestionario ? 'Responda à pergunta...' : 'Digite algo...'}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyPress}
              disabled={!chatId || loading}
              style={{
                height: '50px',
                border: '1px solid #ccc',
                marginRight: '10px'
              }}
            />
            <button
              className="btn btn-primary rounded-pill px-4"
              onClick={handleSend}
              disabled={!chatId || loading}
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
