// src/components/ranking/ProgressBars.jsx

import React, { useEffect, useState } from 'react';

const ProgressBars = ({ players }) => {
  // Estado local para controlar el ancho real de las barras después de la carga inicial
  const [widths, setWidths] = useState({});

  useEffect(() => {
    // Cuando los 'players' cambian, resetea los anchos para animar
    // y luego los establece a los valores finales después de un pequeño retraso
    // para que la transición sea visible.
    setWidths({}); // Resetear anchos para que la animación se dispare
    const timer = setTimeout(() => {
      const newWidths = {};
      players.forEach(player => {
        // Asume un puntaje máximo para escalar las barras.
        // Podrías pasar un 'maxScore' como prop o calcularlo aquí.
        const maxScore = Math.max(...players.map(p => p.score), 1); // Evitar división por cero
        newWidths[player.name] = (player.score / maxScore) * 100;
      });
      setWidths(newWidths);
    }, 100); // Pequeño retraso para que el CSS resetee antes de la transición

    return () => clearTimeout(timer);
  }, [players]); // Vuelve a ejecutar si la lista de jugadores cambia

  return (
    <div className="progress-bars-container">
      <h3>🏆 Ranking de Ventas</h3>
      {players.length > 0 ? (
        players.map((player, index) => (
          <div className="progress-item" key={index}>
            <div className="player-name">{player.name}</div>
            <div className="progress-bar-wrapper">
              <div
                className={`progress-bar-fill ${
                    index === 0 ? 'gold' : index === 1 ? 'silver' : index === 2 ? 'bronze' : ''
                }`}
                style={{ width: `${widths[player.name] || 0}%` }}
              >
                <span className="player-score">{player.score}</span>
              </div>
            </div>
          </div>
        ))
      ) : (
        <p>No hay datos de ranking disponibles.</p>
      )}
    </div>
  );
};

export default ProgressBars;