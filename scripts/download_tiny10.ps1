<#
.SYNOPSIS
    Script para download da ISO do Tiny10 23H2 (x64) ou instrucoes oficiais.
.DESCRIPTION
    O Tiny10 e uma versao ultra-otimizada e leve do Windows 10 criada por NTDEV,
    ideal para ambientes de automacao e agentes de IA rodando em VMs.
#>

param(
    [string]$DestinationDir = "$env:USERPROFILE\Documents\Virtual Machines\ISO",
    [switch]$Interactive
)

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "📥 Download da ISO Tiny10 23H2 x64 para Automacao" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

if (-not (Test-Path $DestinationDir)) {
    New-Item -ItemType Directory -Path $DestinationDir -Force | Out-Null
    Write-Host "📁 Pasta de destino criada: $DestinationDir" -ForegroundColor Yellow
}

$isoName = "tiny10_x64_23h2.iso"
$targetPath = Join-Path $DestinationDir $isoName

# URLs oficiais / confiaveis no Internet Archive (NTDEV)
$primaryUrl = "https://archive.org/download/tiny-10-NTDEV/tiny10%2023h2%20x64.iso"
$archivePage = "https://archive.org/details/tiny-10-NTDEV"

Write-Host "ℹ️  O Tiny10 é hospedado oficialmente no Internet Archive por NTDEV." -ForegroundColor White
Write-Host "🔗 Página oficial: $archivePage" -ForegroundColor Cyan
Write-Host "🎯 Arquivo de destino: $targetPath" -ForegroundColor White

if (Test-Path $targetPath) {
    $sizeGB = [math]::Round(((Get-Item $targetPath).Length / 1GB), 2)
    Write-Host "✅ A ISO já existe localmente ($sizeGB GB): $targetPath" -ForegroundColor Green
    exit 0
}

Write-Host "`nDeseja iniciar o download agora? (~3.5 GB)" -ForegroundColor Yellow
Write-Host "Pressione [Enter] para baixar ou Ctrl+C para baixar manualmente pelo navegador."
if ($Interactive) {
    Read-Host "Pressione Enter para continuar"
}

Write-Host "🚀 Iniciando download via curl/bitsadmin..." -ForegroundColor Cyan
try {
    # Usando curl nativo do Windows para maior velocidade e barra de progresso
    curl.exe -L -o $targetPath $primaryUrl --progress-bar
    if (Test-Path $targetPath) {
        $sizeGB = [math]::Round(((Get-Item $targetPath).Length / 1GB), 2)
        Write-Host "`n✅ Download concluído com sucesso! Tamanho: $sizeGB GB" -ForegroundColor Green
    }
} catch {
    Write-Host "⚠️ Erro no download automático: $_" -ForegroundColor Red
    Write-Host "👉 Por favor, baixe manualmente acessando: $archivePage" -ForegroundColor Yellow
    Write-Host "   E salve o arquivo em: $targetPath" -ForegroundColor Yellow
}
