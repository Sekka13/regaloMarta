import { useState, type FormEvent } from 'react';
import { Check, RotateCcw } from 'lucide-react';
import type { GameLevel } from '../types/game';

type LevelChallengeProps = {
  level: GameLevel;
  onSolved: () => void;
};

function normalizeAnswer(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLocaleLowerCase('es');
}

export function LevelChallenge({ level, onSolved }: LevelChallengeProps) {
  const [selected, setSelected] = useState('');
  const [answer, setAnswer] = useState('');
  const [orderedItems, setOrderedItems] = useState<string[]>([]);
  const [notice, setNotice] = useState('');

  const submitChoice = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (level.kind !== 'choice') return;
    if (selected === level.answer) {
      onSolved();
      return;
    }
    setNotice('¡Casi! Prueba otra respuesta.');
  };

  const submitWord = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (level.kind !== 'word') return;
    if (normalizeAnswer(answer) === normalizeAnswer(level.answer)) {
      onSolved();
      return;
    }
    setNotice('Esa no era. ¡Inténtalo otra vez!');
  };

  const submitOrder = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (level.kind !== 'order') return;
    const isCorrect = orderedItems.every((item, index) => item === level.correctOrder[index])
      && orderedItems.length === level.correctOrder.length;
    if (isCorrect) {
      onSolved();
      return;
    }
    setNotice('El orden no está del todo bien. Puedes quitar el último paso y probar de nuevo.');
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

  if (level.kind === 'choice') {
    return (
      <form className="challenge-form" onSubmit={submitChoice}>
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
        <button className="button button-primary challenge-submit" type="submit" disabled={!selected}>
          Comprobar respuesta <Check size={18} aria-hidden="true" />
        </button>
      </form>
    );
  }

  if (level.kind === 'word') {
    return (
      <form className="challenge-form" onSubmit={submitWord}>
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
        <button className="button button-primary challenge-submit" type="submit" disabled={!answer.trim()}>
          Probar palabra <Check size={18} aria-hidden="true" />
        </button>
      </form>
    );
  }

  return (
    <form className="challenge-form" onSubmit={submitOrder}>
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
        <button className="button button-primary challenge-submit" type="submit" disabled={orderedItems.length !== level.correctOrder.length}>
          Comprobar orden <Check size={18} aria-hidden="true" />
        </button>
      </div>
    </form>
  );
}
