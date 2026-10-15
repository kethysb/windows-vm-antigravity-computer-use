<#
.SYNOPSIS
    Script de configuracao e verificacao do ambiente da VM Windows para Antigravity.
#>

$ErrorActionPreference = "Continue"

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "🛠️ Verificador de Ambiente: Windows VM para Antigravity" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

# 1. Verificar VMware Workstation
$vmrunPaths = @(
    "C:\Program Files (x86)\VMware\VMware Workstation\vmrun.exe",
    "C:\Program Files\VMware\VMware Workstation\vmrun.exe"
)

$vmrun = $vmrunPaths | Where-Object { Test-Path $_ } | Select-Object -First 1

if ($vmrun) {
    Write-Host "✅ VMware Workstation / vmrun encontrado: $vmrun" -ForegroundColor Green
} else {
    Write-Host "❌ VMware Workstation não encontrado! Instale o VMware Workstation Pro (gratuito para uso pessoal)." -ForegroundColor Red
}

# 2. Verificar Node.js
try {
    $nodeVer = & node -v
    Write-Host "✅ Node.js instalado: $nodeVer" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js não encontrado no PATH! Instale em https://nodejs.org" -ForegroundColor Red
}

# 3. Verificar status da VM Tiny10
$vmDir = "$env:USERPROFILE\Documents\Virtual Machines\Tiny10"
$vmxFile = Join-Path $vmDir "Tiny10.vmx"

if (Test-Path $vmxFile) {
    Write-Host "✅ Arquivo VMX da Tiny10 encontrado: $vmxFile" -ForegroundColor Green
    
    # Verificar se as linhas de VNC estao no VMX
    $vncLines = Select-String -Path $vmxFile -Pattern "RemoteDisplay.vnc"
    if ($vncLines) {
        Write-Host "✅ VNC Nativo do VMware está ATIVADO no VMX!" -ForegroundColor Green
        $vncLines | ForEach-Object { Write-Host "   $_" -ForegroundColor DarkGray }
    } else {
        Write-Host "⚠️ As diretivas RemoteDisplay.vnc não estão presentes no VMX!" -ForegroundColor Yellow
        Write-Host "   Adicione as seguintes linhas no final de Tiny10.vmx:" -ForegroundColor Yellow
        Write-Host '   RemoteDisplay.vnc.enabled = "TRUE"'
        Write-Host '   RemoteDisplay.vnc.port = "5958"'
        Write-Host '   RemoteDisplay.vnc.ip = "127.0.0.1"'
        Write-Host '   RemoteDisplay.vnc.keyMap = "us"'
    }
} else {
    Write-Host "ℹ️ Máquina virtual Tiny10 ainda não criada na pasta padrão ($vmDir)." -ForegroundColor Yellow
    Write-Host "   Copie o template em 'templates/Tiny10.vmx' e aponte para a ISO baixada." -ForegroundColor Yellow
}

Write-Host "`nPronto! Tudo pronto para iniciar o visualizador web com ./scripts/start_viewer.ps1" -ForegroundColor Cyan
