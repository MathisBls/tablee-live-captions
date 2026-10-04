# Télécharge whisper.cpp (binaire Windows officiel) et un modèle Whisper multilingue dans tools/whisper/.
# Usage : powershell -ExecutionPolicy Bypass -File scripts/setup-whisper.ps1 [-Cpu]
param(
  # Force la version CPU (sinon CUDA si une carte NVIDIA est détectée).
  [switch]$Cpu,
  [string]$Release = 'b5130'
)

$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'

$root = Join-Path $PSScriptRoot '..\tools\whisper'
$models = Join-Path $root 'models'
New-Item -ItemType Directory -Force $models | Out-Null

$hasNvidia = $null -ne (Get-Command nvidia-smi -ErrorAction SilentlyContinue)
$useGpu = $hasNvidia -and -not $Cpu

if ($useGpu) {
  $asset = 'whisper-cublas-12.4.0-bin-x64.zip'
  $flavor = 'cuda'
  $model = 'ggml-large-v3-turbo.bin'
} else {
  $asset = 'whisper-bin-x64.zip'
  $flavor = 'cpu'
  $model = 'ggml-small.bin'
}

$zip = Join-Path $root $asset
$binaries = Join-Path $root $flavor
if (-not (Test-Path (Join-Path $binaries 'Release\whisper-server.exe'))) {
  Write-Host "-> whisper.cpp $Release ($flavor)"
  Invoke-WebRequest "https://github.com/ggml-org/whisper.cpp/releases/download/$Release/$asset" -OutFile $zip
  Expand-Archive $zip -DestinationPath $binaries -Force
  Remove-Item $zip
}

$modelPath = Join-Path $models $model
if (-not (Test-Path $modelPath)) {
  Write-Host "-> $model"
  Invoke-WebRequest "https://huggingface.co/ggerganov/whisper.cpp/resolve/main/$model" -OutFile $modelPath
}

Write-Host "OK: $flavor + $model. Lance : pnpm whisper"
