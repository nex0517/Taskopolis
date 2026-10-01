import { useRef, useState } from 'react';

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

export function useJuice(): {
  coinPop: CoinPop | null;
  newBuilding: NewBuilding | null;
  showCoinPop: (taskId: string, text: string) => void;
  clearCoinPop: () => void;
  showNewBuilding: (row: number, col: number) => void;
  clearNewBuilding: () => void;
} {
  const [coinPop, setCoinPop] = useState<CoinPop | null>(null);
  const [newBuilding, setNewBuilding] = useState<NewBuilding | null>(null);
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

  return {
    coinPop,
    newBuilding,
    showCoinPop,
    clearCoinPop,
    showNewBuilding,
    clearNewBuilding,
  };
}
