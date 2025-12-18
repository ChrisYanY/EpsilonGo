import React, { useState } from 'react';
import Settings from './components/Settings';
import GameBoard from './components/GameBoard';

function App() {
  const [gameSettings, setGameSettings] = useState(null);
  const [theme, setTheme] = useState('dark');

  const handleStartGame = (settings) => {
    setGameSettings(settings);
  };

  const handleBack = () => {
    setGameSettings(null);
  };

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  return (
    <>
      {gameSettings ? (
        <GameBoard settings={gameSettings} onBack={handleBack} theme={theme} />
      ) : (
        <Settings onStartGame={handleStartGame} theme={theme} toggleTheme={toggleTheme} />
      )}
    </>
  );
}

export default App;
