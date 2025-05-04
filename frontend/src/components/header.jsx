import React from 'react';
import { Link } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import '../styles/global.css';
import '../styles/form.css';

function Header() {
  return (
    <header>
      <nav className="navbar fixed-top bg-white shadow-sm p-3">
        <div className="container-fluid mx-5">
          <a className="navbar-brand d-flex align-items-center" href="#">
            <img src="/logo.png" alt="Logo" width="30" height="24" className="d-inline-block align-text-top" />
            <span className="ms-3">Vocational Test</span>
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
  );
}

export default Header;