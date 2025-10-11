import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import '../styles/global.css';
import '../styles/form.css';
import { auth } from '../services/firebase';

function Header() {
  const location = useLocation();
  const pathname = location.pathname;

  const [fotoPerfil, setFotoPerfil] = useState('/iconevazio.png');
  const [isOpen, setIsOpen] = useState(false);

  // foto do perfil
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user && user.photoURL) setFotoPerfil(user.photoURL);
      else setFotoPerfil('/iconevazio.png');
    });
    return () => unsubscribe();
  }, []);

  // fecha ao mudar de rota
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  // fecha se a tela ficar >= lg (evita ficar "preso" aberto após resize)
  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 992) setIsOpen(false);
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const toggleMenu = () => setIsOpen((prev) => !prev);
  const closeMenu = () => setIsOpen(false);

  return (
    <header>
      {/* navbar-expand-lg => colapsa no mobile, normal no desktop */}
      <nav className="navbar navbar-expand-lg navbar-light bg-white fixed-top shadow-sm">
        <div className="container px-3">
          {/* Logo */}
          <Link to="/home" className="navbar-brand d-flex align-items-center">
            <img src="/logo.png" alt="Logo" width="30" height="24" className="d-inline-block align-text-top" />
            <span className="ms-2 fw-semibold">Vocational Test</span>
          </Link>

          {/* Botão hamburger controlado por estado (sem data-bs-*) */}
          <button
            className={`navbar-toggler ${isOpen ? '' : 'collapsed'}`}
            type="button"
            onClick={toggleMenu}
            aria-controls="navbarNav"
            aria-expanded={isOpen ? 'true' : 'false'}
            aria-label="Alternar navegação"
          >
            <span className="navbar-toggler-icon"></span>
          </button>

          {/* Menu controlado por estado */}
          <div className={`collapse navbar-collapse w-100 ${isOpen ? 'show' : ''}`} id="navbarNav">
            <ul className="navbar-nav align-items-center ms-lg-auto">
              <li className="nav-item">
                <Link
                  className={`nav-link mx-lg-2 ${pathname === '/home' ? 'active-link' : ''}`}
                  to="/home"
                  onClick={closeMenu}
                >
                  Home
                </Link>
              </li>
              <li className="nav-item">
                <Link
                  className={`nav-link mx-lg-2 ${pathname === '/chat' ? 'active-link' : ''}`}
                  to="/chat"
                  onClick={closeMenu}
                >
                  Chat
                </Link>
              </li>
              <li className="nav-item">
                <Link
                  className={`nav-link nav-perfil ms-lg-2 ${pathname === '/perfil' ? 'active-link' : ''}`}
                  to="/perfil"
                  onClick={closeMenu}
                >
                  <img
                    src={fotoPerfil}
                    alt="Perfil"
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      objectFit: 'cover',
                      border: pathname === '/perfil' ? '2px solid #447EB8' : '2px solid transparent',
                    }}
                  />
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </nav>
    </header>
  );
}

export default Header;
