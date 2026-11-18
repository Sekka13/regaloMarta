import { useState, type FormEvent } from 'react';
import { Check, RotateCcw } from 'lucide-react';
import type { GameLevel } from '../types/game';
import { playSoundAndVibrate } from '../utils/soundHelper'; // 👈 1. Importamos el helper de sonido

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

export function LevelChallenge({ level, onSolved, isLastLevel }: LevelChallengeProps) {
  const [selected, setSelected] = useState('');
  const [answer, setAnswer] = useState('');
  const [orderedItems, setOrderedItems] = useState<string[]>([]);
  const [notice, setNotice] = useState('');

  // 🎯 2. Función centralizada para manejar el resultado del nivel
  const handleCheckResult = (isCorrect: boolean, errorMessage: string) => {
    if (isCorrect) {
      if(!isLastLevel){
        playSoundAndVibrate('level_up'); // 🌟 Sonido de acierto
      } 
      onSolved();                     // Avanza de nivel
    } else {
      playSoundAndVibrate('fail_level'); // ❌ Sonido de fallo
      setNotice(errorMessage);           // Muestra el mensaje de error correspondiente
    }
  };

  // 🎯 3. Función unificada handleSubmit que sustituye a los 3 submits antiguos
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    let isCorrect = false;
    let errorMessage = '';

    if (level.kind === 'choice') {
      isCorrect = selected === level.answer;
      errorMessage = '¡Casi! Prueba otra respuesta.';
    } 
    else if (level.kind === 'word') {
      isCorrect = normalizeAnswer(answer) === normalizeAnswer(level.answer);
      errorMessage = 'Esa no era. ¡Inténtalo otra vez!';
    } 
    else if (level.kind === 'order') {
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
        {/* 👈 4. Añadimos data-sound="none" aquí para apagar el pop global */}
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
        {/* 👈 4. Añadimos data-sound="none" aquí también */}
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
        {/* 👈 4. Añadimos data-sound="none" en el botón de comprobar orden */}
        <button className="button button-primary challenge-submit" type="submit" disabled={orderedItems.length !== level.correctOrder.length} data-sound="none">
          Comprobar orden <Check size={18} aria-hidden="true" />
        </button>
      </div>
    </form>
  );
}