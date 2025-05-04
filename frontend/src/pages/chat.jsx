import React, { useState } from 'react';
import Header from '../components/header';
import '../styles/global.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';

function Chat() {
  const [messages, setMessages] = useState([
    { sender: 'bot', text: 'Olá! Vamos começar seu teste vocacional. Qual área você mais se identifica?' }
  ]);
  const [input, setInput] = useState('');

  const handleSend = () => {
    if (!input.trim()) return;
    const userMessage = { sender: 'user', text: input };
    setMessages(prev => [...prev, userMessage]);

    const botResponse = getStaticResponse(input);
    setMessages(prev => [...prev, { sender: 'bot', text: botResponse }]);
    setInput('');
  };

  const getStaticResponse = (input) => {
    const lower = input.toLowerCase();
    if (lower.includes('tecnologia')) {
      return 'Você pode se dar bem com carreiras como Análise de Sistemas ou Engenharia de Software.';
    } else if (lower.includes('saúde')) {
      return 'Você pode gostar de áreas como Enfermagem, Medicina ou Psicologia.';
    } else {
      return 'Legal! Me diga mais sobre o que você gosta de fazer no dia a dia.';
    }
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
          <button className="btn btn-primary rounded-pill px-4" onClick={handleSend}>
            Enviar
          </button>
        </div>
      </div>
    </>
  );
}

export default Chat;
