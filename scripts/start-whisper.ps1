# Lance whisper-server sur 127.0.0.1:8080 avec le meilleur binaire et modèle installés par setup-whisper.ps1.
$ErrorActionPreference = 'Stop'

$root = Join-Path $PSScriptRoot '..\tools\whisper'
$cuda = Join-Path $root 'cuda\Release\whisper-server.exe'
$cpu = Join-Path $root 'cpu\Release\whisper-server.exe'
$turbo = Join-Path $root 'models\ggml-large-v3-turbo.bin'
$small = Join-Path $root 'models\ggml-small.bin'

if (Test-Path $cuda) { $server = $cuda } elseif (Test-Path $cpu) { $server = $cpu } else {
  throw 'whisper-server introuvable : lance d''abord scripts/setup-whisper.ps1'
}
if (Test-Path $turbo) { $model = $turbo } elseif (Test-Path $small) { $model = $small } else {
  throw 'Aucun modèle Whisper : lance d''abord scripts/setup-whisper.ps1'
}

$threads = [Math]::Min([Environment]::ProcessorCount, 8)
& $server -m $model --host 127.0.0.1 --port 8080 -l auto -t $threads
