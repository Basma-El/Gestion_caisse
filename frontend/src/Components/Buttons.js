import React from 'react';
import { useNavigate } from 'react-router-dom';

function Buttons() {
  const navigate = useNavigate();

  const handleEntreeClick = () => {
    navigate('/operation/entree');
  };

  const handleSortieClick = () => {
    navigate('/operation/sortie');
  };

  return (
    <div className="buttons-container" style={{ display: 'flex', gap: '15px', marginBottom: '20px' }}>
      <button 
        className="btn btn-success" 
        onClick={handleEntreeClick}
        style={{ flex: 1 }}
      >
        <span>+</span> Entrée
      </button>
      <button 
        className="btn btn-danger" 
        onClick={handleSortieClick}
        style={{ flex: 1 }}
      >
        <span>-</span> Sortie
      </button>
    </div>
  );
}

export default Buttons;