# Script para iniciar o sistema completo
Write-Host "🚀 Iniciando Sistema ITR/CAR..." -ForegroundColor Green
Write-Host ""

# Verifica se o Node.js está instalado
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Node.js não está instalado!" -ForegroundColor Red
    exit 1
}

# Verifica se as dependências estão instaladas
if (-not (Test-Path "node_modules")) {
    Write-Host "📦 Instalando dependências..." -ForegroundColor Yellow
    npm install
}

# Verifica se o banco de dados existe
if (-not (Test-Path "server/itr_car.db")) {
    Write-Host "🗄️ Inicializando banco de dados..." -ForegroundColor Yellow
    node server/database.js
}

Write-Host ""
Write-Host "=" -ForegroundColor Cyan -NoNewline
Write-Host "=" * 60 -ForegroundColor Cyan
Write-Host "  📡 SERVIDOR BACKEND (API)" -ForegroundColor Cyan
Write-Host "=" * 61 -ForegroundColor Cyan
Write-Host ""
Write-Host "  Porta: http://localhost:3001" -ForegroundColor White
Write-Host "  Status: Iniciando..." -ForegroundColor Yellow
Write-Host ""
Write-Host "=" * 61 -ForegroundColor Cyan
Write-Host ""

# Inicia o servidor em background
$serverJob = Start-Job -ScriptBlock {
    Set-Location $args[0]
    npm run server
} -ArgumentList (Get-Location).Path

# Aguarda um pouco para o servidor iniciar
Start-Sleep -Seconds 3

Write-Host ""
Write-Host "=" * 61 -ForegroundColor Magenta
Write-Host "  🌐 FRONTEND REACT" -ForegroundColor Magenta
Write-Host "=" * 61 -ForegroundColor Magenta
Write-Host ""
Write-Host "  Porta: http://localhost:3000" -ForegroundColor White
Write-Host "  Status: Iniciando..." -ForegroundColor Yellow
Write-Host ""
Write-Host "=" * 61 -ForegroundColor Magenta
Write-Host ""
Write-Host ""
Write-Host "✅ Sistema iniciado com sucesso!" -ForegroundColor Green
Write-Host ""
Write-Host "👤 CREDENCIAIS DE ACESSO:" -ForegroundColor Yellow
Write-Host "   • Admin:    admin / admin123" -ForegroundColor White
Write-Host "   • Auditor:  auditor / auditor123" -ForegroundColor White
Write-Host "   • Analista: analista / analista123" -ForegroundColor White
Write-Host ""
Write-Host "📌 Pressione Ctrl+C para encerrar ambos os servidores" -ForegroundColor Cyan
Write-Host ""

# Inicia o frontend
npm start

# Cleanup quando o frontend é encerrado
Stop-Job $serverJob
Remove-Job $serverJob
Write-Host ""
Write-Host "🛑 Sistema encerrado." -ForegroundColor Red
