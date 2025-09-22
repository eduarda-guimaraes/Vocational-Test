import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { auth, db } from '../services/firebase';
import {
  collection,
  getDocs,
  query,
  where,
  orderBy
} from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import Header from '../components/header';
import '../styles/global.css';
import '../styles/form.css';
import 'bootstrap/dist/css/bootstrap.min.css';

function Historico() {
  const [itens, setItens] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const navigate = useNavigate();

  const limitar = (texto = '', max = 180) =>
    texto.length > max ? texto.slice(0, max).trim() + '…' : texto;

  const formatarData = (ts) => {
    try {
      return ts?.toDate
        ? ts.toDate().toLocaleString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })
        : 'Data não disponível';
    } catch {
      return 'Data não disponível';
    }
  };

  useEffect(() => {
    const carregarHistorico = async (user) => {
      try {
        const chatsQuery = query(
          collection(db, 'chats'),
          where('usuario_id', '==', user.uid)
        );

        const chatsSnapshot = await getDocs(chatsQuery);
        const resultados = [];

        for (const chatDoc of chatsSnapshot.docs) {
          const chatId = chatDoc.id;
          const chatData = chatDoc.data() || {};
          const titulo = chatData.titulo || 'Chat';
          const criadoEm = chatData.criado_em;

          // Mensagens ordenadas (para formar prévia)
          const mensagensRef = collection(db, 'chats', chatId, 'mensagens');
          const mensagensSnap = await getDocs(query(mensagensRef, orderBy('timestamp', 'asc')));
          const mensagens = mensagensSnap.docs.map(d => d.data());

          // Encontrar último resumo_final (análise) se existir
          const resumos = mensagens
            .filter(m => m.tipo === 'resumo_final')
            .sort((a, b) => {
              const ta = a.timestamp?.toDate?.() || 0;
              const tb = b.timestamp?.toDate?.() || 0;
              return tb - ta;
            });

          const resumoAnalise = resumos[0]?.conteudo || null;

          // Prévia curta das últimas mensagens
          const ultimas = mensagens.slice(-6);
          const bolhas = ultimas.map(m => {
            if (m.tipo === 'pergunta') return `Você: ${m.conteudo}`;
            if (m.tipo === 'resposta' || m.tipo === 'resumo_final') return `IA: ${m.conteudo}`;
            return `${m.tipo || 'Msg'}: ${m.conteudo}`;
          });
          const previa = limitar(bolhas.slice(-3).join(' · '), 220);

          if (mensagens.length === 0) continue;

          resultados.push({
            chatId,
            titulo,
            criadoEm,
            resumoAnalise: resumoAnalise || 'Análise indisponível para este chat.',
            previa
          });
        }

        // Ordenar por data de criação (mais recente primeiro)
        resultados.sort((a, b) => {
          const da = a.criadoEm?.toDate ? a.criadoEm.toDate().getTime() : 0;
          const db_ = b.criadoEm?.toDate ? b.criadoEm.toDate().getTime() : 0;
          return db_ - da;
        });

        setItens(resultados);
      } catch (error) {
        console.error('Erro ao buscar histórico:', error);
      } finally {
        setCarregando(false);
      }
    };

    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        carregarHistorico(user);
      } else {
        setItens([]);
        setCarregando(false);
      }
    });

    return () => unsubscribeAuth?.();
  }, []);

  return (
    <>
      <Header />
      <div className="container mt-5 mb-5">
        <h3 className="mb-4 text-center fw-bold" style={{ color: '#447EB8' }}>
          Histórico de Testes Vocacionais
        </h3>

        {carregando ? (
          <p className="text-muted text-center">Carregando...</p>
        ) : itens.length === 0 ? (
          <p className="text-muted text-center">Nenhum teste realizado ainda.</p>
        ) : (
          <div
            className="p-3 shadow"
            style={{
              maxHeight: '540px',
              overflowY: 'auto',
              borderRadius: '1rem',
              backgroundColor: '#f8f9fa',
              borderLeft: '6px solid #447EB8',
              border: 'none'
            }}
          >
            {itens.map((item) => (
              <div
                key={item.chatId}
                className="mb-3 p-3"
                style={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #dee2e6',
                  borderRadius: '0.75rem',
                  boxShadow: '0 2px 6px rgba(0, 0, 0, 0.05)',
                  transition: 'transform 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-3px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'none';
                }}
              >
                <div className="d-flex justify-content-between align-items-start mb-2">
                  <div>
                    <h6 className="mb-1 fw-bold" style={{ color: '#0d47a1' }}>
                      {item.titulo}
                    </h6>
                    <small className="text-muted">Criado em: {formatarData(item.criadoEm)}</small>
                  </div>
                  <Link
                    to={`/chat?id=${encodeURIComponent(item.chatId)}`}
                    className="btn btn-primary btn-sm rounded-pill"
                    title="Abrir chat"
                  >
                    Abrir chat
                  </Link>
                </div>

                <p className="mb-1 fw-semibold" style={{ color: '#447EB8' }}>
                  Resumo Final:
                </p>
                <p className="mb-2" style={{ whiteSpace: 'pre-wrap', color: '#333' }}>
                  {item.resumoAnalise}
                </p>


                <div className="bg-light p-2 rounded" style={{ border: '1px dashed #cbd5e1' }}>
                  <p className="mb-1 small text-muted">Prévia do chat:</p>
                  <p className="mb-0" style={{ whiteSpace: 'pre-wrap' }}>
                    {item.previa || '—'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="text-center mt-4">
          <Link
            to="/perfil"
            className="btn"
            style={{
              backgroundColor: '#6c757d',
              color: 'white',
              padding: '12px 50px',
              borderRadius: '10px',
              fontWeight: '500',
              fontSize: '16px',
              textDecoration: 'none'
            }}
          >
            Voltar
          </Link>
        </div>
      </div>
    </>
  );
}

export default Historico;
