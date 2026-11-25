import { useEffect, useRef, useState, type FormEvent } from 'react';
import { ArrowRight, Check, RotateCcw } from 'lucide-react';
import type { ArtworkLevel, GameLevel } from '../types/game';
import { playSoundAndVibrate } from '../utils/soundHelper';

type LevelChallengeProps = {
  level: GameLevel;
  onSolved: () => void;
  isLastLevel: boolean;
};

function normalizeAnswer(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLocaleLowerCase('es');
}

function ArtworkCanvas({ level, revealed }: { level: ArtworkLevel; revealed: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const pixelSize = level.effects?.pixelSize ?? 8;
  const blurPx = level.effects?.blurPx ?? 1;
  const hueDeg = level.effects?.hueDeg ?? 45;
  const saturate = level.effects?.saturate ?? 1.1;

  useEffect(() => {
    if (revealed) return;
    let cancelled = false;
    const img = new Image();
    img.src = level.imageSrc;

    img.onload = () => {
      if (cancelled || !canvasRef.current) return;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const block = Math.max(2, pixelSize);
      const baseWidth = 720;
      const ratio =
        img.naturalHeight && img.naturalWidth
          ? img.naturalHeight / img.naturalWidth
          : 0.75;
      const targetW = Math.max(40, Math.round(baseWidth / block));
      const targetH = Math.max(40, Math.round(targetW * ratio));

      canvas.width = targetW;
      canvas.height = targetH;
      ctx.imageSmoothingEnabled = false;
      ctx.clearRect(0, 0, targetW, targetH);
      ctx.drawImage(img, 0, 0, targetW, targetH);
    };

    return () => {
      cancelled = true;
    };
  }, [level.imageSrc, pixelSize, revealed]);

  if (revealed) {
    return (
      <div className="artwork-stage is-revealed">
        <div className="artwork-mat">
          <img
            src={level.imageSrc}
            alt={level.answer}
            className="artwork-media is-revealed"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="artwork-stage">
      <div className="artwork-mat">
        <canvas
          ref={canvasRef}
          aria-label="Cuadro con efectos visuales"
          className="artwork-media is-pixelated"
          style={{
            filter: `blur(${blurPx}px) hue-rotate(${hueDeg}deg) saturate(${saturate})`,
          }}
        />
      </div>
    </div>
  );
}

export function LevelChallenge({ level, onSolved, isLastLevel }: LevelChallengeProps) {
  const [selected, setSelected] = useState('');
  const [answer, setAnswer] = useState('');
  const [orderedItems, setOrderedItems] = useState<string[]>([]);
  const [notice, setNotice] = useState('');
  const [artworkRevealed, setArtworkRevealed] = useState(false);

  const handleCheckResult = (isCorrect: boolean, errorMessage: string) => {
    if (isCorrect) {
      if (!isLastLevel) {
        playSoundAndVibrate('level_up');
      }
      onSolved();
    } else {
      playSoundAndVibrate('fail_level');
      setNotice(errorMessage);
    }
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (level.kind === 'artwork') {
      if (artworkRevealed) {
        handleCheckResult(true, '');
        return;
      }
      if (selected === level.answer) {
        playSoundAndVibrate('level_up');
        setArtworkRevealed(true);
        setNotice('¡Correcto! Mira el cuadro original sin efectos.');
      } else {
        handleCheckResult(false, 'No es ese cuadro. ¡Fíjate bien en las formas y los colores!');
      }
      return;
    }

    let isCorrect = false;
    let errorMessage = '';

    if (level.kind === 'choice') {
      isCorrect = selected === level.answer;
      errorMessage = '¡Casi! Prueba otra respuesta.';
    } else if (level.kind === 'word') {
      isCorrect = normalizeAnswer(answer) === normalizeAnswer(level.answer);
      errorMessage = 'Esa no era. ¡Inténtalo otra vez!';
    } else if (level.kind === 'order') {
      isCorrect = orderedItems.every((item, index) => item === level.correctOrder[index])
        && orderedItems.length === level.correctOrder.length;
      errorMessage = 'El orden no está del todo bien. Puedes quitar el último paso y probar de nuevo.';
    }

    handleCheckResult(isCorrect, errorMessage);
  };

  const toggleOrderItem = (item: string) => {
    setNotice('');
    setOrderedItems((current) => current.includes(item)
      ? current.filter((currentItem) => currentItem !== item)
      : [...current, item]);
  };

  const resetOrder = () => {
    setOrderedItems([]);
    setNotice('');
  };

  if (level.kind === 'artwork') {
    return (
      <form className="challenge-form" onSubmit={handleSubmit}>
        <p className="challenge-prompt">¿Qué cuadro se esconde detrás de los efectos?</p>
        <ArtworkCanvas level={level} revealed={artworkRevealed} />

        <div className="answer-options">
          {level.options.map((option, index) => (
            <button
              className={`answer-option ${selected === option ? 'is-selected' : ''}`}
              type="button"
              aria-pressed={selected === option}
              autoFocus={index === 0}
              disabled={artworkRevealed}
              key={option}
              onClick={() => {
                setSelected(option);
                setNotice('');
              }}
            >
              <span>{option}</span>
              {selected === option && <Check size={18} aria-hidden="true" />}
            </button>
          ))}
        </div>

        <p className="challenge-feedback" role="status" aria-live="polite">{notice}</p>

        {artworkRevealed ? (
          <button className="button button-primary challenge-submit" type="submit" data-sound="none">
            Siguiente <ArrowRight size={18} aria-hidden="true" />
          </button>
        ) : (
          <button
            className="button button-primary challenge-submit"
            type="submit"
            disabled={!selected}
            data-sound="none"
          >
            Comprobar respuesta <Check size={18} aria-hidden="true" />
          </button>
        )}
      </form>
    );
  }

  if (level.kind === 'choice') {
    return (
      <form className="challenge-form" onSubmit={handleSubmit}>
        <p className="challenge-prompt">{level.prompt}</p>
        {level.hint && <p className="challenge-hint">{level.hint}</p>}
        <div className="answer-options">
          {level.options.map((option, index) => (
            <button
              className={`answer-option ${selected === option ? 'is-selected' : ''}`}
              type="button"
              aria-pressed={selected === option}
              autoFocus={index === 0}
              key={option}
              onClick={() => { setSelected(option); setNotice(''); }}
            >
              <span>{option}</span>
              {selected === option && <Check size={18} aria-hidden="true" />}
            </button>
          ))}
        </div>
        <p className="challenge-feedback" role="status" aria-live="polite">{notice}</p>
        <button className="button button-primary challenge-submit" type="submit" disabled={!selected} data-sound="none">
          Comporbar respuesta <Check size={18} aria-hidden="true" />
        </button>
      </form>
    );
  }

  if (level.kind === 'word') {
    return (
      <form className="challenge-form" onSubmit={handleSubmit}>
        <p className="challenge-prompt">{level.prompt}</p>
        <p className="challenge-hint">{level.clue}</p>
        <label className="field-label" htmlFor="hidden-word-answer">Escribe la palabra</label>
        <input
          autoFocus
          id="hidden-word-answer"
          className="word-input"
          value={answer}
          onChange={(event) => { setAnswer(event.target.value); setNotice(''); }}
          autoComplete="off"
          autoCapitalize="none"
          spellCheck={false}
          maxLength={24}
          required
        />
        <p className="challenge-feedback" role="status" aria-live="polite">{notice}</p>
        <button className="button button-primary challenge-submit" type="submit" disabled={!answer.trim()} data-sound="none">
          Probar palabra <Check size={18} aria-hidden="true" />
        </button>
      </form>
    );
  }

  return (
    <form className="challenge-form" onSubmit={handleSubmit}>
      <p className="challenge-prompt">{level.prompt}</p>
      <p className="challenge-hint">{level.detail}</p>
      <ol className="order-sequence" aria-label="Pasos elegidos en orden">
        {orderedItems.map((item, index) => (
          <li key={item}><span>{index + 1}</span>{item}</li>
        ))}
        {orderedItems.length === 0 && <li className="order-empty">Tu secuencia aparecerá aquí</li>}
      </ol>
      <div className="order-options" aria-label="Pasos disponibles">
        {level.items.map((item, index) => {
          const itemPosition = orderedItems.indexOf(item);
          return (
            <button
              type="button"
              className={`order-option ${itemPosition >= 0 ? 'is-selected' : ''}`}
              aria-pressed={itemPosition >= 0}
              autoFocus={index === 0}
              key={item}
              onClick={() => toggleOrderItem(item)}
            >
              {itemPosition >= 0 && <span className="order-position">{itemPosition + 1}</span>}
              {item}
            </button>
          );
        })}
      </div>
      <p className="challenge-feedback" role="status" aria-live="polite">{notice}</p>
      <div className="challenge-actions">
        <button className="button button-secondary" type="button" onClick={resetOrder} disabled={orderedItems.length === 0}>
          <RotateCcw size={16} aria-hidden="true" /> Reiniciar
        </button>
        <button className="button button-primary challenge-submit" type="submit" disabled={orderedItems.length !== level.correctOrder.length} data-sound="none">
          Comprobar orden <Check size={18} aria-hidden="true" />
        </button>
      </div>
    </form>
  );
}