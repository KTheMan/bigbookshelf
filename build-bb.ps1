# Build BigBookshelf from WSL — outputs directly to this folder via nuxt.config generate.dir
# Usage: .\build-bb.ps1

$wslProject = "/home/ahero4heor/audiobookshelf-webos"

Write-Host "Building in WSL..." -ForegroundColor Cyan
wsl -d Ubuntu -- bash -c "cd $wslProject && npm run build 2>&1 | tail -12"

if ($LASTEXITCODE -ne 0) {
  Write-Host "Build failed." -ForegroundColor Red
  exit 1
}

Write-Host "Done. Reload the app in the webOS simulator." -ForegroundColor Green
