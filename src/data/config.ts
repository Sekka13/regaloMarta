import type { MartaDefinition, MartaId } from '../types/game';

export const appCopy = {
  title: '¡Bienvenido al Martalendario de Adviento!',
  subtitle: '24 regalitos escogidos con mucho cariño por el Rey Tocino.',
  rulesTitle: 'Las reglas del juego',
  rules: [
    'Hay 24 casillas y 7 personalidades de Marta escondidas detrás de sus minijuegos.',
    'Completa las pruebas de una Marta para iluminar su insignia y descubrir qué regalos abre.',
    'Las casillas cerradas guardan el misterio. La número 24 se abrirá al completar las siete Martas.',
  ],
  finalTitle: '¡Has debloqueado la gran sorpresa!',
  finalMessage: 'Cada Marta representa una cosa que me gusta de ti, una faceta de todas las que forman la increible persona que eres. No imaginas de lo afortunado que me siento de poder conocer a las 7 Martas y lo feliz que me hace poder seguir descubriendo todas la que vendrán; porque aunque el tiempo cambie y con él las personas, yo abrazaré a todas las Martas que vengan y seguiré amando a las que ahora están.   Feliz cumpleaños cariño!',
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
    name: 'Pequeña Marta',
    title: 'La Marta juguetona',
    emoji: '🧸',
    color: 'coral',
    description: 'Con más años que un bosque Pequeña Marta sabe que la edad es solo un número y nada le impedirá volver a ser una niña y divertirse como tal. Con sus 22 añitos recien cumplidos faltaría más!',
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
    description: 'Dulce, tierna y adorable. A Lovely Marta le cuesta mostrar su amor, pero cuando lo hace te puedes sentir la persona mas afortunada del mundo.',
    giftNumbers: giftNumbersByMarta.lovely,
    gameTitle: 'Palabras de dos',
    gameIntro: 'Descubre tres palabras clave.',
    levels: [
      { kind: 'word', label: 'Palabra 1', prompt: 'A veces deseando, otras veces rehuyendo.', clue: 'Tiene 4 letras y empieza por S.', answer: 'sexo' },
      { kind: 'word', label: 'Palabra 2', prompt: 'Una cancion para recordarlo todo.', clue: 'incluye "La" antes, tiene 9 letras y empieza por S.', answer: 'salvación' },
      { kind: 'word', label: 'Palabra 3', prompt: 'Te has convertido en ese lugar para alguien.', clue: 'Tiene 5 letras y empieza por H.', answer: 'hogar' },
    ],
  },
  {
    id: 'artist',
    name: 'Marta Artista',
    title: 'La Marta creativa',
    emoji: '🎨',
    color: 'yellow',
    description: 'Imaginativa y llena de color, siempre encuentra una forma bonita de crear algo único. Lo mismo le das un puñado de hilos que un bote de pintura o un PC, la Marta Artista te crea una obra de arte con un moco y un pelo de Buu',
    giftNumbers: giftNumbersByMarta.artist,
    gameTitle: 'Obra Distorsionada',
    gameIntro: 'Reconoce cada cuadro pese al pixelado, el desenfoque y el cambio de color.',
    levels: [
      {
        kind: 'artwork',
        label: 'Obra 1',
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
    name: 'Marta Disfrutona',
    title: 'La Marta de las tapas',
    emoji: '🍻',
    color: 'orange',
    description: 'Desde una cervecita al sol a un chocolate caliente bajo la mantita, la Marta Disfrutona adora saltarse la dieta (aunque siempre con moderación). Quién podría resistirse a unas tapitas-cervecitas un lunes por la tarde?',
    giftNumbers: giftNumbersByMarta.hungry,
    gameTitle: 'La Ruta de las Tapas',
    gameIntro: 'Tres preguntas para abrir el apetito y ganarte esta insignia.',
    levels: [
      { kind: 'choice', label: 'Pregunta 1', prompt: '¿A donde irias a tomarte una buena cerveza?', options: ['De Tapas', 'La Trapperia', 'Lambic'], answer: 'La Trapperia' },
      { kind: 'choice', label: 'Pregunta 2', prompt: 'En verano cervecita y en invierno ...', options: ['Chocolate', 'Agua', 'Cervecita'], answer: 'Cervecita' },
      { kind: 'choice', label: 'Pregunta 3', prompt: '¿Cuáles son las siglas de la llamada al disfrute por excelencia?', options: ['CFY', 'SMM', 'TM'], answer: 'CFY' },
    ],
  },
  {
    id: 'traveling',
    name: 'Marta Viajera',
    title: 'La Marta viajera',
    emoji: '✈️',
    color: 'blue',
    description: 'Aunque se agobia para coger un autobús a dos paradas, la Marta Viajera adora viajar y conocer mundo. Su curiosidad no tiene límites (aunque sus pies si...).',
    giftNumbers: giftNumbersByMarta.traveling,
    gameTitle: 'Pasaporte de Emojis',
    gameIntro: 'Lee las pistas viajeras y adivina tres destinos.',
    levels: [
      { kind: 'choice', label: 'Destino 1', prompt: '🌯🎡🍺 ¿A partirnos las piernas?', options: ['París', 'Londres', 'Cuarto del Antonio'], answer: 'Londres' },
      { kind: 'choice', label: 'Destino 2', prompt: '🌸💑📖 ¿Un lugar especial?', options: ['Roma', 'Kampaoh', 'Madrid'], answer: 'Kampaoh' },
      {
        kind: 'choice',
        label: 'Destino 3',
        prompt: '❓❓❓ ¿Próximo destino?',
        options: ['Holanda', 'Tailandia', 'Roma'],
        answer: 'Holanda',
        acceptAllOptions: true,
      },
    ],
  },
  {
    id: 'music',
    name: 'Music Marta',
    title: 'La Marta indie',
    emoji: '🎵',
    color: 'purple',
    description: 'Con una cultura musical que ni el mismísimo Mozart, Music Marta es toda una fanática de la música Indie y pop-rock-punk-pink-pan. Cuando hay un concierto a la vista no hay nadie que pueda pararla!',
    giftNumbers: giftNumbersByMarta.music,
    gameTitle: 'SpotyMarta',
    gameIntro: '¡Completa la frase de la canción!',
    levels: [
      {
        kind: 'choice',
        label: 'Algo que sirva como luz - Supersubmarina',
        prompt: '“Así que manda una señal, algo que sirva como luz …”',
        options: [
          'Alguna estrella que me lleve a dónde quiera que estés tú',
          'No queda nada cuando miro alrededor',
          'Quiero un camino que me lleve a dónde solo existas tú',
        ],
        answer: 'Quiero un camino que me lleve a dónde solo existas tú',
        songSrc: '/audio/algoquesirva.mp3',
      },
      {
        kind: 'choice',
        label: 'La Salvación - Arde Bogotá',
        prompt: '“Yo sigo llegando tarde, se me hace largo el viaje …”',
        options: [
          'para esta conversación',
          '¡Me  duele el pecho de amor!',
          'y todo pesa un millón',
        ],
        answer: 'para esta conversación',
        songSrc: '/audio/salvacion.mp3',
      },
      {
        kind: 'choice',
        label: 'Exoplaneta - Arde Bogotá',
        prompt: '“Y tengo una propuesta …”',
        options: [
          'en algún día especial',
          'si todos los problemas',
          'si todas esas pruebas',
        ],
        answer: 'si todas esas pruebas',
        songSrc: '/audio/exoplaneta.mp3',
      },
    ],
  },
  {
    id: 'beauty',
    name: 'Bella Marta',
    title: 'La Marta coqueta',
    emoji: '💄',
    color: 'lilac',
    description: 'Con una variedad cromática entre negro, blanco y purpurina, Bella Marta no tiene nunca nada que ponerse, aun así cualquier trapo y un eyeliner hacen de ella la chica más guapa del planeta.',
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
