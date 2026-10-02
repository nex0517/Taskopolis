import { WONDERS, WONDER_TOTAL } from '../game/config';
import type { Goal } from '../game/types';
import { wonderStage, type WonderStage } from '../game/wonders';

/** What a Wonder looks like before it is finished; finished ones use WONDERS' emoji. */
const STAGE_EMOJI: Record<WonderStage, string> = {
  foundation: '🧱',
  frame: '🏗️',
  walls: '🏢',
  finished: '',
};

export interface WonderLook {
  name: string;
  emoji: string;
  stage: WonderStage;
  /** 0–100, for progress bars. */
  percent: number;
  /** True for abandoned goals: the Wonder stays as it is, labelled "unfinished". */
  unfinished: boolean;
  /** Short text for tooltips and screen readers. */
  summary: string;
}

/** Everything the grid, the mini city and the goal list need to draw one Wonder. */
export function wonderLook(goal: Goal): WonderLook {
  const wonder = WONDERS[goal.category];
  const stage = wonderStage(goal.progress);
  const unfinished = goal.status === 'abandoned';
  const percent = Math.min(
    100,
    Math.round((goal.progress / WONDER_TOTAL) * 100),
  );
  const summary = `${wonder.name} — ${goal.title}: ${goal.progress} / ${WONDER_TOTAL}, ${stage}${unfinished ? ' (unfinished)' : ''}`;
  return {
    name: wonder.name,
    emoji: stage === 'finished' ? wonder.emoji : STAGE_EMOJI[stage],
    stage,
    percent,
    unfinished,
    summary,
  };
}
