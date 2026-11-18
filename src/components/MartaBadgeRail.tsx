import { motion, useReducedMotion } from 'framer-motion';
import { martas } from '../data/config';
import { CharacterVideo } from './CharacterVideo';
import type { MartaId } from '../types/game';

type MartaBadgeRailProps = {
  completedMartaIds: MartaId[];
  videosPaused: boolean;
  animateMartaId: MartaId | null;
};

export function MartaBadgeRail({ completedMartaIds, videosPaused, animateMartaId }: MartaBadgeRailProps) {
  const reduceMotion = Boolean(useReducedMotion());
  const completedCount = completedMartaIds.length;

  return (
    <section className="progress-section" aria-labelledby="marta-progress-heading">
      <div className="section-heading-row progress-heading-row">
        <h2 id="marta-progress-heading">Las siete Martas</h2>
        <span className="badge-total">{completedCount} / 7</span>
      </div>

      <div className="marta-progress-wrap">
        <progress
          className="marta-progress-track"
          value={completedCount}
          max={7}
          aria-label={`Progreso de las Martas: ${completedCount} de 7 desbloqueadas`}
        />
        <ol className="marta-progress-list" role="list">
          {martas.map((marta) => {
            const unlocked = completedMartaIds.includes(marta.id);
            const isNewlyUnlocked = animateMartaId === marta.id;
            return (
              <li
                className={`progress-personality progress-${marta.color} ${unlocked ? 'is-unlocked' : 'is-locked'}`}
                key={marta.id}
              >
                <span className="progress-sr-label visually-hidden">
                  {unlocked ? `${marta.name}: desbloqueada` : 'Personalidad bloqueada'}
                </span>
                <span className="progress-character-slot">
                  {unlocked && (
                    <motion.span
                      className="progress-character-reveal"
                      initial={isNewlyUnlocked && !reduceMotion ? { opacity: 0, y: 12, scale: 0.55 } : false}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ duration: reduceMotion ? 0 : 0.44, type: 'spring', bounce: 0.48 }}
                    >
                      <CharacterVideo
                        id={marta.id}
                        name={marta.name}
                        play={!videosPaused && !reduceMotion}
                        className="progress-character-video"
                      />
                    </motion.span>
                  )}
                </span>
                <motion.span
                  className="progress-emoji"
                  role="img"
                  aria-label={marta.emoji}
                  animate={isNewlyUnlocked && !reduceMotion
                    ? { scale: [0.55, 1.34, 0.92, 1], rotate: [-12, 8, -3, 0] }
                    : { scale: 1, rotate: 0 }}
                  transition={{ duration: reduceMotion ? 0 : 0.72, type: 'spring', bounce: 0.42 }}
                >
                  {marta.emoji}
                </motion.span>
                {isNewlyUnlocked && !reduceMotion && (
                  <motion.span
                    className="progress-unlock-sparkle"
                    aria-hidden="true"
                    initial={{ opacity: 0, scale: 0.3, rotate: -25 }}
                    animate={{ opacity: [0, 1, 0], scale: [0.3, 1.2, 0.8], rotate: [0, 15, 35] }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                  >
                    ✨
                  </motion.span>
                )}
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
