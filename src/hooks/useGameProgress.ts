import { useEffect, useState } from 'react';
import { martas } from '../data/config';
import type { MartaId, PersistedProgress } from '../types/game';

const STORAGE_KEY = 'martalendario-progress-v1';
const BEAUTY_GAME_VERSION = 2;

function freshProgress(): PersistedProgress {
  return {
    version: 1,
    beautyGameVersion: BEAUTY_GAME_VERSION,
    rulesSeen: false,
    completedMartaIds: [],
    levelProgress: Object.fromEntries(martas.map(({ id }) => [id, 0])) as Record<MartaId, number>,
    openedGiftNumbers: [],
    finalOpened: false,
  };
}

function readProgress(): PersistedProgress {
  if (typeof window === 'undefined') return freshProgress();

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) return freshProgress();

    const parsed = JSON.parse(stored) as Partial<PersistedProgress>;
    if (parsed.version !== 1) return freshProgress();

    const fallback = freshProgress();
    const resetBeautyProgress = parsed.beautyGameVersion !== BEAUTY_GAME_VERSION;
    const levelProgress = { ...fallback.levelProgress, ...(parsed.levelProgress ?? {}) };
    for (const marta of martas) {
      levelProgress[marta.id] = Math.min(
        marta.levels.length,
        Math.max(0, Number(levelProgress[marta.id]) || 0),
      );
    }
    if (resetBeautyProgress) levelProgress.beauty = 0;
    const beautyGiftNumbers = martas.find((marta) => marta.id === 'beauty')?.giftNumbers ?? [];

    const completedMartaIds = Array.isArray(parsed.completedMartaIds)
      ? parsed.completedMartaIds.filter((id): id is MartaId => (
        martas.some((marta) => marta.id === id)
        && (!resetBeautyProgress || id !== 'beauty')
      ))
      : [];
    const openedGiftNumbers = Array.isArray(parsed.openedGiftNumbers)
      ? parsed.openedGiftNumbers.filter((number) => (
        Number.isInteger(number)
        && number >= 1
        && number <= 23
        && (!resetBeautyProgress || !beautyGiftNumbers.includes(number))
      ))
      : [];

    return {
      version: 1,
      beautyGameVersion: BEAUTY_GAME_VERSION,
      rulesSeen: Boolean(parsed.rulesSeen),
      completedMartaIds,
      levelProgress,
      openedGiftNumbers,
      finalOpened: Boolean(parsed.finalOpened),
    };
  } catch {
    return freshProgress();
  }
}

export function useGameProgress() {
  const [progress, setProgress] = useState<PersistedProgress>(readProgress);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
    } catch {
      // Keep the current session playable if storage is disabled or full.
    }
  }, [progress]);

  return [progress, setProgress] as const;
}
