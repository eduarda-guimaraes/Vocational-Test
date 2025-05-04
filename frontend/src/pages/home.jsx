import React from 'react';
import { Link } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import '../styles/global.css';
import '../styles/form.css';

function Home() {
  return (
    <>
      <header>
        <nav className="navbar sticky-top bg-body-tertiary p-4">
          <div className="container-fluid mx-5">
            <a className="navbar-brand" href="#">
              <img src="/logo.png" alt="Logo" width="30" height="24" className="d-inline-block align-text-top" />
              Vocational Test
            </a>
            <div className="d-flex ms-auto align-items-center">
              <Link className="nav-link mx-3" to="/">Home</Link>
              <Link className="nav-link mx-3" to="/chat">Chat</Link>
              <Link className="nav-link mx-3" to="/perfil">
                <img src="/iconevazio.png" alt="Ícone de cadastro" width="85" height="85" />
              </Link>
            </div>
          </div>
        </nav>
      </header>

      <div className="container-fluid p-0">
        <div className="card w-100 m-0 rounded-0" style={{ backgroundColor: '#447eb8', height: '300px' }}>
          <div className="card-body d-flex flex-column align-items-center justify-content-center text-white">
            <h2 className="fw-bold">DESCUBRA A CARREIRA IDEAL PARA VOCÊ EM APENAS ALGUNS MINUTOS!</h2>
            <p className="card-text">Preencha o formulário para fazer o teste vocacional.</p>
            <a href="#" className="btn btn-primary" style={{ color: '#000000', backgroundColor: '#ffffff', marginTop: 10, marginBottom: 10, width: '30%', height: 40, borderRadius: 50 }}>Iniciar Teste</a>
          </div>
        </div>
      </div>

      <img src="/banner.png" alt="banner demonstrativo" className="w-100" />

      <div className="container my-5" id="scrollspyHeading3">
        <h3 className="text-center">Dúvidas Frequentes:</h3>
        <p className="text-center">Aqui estão algumas perguntas comuns sobre o Vocational Test:</p>
        <div className="accordion" id="accordionExample">
          {[
            {
              id: 'One',
              question: 'Como faço o teste vocacional?',
              answer: 'Você pode começar o teste clicando no botão \'Iniciar Teste\' na página inicial.',
              show: true,
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
          ].map(({ id, question, answer, show }) => (
            <div className="accordion-item" key={id}>
              <h2 className="accordion-header" id={`heading${id}`}>
                <button
                  className={`accordion-button ${!show ? 'collapsed' : ''}`}
                  type="button"
                  data-bs-toggle="collapse"
                  data-bs-target={`#collapse${id}`}
                  aria-expanded={show ? 'true' : 'false'}
                  aria-controls={`collapse${id}`}
                >
                  {question}
                </button>
              </h2>
              <div
                id={`collapse${id}`}
                className={`accordion-collapse collapse ${show ? 'show' : ''}`}
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