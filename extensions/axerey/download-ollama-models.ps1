# Download Ollama Embedding Models
# This script downloads recommended embedding models for Axerey

Write-Host "📥 Downloading Ollama embedding models..." -ForegroundColor Cyan
Write-Host ""

$models = @(
    "nomic-embed-text",
    "qwen2.5:0.5b-instruct"
)

$ollamaPath = "$env:LOCALAPPDATA\Programs\Ollama\ollama.exe"

if (-not (Test-Path $ollamaPath)) {
    Write-Host "❌ Ollama not found at: $ollamaPath" -ForegroundColor Red
    Write-Host "   Please ensure Ollama is installed and try again." -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Found Ollama at: $ollamaPath" -ForegroundColor Green
Write-Host ""

foreach ($model in $models) {
    Write-Host "📦 Downloading: $model" -ForegroundColor Yellow
    Write-Host "   This may take a few minutes depending on your internet connection..." -ForegroundColor Gray
    
    $process = Start-Process -FilePath $ollamaPath -ArgumentList "pull", $model -NoNewWindow -Wait -PassThru
    
    if ($process.ExitCode -eq 0) {
        Write-Host "   ✅ Successfully downloaded: $model" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️  Warning: $model may not have downloaded correctly (exit code: $($process.ExitCode))" -ForegroundColor Yellow
    }
    Write-Host ""
}

Write-Host "🎉 Model download complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Current models:" -ForegroundColor Cyan
& $ollamaPath list

Write-Host ""
Write-Host "💡 Tip: You can verify models are available by running:" -ForegroundColor Gray
Write-Host "   ollama list" -ForegroundColor White

