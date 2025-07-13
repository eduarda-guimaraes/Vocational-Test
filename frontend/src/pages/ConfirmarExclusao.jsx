import React, { useState } from 'react';
import '../styles/global.css';
import 'bootstrap/dist/css/bootstrap.min.css';

function ConfirmarExclusao({ temSenha, onConfirmar, onCancelar }) {
  const [senha, setSenha] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);

  const handleConfirmar = () => {
    if (temSenha) {
      if (!senha.trim()) {
        alert('Por favor, digite sua senha.');
        return;
      }
      onConfirmar(senha.trim());
    } else {
      onConfirmar(null);
    }
  };

  return (
    <div className="modal d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content shadow">
          <div className="modal-header">
            <h5 className="modal-title">Confirmar Exclusão</h5>
          </div>
          <div className="modal-body">
            <p>Tem certeza que deseja excluir sua conta? Esta ação é <strong>irreversível</strong>.</p>

            {temSenha && (
              <div className="mt-3">
                <label className="form-label">Digite sua senha para confirmar:</label>
                <div className="input-group">
                  <input
                    type={mostrarSenha ? 'text' : 'password'}
                    className="form-control"
                    placeholder="Senha"
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                  />
                  <button
                    className="btn btn-outline-secondary"
                    type="button"
                    onClick={() => setMostrarSenha(!mostrarSenha)}
                  >
                    {mostrarSenha ? 'Ocultar' : 'Mostrar'}
                  </button>
                </div>
              </div>
            )}
          </div>
          <div className="modal-footer">
            <button className="btn btn-secondary" onClick={onCancelar}>
              Cancelar
            </button>
            <button
              className="btn btn-danger"
              onClick={handleConfirmar}
              disabled={temSenha && senha.trim() === ''}
            >
              Excluir Conta
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ConfirmarExclusao;
