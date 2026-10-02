import { useRef, useState } from 'react';

import type { TaskCategory } from './game/types';

export interface CoinPop {
  key: number;
  taskId: string;
  text: string;
}

export interface NewBuilding {
  key: number;
  row: number;
  col: number;
}

export interface Waking {
  key: number;
  category: TaskCategory;
}

export function useJuice(): {
  coinPop: CoinPop | null;
  newBuilding: NewBuilding | null;
  waking: Waking | null;
  showCoinPop: (taskId: string, text: string) => void;
  clearCoinPop: () => void;
  showNewBuilding: (row: number, col: number) => void;
  clearNewBuilding: () => void;
  showWaking: (category: TaskCategory) => void;
  clearWaking: () => void;
} {
  const [coinPop, setCoinPop] = useState<CoinPop | null>(null);
  const [newBuilding, setNewBuilding] = useState<NewBuilding | null>(null);
  const [waking, setWaking] = useState<Waking | null>(null);
  const counter = useRef(0);

  function showCoinPop(taskId: string, text: string) {
    counter.current += 1;
    setCoinPop({ key: counter.current, taskId, text });
  }

  function clearCoinPop() {
    setCoinPop(null);
  }

  function showNewBuilding(row: number, col: number) {
    counter.current += 1;
    setNewBuilding({ key: counter.current, row, col });
  }

  function clearNewBuilding() {
    setNewBuilding(null);
  }

  function showWaking(category: TaskCategory) {
    counter.current += 1;
    setWaking({ key: counter.current, category });
  }

  function clearWaking() {
    setWaking(null);
  }

  return {
    coinPop,
    newBuilding,
    waking,
    showCoinPop,
    clearCoinPop,
    showNewBuilding,
    clearNewBuilding,
    showWaking,
    clearWaking,
  };
}
