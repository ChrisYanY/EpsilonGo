import React, { useState } from 'react';
import Settings from './components/Settings';
import GameBoard from './components/GameBoard';

function App() {
  const [gameSettings, setGameSettings] = useState(null);

  const handleStartGame = (settings) => {
    setGameSettings(settings);
  };

  const handleBack = () => {
    setGameSettings(null);
  };

  return (
    <>
      {gameSettings ? (
        <GameBoard settings={gameSettings} onBack={handleBack} />
      ) : (
        <Settings onStartGame={handleStartGame} />
      )}
    </>
  );
}

export default App;
