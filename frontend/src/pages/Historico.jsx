import React, { useEffect, useState } from 'react';
import { auth, db } from '../services/firebase';
import { collection, getDocs, orderBy, query, where } from 'firebase/firestore';
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
        const q = query(
          collection(db, 'historico'),
          where('uid', '==', user.uid),
          orderBy('criadoEm', 'desc')
        );

        const snapshot = await getDocs(q);
        const lista = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        setItens(lista);
      } catch (error) {
        console.error('Erro ao buscar histórico:', error);
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
            {itens.map((item, i) => (
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
                <p className="mb-1" style={{ fontWeight: '500', color: '#447EB8' }}>
                  Resultado:
                </p>
                <p style={{ whiteSpace: 'pre-wrap', color: '#333' }}>{item.resultado}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

export default Historico;
