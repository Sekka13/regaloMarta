$ErrorActionPreference = 'Stop'

$projectRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$videoDirectory = Join-Path $projectRoot 'public/videos'
$videoIds = @('little', 'lovely', 'artist', 'hungry', 'traveling', 'music', 'beauty')

$ffmpegPath = $env:FFMPEG_PATH
if (-not $ffmpegPath) {
  $ffmpegCommand = Get-Command ffmpeg.exe -ErrorAction SilentlyContinue
  if ($ffmpegCommand) {
    $ffmpegPath = $ffmpegCommand.Source
  }
}

if (-not $ffmpegPath) {
  $wingetPackages = Join-Path $env:LOCALAPPDATA 'Microsoft/WinGet/Packages'
  $ffmpegPath = Get-ChildItem -Directory -Path $wingetPackages -Filter 'Gyan.FFmpeg*' -ErrorAction SilentlyContinue |
    ForEach-Object { Get-ChildItem -File -Path $_.FullName -Filter ffmpeg.exe -Recurse -ErrorAction SilentlyContinue } |
    Select-Object -First 1 -ExpandProperty FullName
}

if (-not $ffmpegPath -or -not (Test-Path -LiteralPath $ffmpegPath)) {
  throw 'No encuentro ffmpeg.exe. Instala FFmpeg o define FFMPEG_PATH con su ruta.'
}

$ffprobePath = Join-Path (Split-Path -Parent $ffmpegPath) 'ffprobe.exe'
if (-not (Test-Path -LiteralPath $ffprobePath)) {
  throw "No encuentro ffprobe.exe junto a FFmpeg: $ffprobePath"
}

New-Item -ItemType Directory -Path $videoDirectory -Force | Out-Null

foreach ($id in $videoIds) {
  $filename = "${id}_marta.webm"
  $inputPath = Join-Path $projectRoot $filename
  $webmPath = Join-Path $videoDirectory $filename
  $movPath = Join-Path $videoDirectory "${id}_marta.mov"
  $posterPath = Join-Path $videoDirectory "${id}_marta-poster.png"

  if (-not (Test-Path -LiteralPath $inputPath)) {
    throw "Falta el vídeo fuente: $inputPath"
  }

  Copy-Item -LiteralPath $inputPath -Destination $webmPath -Force

  & $ffmpegPath -hide_banner -loglevel error -y -c:v libvpx-vp9 -i $inputPath -map 0:v:0 -an `
    -vf 'scale=320:-2:flags=lanczos,format=yuva444p10le' `
    -c:v prores_ks -profile:v 4 -alpha_bits 8 -bits_per_mb 1000 -movflags +faststart $movPath
  if ($LASTEXITCODE -ne 0) { throw "Falló la conversión a MOV de $filename" }

  $videoInfo = & $ffprobePath -v error -select_streams v:0 -show_entries stream=codec_name,width,height,pix_fmt -of json $movPath |
    ConvertFrom-Json
  $stream = $videoInfo.streams | Select-Object -First 1
  if (-not $stream -or $stream.pix_fmt -notlike 'yuva*') {
    throw "El MOV de $filename no conserva un formato de píxel con alfa. Resultado: $($stream.pix_fmt)"
  }

  & $ffmpegPath -hide_banner -loglevel error -y -c:v libvpx-vp9 -i $inputPath -map 0:v:0 -frames:v 1 -update 1 `
    -vf 'scale=320:-2:flags=lanczos,format=rgba' -pix_fmt rgba $posterPath
  if ($LASTEXITCODE -ne 0) { throw "Falló el póster de $filename" }

  $movSizeMb = [math]::Round((Get-Item -LiteralPath $movPath).Length / 1MB, 1)
  Write-Output ("{0}: {1} {2}x{3}, {4} MB; WebM y póster listos" -f $filename, $stream.pix_fmt, $stream.width, $stream.height, $movSizeMb)
}
