import React from 'react';

const Footer = () => {
  return (
    <footer
      style={{
        width: '100%',
        background: '#447eb8',
        color: 'white',
        textAlign: 'center',
        padding: '2rem 1rem',
        fontSize: '0.95rem',
        fontWeight: 500,
        marginTop: '2rem',
        position: 'relative',
        bottom: 0
      }}
    >
      <p style={{ margin: 0 }}>
        © 2025 <strong style={{ fontWeight: 600 }}>Vocational Test</strong>. Todos os direitos reservados.
      </p>
    </footer>
  );
};

export default Footer;
