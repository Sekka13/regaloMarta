/**
 * ============================================================================
 *  MemoryGame.tsx — Memorama autónomo con 6 parejas fijas y progresión consecutiva
 * ============================================================================
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import yoPic from '../../public/pictures/yoPic.webp'
import ballIcon from '../../public/icons/ball.png';
import dollIcon from '../../public/icons/doll.png';
import legoMIcon from '../../public/icons/lego_m.png';
import legoWIcon from '../../public/icons/lego_w.png';
import teddyIcon from '../../public/icons/teddy.png';
import yoyoIcon from '../../public/icons/yoyo.png';
import { playSoundAndVibrate } from '../utils/soundHelper';

type SoundName = Parameters<typeof playSoundAndVibrate>[0];

type MemoryCard = {
  uid: string;
  pairId: string;
  label: string;
  src: string;
};

type MemoryGameProps = {
  onGameComplete?: () => void;
};

// ============================================================================
//  MAZO CON POSICIONES FIJAS (ESTÁTICAS - NUNCA SE BARAJAN)
// ============================================================================
const FIXED_DECK: MemoryCard[] = [
  { uid: 'yoyo-0', pairId: 'yoyo', label: 'Yoyó', src: yoyoIcon },
  { uid: 'ball-0', pairId: 'ball', label: 'Pelota', src: ballIcon },
  { uid: 'lego_m-0', pairId: 'lego_m', label: 'Lego M', src: legoMIcon },
  { uid: 'teddy-0', pairId: 'teddy', label: 'Osito', src: teddyIcon },
  { uid: 'doll-0', pairId: 'doll', label: 'Muñeca', src: dollIcon },
  { uid: 'lego_w-0', pairId: 'lego_w', label: 'Lego W', src: legoWIcon },
  { uid: 'ball-1', pairId: 'ball', label: 'Pelota', src: ballIcon },
  { uid: 'yoyo-1', pairId: 'yoyo', label: 'Yoyó', src: yoyoIcon },
  { uid: 'lego_w-1', pairId: 'lego_w', label: 'Lego W', src: legoWIcon },
  { uid: 'teddy-1', pairId: 'teddy', label: 'Osito', src: teddyIcon },
  { uid: 'lego_m-1', pairId: 'lego_m', label: 'Lego M', src: legoMIcon },
  { uid: 'doll-1', pairId: 'doll', label: 'Muñeca', src: dollIcon },
];

const PAIRS_TOTAL = 6;
const MISMATCH_DELAY_MS = 1000;
const MATCH_UNLOCK_DELAY_MS = 400;
const WIN_TRANSITION_DELAY_MS = 2000; 
const FLIP_DURATION_S = 0.4;

export function MemoryGame({ onGameComplete }: MemoryGameProps) {
  const reduceMotion = Boolean(useReducedMotion());

  const busyRef = useRef(false);
  const flippedRef = useRef<number[]>([]);
  const matchedRef = useRef<string[]>([]);
  const timeoutsRef = useRef<number[]>([]);
  
  const onGameCompleteRef = useRef(onGameComplete);
  onGameCompleteRef.current = onGameComplete;

  const [deck] = useState<MemoryCard[]>(FIXED_DECK);
  const [flipped, setFlipped] = useState<number[]>([]);
  const [matchedIds, setMatchedIds] = useState<string[]>([]);
  const [fails, setFails] = useState(0);
  const [statusMessage, setStatusMessage] = useState('Nivel 1/6: Encuentra la primera pareja.');

  const schedule = useCallback((fn: () => void, ms: number) => {
    const id = window.setTimeout(() => {
      timeoutsRef.current = timeoutsRef.current.filter((t) => t !== id);
      fn();
    }, ms);
    timeoutsRef.current.push(id);
  }, []);

  const clearTimers = useCallback(() => {
    timeoutsRef.current.forEach((t) => window.clearTimeout(t));
    timeoutsRef.current = [];
  }, []);

  useEffect(() => () => clearTimers(), [clearTimers]);

  const handleCardClick = (index: number) => {
    if (busyRef.current) return;

    const card = deck[index];
    if (matchedRef.current.includes(card.pairId)) return;
    if (flippedRef.current.includes(index)) return;

    const nextFlipped = [...flippedRef.current, index];
    flippedRef.current = nextFlipped;
    setFlipped(nextFlipped);

    if (nextFlipped.length < 2) return;

    busyRef.current = true;
    const [first, second] = nextFlipped;
    const isMatch = deck[first].pairId === deck[second].pairId;

    if (isMatch) {
      // ---------------- ACIERTO ----------------
      const pairId = deck[first].pairId;
      const nextMatched = [...matchedRef.current, pairId];
      matchedRef.current = nextMatched;
      setMatchedIds(nextMatched);

      flippedRef.current = [];
      setFlipped([]);

      const currentLevelIndex = nextMatched.length; 
      const isLastPair = currentLevelIndex === PAIRS_TOTAL;

      if (isLastPair) {
        
        setStatusMessage('¡Completado! Desbloqueando a Little...');
        
        schedule(() => {
          onGameCompleteRef.current?.();
        }, WIN_TRANSITION_DELAY_MS);
      } else {
        playSoundAndVibrate('level_up' as SoundName);
        setStatusMessage(`¡Nivel ${currentLevelIndex} superado! A por el siguiente.`);
        schedule(() => {
          busyRef.current = false;
        }, MATCH_UNLOCK_DELAY_MS);
      }
    } else {
      // ---------------- FALLO ----------------
      // Se resetean los aciertos y las cartas levantadas, volviendo al Nivel 1 sin barajar el mazo
      playSoundAndVibrate('fail_level' as SoundName);
      setFails((current) => current + 1);
      setStatusMessage('¡Fallo! Vuelves a empezar desde el Nivel 1.');

      schedule(() => {
        matchedRef.current = [];
        setMatchedIds([]);
        flippedRef.current = [];
        setFlipped([]);
        busyRef.current = false;
      }, MISMATCH_DELAY_MS);
    }
  };

  return (
    <section className="memory-game-panel grid gap-2 w-full" aria-label="Juego de memorama">
      <div className="memory-game-toolbar flex items-center justify-between px-2">
        <div className="flex items-center gap-3">
          <span className="memory-pairs font-semibold text-purple-700 bg-purple-50 px-3 py-1 rounded-full border border-purple-200 text-sm">
            Nivel {matchedIds.length + 1} / {PAIRS_TOTAL}
          </span>
          <span className="memory-fails font-semibold text-pink-600 bg-pink-50 px-3 py-1 rounded-full border border-pink-200 text-sm">
            Fallos: {fails}
          </span>
        </div>
      </div>

      <div className="memory-board relative w-full max-w-sm mx-auto rounded-2xl border-2 border-pink-300 bg-gradient-to-b from-pink-50/70 via-purple-50/50 to-pink-100/70 p-3 shadow-inner select-none overflow-hidden">
        <div className="grid grid-cols-3 gap-3">
          {deck.map((card, index) => {
            const isMatched = matchedIds.includes(card.pairId);
            const faceUp = isMatched || flipped.includes(index);

            return (
              <button
                key={card.uid}
                type="button"
                onClick={() => handleCardClick(index)}
                disabled={faceUp}
                className="memory-card relative aspect-square w-full cursor-pointer disabled:cursor-default focus:outline-none focus-visible:ring-4 focus-visible:ring-pink-400 rounded-xl"
                style={{ perspective: 800 }}
                aria-label={faceUp ? `${card.label}, boca arriba` : 'Carta boca abajo'}
              >
                <motion.div
                  className="absolute inset-0"
                  style={{ transformStyle: 'preserve-3d' }}
                  initial={false}
                  animate={{
                    rotateY: faceUp ? 180 : 0,
                    scale: isMatched ? [1, 1.08, 1] : 1,
                  }}
                  transition={{ duration: reduceMotion ? 0 : FLIP_DURATION_S, ease: 'easeInOut' }}
                >
                  <div
                    className="absolute inset-0 flex items-center justify-center rounded-xl border-2 border-black bg-gradient-to-br from-pink-400 to-purple-500 shadow-[0_3px_0_0_rgba(0,0,0,0.8)]"
                    style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}
                  >
                    <img
                      src={yoPic}
                      alt=""
                      draggable={false}
                      className="w-4/5 h-4/5 object-contain drop-shadow-sm"
                    />
                  </div>

                  <div
                    className={`absolute inset-0 flex items-center justify-center rounded-xl border-2 shadow-[0_3px_0_0_rgba(0,0,0,0.8)] ${
                      isMatched ? 'bg-emerald-50 border-emerald-500' : 'bg-white border-black'
                    }`}
                    style={{
                      backfaceVisibility: 'hidden',
                      WebkitBackfaceVisibility: 'hidden',
                      transform: 'rotateY(180deg)',
                    }}
                  >
                    <img
                      src={card.src}
                      alt=""
                      draggable={false}
                      className="w-3/5 h-3/5 object-contain drop-shadow-sm"
                    />
                  </div>
                </motion.div>
              </button>
            );
          })}
        </div>
      </div>

      <p
        className="memory-game-status text-xs text-center font-medium text-purple-600 h-5"
        role="status"
        aria-live="polite"
      >
        {statusMessage}
      </p>
    </section>
  );
}