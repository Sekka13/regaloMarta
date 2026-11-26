import { useEffect, useMemo, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowRight, Heart, Music2, Sparkles, Stars } from 'lucide-react';
import { appCopy, martas, martaById } from './data/config';
import { useGameProgress } from './hooks/useGameProgress';
import { CalendarBoard } from './components/CalendarBoard';
import { MartaBadgeRail } from './components/MartaBadgeRail';
import { GameDialog } from './components/GameDialog';
import yoPic from '../public/pictures/yoPic.webp'
import { FinalDialog, GiftDialog } from './components/CelebrationDialogs';
import { playSoundAndVibrate } from './utils/soundHelper';
import type { MartaId } from './types/game';

type Screen = 'welcome' | 'rules' | 'board';

function FloatingDecorations() {
  return (
    <div className="floating-decorations" aria-hidden="true">
      <span className="decoration decoration-star">✦</span>
      <span className="decoration decoration-heart"><Heart size={17} fill="currentColor" /></span>
      <span className="decoration decoration-note"><Music2 size={19} /></span>
      <span className="decoration decoration-sparkle">✧</span>
      <span className="decoration decoration-dot">●</span>
      <span className="decoration decoration-small-heart">♥</span>
    </div>
  );
}

function WelcomeScreen({ onContinue }: { onContinue: () => void }) {
  const reduceMotion = Boolean(useReducedMotion());
  return (
    <main className="welcome-screen min-h-dvh grid place-items-center">
      <FloatingDecorations />
      <motion.section
        className="welcome-card paper-card"
        initial={reduceMotion ? false : { opacity: 0, y: 24, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: reduceMotion ? 0 : 0.45, type: 'spring', bounce: 0.23 }}
      >
        <div className="welcome-sticker sticker-holly" aria-hidden="true">❤️</div>
        <div className="welcome-sticker sticker-sparkle" aria-hidden="true">✨</div>
        <div className="hero-art" aria-hidden="true">
          <span className="hero-orbit hero-orbit-one" />
          <span className="hero-orbit hero-orbit-two" />
          <span className="hero-gift hero-gift-one">🎁</span>
          <span className="hero-gift hero-gift-two">🎀</span>
          <span className="hero-star hero-star-one">✦</span>
          <span className="hero-star hero-star-two">✧</span>
          <span className="hero-center-emoji">                    <img
                      src={yoPic}
                      alt=""
                    
                    /></span>
        </div>
        <p className="eyebrow welcome-eyebrow">Reina de la tocinería...</p>
        <h1>{appCopy.title}</h1>
        <p className="welcome-subtitle">{appCopy.subtitle}</p>
        <button className="button button-primary welcome-continue" type="button" onClick={onContinue}>
          Continuar <ArrowRight size={19} aria-hidden="true" />
        </button>
        <p className="welcome-footnote"><Sparkles size={14} aria-hidden="true" /> Hecho con cariño, para Marta <Heart size={14} fill="currentColor" aria-hidden="true" /></p>
      </motion.section>
      <p className="page-caption">Martalendario · edición de cumpleaños</p>
    </main>
  );
}

function RulesScreen({ onContinue }: { onContinue: () => void }) {
  const reduceMotion = Boolean(useReducedMotion());
  return (
    <main className="rules-screen min-h-dvh grid place-items-center">
      <FloatingDecorations />
      <motion.section
        className="rules-card paper-card"
        initial={reduceMotion ? false : { opacity: 0, y: 22 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: reduceMotion ? 0 : 0.34 }}
      >
        <div className="rules-icon" aria-hidden="true">📜</div>
        <p className="eyebrow">Antes de empezar</p>
        <h1>{appCopy.rulesTitle}</h1>
        <ol className="rules-list">
          {appCopy.rules.map((rule, index) => (
            <li key={rule}>
              <span className="rule-number">{index + 1}</span>
              <span>{rule}</span>
            </li>
          ))}
        </ol>
        <div className="rules-tip"><span aria-hidden="true">💡</span><p>Consejito: puedes jugar en el orden que quieras.</p></div>
        <button className="button button-primary rules-continue" type="button" onClick={onContinue}>
          ¡Entendido! <ArrowRight size={19} aria-hidden="true" />
        </button>
      </motion.section>
    </main>
  );
}

