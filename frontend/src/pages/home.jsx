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

      <img src="/banner.png" alt="banner demonstrativo" className="w-100" />

      <div className="container-fluid p-0">
        <div className="card w-100 m-0 rounded-0" style={{ backgroundColor: '#447eb8', height: '300px' }}>
          <div className="card-body d-flex flex-column align-items-center justify-content-center text-white">
            <h2 className="fw-bold">DESCUBRA A CARREIRA IDEAL PARA VOCÊ EM APENAS ALGUNS MINUTOS!</h2>
            <p className="card-text">Preencha o formulário para fazer o teste vocacional.</p>
            <a href="#" className="btn btn-primary" style={{ color: '#000000', backgroundColor: '#ffffff', marginTop: 10, marginBottom: 10, width: '30%', height: 40, borderRadius: 50 }}>Iniciar Teste</a>
          </div>
        </div>
      </div>

      <div className="container my-5" id="scrollspyHeading3">
        <h3 className="text-center">Dúvidas Frequentes:</h3>
        <p className="text-center">Aqui estão algumas perguntas comuns sobre o Vocational Test:</p>
        <div className="accordion" id="accordionExample">
          {/* Acordeões aqui */}
        </div>
      </div>
    </>
  );
}

export default Home;
