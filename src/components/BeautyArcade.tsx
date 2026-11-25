/**
 * ============================================================================
 *  BeautyArcade.tsx — Minijuego "Atrapacosméticos"
 * ============================================================================
 *
 *  CÓMO FUNCIONA (resumen)
 *  -----------------------
 *  1. Caen objetos (cosméticos "buenos" y trampas) desde arriba del campo.
 *  2. El jugador arrastra el dedo para mover el tocador abajo del todo.
 *  3. Si un cosmético toca el tocador -> suma. Si es trampa -> resta una vida.
 *  4. Al llegar a `level.catchTarget` cosméticos -> nivel superado.
 *     Al llegar a 0 vidas -> game over.
 *
 *  ARQUITECTURA (importante para no romper nada)
 *  ---------------------------------------------
 *  - El bucle del juego (requestAnimationFrame) NO usa estado de React para
 *    mover cosas por pantalla. Usa REFS + escritura directa al DOM (transform).
 *    Así se evita re-renderizar 60 veces por segundo.
 *  - El estado de React (useState) solo se usa para lo que SÍ cambia la UI de
 *    forma discreta: vidas, contador, lista de objetos montados, overlays...
 *  - Toda la geometría está en PÍXELES dentro del campo de juego.
 *
 *  GUÍA RÁPIDA: "QUIERO CAMBIAR X, ¿QUÉ TOCO?"
 *  --------------------------------------------
 *  - Tamaño de los iconos que caen ........ ITEM_SIZE
 *  - Ancho / alto del tocador ................ TRAY_WIDTH / VANITY_HEIGHT
 *  - Alto del campo de juego .................. FIELD_HEIGHT
 *  - Dificultad de colisión (hitbox) ......... HORIZONTAL_TOLERANCE (+ más fácil)
 *  - Cantidad de trampas ...................... BASE_TRAP_PROBABILITY,
 *                                                TRAP_PROBABILITY_PER_LEVEL,
 *                                                MAX_TRAP_PROBABILITY
 *  - Vidas por nivel .......................... LIVES_PER_LEVEL
 *  - Velocidad de caída / frecuencia .......... vienen de `level` (props):
 *                                                fallSpeedPxPerSecond, spawnIntervalMs
 *                                                y se ajustan por nivel en el bucle
 *                                                (speedMultiplier / levelSpawnInterval)
 *  - Qué cosméticos / trampas existen ........ GOOD_COSMETICS / TRAPS
 *  - Textos de los banners y botones ......... bloque JSX "Pantalla de bloqueo"
 *  - Explosión al impactar .................... componente <Burst /> y BURST_*
 *  - Suavidad del movimiento del tocador ..... constante 35 (ms) en "easing"
 *  - Flujo Start / Game Over / Siguiente ..... handleActionClick + efecto de
 *                                                "Reinicio cuando cambia de nivel"
 * ============================================================================
 */

import { useCallback, useEffect, useRef, useState, type PointerEvent } from 'react';
import { AnimatePresence, motion, useAnimation, useReducedMotion } from 'framer-motion';
import { Heart, Play, Sparkles } from 'lucide-react';
import brushIcon from '../../public/icons/brush.png';
import lipstickIcon from '../../public/icons/lipstick.png';
import mascaraIcon from '../../public/icons/mascara.png';
import perfumeIcon from '../../public/icons/perfume.png';
import onionIcon from '../../public/icons/onion.png';
import poopIcon from '../../public/icons/poop.png';
import spiderIcon from '../../public/icons/spider.png';
import type { BeautyArcadeLevel } from '../types/game';
import { playSoundAndVibrate } from '../utils/soundHelper';

/** Tipo del nombre de sonido que acepta tu helper (evita errores de TS con 'catch_good', etc.). */
type SoundName = Parameters<typeof playSoundAndVibrate>[0];

// ============================================================================
//  TIPOS
// ============================================================================

/** Definición base de un icono del juego (bueno o trampa). */
type ArcadeIcon = {
  id: string;
  label: string;
  kind: 'good' | 'trap';
  src?: string;
  emoji?: string;
};

/** Un objeto que está cayendo ahora mismo. */
type FallingItem = ArcadeIcon & {
  instanceId: number;
  /** Posición horizontal normalizada (0..1) dentro del ancho útil del campo. */
  xRatio: number;
  /** Coordenada Y (px) del borde SUPERIOR del objeto. */
  y: number;
  /** Velocidad de caída en px/segundo. */
  speed: number;
};

/** Un cosmético ya recogido (se dibuja sobre el tocador). */
type VanityItem = ArcadeIcon & {
  instanceId: number;
  /** Nivel en el que se recogió (para no perderlo al reintentar). */
  stage: number;
};

/** Datos de una explosión visual en el punto de impacto. */
type BurstEffect = {
  id: number;
  x: number; // centro en px dentro del campo
  y: number; // centro en px dentro del campo
  kind: 'good' | 'trap';
  src?: string;
  emoji?: string;
};

/** Pantalla de bloqueo que se muestra (null = juego en marcha). */
type OverlayState = { type: 'start' | 'gameover' | 'nextlevel'; text: string } | null;

type BeautyArcadeProps = {
  level: BeautyArcadeLevel;
  completedLevels: number;
  onLevelComplete: () => void;
  isLastLevel: boolean;
};

