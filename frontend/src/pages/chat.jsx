import React, { useState, useEffect, useRef } from 'react';
import Header from '../components/header';
import '../styles/global.css';
import '../styles/form.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import { auth, db } from '../services/firebase';
import {
  collection, addDoc, serverTimestamp, query, where,
  getDocs, orderBy, deleteDoc, doc, updateDoc, getDoc, limit
} from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { Link, useSearchParams } from 'react-router-dom';

const HEADER_H = 72;
const GAP_Y = 16;
const FOOTER_H = 80;
const ASIDE_W = 250;
const ASIDE_PAD = 20;
const ASIDE_TOTAL = ASIDE_W + ASIDE_PAD * 2;

const QUESTIONARIO = [
  { etapa: 'ETAPA 1 – AUTOCONHECIMENTO', objetivo: 'Entender o perfil pessoal, interesses e habilidades naturais.', perguntas: [
    'Quais são as atividades que você mais gosta de fazer no seu dia a dia?',
    'Quais matérias ou disciplinas você mais gosta (ou gostava) na escola?',
    'Você prefere trabalhar mais com pessoas, com ideias ou com objetos/máquinas?',
    'Você gosta de resolver problemas, criar coisas novas ou seguir instruções bem definidas?',
    'Prefere ambientes mais tranquilos e organizados ou agitados e desafiadores?',
    'O que você faz quando tem tempo livre? Há alguma atividade que você faz sem perceber o tempo passar?'
  ]},
  { etapa: 'ETAPA 2 – VALORES PESSOAIS E PROPÓSITO', objetivo: 'Identificar motivações internas e fatores que influenciam escolhas.', perguntas: [
    'O que é mais importante para você em uma carreira? (Ex: estabilidade, propósito, status, ajudar os outros, ganhar bem, viajar, liberdade, etc.)',
    'Você se imagina trabalhando em um escritório, ao ar livre, com o público, ou em laboratórios/ambientes técnicos?',
    'Você prefere uma rotina fixa ou ter tarefas e horários mais flexíveis?',
    'Você gostaria de trabalhar sozinho ou em equipe?'
  ]},
  { etapa: 'ETAPA 3 – OBJETIVOS E EXPECTATIVAS DE VIDA', objetivo: 'Entender metas e estilo de vida desejado.', perguntas: [
    'Você pretende fazer uma faculdade? Um curso técnico? Empreender?',
    'Está disposto(a) a fazer um curso longo ou prefere formações mais curtas e práticas?',
    'Você se imagina em cargos de liderança ou prefere colaborar em funções mais técnicas?'
  ]},
  { etapa: 'ETAPA 4 – LIMITAÇÕES E REALIDADES', objetivo: 'Ajustar expectativas com a realidade e contexto atual.', perguntas: [
    'Já trabalha ou pretende trabalhar enquanto estuda?',
    'Quais carreiras você já considerou ou descartou? Por quê?'
  ]},
];

