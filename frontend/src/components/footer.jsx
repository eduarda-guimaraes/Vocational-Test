import React from 'react';

const Footer = () => {
  return (
    <footer style={{ 
      textAlign: 'center',
      padding: '2.5rem 1rem',
      background: '#447eb8',
      color: 'white',
      fontFamily: 'inherit',
      fontSize: '0.95rem',
      marginTop: 'auto'
    }}>
      <p style={{ 
        margin: 0,
        fontWeight: 500
      }}>
        © 2025 <strong style={{ fontWeight: 600 }}>Vocational Test</strong>. Todos os direitos reservados.
      </p>
    </footer>
  );
};

export default Footer;