import React, { useState, useEffect } from 'react';
import Header from '../components/header';
import '../styles/global.css';
import '../styles/form.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';

function Chat() {
  const [messages, setMessages] = useState([
    { sender: 'bot', text: 'Olá! Vamos começar seu teste vocacional. Qual área você mais se identifica?' }
  ]);
  const [input, setInput] = useState('');
  const [stage, setStage] = useState(0);
  const [respostas, setRespostas] = useState([]);

  // Limpar o histórico ao carregar a página
  useEffect(() => {
    localStorage.removeItem('historico');
  }, []);

  const perguntas = [
    'Você se considera mais analítico ou criativo?',
    'Prefere trabalhar em ambientes estruturados ou flexíveis?',
    'Você gosta mais de trabalhar com pessoas ou com dados?',
    'Você prefere liderança ou execução?',
  ];

  const resultados = {
    tecnologia: 'Você pode se dar bem com carreiras como Análise de Sistemas ou Engenharia de Software.',
    saude: 'Você pode gostar de áreas como Enfermagem, Medicina ou Psicologia.',
    humanas: 'Você pode se interessar por Comunicação, Psicologia ou Direito.',
    exatas: 'Você pode se identificar com Engenharia, Estatística ou Física.',
    indefinido: 'Ainda não foi possível determinar sua área ideal, mas continue explorando!',
  };

  const handleSend = () => {
    if (!input.trim()) return;
    const userMessage = { sender: 'user', text: input };
    setMessages((prev) => [...prev, userMessage]);

    const updatedRespostas = [...respostas, input];
    setRespostas(updatedRespostas);

    setInput('');

    setTimeout(() => {
      if (stage < perguntas.length) {
        setMessages((prev) => [...prev, { sender: 'bot', text: perguntas[stage] }]);
        setStage(stage + 1);
      } else {
        const resultadoFinal = determinarResultado(updatedRespostas);
        const mensagemFinal = resultados[resultadoFinal];

        // Salvar no localStorage
        const historicoAnterior = JSON.parse(localStorage.getItem('historico')) || [];
        const novoHistorico = [...historicoAnterior, { respostas: updatedRespostas, resultado: mensagemFinal }];
        localStorage.setItem('historico', JSON.stringify(novoHistorico));

        setMessages((prev) => [
          ...prev,
          { sender: 'bot', text: 'Obrigado por responder! Aqui está seu resultado:' },
          { sender: 'bot', text: mensagemFinal }
        ]);
      }
    }, 600);
  };

  const determinarResultado = (respostas) => {
    const joined = respostas.join(' ').toLowerCase();
    if (joined.includes('tecnologia')) return 'tecnologia';
    if (joined.includes('saúde') || joined.includes('medicina') || joined.includes('enfermagem')) return 'saude';
    if (joined.includes('pessoas') || joined.includes('comunicação')) return 'humanas';
    if (joined.includes('dados') || joined.includes('números')) return 'exatas';
    return 'indefinido';
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
