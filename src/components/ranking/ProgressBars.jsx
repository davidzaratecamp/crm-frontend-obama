import React from 'react';
import '../../styles/ProgressBars.css';

function ProgressBars({ players }) {
  return (
    <div className="progress-bars-container">
      {players.map((player, index) => (
        <div key={index} className="progress-bar">
          <div className="player-name">{player.name}</div>
          <div className="bar-container">
            <div className="bar" style={{ width: `${player.score}%` }}></div>
          </div>
          <div className="player-score">{player.score}</div>
        </div>
      ))}
    </div>
  );
}

export default ProgressBars;