import { useEffect, useMemo, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ArrowLeft, ArrowRight, Heart, Pause, Play, Sparkles } from 'lucide-react';
import brushIcon from '../assets/icons/brush.png';
import lipstickIcon from '../assets/icons/lipstick.png';
import mascaraIcon from '../assets/icons/mascara.png';
import perfumeIcon from '../assets/icons/perfume.png';
import onionIcon from '../assets/icons/onion.png';
import poopIcon from '../assets/icons/poop.png';
import spiderIcon from '../assets/icons/spider.png';
import type { BeautyArcadeLevel } from '../types/game';

type ArcadeIcon = {
  id: string;
  label: string;
  kind: 'good' | 'trap';
  src?: string;
  emoji?: string;
};

type FallingItem = ArcadeIcon & {
  instanceId: number;
  x: number;
  y: number;
  speed: number;
};

type VanityItem = ArcadeIcon & {
  instanceId: number;
  stage: number;
};

type Stain = { id: number; x: number; y: number };

type BeautyArcadeProps = {
  level: BeautyArcadeLevel;
  completedLevels: number;
  onLevelComplete: () => void;
};

const GOOD_COSMETICS: ArcadeIcon[] = [
  { id: 'mascara', label: 'Máscara de pestañas', kind: 'good', src: mascaraIcon },
  { id: 'lipstick', label: 'Pintalabios', kind: 'good', src: lipstickIcon },
  { id: 'brush', label: 'Brocha', kind: 'good', src: brushIcon },
  { id: 'perfume', label: 'Perfume', kind: 'good', src: perfumeIcon },
];

const TRAPS: ArcadeIcon[] = [
  { id: 'poop', label: 'Trampa', kind: 'trap', src: poopIcon },
  { id: 'onion', label: 'Trampa', kind: 'trap', src: onionIcon },
  // Este PNG aún no está en src/assets/icons; el emoji mantiene jugable la trampa.
  { id: 'spider', label: 'Trampa', kind: 'trap', src: spiderIcon },
];

const LIVES_PER_LEVEL = 3;
const VANITY_SLOTS_PER_SHELF = 5;
const VANITY_SHELF_COUNT = 3;
const ITEM_SIZE = 46;
const VANITY_HEIGHT = 124;

function startingVanity(completedLevels: number): VanityItem[] {
  return Array.from({ length: completedLevels * VANITY_SLOTS_PER_SHELF }, (_, index) => ({
    ...GOOD_COSMETICS[index % GOOD_COSMETICS.length],
    instanceId: -index - 1,
    stage: Math.floor(index / VANITY_SLOTS_PER_SHELF),
  }));
}

