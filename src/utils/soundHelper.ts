
// pop.mp3 (botones y elementos generales)
// open.mp3 (al abrir casillas del calendario)
// catch_good.mp3 (al atrapar cosmético bueno en Beauty Marta)
// catch_bad.mp3 (al atrapar trampa o fallo menor)
// level_up.mp3 (al pasar de nivel)
// fail_level.mp3 (al perder y reiniciar nivel o elegir respuesta incorrecta)
// victory_game.mp3 (al completar los 3 niveles del minijuego)
// final_victory.mp3 (al abrir la caja final 24)

export type SoundName =
  | 'pop'
  | 'open'
  | 'catch_good'
  | 'catch_bad'
  | 'level_up'
  | 'fail_level'
  | 'victory_game'
  | 'final_victory';

const HAPTIC_PATTERNS: Record<SoundName, number | number[]> = {
  pop: 15,
  open: [20, 30, 20],
  catch_good: 30,
  catch_bad: [40, 40, 40],
  level_up: [30, 50, 30],
  fail_level: [80, 50, 80],
  victory_game: [50, 80, 50, 80],
  final_victory: [100, 100, 100, 200],
};

// Lista de todos los sonidos que queremos precargar en segundo plano
const ALL_SOUNDS: SoundName[] = [
  'pop',
  'open',
  'catch_good',
  'catch_bad',
  'level_up',
  'fail_level',
  'victory_game',
  'final_victory',
];

// Caché para guardar las instancias de audio ya listas
const preloadedAudios: Record<SoundName, HTMLAudioElement> = {} as Record<SoundName, HTMLAudioElement>;

// Precarga automática inmediata al cargar el script en el navegador
if (typeof window !== 'undefined') {
  ALL_SOUNDS.forEach((sound) => {
    const audio = new Audio(`/audio/${sound}.mp3`);
    audio.preload = 'auto';
    audio.load(); // Forzamos la carga inicial en el búfer del navegador
    preloadedAudios[sound] = audio;
  });
}

export function playSoundAndVibrate(sound: SoundName): void {
  // 1. Reproducción ultra rápida clonando el audio ya precargado
  try {
    const baseAudio = preloadedAudios[sound];
    if (baseAudio) {
      const instance = baseAudio.cloneNode(true) as HTMLAudioElement;
      instance.volume = 0.65;
      void instance.play().catch(() => {});
    }
  } catch {}

  // 2. Respuesta háptica instantánea
  if (typeof window !== 'undefined' && typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate(HAPTIC_PATTERNS[sound]);
    } catch {}
  }
}
