import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom'; // ✅ IMPORTANTE para navegação SPA
import { auth, db } from '../services/firebase';
import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
  limit
} from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import Header from '../components/header';
import '../styles/global.css';
import '../styles/form.css';
import 'bootstrap/dist/css/bootstrap.min.css';

function Historico() {
  const [itens, setItens] = useState([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    let unsubscribeAuth;

    const carregarHistorico = async (user) => {
      try {
        const chatsQuery = query(
          collection(db, 'chats'),
          where('usuario_id', '==', user.uid)
        );

        const chatsSnapshot = await getDocs(chatsQuery);
        const resultados = [];

        for (const chatDoc of chatsSnapshot.docs) {
          const respostasRef = collection(db, 'chats', chatDoc.id, 'respostas');
          const ultimaRespostaQuery = query(respostasRef, orderBy('criadoEm', 'desc'), limit(1));
          const ultimaRespostaSnap = await getDocs(ultimaRespostaQuery);

          ultimaRespostaSnap.forEach((doc) => {
            resultados.push({
              id: doc.id,
              ...doc.data()
            });
          });
        }

        setItens(resultados);
      } catch (error) {
        console.error('Erro ao buscar respostas:', error);
      } finally {
        setCarregando(false);
      }
    };

    unsubscribeAuth = onAuthStateChanged(auth, (user) => {
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
              maxHeight: '500px',
              overflowY: 'auto',
              borderRadius: '1rem',
              backgroundColor: '#f8f9fa',
              borderLeft: '6px solid #447EB8',
              border: 'none'
            }}
          >
            {itens.map((item, i) => {
              const dataFormatada = item.criadoEm?.toDate
                ? item.criadoEm.toDate().toLocaleString('pt-BR', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                : 'Data não disponível';

              return (
                <div
                  key={i}
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
                  <p className="mb-1 fw-bold" style={{ color: '#447EB8' }}>
                    Resultado:
                  </p>
                  <p className="mb-2" style={{ whiteSpace: 'pre-wrap', color: '#333' }}>
                    {item.resultado}
                  </p>
                  <p className="text-muted small mb-0">Criado em: {dataFormatada}</p>
                </div>
              );
            })}
          </div>
        )}

        {/* Botão Voltar */}
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
