import type { MartaDefinition, MartaId } from '../types/game';

export const appCopy = {
  title: '¡Bienvenido al Martalendario de Adviento! 🎄✨',
  subtitle: 'Un calendario hecho de recuerdos, risas y siete versiones muy especiales de Marta.',
  rulesTitle: 'Las reglas del juego',
  rules: [
    'Hay 24 casillas y 7 personalidades de Marta escondidas detrás de sus minijuegos.',
    'Completa las pruebas de una Marta para iluminar su insignia y descubrir qué regalos abre.',
    'Las casillas cerradas guardan el misterio. La número 24 se abrirá al completar las siete Martas.',
    'Tu progreso se guarda en este dispositivo, así que puedes volver cuando quieras.',
  ],
  finalTitle: '¡El gran final del Martalendario!',
  finalMessage: 'Siete Martas, veintitrés regalos y una aventura hecha con muchísimo cariño. ¡Feliz cumpleaños!',
};

export const giftNumbersByMarta: Record<MartaId, number[]> = {
  little: [1, 8, 15],
  lovely: [2, 9, 16],
  artist: [3, 10, 17],
  hungry: [4, 11, 18],
  traveling: [5, 12, 19],
  music: [6, 13, 20, 22],
  beauty: [7, 14, 21, 23],
};

export const calendarLayout = [
  [13,13, 2,17,17, 1],
  [13,13, 5, 5,20,20],

  [23, 8, 8,11,11,24],
  [23,4, 4,19,19,24],

  [ 6,14, 9,22,22,22],
  [ 3, 3,16,10,21,21],

  [ 7,15,15,12,18,18]
];

export function buildCalendarTiles(layout:number[][]) {
  const map = new Map<number,{
    number:number;
    row:number;
    col:number;
    rowSpan:number;
    colSpan:number;
  }>();

  layout.forEach((line,row) => {
    line.forEach((value,col) => {

      if (!map.has(value)) {

        map.set(value,{
          number:value,
          row,
          col,
          rowSpan:1,
          colSpan:1
        });

      } else {

        const tile = map.get(value)!;

        tile.rowSpan =
          Math.max(tile.rowSpan,row - tile.row + 1);

        tile.colSpan =
          Math.max(tile.colSpan,col - tile.col + 1);
      }

    });
  });

  return Array
    .from(map.values())
    .sort((a,b)=>a.number-b.number);
}

export const martaColorMap: Record<string, string> = {
  coral: '#ff6481',
  pink: '#ff9cba',
  yellow: '#ffd84b',
  orange: '#ff9c52',
  blue: '#8acbf4',
  purple: '#be9afa',
  lilac: '#baa9ff',
};

