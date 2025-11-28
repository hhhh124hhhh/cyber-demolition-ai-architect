import { Vector3 } from 'three';

export interface BlockData {
  id: number;
  position: [number, number, number];
  color: string;
  type: 'CONCRETE' | 'GLASS' | 'EXPLOSIVE' | 'GOLD';
  mass: number;
}

export interface CityLayout {
  blocks: BlockData[];
  name: string;
  architectNote: string;
}

export interface GameState {
  chaosScore: number;      // 0 to 10000+
  chaosLevel: number;      // 0% to 100% (Progress to next level)
  level: number;
  isLevelActive: boolean;
  gameStatus: 'IDLE' | 'PLAYING' | 'LEVEL_CLEARED';
}

export interface LogMessage {
  id: string;
  text: string;
  source: 'SYSTEM' | 'ARCHITECT';
  type: 'info' | 'warning' | 'error';
}