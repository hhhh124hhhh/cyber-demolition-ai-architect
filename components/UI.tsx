
import React, { useEffect, useState } from 'react';
import { GameState, CityLayout } from '../types';
import { generateNewsAI } from '../services/geminiService';
import { LEVEL_TARGET_BASE } from '../constants';

interface UIProps {
  gameState: GameState;
  cityLayout: CityLayout;
  onNextLevel: () => void;
}

const NewsTicker = ({ chaosScore }: { chaosScore: number }) => {
    const [news, setNews] = useState("突发新闻：未知巨型生物出现在市中心！市民请立即撤离！");
    
    useEffect(() => {
        const interval = setInterval(async () => {
            const data = await generateNewsAI(chaosScore);
            setNews(data.message);
        }, 8000);
        return () => clearInterval(interval);
    }, [chaosScore]);

    return (
        <div className="absolute bottom-0 w-full bg-red-700 text-white overflow-hidden py-2 border-t-4 border-yellow-400 z-10 pointer-events-auto">
            <div className="flex whitespace-nowrap animate-scroll font-bold text-xl uppercase tracking-widest">
                <span className="mx-4">🔴 BREAKING NEWS:</span>
                <span className="mx-4">{news}</span>
                <span className="mx-4">🔴 LIVE COVERAGE</span>
                <span className="mx-4">{news}</span>
            </div>
        </div>
    );
};

export const UI = ({ gameState, cityLayout, onNextLevel }: UIProps) => {
  const [showHelp, setShowHelp] = useState(true);

  // Calculate percentage for progress bar
  const targetScore = gameState.level * LEVEL_TARGET_BASE;
  const progressPercent = Math.min(100, (gameState.chaosScore / targetScore) * 100);

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-0 font-sans select-none">
      
      {/* Top Bar: Progress */}
      <div className="absolute top-0 w-full h-4 bg-gray-900 z-20">
        <div 
            className="h-full bg-red-600 transition-all duration-300 ease-out shadow-[0_0_10px_#f00]"
            style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Live Badge */}
      <div className="absolute top-8 right-4 flex items-center gap-2 animate-pulse pointer-events-auto">
        <div className="bg-red-600 text-white font-black px-3 py-1 rounded text-sm tracking-wider shadow-lg">
            LIVE
        </div>
        <div className="text-red-500 font-bold tracking-widest text-shadow">
            CH. 5 NEWS
        </div>
      </div>

      {/* Score / Chaos Meter */}
      <div className="absolute top-8 left-4 pointer-events-auto">
        <div className="bg-black/80 border-l-4 border-red-500 p-4 text-white w-64 skew-x-[-10deg]">
             <h2 className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-1 transform skew-x-[10deg]">Destruction Level</h2>
             <div className="text-4xl font-black text-red-500 transform skew-x-[10deg]">
                {gameState.chaosScore.toLocaleString()} <span className="text-sm text-gray-500">/ {targetScore}</span>
             </div>
             <h3 className="text-white text-sm mt-2 font-bold transform skew-x-[10deg] truncate">
                目标: {cityLayout.name}
             </h3>
             <p className="text-xs text-gray-400 italic mt-1 transform skew-x-[10deg]">
                "{cityLayout.architectNote}"
             </p>
        </div>
      </div>

      {/* Level Complete Overlay */}
      {gameState.gameStatus === 'LEVEL_CLEARED' && (
         <div className="absolute inset-0 flex items-center justify-center bg-black/50 pointer-events-auto z-20">
             <div className="bg-yellow-400 p-8 transform -rotate-2 border-8 border-black shadow-[10px_10px_0_rgba(0,0,0,0.5)] text-center max-w-md animate-bounce-in">
                 <h1 className="text-6xl font-black text-black mb-2 uppercase">摧毁!</h1>
                 <p className="text-xl font-bold text-black mb-6">该区域已被夷为平地。</p>
                 <div className="text-2xl font-black mb-4">分数: {gameState.chaosScore}</div>
                 <button 
                    onClick={onNextLevel}
                    className="bg-black text-white text-2xl font-bold px-8 py-4 hover:bg-gray-800 transition-colors w-full"
                 >
                    前往下一个街区
                 </button>
             </div>
         </div>
      )}

      {/* Help Overlay (Start Screen) */}
      {!gameState.isLevelActive && gameState.level === 1 && showHelp && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/90 pointer-events-auto z-30">
            <div className="text-center text-white max-w-2xl p-8 border-4 border-red-600">
                <h1 className="text-5xl font-black text-red-500 mb-2 tracking-tighter">CYBER DEMOLITION</h1>
                <p className="text-gray-400 mb-8 tracking-widest uppercase">The AI Architect Challenge</p>
                
                <div className="grid grid-cols-2 gap-8 text-left mb-8">
                    <div>
                        <h3 className="text-yellow-400 font-bold mb-2">🎮 操作方法</h3>
                        <p>1. <b>移动鼠标</b> 控制怪兽之手。</p>
                        <p>2. <b>滚轮</b> 缩放视角。</p>
                        <p>3. <b>点击/按住</b> 粉碎建筑。</p>
                    </div>
                    <div>
                        <h3 className="text-yellow-400 font-bold mb-2">🎯 任务目标</h3>
                        <p>AI 建筑师设计了“完美”的城市。</p>
                        <p>证明它是错的。</p>
                        <p>达到目标分数进入下一关。</p>
                    </div>
                </div>

                <button 
                    onClick={() => { setShowHelp(false); onNextLevel(); }}
                    className="bg-red-600 text-white text-2xl font-black px-12 py-4 hover:bg-red-500 hover:scale-105 transition-all shadow-[0_0_30px_rgba(255,0,0,0.5)]"
                >
                    开始拆迁 (并开启音效)
                </button>
            </div>
        </div>
      )}

      {/* News Ticker */}
      <NewsTicker chaosScore={gameState.chaosScore} />
    </div>
  );
};