function Chat() {
  // Mensagens e UI
  const [messages, setMessages] = useState([
    { sender: 'bot', text: 'Olá! Antes de usar a IA, vamos passar por um questionário rápido para entender melhor seu perfil. Tudo bem?' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  // Auth/Chat
  const [chatId, setChatId] = useState(null);
  const [userId, setUserId] = useState(null);
  const [userPhoto, setUserPhoto] = useState('/iconevazio.png');
  const [isUserLoggedIn, setIsUserLoggedIn] = useState(true);
  const [historicoChats, setHistoricoChats] = useState([]);
  const [searchParams] = useSearchParams();

  // Fluxo do questionário/IA
  const [modo, setModo] = useState('questionario');
  const [etapaIndex, setEtapaIndex] = useState(0);
  const [perguntaIndex, setPerguntaIndex] = useState(0);
  const [respostas, setRespostas] = useState([]);
  const [isTestEnded, setIsTestEnded] = useState(false);
  const [respostasAnterioresIA, setRespostasAnterioresIA] = useState([]);
  const textareaRef = useRef(null);
  const [textareaHeight, setTextareaHeight] = useState(50);
  const [confirmDelete, setConfirmDelete] = useState({ open: false, chatId: null, title: '' });
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth < 992 : false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 992);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  const toggleSidebar = () => setSidebarOpen(v => !v);
  const chatBoxHeight = isMobile ? '56vh' : '62vh';
  const backendUrl = import.meta.env.VITE_API_URL;

  const formatarDataCurta = (date) => {
    try {
      return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }).format(date);
    } catch { return ''; }
  };

  const tituloDoChat = (c) => {
    if (c?.titulo) return c.titulo;
    const criado = c?.criado_em?.toDate ? c.criado_em.toDate() : null;
    return criado ? `Chat ${formatarDataCurta(criado)}` : `Chat ${c.id?.slice(0, 5)}`;
  };

  const salvarMensagem = async (tipo, conteudo) => {
    try {
      if (!chatId) return;
      await addDoc(collection(db, 'chats', chatId, 'mensagens'), { tipo, conteudo, timestamp: serverTimestamp() });
    } catch (e) { console.error('Falha ao salvar mensagem:', e); }
  };

  const salvarRespostaQuestionario = async ({ etapa, pergunta, resposta }) => {
    try {
      if (!chatId) return;
      await addDoc(collection(db, 'chats', chatId, 'respostas'), { etapa, pergunta, resposta, timestamp: serverTimestamp() });
    } catch (e) { console.error('Falha ao salvar resposta do questionário:', e); }
  };

  const excluirChat = async (id) => {
    try {
      await deleteDoc(doc(db, 'chats', id));
      setHistoricoChats(prev => prev.filter(c => c.id !== id));
      if (chatId === id) setChatId(null);
    } catch (error) { console.error('Erro ao excluir chat:', error); }
  };

  // 🧹 Limpeza programada de chats vazios com > 30 min
  const cleanUpEmptyOldChats = async (uid) => {
    try {
      if (!uid) return;
      const cutoffMs = Date.now() - 30 * 60 * 1000; // 30 min

      const q = query(collection(db, 'chats'), where('usuario_id', '==', uid));
      const snap = await getDocs(q);

      for (const chatDoc of snap.docs) {
        // não apagar o chat aberto
        if (chatDoc.id === chatId) continue;

        const data = chatDoc.data();
        const criado = data?.criado_em?.toDate ? data.criado_em.toDate() : null;
        if (!criado || criado.getTime() > cutoffMs) continue; // ainda recente

        // checa se não há mensagens
        const msgsSnap = await getDocs(query(collection(db, 'chats', chatDoc.id, 'mensagens'), limit(1)));
        if (msgsSnap.empty) {
          await excluirChat(chatDoc.id);
        }
      }
    } catch (err) {
      console.error('Erro na limpeza programada:', err);
    }
  };

  useEffect(() => {
    if (!userId) return;
    cleanUpEmptyOldChats(userId); // roda 1x ao montar / mudar userId
    const int = setInterval(() => cleanUpEmptyOldChats(userId), 10 * 60 * 1000); // a cada 10 min
    return () => clearInterval(int);
  }, [userId]); // eslint-disable-line

  const openDeleteModal = (id, title) => setConfirmDelete({ open: true, chatId: id, title });
  const closeDeleteModal = () => setConfirmDelete({ open: false, chatId: null, title: '' });
  const confirmDeleteChat = async () => { if (!confirmDelete.chatId) return; await excluirChat(confirmDelete.chatId); closeDeleteModal(); };

  const setBloqueioChat = async (id, bloquear) => {
    try {
      const ref = doc(db, 'chats', id);
      await updateDoc(ref, { bloqueado: bloquear, bloqueado_em: bloquear ? serverTimestamp() : null });
      if (id === chatId) setIsTestEnded(bloquear);
      setHistoricoChats(prev => prev.map(c => (c.id === id ? { ...c, bloqueado: bloquear } : c)));
    } catch (e) { console.error('Erro ao atualizar bloqueio do chat:', e); }
  };

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') closeDeleteModal(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const scrollToBottom = () => {
    setTimeout(() => {
      const chatContainer = document.getElementById('chatContainer');
      if (chatContainer) chatContainer.scrollTop = chatContainer.scrollHeight;
    }, 80);
  };
  const enqueueBot = async (text) => { setMessages(prev => [...prev, { sender: 'bot', text }]); await salvarMensagem('resposta', text); scrollToBottom(); };
  const enqueueUser = async (text) => { setMessages(prev => [...prev, { sender: 'user', text }]); await salvarMensagem('pergunta', text); scrollToBottom(); };

  const calcularProgresso = (qtdRespostas) => {
    let restante = qtdRespostas;
    for (let i = 0; i < QUESTIONARIO.length; i++) {
      const n = QUESTIONARIO[i].perguntas.length;
      if (restante < n) return { modo: 'questionario', etapaIndex: i, perguntaIndex: restante };
      restante -= n;
    }
    return { modo: 'ia', etapaIndex: QUESTIONARIO.length - 1, perguntaIndex: QUESTIONARIO[QUESTIONARIO.length - 1].perguntas.length - 1 };
  };

  const proximaPergunta = async () => {
    const etapa = QUESTIONARIO[etapaIndex];
    const proxPergIndex = perguntaIndex + 1;

    if (proxPergIndex < etapa.perguntas.length) {
      setPerguntaIndex(proxPergIndex);
      await enqueueBot(etapa.perguntas[proxPergIndex]);
      return;
    }
    const proxEtapaIndex = etapaIndex + 1;
    if (proxEtapaIndex < QUESTIONARIO.length) {
      setEtapaIndex(proxEtapaIndex);
      setPerguntaIndex(0);
      const nova = QUESTIONARIO[proxEtapaIndex];
      await enqueueBot(`${nova.etapa}\n${nova.objetivo}\n\n${nova.perguntas[0]}`);
      return;
    }
    await finalizarQuestionario();
  };

  const finalizarQuestionario = async () => {
    setLoading(true);
    await enqueueBot('Espere uns minutos, a análise está sendo feita...');
    try {
      const resp = await fetch(`${backendUrl}/api/analise-perfil`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, respostas })
      });
      const data = await resp.json();
      await enqueueBot(`ETAPA 5 – SUGESTÕES E ANÁLISE DO PERFIL\n\n${data?.analise || 'Análise indisponível no momento.'}`);
      await salvarMensagem('resumo_final', data?.analise || 'Análise indisponível no momento.');
      setModo('ia');
      await enqueueBot('Agora você pode conversar livremente comigo. Para encerrar, digite "encerrar teste".');
    } catch (e) {
      console.error('Erro ao gerar análise:', e);
      await enqueueBot('Houve um erro ao gerar sua análise. Tente novamente em alguns instantes.');
    } finally { setLoading(false); }
  };

  // Auth + histórico
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setIsUserLoggedIn(false); setUserId(null); setChatId(null);
        return;
      }
      setIsUserLoggedIn(true); setUserId(user.uid); setUserPhoto(user.photoURL || '/iconevazio.png');
      try {
        const q = query(collection(db, 'chats'), where('usuario_id', '==', user.uid));
        const querySnapshot = await getDocs(q);
        const lista = [];
        for (const docSnap of querySnapshot.docs) {
          const dados = { id: docSnap.id, ...docSnap.data() };
          // ⚠️ NÃO apagar chats vazios aqui!
          const msgsSnap = await getDocs(query(collection(db, 'chats', docSnap.id, 'mensagens'), limit(1)));
          const _empty = msgsSnap.empty;
          lista.push({ ...dados, _empty });
        }
        // ordena por criado_em desc
        lista.sort((a, b) => {
          const da = a?.criado_em?.toDate ? a.criado_em.toDate().getTime() : 0;
          const db_ = b?.criado_em?.toDate ? b.criado_em.toDate().getTime() : 0;
          return db_ - da;
        });
        setHistoricoChats(lista);

        // abre por query param ?id= se existir
        const urlId = searchParams.get('id');
        if (urlId && lista.some(c => c.id === urlId)) {
          await carregarChat(urlId);
          return;
        }

        if (lista.length === 0) {
          await criarNovoChat(user.uid);
        } else if (!chatId) {
          await carregarChat(lista[0].id);
        }
      } catch (error) { console.error('Erro ao buscar chats:', error); }
    });
    return () => unsubscribe();
  }, []); // eslint-disable-line

  // ✅ Criar novo chat SEM race condition: persistir msgs com chatRef.id
  const criarNovoChat = async (uid = userId) => {
    try {
      const agora = new Date();
      const tituloPadrao = `Chat ${formatarDataCurta(agora)}`;
      const chatRef = await addDoc(collection(db, 'chats'), {
        usuario_id: uid, criado_em: serverTimestamp(), titulo: tituloPadrao, bloqueado: false, bloqueado_em: null
      });

      // Persistir as 2 primeiras mensagens USANDO chatRef.id (não depende de chatId do estado)
      const welcome = 'Olá! Antes de usar a IA, vamos passar por um questionário rápido para entender melhor seu perfil. Tudo bem?';
      const primeira = QUESTIONARIO[0];
      const primeiraPerg = `${primeira.etapa}\n${primeira.objetivo}\n\n${primeira.perguntas[0]}`;

      await addDoc(collection(db, 'chats', chatRef.id, 'mensagens'), { tipo: 'resposta', conteudo: welcome, timestamp: serverTimestamp() });
      await addDoc(collection(db, 'chats', chatRef.id, 'mensagens'), { tipo: 'resposta', conteudo: primeiraPerg, timestamp: serverTimestamp() });

      // Atualiza estado
      setChatId(chatRef.id);
      setMessages([{ sender: 'bot', text: welcome }, { sender: 'bot', text: primeiraPerg }]);
      setModo('questionario'); setEtapaIndex(0); setPerguntaIndex(0);
      setRespostas([]); setIsTestEnded(false);

      setHistoricoChats(prev => [
        { id: chatRef.id, usuario_id: uid, titulo: tituloPadrao, criado_em: { toDate: () => agora }, bloqueado: false, _empty: false },
        ...prev
      ]);
    } catch (error) { console.error('Erro ao criar chat:', error); }
  };

  // ✅ NUNCA apagar ao abrir; se estiver vazio, apenas mostrar vazio
  const carregarChat = async (id) => {
    setChatId(id);
    try {
      const chatDoc = await getDoc(doc(db, 'chats', id));
      const chatData = chatDoc.exists() ? chatDoc.data() : {};
      const bloqueado = !!chatData.bloqueado;
      setIsTestEnded(bloqueado);

      const msgsSnap = await getDocs(query(collection(db, 'chats', id, 'mensagens'), orderBy('timestamp', 'asc')));
      if (msgsSnap.empty) {
        setMessages([]); // não deletar
        setModo('questionario'); setEtapaIndex(0); setPerguntaIndex(0);
        setRespostas([]);
        return;
      }

      const mensagens = msgsSnap.docs.map((d) => {
        const data = d.data();
        return { sender: data.tipo === 'pergunta' ? 'user' : 'bot', text: data.conteudo };
      });
      setMessages(mensagens);

      const respSnap = await getDocs(query(collection(db, 'chats', id, 'respostas'), orderBy('timestamp', 'asc')));
      const respostasDocs = respSnap.docs.map(d => d.data());
      setRespostas(respostasDocs);

      const prog = calcularProgresso(respostasDocs.length);
      setModo(prog.modo); setEtapaIndex(prog.etapaIndex); setPerguntaIndex(prog.perguntaIndex);

      if (!bloqueado && prog.modo === 'questionario') {
        const etapa = QUESTIONARIO[prog.etapaIndex];
        const perguntaAtual = etapa.perguntas[prog.perguntaIndex];
        const last = mensagens[mensagens.length - 1];
        if (!last || last.sender === 'user') {
          await enqueueBot(prog.perguntaIndex === 0 ? `${etapa.etapa}\n${etapa.objetivo}\n\n${perguntaAtual}` : perguntaAtual);
        }
      }
    } catch (e) { console.error('Erro ao carregar chat:', e); }
  };

  const carregarChatMobile = async (id) => { await carregarChat(id); if (isMobile) setSidebarOpen(false); };

  const enviarParaIA = async (mensagem) => {
    try {
      const response = await fetch(`${backendUrl}/api/chat-vocacional`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mensagem, respostas_anteriores: respostasAnterioresIA, chat_id: chatId })
      });
      return await response.json();
    } catch (error) { console.error('Erro ao enviar para IA:', error); return { resposta: 'Houve um erro ao se conectar com a IA.', pergunta_aleatoria: null }; }
  };

  const handleSend = async () => {
    if (!input.trim() || !chatId || !isUserLoggedIn || isTestEnded) return;
    const texto = input.trim();
    await enqueueUser(texto);
    setInput('');

    if (modo === 'questionario') {
      const etapaAtual = QUESTIONARIO[etapaIndex];
      const perguntaAtual = etapaAtual.perguntas[perguntaIndex];
      const registro = { etapa: etapaAtual.etapa, pergunta: perguntaAtual, resposta: texto };
      setRespostas(prev => [...prev, registro]);
      await salvarRespostaQuestionario(registro);
      await proximaPergunta();
      return;
    }

    if (texto.toLowerCase() === 'encerrar teste') {
      await enqueueBot('Teste encerrado! Obrigado por participar. Você pode visualizar os resultados agora.');
      await setBloqueioChat(chatId, true);
      return;
    }

    setLoading(true);
    const data = await enviarParaIA(texto);
    setLoading(false);
    setRespostasAnterioresIA(prev => [...prev, texto].slice(-10));

    if (data?.finalizado) {
      await enqueueBot(data.resposta || 'Teste encerrado. Obrigado por participar!');
      await setBloqueioChat(chatId, true);
      return;
    }
    await enqueueBot(data?.resposta || 'Não consegui entender, pode reformular?');
  };

  const handleKeyPress = (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } };
  const handleInput = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const next = Math.min(textareaRef.current.scrollHeight, 160);
      setTextareaHeight(Math.max(next, 50));
    }
  };

  const totalPerguntas = QUESTIONARIO.reduce((acc, cur) => acc + cur.perguntas.length, 0);
  const respondidas = respostas.length;
  const emQuestionario = (modo === 'questionario');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Header />

      <main
        style={{
          flex: 1,
          display: 'flex',
          marginLeft: isMobile ? 0 : `${ASIDE_TOTAL + 10}px`,
          paddingTop: `${GAP_Y}px`,
          paddingBottom: `${GAP_Y}px`
        }}
      >
        <aside
          style={{
            width: isMobile ? '85vw' : '250px',
            maxWidth: isMobile ? 340 : 'auto',
            backgroundColor: '#f5f5f5',
            borderRight: isMobile ? 'none' : '1px solid #ddd',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            position: 'fixed',
            left: isMobile ? (sidebarOpen ? 0 : '-110%') : 0,
            top: isMobile ? GAP_Y : `${HEADER_H + GAP_Y}px`,
            bottom: isMobile ? GAP_Y : `${FOOTER_H + GAP_Y}px`,
            borderRadius: isMobile ? '12px' : '0 12px 12px 0',
            boxShadow: isMobile ? '0 8px 28px rgba(0,0,0,.25)' : '2px 0 6px rgba(0,0,0,0.08)',
            overflowY: 'auto',
            transition: 'left .25s ease',
            zIndex: 1085
          }}
        >
          {isMobile && (
            <div
              className="d-flex align-items-center justify-content-start mb-2"
              style={{ position: 'sticky', top: 0, background: '#f5f5f5', zIndex: 2, paddingBottom: '8px' }}
            >
              <button className="btn btn-outline-secondary btn-sm rounded-pill" onClick={toggleSidebar} aria-label="Voltar">
                <i className="bi bi-arrow-left me-1"></i> Voltar
              </button>
            </div>
          )}

          <h6 className="fw-bold mb-3">Meus Chats</h6>

          {isUserLoggedIn ? (
            <>
              {historicoChats.map((c) => (
                <div key={c.id} className="d-flex align-items-center">
                  <button
                    className={`chat-btn ${c.id === chatId ? 'active' : ''}`}
                    onClick={() => carregarChatMobile(c.id)}
                    title={tituloDoChat(c)}
                    style={{ flex: 1 }}
                  >
                    {tituloDoChat(c)} {c._empty && <span className="badge bg-secondary ms-2">vazio</span>}
                  </button>

                  <div className="d-flex align-items-center gap-2" style={{ marginLeft: '8px' }}>
                    <button
                      className={`btn btn-sm ${c.bloqueado ? 'btn-outline-secondary' : 'btn-outline-warning'}`}
                      onClick={() => setBloqueioChat(c.id, !c.bloqueado)}
                      title={c.bloqueado ? 'Destrancar chat' : 'Trancar chat'}
                    >
                      <i className={`bi ${c.bloqueado ? 'bi-unlock' : 'bi-lock'}`}></i>
                    </button>

                    <button
                      className="btn btn-sm btn-danger"
                      onClick={() => openDeleteModal(c.id, tituloDoChat(c))}
                      title="Excluir chat"
                    >
                      <i className="bi bi-trash"></i>
                    </button>
                  </div>
                </div>
              ))}

              <button className="chat-btn novo" onClick={() => criarNovoChat()}>
                + Novo Chat
              </button>
            </>
          ) : (
            <>
              <div className="text-muted small">Entre para ver seus chats.</div>
              <button className="chat-btn novo disabled w-100" disabled>+ Novo Chat</button>
            </>
          )}
        </aside>

        {isMobile && sidebarOpen && (
          <div className="drawer-backdrop" onClick={toggleSidebar} aria-hidden="true" style={{ zIndex: 1080 }} />
        )}

        <div
          className="container py-4 flex-grow-1 chat-container"
          style={{ paddingTop: '0px', minHeight: `calc(100vh - ${HEADER_H}px)`, display: 'flex', flexDirection: 'column' }}
        >
          {isMobile && (
            <div className="mobile-toolbar d-flex align-items-center gap-2 mb-3" style={{ marginTop: '12px' }}>
              <button className="btn btn-outline-primary rounded-pill btn-sm mobile-chats-btn" onClick={toggleSidebar} aria-label="Abrir lista de chats">
                <i className="bi bi-list me-1"></i> Chats
              </button>
            </div>
          )}

          {!isUserLoggedIn && (
            <div className="alert alert-warning rounded-4 shadow-sm d-flex flex-column align-items-center text-center">
              <div className="mb-2">Atenção: Você precisa estar logado para iniciar o teste vocacional.</div>
              <Link to="/login" className="btn btn-primary rounded-pill px-4">Fazer login</Link>
            </div>
          )}

          <div
            className="alert text-center rounded-4 shadow-sm p-4"
            style={{ backgroundColor: '#e3f2fd', color: '#0d47a1', marginTop: '8px', marginBottom: '12px' }}
          >
            <h5 className="mb-2 fw-bold">Como funciona o teste vocacional?</h5>
            <p className="mb-0">
              {modo === 'questionario' ? (
                <>Primeiro, você responde um questionário estruturado. Em seguida, a IA analisa seu perfil e oferece sugestões de carreiras.<br /><strong>Progresso:</strong> {respostas.length}/{QUESTIONARIO.reduce((a, c) => a + c.perguntas.length, 0)}</>
              ) : (
                <>Converse com nosso assistente sobre seus interesses. A inteligência artificial analisará suas respostas e recomendará áreas profissionais ideais para você.<br /><strong>Dica:</strong> você pode digitar <strong>"encerrar teste"</strong> a qualquer momento para terminar e ver o resultado.</>
              )}
            </p>
          </div>

          <div
            className="chat-box p-3"
            style={{
              backgroundColor: '#f9f9f9', borderRadius: '15px',
              flex: '0 0 auto', height: chatBoxHeight, maxHeight: chatBoxHeight,
              overflowY: 'auto', overflowX: 'hidden', scrollBehavior: 'smooth',
              display: 'flex', flexDirection: 'column'
            }}
            id="chatContainer"
          >
            {messages.map((msg, index) => (
              <div key={index} className={`d-flex mb-4 ${msg.sender === 'user' ? 'flex-row-reverse text-end' : 'flex-row text-start'}`}>
                <div className="d-flex align-items-start justify-content-center"
                  style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#e0e0e0', margin: '0 10px', overflow: 'hidden' }}>
                  <img src={msg.sender === 'user' ? userPhoto : '/logo.png'} alt={msg.sender === 'user' ? 'Você' : 'Bot'}
                    onError={(e) => { e.currentTarget.src = '/iconevazio.png'; }}
                    style={{ width: '30px', height: '30px', borderRadius: '50%', objectFit: 'cover', margin: 'auto' }} />
                </div>
                <div style={{ backgroundColor: msg.sender === 'user' ? '#bbdefb' : '#cfd8dc', whiteSpace: 'pre-wrap', padding: '15px', borderRadius: '20px', maxWidth: '75%', boxShadow: '0px 2px 4px rgba(0,0,0,0.1)', fontStyle: 'italic' }}>
                  {msg.text}
                </div>
              </div>
            ))}
          </div>

          {isTestEnded && (
            <div className="alert alert-success mt-3">
              <strong>Chat trancado!</strong> Este teste foi encerrado. (Use o botão ao lado do chat na lista para destrancar, se precisar.)
            </div>
          )}

          <div className="d-flex mt-3">
            <textarea
              ref={textareaRef}
              className="form-control rounded-pill px-4 text-start"
              placeholder={modo === 'questionario' ? 'Responda à pergunta...' : 'Digite algo...'}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyPress}
              onInput={handleInput}
              disabled={!chatId || loading || !isUserLoggedIn || isTestEnded}
              rows={1}
              style={{ border: '1px solid #ccc', marginRight: '10px', resize: 'none', minHeight: '50px', height: `${textareaHeight}px`, paddingTop: '10px', paddingBottom: '10px', paddingLeft: '12px' }}
            />
            <button className="btn btn-primary rounded-pill px-4" onClick={handleSend} disabled={!chatId || loading || !isUserLoggedIn || isTestEnded}>
              {loading ? 'Enviando...' : 'Enviar'}
            </button>
          </div>
        </div>
      </main>

      {/* MODAL */}
      {confirmDelete.open && (
        <div className="vt-modal-backdrop" style={{ zIndex: 3000 }} onClick={closeDeleteModal} role="presentation" aria-hidden="true">
          <div className="vt-modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <div className="vt-modal-header d-flex align-items-center justify-content-between">
              <span className="d-flex align-items-center gap-2"><i className="bi bi-exclamation-triangle-fill"></i> Confirmar exclusão</span>
              <button className="btn btn-sm btn-link text-white" onClick={closeDeleteModal} aria-label="Fechar"><i className="bi bi-x-lg"></i></button>
            </div>
            <div className="vt-modal-body">
              <p className="mb-1">Tem certeza que deseja excluir <strong>{confirmDelete.title}</strong>?</p>
              <small className="opacity-75">Esta ação <u>não pode</u> ser desfeita.</small>
            </div>
            <div className="vt-modal-footer d-flex justify-content-end gap-2">
              <button className="btn btn-outline-light rounded-pill px-4" onClick={closeDeleteModal}>Cancelar</button>
              <button className="btn btn-danger rounded-pill px-4" onClick={confirmDeleteChat}><i className="bi bi-trash me-1"></i> Excluir definitivamente</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Chat;