export default function App() {
  // --- DELEGACIÓN GLOBAL DE EVENTOS PARA BOTONES ---
  // Hace que cualquier <button> o [role="button"] reproduzca 'pop' automáticamente,
  // permitiendo sobrescribirlo con data-sound="nombre" o silenciarlo con data-sound="none".
  useEffect(() => {
    const handleGlobalClick = (event: PointerEvent) => {
      const target = event.target as HTMLElement;
      const button = target.closest('button') || target.closest('[role="button"]');

      if (button) {
        const customSound = button.getAttribute('data-sound');
        if (customSound === 'none') return; // Si es silencioso, no hace nada
        
        const soundToPlay = (customSound as any) || 'pop';
        playSoundAndVibrate(soundToPlay);
      }
    };

    window.addEventListener('pointerdown', handleGlobalClick);
    return () => window.removeEventListener('pointerdown', handleGlobalClick);
  }, []);
  // ------------------------------------------------



  const [progress, setProgress] = useGameProgress();
  const [screen, setScreen] = useState<Screen>(() => progress.rulesSeen ? 'board' : 'welcome');
  const [activeMartaId, setActiveMartaId] = useState<MartaId | null>(null);
  const [celebrateUnlock, setCelebrateUnlock] = useState(false);
  const [giftNumber, setGiftNumber] = useState<number | null>(null);
  const [finalOpen, setFinalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [revealMartaId, setRevealMartaId] = useState<MartaId | null>(null);
  const reduceMotion = Boolean(useReducedMotion());
  const [videosPaused, setVideosPaused] = useState(reduceMotion);
  const completedCount = progress.completedMartaIds.length;
  const activeMarta = activeMartaId ? martaById[activeMartaId] : null;

  useEffect(() => {
    if (reduceMotion) setVideosPaused(true);
  }, [reduceMotion]);

  useEffect(() => {
    if (!toastMessage) return;
    const timeout = window.setTimeout(() => setToastMessage(''), 3000);
    return () => window.clearTimeout(timeout);
  }, [toastMessage]);

  useEffect(() => {
    if (!revealMartaId) return;
    const timeout = window.setTimeout(() => setRevealMartaId(null), 1800);
    return () => window.clearTimeout(timeout);
  }, [revealMartaId]);

  const badgeProgressText = useMemo(() => `${completedCount} de 7 personalidades desbloqueadas`, [completedCount]);

  const showBoard = () => {
    setProgress((current) => ({ ...current, rulesSeen: true }));
    setScreen('board');
  };

  const selectMarta = (id: MartaId) => {
    setCelebrateUnlock(!progress.completedMartaIds.includes(id));
    setActiveMartaId(id);
  };

  const closeGame = () => {
    if (activeMarta && celebrateUnlock && progress.completedMartaIds.includes(activeMarta.id)) {
      setRevealMartaId(activeMarta.id);
    }
    setActiveMartaId(null);
    setCelebrateUnlock(false);
  };

  const solveLevel = () => {
    if (!activeMarta) return;
    const martaId = activeMarta.id;
    const totalLevels = activeMarta.levels.length;
    setProgress((current) => {
      const currentLevel = current.levelProgress[martaId];
      if (currentLevel >= totalLevels) return current;

      const nextLevel = currentLevel + 1;
      const completedMartaIds = nextLevel >= totalLevels && !current.completedMartaIds.includes(martaId)
        ? [...current.completedMartaIds, martaId]
        : current.completedMartaIds;

      return {
        ...current,
        levelProgress: { ...current.levelProgress, [martaId]: nextLevel },
        completedMartaIds,
      };
    });
  };

  const openGift = (number: number) => {
    if (number === 24) {
      setProgress((current) => ({ ...current, finalOpened: true }));
      setFinalOpen(true);
      return;
    }

    setProgress((current) => ({
      ...current,
      openedGiftNumbers: current.openedGiftNumbers.includes(number)
        ? current.openedGiftNumbers
        : [...current.openedGiftNumbers, number],
    }));
    setGiftNumber(number);
  };

  const selectCalendarCell = (number: number) => {
    if (number === 24) {
      setToastMessage('Completa las siete Martas para abrir la casilla 24.');
      return;
    }

    const owner = martas.find((marta) => marta.giftNumbers.includes(number));
    if (owner) {
      selectMarta(owner.id);
      return;
    }
    setToastMessage('¡Esta casilla aún está cerrada!');
  };

  if (screen === 'welcome') return <WelcomeScreen onContinue={() => setScreen('rules')} />;
  if (screen === 'rules') return <RulesScreen onContinue={showBoard} />;

  return (
    <div className="app-shell">
      <FloatingDecorations />
      <header className="board-header">
        <div className="brand-mark" aria-hidden="true"><span>YO</span></div>
        <div className="board-heading">
          <p className="eyebrow">Tu aventura de cumpleaños</p>
          <h1>Martalendario <span>de Adviento</span></h1>
        </div>
        <div className="progress-pill" aria-label={badgeProgressText}>
          <Stars size={16} aria-hidden="true" />
          <span>{completedCount}<span className="progress-total"> / 7</span></span>
        </div>
      </header>

      <main className="board-main mx-auto w-full">
        <section className="board-intro paper-card">
          <div>
            <p className="eyebrow">¡Hola, cumpleañera!</p>
            <h2>Elige una casilla</h2>
            <p>Juega al minijuego y descubre qué Marta desbloquea para abrir sus regalos.</p>
          </div>
          <div className="board-intro-sticker" aria-hidden="true">💌</div>
        </section>

        <MartaBadgeRail
          completedMartaIds={progress.completedMartaIds}
          videosPaused={videosPaused}
          animateMartaId={revealMartaId}
        />

        <div className="motion-control-row">
          <p>{reduceMotion ? 'Las animaciones están pausadas según tus preferencias.' : 'Las Martas están listas para bailar.'}</p>
          <button
            type="button"
            className="motion-toggle"
            onClick={() => setVideosPaused((paused) => !paused)}
          >
            {videosPaused ? 'Reanudar bailes' : 'Pausar bailes'}
          </button>
        </div>

        <CalendarBoard
          progress={progress}
          revealMartaId={revealMartaId}
          onOpenGift={openGift}
          onLocked={selectCalendarCell}
        />

        <footer className="board-footer">
          <p>Un regalo a la vez, una Marta a la vez <span aria-hidden="true">💝</span></p>
          <p>Tu progreso se guarda automáticamente en este dispositivo.</p>
        </footer>
      </main>

      {toastMessage && (
        <motion.p
          className="status-toast"
          role="status"
          initial={reduceMotion ? false : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reduceMotion ? 0 : 0.16 }}
        >
          {toastMessage}
        </motion.p>
      )}

      <GameDialog
        key={activeMartaId ?? 'closed-game'}
        marta={activeMarta}
        completedLevels={activeMartaId ? progress.levelProgress[activeMartaId] : 0}
        celebrateUnlock={celebrateUnlock}
        videosPaused={videosPaused}
        onSolved={solveLevel}
        onContinue={closeGame}
      />
      <GiftDialog giftNumber={giftNumber} onClose={() => setGiftNumber(null)} />
      <FinalDialog open={finalOpen} onClose={() => setFinalOpen(false)} />
    </div>
  );
}
