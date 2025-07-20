import React from 'react';
import Header from '../components/header';
import 'bootstrap/dist/css/bootstrap.min.css';
import '../styles/global.css';
import '../styles/form.css';
import { Link } from 'react-router-dom';

function Home() {
  return (
    <>
      <Header />

      <div style={{ height: '20px' }} />

      <div className="container-fluid p-0" style={{ paddingTop: '40px' }}>
        <div className="card w-100 m-0 rounded-0" style={{ backgroundColor: '#447eb8', height: '300px' }}>
          <div className="card-body d-flex flex-column align-items-center justify-content-center text-white">
            <h2 className="fw-bold">DESCUBRA A CARREIRA IDEAL PARA VOCÊ EM APENAS ALGUNS MINUTOS!</h2>
            <p className="card-text">Preencha o formulário para fazer o teste vocacional.</p>
            <Link to="/chat" className="btn btn-iniciar-teste mt-2 mb-2">
              Iniciar Teste
            </Link>
          </div>
        </div>
      </div>

      <img src="/banner.png" alt="banner demonstrativo" className="w-100" />

<div className="container my-5">
  <div className="row text-center">
    <div className="col-md-4 mb-4">
      <div
        className="card h-100 shadow"
        style={{
          backgroundColor: '#f8f9fa',
          borderLeft: '6px solid #447EB8',
          border: 'none',
          borderRadius: '1rem',
          transition: 'transform 0.3s ease, box-shadow 0.3s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-5px)';
          e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.1)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'none';
          e.currentTarget.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.05)';
        }}
      >
        <div className="card-body p-4 text-start">
          <h5 style={{ color: '#447EB8', fontWeight: 'bold', marginBottom: '1rem' }}>O que é o Vocational Test?</h5>
          <p style={{ color: '#333' }}>
            É uma plataforma que utiliza inteligência artificial para ajudar jovens a descobrirem suas carreiras ideais com base em seus interesses e perfis.
          </p>
        </div>
      </div>
    </div>

    <div className="col-md-4 mb-4">
      <div
        className="card h-100 shadow"
        style={{
          backgroundColor: '#f8f9fa',
          borderLeft: '6px solid #447EB8',
          border: 'none',
          borderRadius: '1rem',
          transition: 'transform 0.3s ease, box-shadow 0.3s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-5px)';
          e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.1)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'none';
          e.currentTarget.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.05)';
        }}
      >
        <div className="card-body p-4 text-start">
          <h5 style={{ color: '#447EB8', fontWeight: 'bold', marginBottom: '1rem' }}>Como funciona o teste?</h5>
          <p style={{ color: '#333' }}>
            Você responde algumas perguntas, e nossa IA analisa suas respostas para indicar áreas profissionais que combinam com você.
          </p>
        </div>
      </div>
    </div>

    <div className="col-md-4 mb-4">
      <div
        className="card h-100 shadow"
        style={{
          backgroundColor: '#f8f9fa',
          borderLeft: '6px solid #447EB8',
          border: 'none',
          borderRadius: '1rem',
          transition: 'transform 0.3s ease, box-shadow 0.3s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-5px)';
          e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.1)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'none';
          e.currentTarget.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.05)';
        }}
      >
        <div className="card-body p-4 text-start">
          <h5 style={{ color: '#447EB8', fontWeight: 'bold', marginBottom: '1rem' }}>Benefícios da plataforma</h5>
          <p style={{ color: '#333' }}>
            Descoberta vocacional personalizada, facilidade de acesso, confidencialidade dos dados e resultados práticos para planejamento de carreira.
          </p>
        </div>
      </div>
    </div>
  </div>
</div>
      <div className="container my-5" id="scrollspyHeading3">
        <h3 className="text-center">Dúvidas Frequentes:</h3>
        <p className="text-center">Aqui estão algumas perguntas comuns sobre o Vocational Test:</p>
        <div className="accordion" id="accordionExample">
          {[
            {
              id: 'One',
              question: 'Como faço o teste vocacional?',
              answer: 'Você pode começar o teste clicando no botão \'Iniciar Teste\' na página inicial.',
            },
            {
              id: 'Two',
              question: 'O teste é gratuito?',
              answer: 'Sim, o teste é totalmente gratuito.',
            },
            {
              id: 'Three',
              question: 'Quanto tempo leva para fazer o teste?',
              answer: 'O teste é rápido e eficiente, levando em média 10 a 15 minutos para ser completado.',
            },
            {
              id: 'Four',
              question: 'Como são feitas as recomendações de carreiras?',
              answer: 'As recomendações são feitas com base nas suas respostas durante o teste, levando em consideração suas habilidades, interesses e valores.',
            },
            {
              id: 'Five',
              question: 'Os resultados são confidenciais?',
              answer: 'Sim, todos os resultados do teste são privados e serão utilizados apenas para gerar suas recomendações de carreira.',
            },
            {
              id: 'Six',
              question: 'Posso refazer o teste se não gostar dos resultados?',
              answer: 'Sim, você pode refazer o teste quantas vezes quiser para comparar diferentes resultados e obter uma análise mais precisa.',
            },
          ].map(({ id, question, answer }) => (
            <div className="accordion-item" key={id}>
              <h2 className="accordion-header" id={`heading${id}`}>
                <button
                  className="accordion-button collapsed"
                  type="button"
                  data-bs-toggle="collapse"
                  data-bs-target={`#collapse${id}`}
                  aria-expanded="false"
                  aria-controls={`collapse${id}`}
                >
                  {question}
                </button>
              </h2>
              <div
                id={`collapse${id}`}
                className="accordion-collapse collapse"
                aria-labelledby={`heading${id}`}
              >
                <div className="accordion-body">{answer}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

export default Home;
