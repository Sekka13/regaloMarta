import { useEffect, useRef } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import confetti from 'canvas-confetti';
import { ArrowRight, Sparkles } from 'lucide-react';
import { CharacterVideo } from './CharacterVideo';
import { BeautyArcade } from './BeautyArcade';
import { MemoryGame } from './MemoryGame'; 
import { DialogFrame } from './DialogFrame';
import { LevelChallenge } from './LevelChallenge';
import { playSoundAndVibrate } from '../utils/soundHelper';
import type { MartaDefinition } from '../types/game';

type GameDialogProps = {
  marta: MartaDefinition | null;
  completedLevels: number;
  celebrateUnlock: boolean;
  videosPaused: boolean;
  onSolved: () => void;
  onContinue: () => void;
};

export function GameDialog({ marta, completedLevels, celebrateUnlock, videosPaused, onSolved, onContinue }: GameDialogProps) {
  const reduceMotion = Boolean(useReducedMotion());
  const celebrated = useRef(false);
  const isComplete = Boolean(marta && completedLevels >= marta.levels.length);
  const titleId = marta ? `game-title-${marta.id}` : 'game-title-closed';
  const isLastLevel = marta ? completedLevels >= marta.levels.length - 1 : false;

  useEffect(() => {
    celebrated.current = false;
  }, [marta?.id]);

  useEffect(() => {
    if (!isComplete || !celebrateUnlock || reduceMotion || celebrated.current) return;
    celebrated.current = true;
    playSoundAndVibrate('victory_game');
    void confetti({
      particleCount: 120,
      spread: 82,
      startVelocity: 34,
      origin: { y: 0.62 },
      colors: ['#ff557d', '#ffd43b', '#2abf9e', '#7065ff', '#ff8e48'],
      disableForReducedMotion: true,
    });
  }, [celebrateUnlock, isComplete, reduceMotion]);

  return (
    <DialogFrame open={Boolean(marta)} labelledBy={titleId} onClose={onContinue} className="game-dialog">
      {marta && (
        <AnimatePresence mode="wait" initial={false}>
          {isComplete ? (
            <motion.section
              key="unlocked"
              className="win-content"
              initial={reduceMotion ? false : { opacity: 0, y: 24, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: reduceMotion ? 0 : 0.32, type: 'spring', bounce: 0.24 }}
            >
              <div className="prize-label"><Sparkles size={16} aria-hidden="true" /> ¡Premio! <Sparkles size={16} aria-hidden="true" /></div>
              <CharacterVideo id={marta.id} name={marta.name} play={!videosPaused && !reduceMotion} className="win-character" />
              <p className="eyebrow">Personalidad desbloqueada</p>
              <h2 id={titleId}>¡Enhorabuena, has desbloqueado a {marta.name}!</h2>
              <p className="win-description">{marta.description}</p>
              <div className="gift-unlock-note">
                <span className="gift-note-icon" aria-hidden="true">🎁</span>
                <p>Ahora puedes abrir los regalos <strong>{marta.giftNumbers.join(', ')}</strong> en el tablero.</p>
              </div>
              <button className="button button-primary continue-button" type="button" onClick={onContinue}>
                Continuar <ArrowRight size={19} aria-hidden="true" />
              </button>
            </motion.section>
          ) : (
            <motion.section
              key={`game-${marta.id}-${completedLevels}`}
              className="game-content"
              initial={reduceMotion ? false : { opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: reduceMotion ? 0 : 0.2 }}
            >
              <p className="eyebrow">{marta.emoji} Minijuego de {marta.name}</p>
              <h2 id={titleId}>{marta.gameTitle}</h2>
              <p className="game-intro">{marta.gameIntro}</p>
              
              {/* Ocultamos el medidor tradicional en memory game, beauty y music (para no adelantar el título de la canción) */}
              {marta.id !== 'little' && marta.id !== 'beauty' && marta.id !== 'music' && (
                <div className="level-meter">
                  <div className="level-meter-copy">
                    <span>{marta.levels[completedLevels]?.label ?? 'Pruebas'}</span>
                    <span>Prueba {completedLevels + 1} de {marta.levels.length}</span>
                  </div>
                  <div
                    className="level-meter-track"
                    role="progressbar"
                    aria-label={`Progreso de ${marta.name}`}
                    aria-valuemin={0}
                    aria-valuemax={marta.levels.length}
                    aria-valuenow={completedLevels}
                  >
                    <span style={{ width: `${(completedLevels / marta.levels.length) * 100}%` }} />
                  </div>
                </div>
              )}

              {marta.id === 'music' && (
                <div className="level-meter">
                  <div className="level-meter-copy">
                    <span>Canción misteriosa</span>
                    <span>Prueba {completedLevels + 1} de {marta.levels.length}</span>
                  </div>
                  <div
                    className="level-meter-track"
                    role="progressbar"
                    aria-label={`Progreso de ${marta.name}`}
                    aria-valuemin={0}
                    aria-valuemax={marta.levels.length}
                    aria-valuenow={completedLevels}
                  >
                    <span style={{ width: `${(completedLevels / marta.levels.length) * 100}%` }} />
                  </div>
                </div>
              )}
              
              {marta.id === 'beauty' ? (
                <BeautyArcade
                  key={`beauty-level-${completedLevels}`}
                  level={marta.levels[completedLevels]}
                  completedLevels={completedLevels}
                  onLevelComplete={onSolved}
                  isLastLevel={isLastLevel}
                />
              ) : marta.id === 'little' ? (
                <MemoryGame
                  key="memory-game-little"
                  onGameComplete={() => {
                    onSolved();
                  }}
                />
              ) : (
                <LevelChallenge
                  key={`${marta.id}-level-${completedLevels}`}
                  level={marta.levels[completedLevels]}
                  onSolved={onSolved}
                  isLastLevel={isLastLevel}
                />
              )}
            </motion.section>
          )}
        </AnimatePresence>
      )}
    </DialogFrame>
  );
}
