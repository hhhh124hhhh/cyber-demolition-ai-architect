
import React, { useState, useEffect, useCallback } from 'react';
import { GameScene } from './components/GameScene';
import { UI } from './components/UI';
import { INITIAL_GAME_STATE, FALLBACK_CITY_LAYOUT, LEVEL_TARGET_BASE } from './constants';
import { GameState, CityLayout } from './types';
import { generateCityAI } from './services/geminiService';
import { audioManager } from './services/audioService';

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>({ ...INITIAL_GAME_STATE });
  const [cityLayout, setCityLayout] = useState<CityLayout>(FALLBACK_CITY_LAYOUT as any);

  // Initialize Audio Context on first interaction
  const initAudio = () => {
      audioManager.init();
  };

  const startLevel = useCallback(async () => {
    initAudio();
    setGameState(prev => ({ ...prev, isLevelActive: false, gameStatus: 'IDLE' }));
    
    // Generate new city
    const newLayout = await generateCityAI(gameState.level);
    setCityLayout(newLayout);
    
    setGameState(prev => ({ 
        ...prev, 
        isLevelActive: true, 
        gameStatus: 'PLAYING',
        chaosScore: 0,
        chaosLevel: 0
    }));
  }, [gameState.level]);

  const handleScoreUpdate = useCallback((scoreDelta: number) => {
    setGameState(prev => {
        if (prev.gameStatus !== 'PLAYING') return prev;

        const newScore = prev.chaosScore + scoreDelta;
        const targetScore = prev.level * LEVEL_TARGET_BASE;
        const progress = Math.min(100, (newScore / targetScore) * 100);

        // Check for level clear
        if (newScore >= targetScore) {
            audioManager.playWin();
            return { 
                ...prev, 
                chaosScore: newScore, 
                chaosLevel: 100,
                gameStatus: 'LEVEL_CLEARED',
                isLevelActive: false // Stop physics updates or just show UI? Let's stop physics to save performance
            };
        }

        return { ...prev, chaosScore: newScore, chaosLevel: progress };
    });
  }, []);

  const handleNextLevel = () => {
      setGameState(prev => ({ ...prev, level: prev.level + 1 }));
      // Effect will trigger startLevel
  };
  
  // Trigger start level when level number changes
  useEffect(() => {
      if (gameState.level > 1) {
          startLevel();
      }
  }, [gameState.level, startLevel]);

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden cursor-none" onClick={initAudio}>
      <GameScene 
        gameState={gameState} 
        cityLayout={cityLayout}
        onScoreUpdate={handleScoreUpdate}
      />
      <UI 
        gameState={gameState} 
        cityLayout={cityLayout}
        onNextLevel={gameState.level === 1 && !gameState.isLevelActive ? startLevel : handleNextLevel}
      />
    </div>
  );
};

export default App;
