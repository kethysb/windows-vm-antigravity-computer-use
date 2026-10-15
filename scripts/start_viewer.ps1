# Inicia o visualizador web no navegador
$ErrorActionPreference = "Stop"

$ViewerDir = Join-Path $PSScriptRoot "..\viewer"
$NoVncDir = Join-Path $ViewerDir "noVNC"
$ViewerUrl = "http://127.0.0.1:5993/vnc.html?autoconnect=1&resize=scale&path=websockify"

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "🚀 Iniciando Visualizador noVNC para Antigravity / VM" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

# Verifica se node_modules existe
if (-not (Test-Path (Join-Path $ViewerDir "node_modules"))) {
    Write-Host "📦 Instalando dependências do viewer (ws)..." -ForegroundColor Yellow
    Push-Location $ViewerDir
    npm install
    Pop-Location
}

# Verifica se o noVNC existe
if (-not (Test-Path (Join-Path $NoVncDir "vnc.html"))) {
    Write-Host "📥 Baixando biblioteca noVNC..." -ForegroundColor Yellow
    $zipPath = Join-Path $ViewerDir "novnc.zip"
    $url = "https://github.com/novnc/noVNC/archive/refs/tags/v1.5.0.zip"
    Invoke-WebRequest -Uri $url -OutFile $zipPath
    Expand-Archive -Path $zipPath -DestinationPath $ViewerDir -Force
    Remove-Item -Path $zipPath -Force
    Move-Item -Path (Join-Path $ViewerDir "noVNC-1.5.0") -Destination $NoVncDir -Force
    Write-Host "✅ noVNC pronto!" -ForegroundColor Green
}

Write-Host "🌐 Abrindo aba no navegador: $ViewerUrl" -ForegroundColor Green
Start-Process $ViewerUrl

Write-Host "⚡ Iniciando bridge Node.js..." -ForegroundColor Cyan
Push-Location $ViewerDir
node bridge.mjs
Pop-Location
