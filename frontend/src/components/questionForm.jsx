import React, { useState } from 'react';

const questions = [
  {
    id: 1,
    text: 'Você prefere trabalhar com pessoas ou com tecnologia?',
    options: ['Pessoas', 'Tecnologia']
  },
  {
    id: 2,
    text: 'Você se considera mais criativo ou analítico?',
    options: ['Criativo', 'Analítico']
  },
  {
    id: 3,
    text: 'Prefere ambientes dinâmicos ou estruturados?',
    options: ['Dinâmicos', 'Estruturados']
  }
];

function QuestionForm({ onSubmit }) {
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState([]);

  const handleAnswer = (answer) => {
    const updatedAnswers = [...answers, answer];
    if (current < questions.length - 1) {
      setAnswers(updatedAnswers);
      setCurrent(current + 1);
    } else {
      onSubmit(updatedAnswers);
    }
  };

  return (
    <div className="card p-4">
      <h5>{questions[current].text}</h5>
      <div className="mt-3">
        {questions[current].options.map((opt, idx) => (
          <button
            key={idx}
            className="btn btn-outline-primary m-2"
            onClick={() => handleAnswer(opt)}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}

export default QuestionForm;