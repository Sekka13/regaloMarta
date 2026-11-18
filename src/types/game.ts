export type MartaId =
  | 'little'
  | 'lovely'
  | 'artist'
  | 'hungry'
  | 'traveling'
  | 'music'
  | 'beauty';

export type ChoiceLevel = {
  kind: 'choice';
  label: string;
  prompt: string;
  options: string[];
  answer: string;
  hint?: string;
};

export type WordLevel = {
  kind: 'word';
  label: string;
  prompt: string;
  clue: string;
  answer: string;
};

export type OrderLevel = {
  kind: 'order';
  label: string;
  prompt: string;
  detail: string;
  items: string[];
  correctOrder: string[];
};

export type GameLevel = ChoiceLevel | WordLevel | OrderLevel;

export type BeautyArcadeLevel = {
  label: string;
  catchTarget: 5;
  fallSpeedPxPerSecond: number;
  spawnIntervalMs: number;
};

type MartaDefinitionBase = {
  name: string;
  title: string;
  emoji: string;
  color: string;
  description: string;
  giftNumbers: number[];
  gameTitle: string;
  gameIntro: string;
};

export type MartaDefinition = MartaDefinitionBase & (
  | { id: Exclude<MartaId, 'beauty'>; levels: GameLevel[] }
  | { id: 'beauty'; levels: BeautyArcadeLevel[] }
);

export type PersistedProgress = {
  version: 1;
  beautyGameVersion: 2;
  rulesSeen: boolean;
  completedMartaIds: MartaId[];
  levelProgress: Record<MartaId, number>;
  openedGiftNumbers: number[];
  finalOpened: boolean;
};
