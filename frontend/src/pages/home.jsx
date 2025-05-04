import React from 'react';
import Header from '../components/header'; // Importa o componente de cabeçalho
import 'bootstrap/dist/css/bootstrap.min.css';
import '../styles/global.css';
import '../styles/form.css';
import { Link } from 'react-router-dom';

function Home() {
  return (
    <>
      <Header />

      <div style={{ height: '100px' }} />

      <div className="container-fluid p-0" style={{ paddingTop: '100px' }}>
        
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
        <h3 className="text-center">Explore os Benefícios do Vocational Test:</h3>
        <div className="row justify-content-center mt-4">
          {/* Card 1 */}
          <div className="col-md-3 mb-4">
            <div className="card" style={{ backgroundColor: '#f1f1f1', height: '100%' }}>
              <div className="card-body text-center">
                <h5 className="card-title" style={{ color: '#0097B2' }}>RÁPIDO E EFICIENTE</h5>
                <p className="card-text text-justified">
                  Em poucos minutos, você descobrirá suas aptidões, interesses e características pessoais de forma clara e objetiva. 
                  Nosso teste vocacional é rápido e eficiente, oferecendo uma análise detalhada sem tomar muito do seu tempo. Ao final, você receberá uma visão precisa sobre os caminhos profissionais mais adequados ao seu perfil, facilitando decisões mais seguras sobre o seu futuro.
                </p>
              </div>
            </div>
          </div>
          {/* Card 2 */}
          <div className="col-md-3 mb-4">
            <div className="card" style={{ backgroundColor: '#f1f1f1', height: '100%' }}>
              <div className="card-body text-center">
                <h5 className="card-title" style={{ color: '#0097B2' }}>BASEADO EM PSICOLOGIA</h5>
                <p className="card-text text-justified">
                  Nosso teste vocacional é fundamentado em teorias psicológicas reconhecidas, garantindo uma análise detalhada e confiável. 
                  Utilizamos abordagens científicas que avaliam suas habilidades cognitivas, preferências pessoais e comportamento em diferentes situações, proporcionando uma visão precisa do seu perfil profissional.
                </p>
              </div>
            </div>
          </div>
          {/* Card 3 */}
          <div className="col-md-3 mb-4">
            <div className="card" style={{ backgroundColor: '#f1f1f1', height: '100%' }}>
              <div className="card-body text-center">
                <h5 className="card-title" style={{ color: '#0097B2' }}>SUGESTÕES DE CARREIRA</h5>
                <p className="card-text text-justified">
                  Após concluir o teste, você receberá recomendações personalizadas de carreiras alinhadas às suas habilidades, interesses e valores. 
                  Nosso sistema oferece opções de profissões que correspondem ao seu perfil, considerando suas preferências e atividades com as quais você se identifica, ajudando a identificar as melhores opções para sua carreira.
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