// ============================================================================
//  CONSTANTES DE AJUSTE (aquí se toca casi todo)
// ============================================================================

/** Cosméticos que suman. Añade/quita entradas para cambiar los objetos buenos. */
const GOOD_COSMETICS: ArcadeIcon[] = [
  { id: 'mascara', label: 'Máscara de pestañas', kind: 'good', src: mascaraIcon },
  { id: 'lipstick', label: 'Pintalabios', kind: 'good', src: lipstickIcon },
  { id: 'brush', label: 'Brocha', kind: 'good', src: brushIcon },
  { id: 'perfume', label: 'Perfume', kind: 'good', src: perfumeIcon },
];

/** Trampas que restan vida. Añade/quita entradas para cambiar las trampas. */
const TRAPS: ArcadeIcon[] = [
  { id: 'poop', label: 'Trampa', kind: 'trap', src: poopIcon },
  { id: 'onion', label: 'Trampa', kind: 'trap', src: onionIcon },
  { id: 'spider', label: 'Trampa', kind: 'trap', src: spiderIcon },
];

/** Vidas con las que empieza cada nivel. */
const LIVES_PER_LEVEL = 3;

/** Tamaño (px) de los iconos que caen. También afecta a la hitbox y a la explosión. */
const ITEM_SIZE = 36;

/** Ancho (px) del tocador. */
const TRAY_WIDTH = 140;

/** Alto (px) del tocador. El tocador va pegado abajo del todo. */
const VANITY_HEIGHT = 60;

/** Alto (px) de la zona de juego. */
const FIELD_HEIGHT = 520;

/**
 * TOLERANCIA DE COLISIÓN HORIZONTAL (px).
 * El objeto cuenta como "atrapado" si la distancia entre su CENTRO y el CENTRO del
 * tocador es <= TRAY_WIDTH / 2 + HORIZONTAL_TOLERANCE.
 *   - 0  -> el centro del objeto debe estar justo dentro del tocador (preciso).
 *   - >0 -> más permisivo (atrapa objetos que rozan el borde).
 *   - <0 -> más exigente (el centro debe estar bien dentro del tocador).
 */
const HORIZONTAL_TOLERANCE = ITEM_SIZE * 0.1;

/**
 * PROFUNDIDAD DE CAPTURA VERTICAL (px).
 * El objeto cuenta como "atrapado" cuando su borde INFERIOR ha bajado esta cantidad
 * POR DEBAJO de la parte superior del tocador.
 *   - 0  -> cuenta en cuanto roza la parte superior (muy temprano).
 *   - Más alto -> el objeto tiene que "entrar" más en el tocador antes de contar.
 * Si sigue contando demasiado pronto, súbelo; si cuenta tarde, bájalo.
 * Recomendado: entre 0 y ~25 (con valores mayores la ventana de captura se estrecha).
 */
const VERTICAL_CATCH_DEPTH = ITEM_SIZE * 0.1;

/**
 * HUECOS DEL TOCADOR (dónde se colocan los cosméticos recogidos).
 *  - VANITY_SLOTS ........ nº de huecos fijos, de izquierda a derecha.
 *  - VANITY_ICON_SIZE .... tamaño (px) de cada icono colocado.
 *  - VANITY_ICON_BOTTOM .. separación (px) desde el borde inferior del tocador.
 * El ancho de cada hueco se calcula solo a partir de TRAY_WIDTH (menos 4px de borde).
 */
const VANITY_SLOTS = 5;
const VANITY_ICON_SIZE = 24;
const VANITY_ICON_BOTTOM = 6;
const VANITY_SLOT_WIDTH = (TRAY_WIDTH - 4) / VANITY_SLOTS;

/** Duración (ms) tras la que se elimina una explosión del estado. */
const BURST_DURATION_MS = 600;

/** Número de partículas de cada explosión. */
const BURST_PARTICLES = 8;

/**
 * PROBABILIDAD DE QUE UN OBJETO SEA TRAMPA (0..1).
 * probabilidad = BASE + nivelesCompletados * PER_LEVEL, con tope MAX.
 */
const BASE_TRAP_PROBABILITY = 0.5;
const TRAP_PROBABILITY_PER_LEVEL = 0.06;
const MAX_TRAP_PROBABILITY = 0.75;

/**
 * ARRANQUE DIRECTO TRAS "SIGUIENTE NIVEL".
 * Guardamos a nivel de MÓDULO (fuera del componente) el instante en que se pulsó
 * el botón de siguiente nivel. Así, aunque el componente padre desmonte y vuelva a
 * montar este componente (por ejemplo, al cambiar una `key`), el nuevo montaje
 * sabe que debe arrancar el juego directamente y no mostrar "¡Empezar Juego!".
 * La ventana de tiempo evita que una marca antigua afecte a una partida futura.
 */
let autoStartRequestedAt = 0;
const AUTO_START_WINDOW_MS = 3000;
const shouldAutoStart = () => Date.now() - autoStartRequestedAt < AUTO_START_WINDOW_MS;

// ============================================================================
//  FUNCIONES AUXILIARES
// ============================================================================

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

