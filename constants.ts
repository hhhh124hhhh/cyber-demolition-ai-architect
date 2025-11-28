
export const MAP_SIZE = 40;
export const BLOCK_SIZE = 1;

export const BLOCK_TYPES = {
  CONCRETE: { color: '#888888', mass: 10, score: 10 },
  GLASS: { color: '#88ccff', mass: 2, score: 5 },
  EXPLOSIVE: { color: '#ff3300', mass: 5, score: 50 },
  GOLD: { color: '#ffd700', mass: 20, score: 100 }
};

export const INITIAL_GAME_STATE = {
  chaosScore: 0,
  chaosLevel: 0,
  level: 1,
  isLevelActive: false,
  gameStatus: 'IDLE' as const
};

// Base score required to pass level 1. Multiplied by level number.
export const LEVEL_TARGET_BASE = 2000; 

// Simple default city if AI fails
export const FALLBACK_CITY_LAYOUT = {
  name: "Default Sandbox",
  architectNote: "Let's see you knock this over.",
  blocks: [] // Will be populated dynamically
};
