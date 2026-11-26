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
  songSrc?: string;
  acceptAllOptions?: boolean;
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

export type ArtworkEffects = {
  pixelSize?: number; // Tamaño de bloque de pixelado (ej. 10 - 18)
  blurPx?: number;    // Desenfoque en píxeles (ej. 2 - 5)
  hueDeg?: number;    // Rotación de color en grados (ej. 65 - 160)
  saturate?: number;  // Saturación opcional (ej. 1.3)
};

export type ArtworkLevel = {
  kind: 'artwork';
  label: string;
  imageSrc: string;
  options: string[];
  answer: string;
  effects?: ArtworkEffects;
};

export type GameLevel = ChoiceLevel | WordLevel | OrderLevel | ArtworkLevel;

export type BeautyArcadeLevel = {
  label: string;
  catchTarget: 5;
  fallSpeedPxPerSecond: number;
  spawnIntervalMs: number;
};

export type MemoryGameLevel = {
  label: string;
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
  | { id: Exclude<MartaId, 'beauty' | 'little'>; levels: GameLevel[] }
  | { id: 'beauty'; levels: BeautyArcadeLevel[] }
  | { id: 'little'; levels: MemoryGameLevel[] }
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