/** Cosméticos que ya están en el tocador al empezar un nivel (los de niveles anteriores). */
function startingVanity(completedLevels: number): VanityItem[] {
  const items: VanityItem[] = [];
  for (let s = 0; s < completedLevels; s++) {
    for (let i = 0; i < 5; i++) {
      items.push({
        ...GOOD_COSMETICS[i % GOOD_COSMETICS.length],
        instanceId: -s * 10 - i - 1,
        stage: s,
      });
    }
  }
  return items;
}

/** Centro X (px) de un objeto a partir de su ratio normalizado (0..1) y el ancho del campo. */
function itemCenterX(item: FallingItem, fieldWidth: number): number {
  const usable = Math.max(0, fieldWidth - ITEM_SIZE);
  return ITEM_SIZE / 2 + item.xRatio * usable;
}

// ============================================================================
//  COMPONENTE DE EXPLOSIÓN
// ============================================================================

/**
 * Explosión que se dibuja en el punto de impacto:
 *  - el icono se agranda y se desvanece,
 *  - un anillo se expande,
 *  - salen partículas en todas direcciones.
 * Con `prefers-reduced-motion` solo se hace un desvanecimiento simple.
 */
function Burst({ effect, reduceMotion }: { effect: BurstEffect; reduceMotion: boolean }) {
  const isGood = effect.kind === 'good';
  // Colores: rosa para cosméticos, rojo oscuro para trampas (cámbialos aquí)
  const particleColor = isGood ? '#f472b6' : '#7f1d1d';
  const ringColor = isGood ? 'rgba(244,114,182,0.9)' : 'rgba(220,38,38,0.9)';

  return (
    <div
      className="absolute z-30 pointer-events-none"
      style={{ left: effect.x, top: effect.y, width: 0, height: 0 }}
      aria-hidden="true"
    >
      {/* Icono: escalado rápido + desvanecimiento */}
      <motion.div
        className="absolute flex items-center justify-center"
        style={{ width: ITEM_SIZE, height: ITEM_SIZE, left: -ITEM_SIZE / 2, top: -ITEM_SIZE / 2 }}
        initial={{ scale: 1, opacity: 1 }}
        animate={reduceMotion ? { opacity: 0 } : { scale: [1, 1.5, 2.1], opacity: [1, 0.9, 0] }}
        transition={{ duration: reduceMotion ? 0.15 : 0.35, ease: 'easeOut' }}
      >
        {effect.src ? (
          <img src={effect.src} alt="" draggable={false} className="w-full h-full object-contain" />
        ) : (
          <span>{effect.emoji}</span>
        )}
      </motion.div>

      {!reduceMotion && (
        <>
          {/* Anillo expansivo */}
          <motion.div
            className="absolute rounded-full"
            style={{
              width: ITEM_SIZE,
              height: ITEM_SIZE,
              left: -ITEM_SIZE / 2,
              top: -ITEM_SIZE / 2,
              border: `3px solid ${ringColor}`,
            }}
            initial={{ scale: 0.4, opacity: 0.9 }}
            animate={{ scale: 2.2, opacity: 0 }}
            transition={{ duration: 0.45, ease: 'easeOut' }}
          />

          {/* Partículas repartidas en círculo */}
          {Array.from({ length: BURST_PARTICLES }, (_, i) => {
            const angle = (i / BURST_PARTICLES) * Math.PI * 2;
            const distance = 34 + (i % 2) * 14; // alternan cortas y largas
            return (
              <motion.span
                key={i}
                className="absolute rounded-full"
                style={{
                  width: 8,
                  height: 8,
                  left: -4,
                  top: -4,
                  backgroundColor: i % 3 === 0 ? '#fde047' : particleColor,
                }}
                initial={{ x: 0, y: 0, scale: 1, opacity: 1 }}
                animate={{
                  x: Math.cos(angle) * distance,
                  y: Math.sin(angle) * distance - 6,
                  scale: 0,
                  opacity: 0,
                }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
              />
            );
          })}
        </>
      )}
    </div>
  );
}

// ============================================================================
//  COMPONENTE PRINCIPAL
// ============================================================================

export function BeautyArcade({ level, completedLevels, onLevelComplete, isLastLevel }: BeautyArcadeProps) {
  const reduceMotion = Boolean(useReducedMotion());
  /** Controla la animación de "rebote" del tocador al atrapar un cosmético. */
  const vanityControls = useAnimation();

  // --------------------------------------------------------------------------
  //  REFS DE DOM
  // --------------------------------------------------------------------------
  const fieldRef = useRef<HTMLDivElement>(null); // el campo de juego
  const trayRef = useRef<HTMLDivElement>(null); // contenedor posicionable del tocador
  const itemElsRef = useRef<Map<number, HTMLDivElement>>(new Map()); // instanceId -> elemento DOM

  // --------------------------------------------------------------------------
  //  REFS DE JUEGO (fuente de verdad dentro del bucle; no provocan re-render)
  // --------------------------------------------------------------------------
  const fieldSizeRef = useRef({ width: 0, height: 0 }); // tamaño real del campo en px
  const fallingItemsRef = useRef<FallingItem[]>([]); // objetos cayendo (con su Y actual)
  const playerPxRef = useRef(-1); // centro X del tocador en px (-1 = sin inicializar)
  const targetPxRef = useRef(-1); // hacia dónde quiere ir el tocador (posición del dedo)
  const caughtRef = useRef(0); // cosméticos atrapados en este nivel
  const livesRef = useRef(LIVES_PER_LEVEL); // vidas restantes
  const nextItemIdRef = useRef(0); // contador de ids de objetos
  const nextBurstIdRef = useRef(0); // contador de ids de explosiones
  const onLevelCompleteRef = useRef(onLevelComplete); // siempre la última callback del padre
  const statusTimeoutRef = useRef<number | null>(null); // timeout del mensaje de estado
  const burstTimeoutsRef = useRef<number[]>([]); // timeouts de explosiones (para limpiar)
  /** Clave del nivel actual; sirve para detectar cuándo cambia de nivel sin disparar en el montaje. */
  const levelKeyRef = useRef(`${completedLevels}-${level.catchTarget}`);

  // --------------------------------------------------------------------------
  //  ESTADO DE REACT (solo lo que necesita re-render)
  // --------------------------------------------------------------------------
  /** Si venimos de "Siguiente nivel" (incluso tras remontaje), se arranca directamente. */
  const [startsImmediately] = useState(() => shouldAutoStart());

  const [isPlaying, setIsPlaying] = useState(startsImmediately);
  const [renderItems, setRenderItems] = useState<FallingItem[]>([]); // objetos montados en el DOM
  const [bursts, setBursts] = useState<BurstEffect[]>([]); // explosiones activas
  const [caughtThisLevel, setCaughtThisLevel] = useState(0);
  const [lives, setLives] = useState(LIVES_PER_LEVEL);
  const [collected, setCollected] = useState<VanityItem[]>(() => startingVanity(completedLevels));
  const [statusMessage, setStatusMessage] = useState('Desliza para atrapar cosméticos y esquiva trampas.');
  const [overlayState, setOverlayState] = useState<OverlayState>(
    startsImmediately ? null : { type: 'start', text: '¡Listos para jugar!' },
  );

  // Mantener siempre la última versión de la callback del padre
  onLevelCompleteRef.current = onLevelComplete;

  // --------------------------------------------------------------------------
  //  UTILIDADES INTERNAS
  // --------------------------------------------------------------------------

  /** Muestra un mensaje bajo el campo durante ~1.8 s. */
  const announce = useCallback((message: string) => {
    setStatusMessage(message);
    if (statusTimeoutRef.current !== null) window.clearTimeout(statusTimeoutRef.current);
    statusTimeoutRef.current = window.setTimeout(() => setStatusMessage(''), 1800);
  }, []);

  /** Escribe la posición actual del tocador directamente en el DOM (sin re-render). */
  const applyTrayPosition = useCallback(() => {
    const tray = trayRef.current;
    if (!tray || playerPxRef.current < 0) return;
    tray.style.transform = `translate3d(${playerPxRef.current - TRAY_WIDTH / 2}px, 0, 0)`;
  }, []);

  /** Deja vidas, contador, objetos y tocador listos para empezar una ronda desde cero. */
  const resetRound = useCallback(() => {
    livesRef.current = LIVES_PER_LEVEL;
    caughtRef.current = 0;
    fallingItemsRef.current = [];
    itemElsRef.current.clear();
    setLives(LIVES_PER_LEVEL);
    setCaughtThisLevel(0);
    setRenderItems([]);
    setBursts([]);
    const { width } = fieldSizeRef.current;
    if (width > 0) {
      // Tocador centrado
      playerPxRef.current = width / 2;
      targetPxRef.current = width / 2;
      applyTrayPosition();
    }
  }, [applyTrayPosition]);

  /** Crea una explosión en (x, y) y la elimina del estado cuando termina. */
  const spawnBurst = useCallback((effect: Omit<BurstEffect, 'id'>) => {
    const id = nextBurstIdRef.current++;
    setBursts((current) => [...current, { ...effect, id }]);
    const timeout = window.setTimeout(() => {
      setBursts((current) => current.filter((b) => b.id !== id));
      burstTimeoutsRef.current = burstTimeoutsRef.current.filter((t) => t !== timeout);
    }, BURST_DURATION_MS);
    burstTimeoutsRef.current.push(timeout);
  }, []);

  // --------------------------------------------------------------------------
  //  EFECTO: limpieza al desmontar
  // --------------------------------------------------------------------------
  useEffect(
    () => () => {
      if (statusTimeoutRef.current !== null) window.clearTimeout(statusTimeoutRef.current);
      burstTimeoutsRef.current.forEach((t) => window.clearTimeout(t));
      burstTimeoutsRef.current = [];
    },
    [],
  );

  // --------------------------------------------------------------------------
  //  EFECTO: consumir la marca de "arranque directo" tras montar
  //  (se lee en el estado inicial y se borra aquí para que no afecte a futuros montajes)
  // --------------------------------------------------------------------------
  useEffect(() => {
    autoStartRequestedAt = 0;
  }, []);

  // --------------------------------------------------------------------------
  //  EFECTO: reinicio cuando cambia de nivel SIN remontar el componente
  //  (si el padre sí lo remonta, lo resuelve el estado inicial de arriba).
  //  Si se pulsó "Siguiente nivel" -> arranca directo. Si no -> pantalla de inicio.
  // --------------------------------------------------------------------------
  useEffect(() => {
    const key = `${completedLevels}-${level.catchTarget}`;
    if (levelKeyRef.current === key) return; // no cambió el nivel (p. ej. montaje inicial)
    levelKeyRef.current = key;

    resetRound();
    setCollected(startingVanity(completedLevels));

    if (shouldAutoStart()) {
      autoStartRequestedAt = 0;
      setOverlayState(null);
      setIsPlaying(true);
    } else {
      setIsPlaying(false);
      setOverlayState({ type: 'start', text: '¡Listos para jugar!' });
    }
  }, [completedLevels, level.catchTarget, resetRound]);

  // --------------------------------------------------------------------------
  //  EFECTO: medir el campo en tiempo real (ResizeObserver)
  //  Mantiene el tocador dentro del campo si cambia el tamaño de pantalla.
  // --------------------------------------------------------------------------
  useEffect(() => {
    const field = fieldRef.current;
    if (!field) return;

    const measureField = () => {
      const bounds = field.getBoundingClientRect();
      fieldSizeRef.current = { width: bounds.width, height: bounds.height };

      // Rango permitido para el CENTRO del tocador: que sus bordes no salgan del campo
      const half = TRAY_WIDTH / 2;
      const minX = Math.min(half, bounds.width / 2);
      const maxX = Math.max(bounds.width - half, bounds.width / 2);

      if (playerPxRef.current < 0) {
        // Primera medición: centrar el tocador
        playerPxRef.current = bounds.width / 2;
        targetPxRef.current = bounds.width / 2;
      } else {
        playerPxRef.current = clamp(playerPxRef.current, minX, maxX);
        targetPxRef.current = clamp(targetPxRef.current, minX, maxX);
      }
      applyTrayPosition();
    };

    measureField();
    const resizeObserver = new ResizeObserver(measureField);
    resizeObserver.observe(field);
    return () => resizeObserver.disconnect();
  }, [applyTrayPosition]);

  // --------------------------------------------------------------------------
  //  EFECTO: BUCLE PRINCIPAL DEL JUEGO
  //  Solo corre mientras `isPlaying` es true y no hay overlay.
  //  Cada frame: mover tocador -> mover objetos -> spawn -> colisiones -> pintar.
  // --------------------------------------------------------------------------
  useEffect(() => {
    if (!isPlaying || overlayState) return;

    let animationFrame = 0;
    let lastFrameTime = 0;
    let spawnElapsed = 0; // tiempo acumulado desde el último spawn

    const tick = (time: number) => {
      if (!lastFrameTime) lastFrameTime = time;
      // `delta` en ms, limitado a 50 para evitar saltos si la pestaña se congela
      const delta = Math.min(time - lastFrameTime, 50);
      lastFrameTime = time;

      const { width, height } = fieldSizeRef.current;

      if (width > 0 && height > 0) {
        // ---- 1) Movimiento suavizado del tocador hacia el dedo -------------
        // 35 = "constante de tiempo" en ms: MENOR = sigue al dedo más rápido/brusco,
        // MAYOR = más suave pero con más retraso.
        const easing = 1 - Math.exp(-delta / (reduceMotion ? 90 : 35));
        playerPxRef.current += (targetPxRef.current - playerPxRef.current) * easing;
        applyTrayPosition();

        // ---- 2) Mover objetos hacia abajo ----------------------------------
        const speedFactor = reduceMotion ? 0.78 : 1;
        const items = fallingItemsRef.current;
        for (const item of items) {
          item.y += (item.speed * speedFactor * delta) / 1000;
        }

        // ---- 3) Aparición de nuevos objetos --------------------------------
        // El intervalo se acorta 110 ms por nivel completado (mínimo 420 ms)
        const levelSpawnInterval = Math.max(420, level.spawnIntervalMs - completedLevels * 110);
        let listChanged = false; // ¿hay que actualizar la lista montada en React?
        spawnElapsed += delta;
        while (spawnElapsed >= levelSpawnInterval) {
          spawnElapsed -= levelSpawnInterval;

          // Probabilidad de trampa (ver constantes BASE/PER_LEVEL/MAX)
          const trapProbability = Math.min(
            MAX_TRAP_PROBABILITY,
            BASE_TRAP_PROBABILITY + completedLevels * TRAP_PROBABILITY_PER_LEVEL,
          );
          const isGood = Math.random() >= trapProbability;
          const icon = isGood
            ? GOOD_COSMETICS[Math.floor(Math.random() * GOOD_COSMETICS.length)]
            : TRAPS[Math.floor(Math.random() * TRAPS.length)];

          // La velocidad sube un 16% por nivel y varía un poco entre objetos
          const speedMultiplier = 1 + completedLevels * 0.16;

          items.push({
            ...icon,
            instanceId: nextItemIdRef.current++,
            xRatio: Math.random(), // 0 = pegado a la izquierda, 1 = pegado a la derecha
            y: -ITEM_SIZE, // empieza justo fuera por arriba
            speed: level.fallSpeedPxPerSecond * speedMultiplier * (0.85 + Math.random() * 0.35),
          });
          listChanged = true;
        }

        // ---- 4) Colisiones --------------------------------------------------
        // Vertical: el borde inferior del objeto alcanza la parte superior del tocador.
        // Horizontal: el centro del objeto está dentro del ancho del tocador (+ tolerancia).
        const trayTop = height - VANITY_HEIGHT;
        const trayCenter = playerPxRef.current;
        const horizontalReach = TRAY_WIDTH / 2 + HORIZONTAL_TOLERANCE;

        const survivors: FallingItem[] = []; // objetos que siguen en juego
        const newCosmetics: VanityItem[] = []; // cosméticos atrapados en este frame
        let died = false;
        let completed = false;

        for (const item of items) {
          // Si el nivel ya terminó en este frame, descartamos el resto
          if (died || completed) {
            listChanged = true;
            continue;
          }

          const cx = itemCenterX(item, width);
          const itemBottom = item.y + ITEM_SIZE;
          const itemMidY = item.y + ITEM_SIZE / 2;

          // Ventana vertical de captura: desde que toca el tocador hasta ~60% de su altura.
          // Más allá se considera que el objeto "pasó de largo" y ya no se puede atrapar.
          const touchesTrayVertically =
            itemBottom >= trayTop + VERTICAL_CATCH_DEPTH && itemMidY <= trayTop + VANITY_HEIGHT * 0.6;
          const insideTrayHorizontally = Math.abs(cx - trayCenter) <= horizontalReach;

          if (touchesTrayVertically && insideTrayHorizontally) {
            // ¡Impacto contabilizado! -> explosión en el punto de contacto
            spawnBurst({
              x: cx,
              y: Math.min(itemMidY, trayTop + VERTICAL_CATCH_DEPTH),
              kind: item.kind,
              src: item.src,
              emoji: item.emoji,
            });
            listChanged = true;

            if (item.kind === 'good') {
              // ---- Cosmético atrapado ----
              playSoundAndVibrate('catch_good' as SoundName);
              caughtRef.current += 1;
              newCosmetics.push({ ...item, stage: completedLevels });

              // Rebote del tocador
              if (!reduceMotion) {
                void vanityControls.start({
                  scale: [1, 1.06, 1],
                  transition: { duration: 0.25, ease: 'easeOut' },
                });
              }

              if (caughtRef.current >= level.catchTarget) {
                completed = true;
              } else {
                announce(`¡${item.label} atrapado!`);
              }
            } else {
              // ---- Trampa atrapada ----
              playSoundAndVibrate('catch_bad' as SoundName);
              livesRef.current -= 1;

              if (livesRef.current <= 0) {
                died = true;
              } else {
                announce(`¡Era una trampa! Te quedan ${livesRef.current} vidas.`);
              }
            }
            continue; // el objeto se consume (no pasa a `survivors`)
          }

          // Salió por abajo sin ser atrapado -> se elimina
          if (item.y > height + ITEM_SIZE) {
            listChanged = true;
            continue;
          }

          survivors.push(item);
        }

        // ---- 5) Sincronizar estado de React SOLO cuando algo cambia ---------
        if (newCosmetics.length > 0) {
          setCollected((current) => [...current, ...newCosmetics]);
          setCaughtThisLevel(caughtRef.current);
        }
        setLives((current) => (current === livesRef.current ? current : livesRef.current));

        // Fin de nivel (game over o superado): parar el juego y mostrar overlay
        if (died || completed) {
          fallingItemsRef.current = [];
          itemElsRef.current.clear();
          setRenderItems([]);
          setIsPlaying(false);

          if (died) {
            playSoundAndVibrate('fail_level');
            setOverlayState({ type: 'gameover', text: '¡GAME OVER!' });
          } else {
            if (!isLastLevel) playSoundAndVibrate('level_up');
            announce('¡Tocador completo!');
            setOverlayState({ type: 'nextlevel', text: '¡NIVEL SUPERADO!' });
          }
          return; // no pedimos más frames; el efecto se reinicia al cambiar isPlaying
        }

        fallingItemsRef.current = survivors;
        if (listChanged) setRenderItems([...survivors]);

        // ---- 6) Pintar: posicionar objetos directamente en el DOM -----------
        for (const item of survivors) {
          const el = itemElsRef.current.get(item.instanceId);
          if (el) {
            el.style.transform = `translate3d(${itemCenterX(item, width) - ITEM_SIZE / 2}px, ${item.y}px, 0)`;
          }
        }
      }

      animationFrame = window.requestAnimationFrame(tick);
    };

    animationFrame = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(animationFrame);
  }, [
    isPlaying,
    overlayState,
    completedLevels,
    level.catchTarget,
    level.fallSpeedPxPerSecond,
    level.spawnIntervalMs,
    reduceMotion,
    isLastLevel,
    announce,
    applyTrayPosition,
    spawnBurst,
    vanityControls,
  ]);

  // --------------------------------------------------------------------------
  //  CONTROL TÁCTIL / PUNTERO
  //  Convierte la posición del dedo (clientX) a coordenadas dentro del campo y
  //  la limita para que el tocador cubra de borde a borde (0%–100% del ancho).
  // --------------------------------------------------------------------------
  const setTargetFromClientX = (clientX: number) => {
    const field = fieldRef.current;
    if (!field) return;
    const rect = field.getBoundingClientRect();
    if (rect.width === 0) return;

    const half = TRAY_WIDTH / 2;
    const rawX = clientX - rect.left; // posición del dedo dentro del campo, en px
    // El centro del tocador va entre `half` y `ancho - half`, así sus bordes tocan los del campo
    targetPxRef.current = clamp(rawX, Math.min(half, rect.width / 2), Math.max(rect.width - half, rect.width / 2));
  };

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (!isPlaying || overlayState) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    setTargetFromClientX(event.clientX);
  };

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!isPlaying || overlayState) return;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      setTargetFromClientX(event.clientX);
    }
  };

  const handlePointerEnd = (event: PointerEvent<HTMLDivElement>) => {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  // --------------------------------------------------------------------------
  //  BOTÓN DE LA PANTALLA DE BLOQUEO (Empezar / Reintentar / Siguiente nivel)
  // --------------------------------------------------------------------------
  const handleActionClick = () => {
    if (overlayState?.type === 'gameover') {
      // REINTENTAR: reinicia el nivel actual y arranca directamente
      resetRound();
      // Conserva los cosméticos de niveles anteriores, descarta los de este intento
      setCollected((current) => current.filter((cosmetic) => cosmetic.stage < completedLevels));
      setOverlayState(null);
      setIsPlaying(true);
    } else if (overlayState?.type === 'nextlevel') {
      // SIGUIENTE NIVEL: marcamos "arranque directo" y avisamos al padre.
      // Cuando el padre cambie el nivel (con o sin remontar el componente), el juego
      // arrancará solo, sin pasar por "¡Empezar Juego!".
      autoStartRequestedAt = Date.now();
      onLevelCompleteRef.current();
    } else {
      // EMPEZAR (primera pantalla)
      resetRound();
      setOverlayState(null);
      setIsPlaying(true);
    }
  };

  /** Texto del botón según la pantalla de bloqueo actual. */
  const actionLabel =
    overlayState?.type === 'gameover'
      ? 'Reintentar'
      : overlayState?.type === 'nextlevel'
        ? isLastLevel
          ? 'Continuar'
          : 'Siguiente nivel'
        : '¡Empezar Juego!';

  // Cosméticos recogidos en el nivel actual (los que se dibujan sobre el tocador)
  const currentLevelCollected = collected.filter((item) => item.stage === completedLevels);

  // Cada cosmético recibe un hueco fijo según su orden de llegada (0,1,2... y vuelta a 0).
  // Solo se muestran los últimos VANITY_SLOTS; los anteriores quedan reemplazados.
  const firstVisibleIndex = Math.max(0, currentLevelCollected.length - VANITY_SLOTS);
  const visibleVanityItems = currentLevelCollected.slice(firstVisibleIndex).map((cosmetic, k) => ({
    cosmetic,
    slot: (firstVisibleIndex + k) % VANITY_SLOTS,
  }));

  // --------------------------------------------------------------------------
  //  RENDER
  // --------------------------------------------------------------------------
  return (
    <section className="beauty-arcade-panel grid gap-2 w-full" aria-label="Minijuego Atrapacosméticos">
      {/* ---------- Barra superior: vidas y contador ---------- */}
      <div className="beauty-arcade-toolbar flex items-center justify-between px-2">
        <div className="beauty-arcade-counters flex items-center gap-3">
          <span
            className="beauty-lives flex items-center gap-1 font-bold text-pink-600 bg-pink-50 px-3 py-1 rounded-full border border-pink-200"
            role="group"
            aria-label={`Vidas: ${lives} de ${LIVES_PER_LEVEL}`}
          >
            <span className="flex items-center gap-1" aria-hidden="true">
              {Array.from({ length: LIVES_PER_LEVEL }, (_, index) => (
                <Heart
                  key={index}
                  size={17}
                  fill={index < lives ? 'currentColor' : 'none'}
                  className={index < lives ? 'text-red-500 animate-pulse' : 'text-gray-300'}
                />
              ))}
            </span>
            <span className="text-xs uppercase tracking-wider text-gray-600 ml-1">Vidas</span>
          </span>
          <span className="beauty-score font-semibold text-purple-700 bg-purple-50 px-3 py-1 rounded-full border border-purple-200 text-sm">
            {caughtThisLevel}/{level.catchTarget} cosméticos
          </span>
        </div>
      </div>

      {/* ---------- Zona de juego (alto = FIELD_HEIGHT) ---------- */}
      <div
        ref={fieldRef}
        className="beauty-game-field relative w-full bg-gradient-to-b from-pink-50/70 via-purple-50/50 to-pink-100/70 rounded-2xl border-2 border-pink-300 overflow-hidden touch-none select-none shadow-inner"
        style={{ height: FIELD_HEIGHT }}
        role="group"
        aria-label="Zona de juego táctil. Arrastra el tocador horizontalmente para atrapar cosméticos."
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerEnd}
        onPointerCancel={handlePointerEnd}
      >
        {/* Decoración */}
        <div
          className="beauty-field-stars absolute top-3 left-4 text-pink-300 text-xs select-none pointer-events-none"
          aria-hidden="true"
        >
          ✦ ✧ ✦
        </div>

        {/* Total de cosméticos acumulados */}
        <div
          className="beauty-field-capacity absolute top-3 right-4 flex items-center gap-1 text-xs font-bold text-purple-600 bg-white/90 px-3 py-1 rounded-full shadow-sm pointer-events-none"
          aria-hidden="true"
        >
          <Sparkles size={13} aria-hidden="true" />
          Total: {collected.length}
        </div>

        {/* Objetos cayendo: su posición la escribe el bucle vía `transform` */}
        {renderItems.map((item) => (
          <div
            key={item.instanceId}
            ref={(el) => {
              if (el) {
                // Registramos el elemento y fijamos su posición inicial
                itemElsRef.current.set(item.instanceId, el);
                const { width } = fieldSizeRef.current;
                el.style.transform = `translate3d(${itemCenterX(item, width) - ITEM_SIZE / 2}px, ${item.y}px, 0)`;
              } else {
                itemElsRef.current.delete(item.instanceId);
              }
            }}
            className={`beauty-falling-item absolute top-0 left-0 flex items-center justify-center drop-shadow-md pointer-events-none ${
              item.kind === 'trap' ? 'is-trap' : 'is-good'
            }`}
            style={{ width: ITEM_SIZE, height: ITEM_SIZE, willChange: 'transform' }}
            aria-hidden="true"
          >
            {item.src ? (
              <img src={item.src} alt="" draggable={false} className="w-full h-full object-contain" />
            ) : (
              <span>{item.emoji}</span>
            )}
          </div>
        ))}

        {/* Explosiones al impactar */}
        <AnimatePresence>
          {bursts.map((burst) => (
            <Burst key={burst.id} effect={burst} reduceMotion={reduceMotion} />
          ))}
        </AnimatePresence>

        {/* ---------- Pantalla de bloqueo (Start / Game Over / Nivel superado) ---------- */}
        {overlayState && (
          <div className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-black/50 backdrop-blur-sm p-4 text-center">
            {/* Banner: rojo = game over, verde = nivel superado, morado = inicio */}
            <div
              /* Solo texto (sin cartel). El grosor extra viene de font-black + el trazo
                 [-webkit-text-stroke]: sube el 3px para letras aún más gordas.
                 El color de cada pantalla es el que antes tenía el fondo del cartel. */
              className={`text-4xl font-black tracking-wider mb-6 transform animate-bounce [-webkit-text-stroke:3px_currentColor] ${
                overlayState.type === 'gameover'
                  ? 'text-red-600'
                  : overlayState.type === 'nextlevel'
                    ? 'text-emerald-500'
                    : 'text-white-600 text-4xl'
              }`}
            >
              {overlayState.text}
            </div>

            {/* Botón de acción (el texto sale de `actionLabel`) */}
            <button
              type="button"
              onClick={handleActionClick}
              className="flex items-center gap-2 px-8 py-4 bg-pink-500 hover:bg-pink-600 active:scale-95 text-white font-bold text-lg rounded-2xl shadow-[0_6px_0_0_rgba(157,23,77,1)] border-2 border-white transition-all cursor-pointer"
            >
              <Play size={22} fill="currentColor" />
              {actionLabel}
            </button>
          </div>
        )}

        {/* ---------- Tocador ----------
            El contenedor exterior se mueve con `transform` desde el bucle (en px).
            Va pegado abajo del todo (bottom-0). El interior hace el rebote al atrapar. */}
        <div
          ref={trayRef}
          className="beauty-vanity-positioner absolute bottom-0 left-0 z-20 pointer-events-none"
          style={{ width: TRAY_WIDTH, height: VANITY_HEIGHT, willChange: 'transform' }}
        >
          <motion.div
            className="beauty-vanity relative flex flex-col items-center justify-end bg-pink-200 border-2 border-black rounded-t-2xl shadow-[0_4px_0_0_rgba(0,0,0,0.8)] px-2 pb-1.5 pt-1 box-border"
            style={{ width: TRAY_WIDTH, height: VANITY_HEIGHT, transformOrigin: 'bottom center' }}
            animate={vanityControls}
            role="group"
            aria-label={`Tocador con ${currentLevelCollected.length} cosméticos recogidos`}
          >
            {/* Superficie superior de la mesa */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-pink-300 border-b border-black rounded-t-xl" />

            {/* Cosméticos recogidos en HUECOS FIJOS, de izquierda a derecha.
                Cada uno se queda en su hueco (no se desplaza al llegar otro).
                Si se supera VANITY_SLOTS, el siguiente reemplaza al más antiguo
                en ese mismo hueco (vuelve a empezar por la izquierda). */}
            {visibleVanityItems.map(({ cosmetic, slot }) => (
              <motion.div
                key={cosmetic.instanceId}
                className="absolute z-10 flex items-center justify-center drop-shadow-sm"
                style={{
                  width: VANITY_ICON_SIZE,
                  height: VANITY_ICON_SIZE,
                  left: slot * VANITY_SLOT_WIDTH + (VANITY_SLOT_WIDTH - VANITY_ICON_SIZE) / 2,
                  bottom: VANITY_ICON_BOTTOM,
                }}
                initial={reduceMotion ? false : { scale: 0, y: -12 }}
                animate={{ scale: 1, y: 0 }}
                transition={{ type: 'spring', stiffness: 500, damping: 22 }}
              >
                {cosmetic.src ? (
                  <img
                    src={cosmetic.src}
                    alt={cosmetic.label}
                    className="w-full h-full object-contain"
                    draggable={false}
                  />
                ) : (
                  <span className="text-xs">{cosmetic.emoji}</span>
                )}
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* ---------- Mensaje de estado (accesible) ---------- */}
      <p
        className="beauty-arcade-status text-xs text-center font-medium text-purple-600 h-5"
        role="status"
        aria-live="polite"
      >
        {statusMessage}
      </p>
    </section>
  );
}