param(
    [string]$Message = "chore: aplicar alterações e workflow de deploy",
    [switch]$LocalDeploy
)

Write-Host "Verificando se o Git está disponível..."
try {
    git --version | Out-Null
} catch {
    Write-Error "git não encontrado no PATH. Instale o Git e reabra o PowerShell antes de continuar."
    exit 1
}

Write-Host "Adicionando alterações ao index..."
git add -A

Write-Host "Criando commit..."
$null = git commit -m "$Message" 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "Nenhuma alteração para commitar, pulando commit." -ForegroundColor Yellow
} else {
    Write-Host "Commit criado." -ForegroundColor Green
}

Write-Host "Enviando para origin/main..."
git push origin main
if ($LASTEXITCODE -ne 0) {
    Write-Error "git push falhou. Verifique sua autenticação e remotes."
    exit 1
}

Write-Host "Push concluído. O workflow de GitHub Actions (Deploy) será disparado automaticamente se estiver configurado." -ForegroundColor Green

if ($LocalDeploy) {
    Write-Host "Executando build e deploy local (npm run deploy)..." -ForegroundColor Cyan
    npm install
    npm run build
    npm run deploy
}

Write-Host "Pronto." -ForegroundColor Green
