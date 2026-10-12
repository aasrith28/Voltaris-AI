$ErrorActionPreference = "Stop"

$root = $PSScriptRoot
$backend = Join-Path $root "backend"
$frontend = Join-Path $root "frontend"
$python = Join-Path $backend ".venv\Scripts\python.exe"

if (-not (Test-Path (Join-Path $backend "app\main.py"))) {
  throw "Voltaris AI backend was not found under $backend."
}

if (-not (Test-Path $python)) {
  $pythonCommand = Get-Command python -ErrorAction SilentlyContinue
  if (-not $pythonCommand) {
    throw "Python was not found. Install Python 3.10 or newer, then run this script again."
  }
  $python = $pythonCommand.Source
}

& $python -c "import fastapi, uvicorn" 2>$null
if ($LASTEXITCODE -ne 0) {
  throw "Backend packages are missing. Install them once with: pip install -r backend\requirements.txt"
}

if (-not (Test-Path (Join-Path $frontend "node_modules\vite"))) {
  throw "Frontend packages are missing. Install them once with: npm install (from the frontend folder)"
}

$npm = Get-Command npm.cmd -ErrorAction SilentlyContinue
if (-not $npm) {
  throw "npm was not found. Install Node.js 18 or newer, then run this script again."
}

$backendProcess = Start-Process `
  -FilePath $python `
  -ArgumentList @("-m", "uvicorn", "app.main:app", "--reload", "--host", "127.0.0.1", "--port", "8000") `
  -WorkingDirectory $backend `
  -PassThru

try {
  $frontendProcess = Start-Process `
    -FilePath $env:ComSpec `
      -ArgumentList @("/c", "npm run dev -- --host 127.0.0.1 --strictPort") `
    -WorkingDirectory $frontend `
    -PassThru
}
catch {
  if (-not $backendProcess.HasExited) {
    Stop-Process -Id $backendProcess.Id
  }
  throw
}

$frontendReady = $false
$apiReady = $false
for ($attempt = 0; $attempt -lt 45; $attempt++) {
  if ($frontendProcess.HasExited -or $backendProcess.HasExited) {
    break
  }

  if (-not $frontendReady) {
    try {
      $null = Invoke-WebRequest -Uri "http://127.0.0.1:5173" -TimeoutSec 2 -UseBasicParsing
      $frontendReady = $true
    }
    catch {
      Start-Sleep -Seconds 1
    }
  }

  if (-not $apiReady) {
    try {
      $null = Invoke-WebRequest -Uri "http://127.0.0.1:8000/api/v1/health" -TimeoutSec 2 -UseBasicParsing
      $apiReady = $true
    }
    catch {
      Start-Sleep -Seconds 1
    }
  }

  if ($frontendReady -and $apiReady) {
    break
  }
}

if ($frontendReady) {
  Start-Process "http://127.0.0.1:5173"
}

Write-Host ""
Write-Host "Voltaris AI startup"
Write-Host "Frontend: http://127.0.0.1:5173 $(if ($frontendReady) { '(ready)' } else { '(starting; check its terminal window)' })"
Write-Host "Backend:  http://127.0.0.1:8000 $(if ($apiReady) { '(ready)' } else { '(starting; check its terminal window)' })"
Write-Host "API docs: http://127.0.0.1:8000/api/docs"
Write-Host "Process IDs: frontend $($frontendProcess.Id), backend $($backendProcess.Id)"
Write-Host "Close the frontend and backend terminal windows to stop the services."

if (-not $frontendReady -or -not $apiReady) {
  Write-Warning "One or more services did not become ready. Review the service terminal windows for startup errors."
}
