import React, { useEffect, useState } from 'react'; 
import { Link, useLocation } from 'react-router-dom';
import { auth } from '../services/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import 'bootstrap/dist/css/bootstrap.min.css';
import '../styles/global.css';
import '../styles/form.css';

function Header() {
  const location = useLocation();
  const pathname = location.pathname;
  const [fotoPerfil, setFotoPerfil] = useState('/iconevazio.png');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user?.photoURL) {
        setFotoPerfil(user.photoURL);
      } else {
        setFotoPerfil('/iconevazio.png');
      }
    });

    return () => unsubscribe(); // limpa o listener ao desmontar
  }, []);

  return (
    <header>
      <nav className="navbar fixed-top bg-white shadow-sm p-3">
        <div className="container-fluid mx-5">
          <a className="navbar-brand d-flex align-items-center" href="#">
            <img src="/logo.png" alt="Logo" width="30" height="24" className="d-inline-block align-text-top" />
            <span className="ms-3">Vocational Test</span>
          </a>
          <div className="d-flex ms-auto align-items-center">
            <Link className={`nav-link mx-3 ${pathname === '/home' ? 'active' : ''}`} to="/home">Home</Link>
            <Link className={`nav-link mx-3 ${pathname === '/chat' ? 'active' : ''}`} to="/chat">Chat</Link>
            <Link className={`nav-link nav-perfil mx-3 ${pathname === '/perfil' ? 'active' : ''}`} to="/perfil">
              <div
                className="perfil-icon"
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  overflow: 'hidden',
                  backgroundColor: '#e0e0e0'
                }}
              >
                <img
                  src={fotoPerfil}
                  alt="Perfil"
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover'
                  }}
                />
              </div>
            </Link>
          </div>
        </div>
      </nav>
    </header>
  );
}

export default Header;