export const martas: MartaDefinition[] = [
  {
    id: 'little',
    name: 'Little Marta',
    title: 'La Marta juguetona',
    emoji: '🧸',
    color: 'coral',
    description: 'Curiosa, traviesa y siempre lista para encontrar un tesoro escondido entre sus juguetes.',
    giftNumbers: giftNumbersByMarta.little,
    gameTitle: 'Memorama de Juguetes',
    gameIntro: 'Encuentra las 6 parejas de manera consecutiva sin equivocarte. Si fallas, se ocultan y vuelves a empezar.',
    levels: [
      { label: 'Memorama · 6 parejas' },
    ],
  },
  {
    id: 'lovely',
    name: 'Lovely Marta',
    title: 'La Marta romántica',
    emoji: '❤️',
    color: 'pink',
    description: 'Dulce y detallista; convierte los pequeños momentos en recuerdos para guardar juntitos.',
    giftNumbers: giftNumbersByMarta.lovely,
    gameTitle: 'Palabras de dos',
    gameIntro: 'Descubre tres palabras que esconden pistas de vuestra historia.',
    levels: [
      { kind: 'word', label: 'Palabra 1', prompt: 'Un gesto pequeño que siempre se siente enorme.', clue: 'Tiene 6 letras y empieza por A.', answer: 'abrazo' },
      { kind: 'word', label: 'Palabra 2', prompt: 'Una pausa rica para compartir sin mirar el reloj.', clue: 'Tiene 8 letras y suele empezar con C.', answer: 'cafecito' },
      { kind: 'word', label: 'Palabra 3', prompt: 'Ese lugar que también puede ser una persona.', clue: 'Tiene 5 letras y empieza por H.', answer: 'hogar' },
    ],
  },
  {
    id: 'artist',
    name: 'Artist Marta',
    title: 'La Marta creativa',
    emoji: '🎨',
    color: 'yellow',
    description: 'Imaginativa y llena de color: siempre encuentra una forma bonita de crear algo único.',
    giftNumbers: giftNumbersByMarta.artist,
    gameTitle: 'Obra Distorsionada',
    gameIntro: 'Reconoce cada cuadro pese al pixelado, el desenfoque y el cambio de color.',
    levels: [
      {
        kind: 'artwork',
        label: 'Obra 1',
        // Ajusta el nombre exacto del archivo en public/pictures si es necesario
        imageSrc: '/pictures/girasoles.jpg',
        options: [
          'Campo de trigo con cipreses de Van Gogh',
          'Los girasoles de Van Gogh',
          'La terraza de café por la noche de Van Gogh',
        ],
        answer: 'Los girasoles de Van Gogh',
        effects: { pixelSize: 12, blurPx: 2, hueDeg: 85, saturate: 1.25 },
      },
      {
        kind: 'artwork',
        label: 'Obra 2',
        imageSrc: '/pictures/puente-japones.jpg',
        options: [
          'El puente japonés de Monet',
          'Estanque de nenúfares de Monet',
          'Paseo junto al acantilado de Monet',
        ],
        answer: 'El puente japonés de Monet',
        effects: { pixelSize: 14, blurPx: 2.5, hueDeg: 130, saturate: 1.3 },
      },
      {
        kind: 'artwork',
        label: 'Obra 3',
        imageSrc: '/pictures/jardin-delicias.jpg',
        options: [
          'El carro de heno de El Bosco',
          'El jardín de las delicias del Bosco',
          'El triunfo de la muerte de Bruegel',
        ],
        answer: 'El jardín de las delicias del Bosco',
        effects: { pixelSize: 15, blurPx: 2, hueDeg: -75, saturate: 1.2 },
      },
    ],
  },
  {
    id: 'hungry',
    name: 'Hungry Marta',
    title: 'La Marta de las tapas',
    emoji: '🍻',
    color: 'orange',
    description: 'Disfrutona y de buen apetito: una buena tapa y una charla larga siempre son un gran plan.',
    giftNumbers: giftNumbersByMarta.hungry,
    gameTitle: 'La Ruta de las Tapas',
    gameIntro: 'Tres preguntas para abrir el apetito y ganarte esta insignia.',
    levels: [
      { kind: 'choice', label: 'Pregunta 1', prompt: '¿Qué estilo de cerveza suele ser dorado, ligero y refrescante?', options: ['Lager', 'Stout', 'Lambic'], answer: 'Lager' },
      { kind: 'choice', label: 'Pregunta 2', prompt: '¿Cuál de estos platos es una tapa clásica para compartir?', options: ['Tortilla española', 'Tarta de cumpleaños', 'Gachas de avena'], answer: 'Tortilla española' },
      { kind: 'choice', label: 'Pregunta 3', prompt: '¿Qué tapa suele servirse con salsa brava?', options: ['Patatas bravas', 'Boquerones en vinagre', 'Pan con tomate'], answer: 'Patatas bravas' },
    ],
  },
  {
    id: 'traveling',
    name: 'Traveling Marta',
    title: 'La Marta viajera',
    emoji: '✈️',
    color: 'blue',
    description: 'Curiosa y aventurera, siempre tiene ganas de conocer un rincón nuevo y llenar la cámara de fotos.',
    giftNumbers: giftNumbersByMarta.traveling,
    gameTitle: 'Pasaporte de Emojis',
    gameIntro: 'Lee las pistas viajeras y adivina tres destinos.',
    levels: [
      { kind: 'choice', label: 'Destino 1', prompt: '🗼🥐🎨 ¿Qué ciudad buscamos?', options: ['París', 'Roma', 'Lisboa'], answer: 'París' },
      { kind: 'choice', label: 'Destino 2', prompt: '🍕🏛️🛵 ¿Dónde paramos a comer?', options: ['Atenas', 'Roma', 'Madrid'], answer: 'Roma' },
      { kind: 'choice', label: 'Destino 3', prompt: '🗻🍣🌸 ¿Qué destino aparece en el mapa?', options: ['Seúl', 'Kioto', 'Tokio'], answer: 'Tokio' },
    ],
  },
  {
    id: 'music',
    name: 'Music Marta',
    title: 'La Marta indie',
    emoji: '🎵',
    color: 'purple',
    description: 'Lleva una banda sonora para cada aventura y siempre encuentra una canción que encaja.',
    giftNumbers: giftNumbersByMarta.music,
    gameTitle: 'Completa la Frase Indie',
    gameIntro: 'Tres frases originales con una palabra desaparecida. ¡Que siga la música!',
    levels: [
      { kind: 'choice', label: 'Verso 1', prompt: '“Con la ventanilla abierta y bailando bajo la …”', options: ['Luna', 'Lluvia', 'Mesa'], answer: 'Luna' },
      { kind: 'choice', label: 'Verso 2', prompt: '“Guardamos los veranos en una vieja …”', options: ['Botella', 'Melodía', 'Ventana'], answer: 'Melodía' },
      { kind: 'choice', label: 'Verso 3', prompt: '“Si el mundo se acelera, nos bajamos en …”', options: ['Marte', 'Casa', 'Bicicleta'], answer: 'Bicicleta' },
    ],
  },
  {
    id: 'beauty',
    name: 'Beauty Marta',
    title: 'La Marta beauty',
    emoji: '💄',
    color: 'lilac',
    description: 'Fan del maquillaje, la cosmética y esos ratitos de autocuidado que recargan el ánimo.',
    giftNumbers: giftNumbersByMarta.beauty,
    gameTitle: '¡Atrapacosméticos!',
    gameIntro: 'Desliza el tocador para atrapar cinco cosméticos por nivel. ¡Esquiva las trampas!',
    levels: [
      { label: 'Nivel 1 · Preparación', catchTarget: 5, fallSpeedPxPerSecond: 118, spawnIntervalMs: 1050 },
      { label: 'Nivel 2 · Tocador en marcha', catchTarget: 5, fallSpeedPxPerSecond: 154, spawnIntervalMs: 880 },
      { label: 'Nivel 3 · ¡A toda velocidad!', catchTarget: 5, fallSpeedPxPerSecond: 192, spawnIntervalMs: 730 },
    ],
  },
];

export const giftOwnerByNumber = Object.fromEntries(
  martas.flatMap((marta) =>
    marta.giftNumbers.map((number) => [
      number,
      marta.id,
    ])
  )
) as Record<number, MartaId>;


export const martaById = Object.fromEntries(
  martas.map((marta) => [marta.id, marta])
) as Record<MartaId, MartaDefinition>;
