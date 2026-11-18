# Martalendario de Adviento

Aplicación de cumpleaños móvil con siete minijuegos, 24 casillas y progreso guardado en el navegador. Los juegos empiezan al seleccionar una casilla cerrada; al completar uno, se animan y abren las casillas asignadas a esa Marta, y el juego ya no se puede repetir desde esos regalos.

## Empezar

```powershell
npm install
npm run dev
```

Para crear la versión de producción: `npm run build`.

## Editar regalos y minijuegos

Abre `src/data/config.ts` para modificar los textos, emojis, descripciones, números de regalo y pruebas de cada Marta. Los niveles se guardan en el array `levels` de cada personalidad: seis Martas tienen tres pruebas y Beauty Marta tiene dos. Los regalos normales deben cubrir los números del 1 al 23 una sola vez; el 24 está reservado para el gran final.

El progreso se guarda en `localStorage` con la clave `martalendario-progress-v1`.

## Vídeos

Coloca los siete archivos fuente `<personalidad>_marta.webm` en la raíz del proyecto y ejecuta:

```powershell
./scripts/convert-videos.ps1
```

El script copia los WebM a `public/videos/`, genera MOV ProRes 4444 con alfa y crea pósteres PNG para el modo de movimiento reducido. FFmpeg debe estar en el `PATH` o indicado por la variable `FFMPEG_PATH`. Los MOV se exportan a 320 px de ancho para mantener un tamaño razonable en móvil.
