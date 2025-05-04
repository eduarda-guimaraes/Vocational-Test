import React from 'react';

function ResultDisplay({ answers }) {
  const calculateResult = () => {
    const counts = answers.reduce((acc, answer) => {
      acc[answer] = (acc[answer] || 0) + 1;
      return acc;
    }, {});

    if ((counts['Tecnologia'] || 0) > (counts['Pessoas'] || 0)) {
      return 'Você parece se identificar mais com a área de tecnologia!';
    } else if ((counts['Pessoas'] || 0) > (counts['Tecnologia'] || 0)) {
      return 'Você parece se identificar mais com profissões voltadas ao contato humano!';
    } else {
      return 'Você tem interesses diversos! Pode explorar áreas híbridas como UX Design, Psicologia Organizacional ou Gestão de Projetos.';
    }
  };

  return (
    <div className="card p-4">
      <h4>Resultado do Teste:</h4>
      <p className="mt-3">{calculateResult()}</p>
    </div>
  );
}

export default ResultDisplay;