export function BeautyArcade({ level, completedLevels, onLevelComplete }: BeautyArcadeProps) {
  const reduceMotion = Boolean(useReducedMotion());
  const fieldRef = useRef<HTMLDivElement>(null);
  const fieldSizeRef = useRef({ width: 0, height: 0 });
  const fallingItemsRef = useRef<FallingItem[]>([]);
  const playerXRef = useRef(50);
  const targetXRef = useRef(50);
  const caughtRef = useRef(0);
  const livesRef = useRef(LIVES_PER_LEVEL);
  const completedRef = useRef(false);
  const pausedRef = useRef(false);
  const nextItemIdRef = useRef(0);
  const nextStainIdRef = useRef(0);
  const onLevelCompleteRef = useRef(onLevelComplete);
  const statusTimeoutRef = useRef<number | null>(null);

  const [fallingItems, setFallingItems] = useState<FallingItem[]>([]);
  const [playerX, setPlayerX] = useState(50);
  const [caughtThisLevel, setCaughtThisLevel] = useState(0);
  const [lives, setLives] = useState(LIVES_PER_LEVEL);
  const [collected, setCollected] = useState<VanityItem[]>(() => startingVanity(completedLevels));
  const [stains, setStains] = useState<Stain[]>([]);
  const [paused, setPaused] = useState(false);
  const [statusMessage, setStatusMessage] = useState('Atrapa cosméticos y esquiva las trampas.');

  pausedRef.current = paused;
  onLevelCompleteRef.current = onLevelComplete;

  const vanityCapacity = (completedLevels + 1) * level.catchTarget;
  const vanityAnimation = useMemo(() => ({
    scale: collected.length > completedLevels * VANITY_SLOTS_PER_SHELF ? [1, 1.04, 1] : 1,
  }), [collected.length, completedLevels]);

  const announce = (message: string) => {
    setStatusMessage(message);
    if (statusTimeoutRef.current !== null) window.clearTimeout(statusTimeoutRef.current);
    statusTimeoutRef.current = window.setTimeout(() => setStatusMessage(''), 1800);
  };

  useEffect(() => () => {
    if (statusTimeoutRef.current !== null) window.clearTimeout(statusTimeoutRef.current);
  }, []);

  useEffect(() => {
    const field = fieldRef.current;
    if (!field) return;

    const measureField = () => {
      const bounds = field.getBoundingClientRect();
      fieldSizeRef.current = { width: bounds.width, height: bounds.height };
    };

    measureField();
    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', measureField);
      return () => window.removeEventListener('resize', measureField);
    }

    const resizeObserver = new ResizeObserver(measureField);
    resizeObserver.observe(field);
    return () => resizeObserver.disconnect();
  }, []);

  useEffect(() => {
    const field = fieldRef.current;
    if (!field) return;

    let animationFrame = 0;
    let lastFrameTime = 0;
    let spawnElapsed = 0;
    let renderElapsed = 0;

    const getPlayerBounds = () => {
      const { width } = fieldSizeRef.current;
      const trayWidth = width ? Math.min(208, width * 0.68) : 204;
      const margin = width ? (trayWidth / 2 / width) * 100 : 34;
      return { min: margin, max: 100 - margin, trayWidth };
    };

    const tick = (time: number) => {
      if (!lastFrameTime) lastFrameTime = time;
      const delta = Math.min(time - lastFrameTime, 50);
      lastFrameTime = time;

      if (!pausedRef.current && !completedRef.current) {
        const { width, height } = fieldSizeRef.current;
        if (width > 0 && height > 0) {
          const { trayWidth } = getPlayerBounds();
          const easing = 1 - Math.exp(-delta / (reduceMotion ? 150 : 70));
          playerXRef.current += (targetXRef.current - playerXRef.current) * easing;

          const currentItems = fallingItemsRef.current.map((item) => ({
            ...item,
            y: item.y + (item.speed * (reduceMotion ? 0.78 : 1) * delta) / 1000,
          }));

          spawnElapsed += delta;
          while (spawnElapsed >= level.spawnIntervalMs) {
            spawnElapsed -= level.spawnIntervalMs;
            const isGood = Math.random() < 0.68;
            const icon = isGood
              ? GOOD_COSMETICS[Math.floor(Math.random() * GOOD_COSMETICS.length)]
              : TRAPS[Math.floor(Math.random() * TRAPS.length)];
            currentItems.push({
              ...icon,
              instanceId: nextItemIdRef.current++,
              x: 7 + Math.random() * 86,
              y: -ITEM_SIZE,
              speed: level.fallSpeedPxPerSecond * (0.82 + Math.random() * 0.38),
            });
          }

          const remainingItems: FallingItem[] = [];
          let restartedLevel = false;
          const playerCenterPx = (playerXRef.current / 100) * width;
          const catchLine = height - VANITY_HEIGHT - 4;

          for (const item of currentItems) {
            const itemCenterPx = (item.x / 100) * width;
            const inCatchingRange = Math.abs(itemCenterPx - playerCenterPx) <= trayWidth * 0.43;
            const reachesTray = item.y + ITEM_SIZE >= catchLine;

            if (reachesTray && inCatchingRange) {
              if (item.kind === 'good') {
                const nextCaught = caughtRef.current + 1;
                caughtRef.current = nextCaught;
                setCaughtThisLevel(nextCaught);
                setCollected((current) => [...current, { ...item, stage: completedLevels }]);
                announce(nextCaught >= level.catchTarget
                  ? '¡Tocador completo! Preparando el siguiente nivel.'
                  : `¡${item.label} atrapado! ${level.catchTarget - nextCaught} por recoger.`);

                if (nextCaught >= level.catchTarget) {
                  completedRef.current = true;
                  fallingItemsRef.current = [];
                  setFallingItems([]);
                  onLevelCompleteRef.current();
                  break;
                }
              } else {
                const nextLives = livesRef.current - 1;
                livesRef.current = nextLives;
                setLives(nextLives);
                const stainX = Math.max(12, Math.min(88, 50 + ((item.x - playerXRef.current) * width) / trayWidth));
                setStains((current) => [...current, {
                  id: nextStainIdRef.current++,
                  x: stainX,
                  y: 40 + Math.random() * 36,
                }].slice(-6));

                if (nextLives <= 0) {
                  livesRef.current = LIVES_PER_LEVEL;
                  caughtRef.current = 0;
                  setLives(LIVES_PER_LEVEL);
                  setCaughtThisLevel(0);
                  setCollected((current) => current.filter((cosmetic) => cosmetic.stage < completedLevels));
                  announce('¡Tres trampas! Se reinicia este nivel.');
                  spawnElapsed = 0;
                  restartedLevel = true;
                  break;
                } else {
                  announce(`¡Era una trampa! Te quedan ${nextLives} vidas.`);
                }
              }
            } else if (item.y <= height + ITEM_SIZE) {
              remainingItems.push(item);
            }
          }

          if (restartedLevel) remainingItems.length = 0;

          if (!completedRef.current) {
            fallingItemsRef.current = remainingItems;
            renderElapsed += delta;
            if (renderElapsed >= 1000 / 30) {
              renderElapsed = 0;
              setPlayerX(playerXRef.current);
              setFallingItems(remainingItems);
            }
          }
        }
      }

      animationFrame = window.requestAnimationFrame(tick);
    };

    animationFrame = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(animationFrame);
  }, [completedLevels, level.catchTarget, level.fallSpeedPxPerSecond, level.spawnIntervalMs, reduceMotion]);

  const clampPlayerX = (value: number) => {
    const { min, max } = (() => {
      const width = fieldSizeRef.current.width;
      const trayWidth = width ? Math.min(208, width * 0.68) : 204;
      const margin = width ? (trayWidth / 2 / width) * 100 : 34;
      return { min: margin, max: 100 - margin };
    })();
    return Math.max(min, Math.min(max, value));
  };

  const moveToPointer = (clientX: number) => {
    const bounds = fieldRef.current?.getBoundingClientRect();
    if (!bounds || bounds.width === 0) return;
    targetXRef.current = clampPlayerX(((clientX - bounds.left) / bounds.width) * 100);
  };

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (paused || (event.pointerType === 'mouse' && event.button !== 0)) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    moveToPointer(event.clientX);
  };

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (event.currentTarget.hasPointerCapture(event.pointerId) && !paused) moveToPointer(event.clientX);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (paused) return;
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault();
      targetXRef.current = clampPlayerX(targetXRef.current + (event.key === 'ArrowLeft' ? -12 : 12));
    }
  };

  const moveByButton = (direction: -1 | 1) => {
    if (paused) return;
    targetXRef.current = clampPlayerX(targetXRef.current + direction * 14);
  };

  const togglePause = () => setPaused((current) => !current);

  return (
    <section className="beauty-arcade-panel grid gap-2" aria-label="Minijuego Atrapacosméticos">
      <div className="beauty-arcade-toolbar flex items-center justify-between gap-2">
        <div className="beauty-arcade-counters flex flex-wrap items-center gap-2">
          <span className="beauty-lives" role="group" aria-label={`Vidas: ${lives} de ${LIVES_PER_LEVEL}`}>
            <span aria-hidden="true">
              {Array.from({ length: LIVES_PER_LEVEL }, (_, index) => (
                <Heart key={index} size={17} fill={index < lives ? 'currentColor' : 'none'} />
              ))}
            </span>
            <span>Vidas</span>
          </span>
          <span className="beauty-score">{caughtThisLevel}/{level.catchTarget} cosméticos</span>
        </div>
        <button className="beauty-pause-button" type="button" onClick={togglePause}>
          {paused ? <Play size={15} aria-hidden="true" /> : <Pause size={15} aria-hidden="true" />}
          {paused ? 'Reanudar' : 'Pausar'}
        </button>
      </div>

      <p className="beauty-arcade-instructions" id="beauty-arcade-instructions">
        Desliza el dedo sobre el juego o toca las flechas. Atrapa los cosméticos y evita las trampas.
      </p>

      <div
        ref={fieldRef}
        className={`beauty-game-field ${paused ? 'is-paused' : ''}`}
        role="group"
        aria-label="Zona de juego. Desliza horizontalmente o usa las flechas del teclado para mover el tocador."
        aria-describedby="beauty-arcade-instructions"
        tabIndex={0}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={(event) => {
          if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
        }}
        onPointerCancel={(event) => {
          if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
        }}
        onKeyDown={handleKeyDown}
      >
        <div className="beauty-field-stars" aria-hidden="true">✦　✧　✦</div>

        <div className="beauty-field-capacity" aria-hidden="true">
          <Sparkles size={14} aria-hidden="true" />
          {collected.length}/{vanityCapacity}
        </div>

        <AnimatePresence initial={false}>
          {fallingItems.map((item) => (
            <motion.div
              key={item.instanceId}
              className={`beauty-falling-item ${item.kind === 'trap' ? 'is-trap' : 'is-good'}`}
              style={{ left: `calc(${item.x}% - ${ITEM_SIZE / 2}px)`, y: item.y }}
              initial={reduceMotion ? { opacity: 1 } : { opacity: 0, scale: 0.65, rotate: -12 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              exit={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.7 }}
              transition={{ duration: reduceMotion ? 0 : 0.18, ease: 'easeOut' }}
              aria-hidden="true"
            >
              {item.src ? <img src={item.src} alt="" draggable={false} /> : <span>{item.emoji}</span>}
            </motion.div>
          ))}
        </AnimatePresence>

        <div className="beauty-vanity-positioner" style={{ left: `${playerX}%` }}>
          <motion.div
            className="beauty-vanity"
            animate={reduceMotion ? undefined : vanityAnimation}
            transition={{ duration: 0.36, ease: 'easeOut' }}
            role="group"
            aria-label={`Tocador con ${collected.length} de ${vanityCapacity} cosméticos`}
          >
            <div className="beauty-vanity-title">
              <span>Mi tocador</span>
              <span>{collected.length}/{vanityCapacity}</span>
            </div>
            <div className="beauty-vanity-shelves" role="group" aria-label="Cosméticos recogidos">
              {Array.from({ length: VANITY_SHELF_COUNT }, (_, shelfIndex) => (
                <ol className="beauty-vanity-shelf" key={shelfIndex} aria-label={`Baldas ${shelfIndex + 1}`}>
                  {Array.from({ length: VANITY_SLOTS_PER_SHELF }, (_, slotIndex) => {
                    const cosmetic = collected[shelfIndex * VANITY_SLOTS_PER_SHELF + slotIndex];
                    return (
                      <li className={cosmetic ? 'is-filled' : ''} key={slotIndex} aria-label={cosmetic?.label ?? 'Hueco vacío'}>
                        {cosmetic && <img src={cosmetic.src} alt="" draggable={false} />}
                      </li>
                    );
                  })}
                </ol>
              ))}
            </div>
            {stains.map((stain) => (
              <span
                key={stain.id}
                className="beauty-stain"
                style={{ left: `${stain.x}%`, top: `${stain.y}%` }}
                aria-hidden="true"
              />
            ))}
          </motion.div>
        </div>

        {paused && <div className="beauty-pause-overlay">Pausa</div>}
      </div>

      <div className="beauty-arcade-controls grid grid-cols-[52px_1fr_52px] items-center justify-items-center gap-2">
        <button className="beauty-direction-button" type="button" aria-label="Mover tocador a la izquierda" onClick={() => moveByButton(-1)} disabled={paused}>
          <ArrowLeft size={22} aria-hidden="true" />
        </button>
        <span className="beauty-controls-hint">Mueve el tocador</span>
        <button className="beauty-direction-button" type="button" aria-label="Mover tocador a la derecha" onClick={() => moveByButton(1)} disabled={paused}>
          <ArrowRight size={22} aria-hidden="true" />
        </button>
      </div>

      <p className="beauty-arcade-status" role="status" aria-live="polite">{statusMessage}</p>
    </section>
  );
}
