<#
.SYNOPSIS
  Regenerate the motion slide (and PNG preview) from its JSON config.
.DESCRIPTION
  Requires Node.js. The PNG preview additionally requires LibreOffice (soffice).
#>
$ErrorActionPreference = "Stop"

$root      = Split-Path -Parent $PSScriptRoot
$config    = Join-Path $root "deck\motion-sql.json"
$output    = Join-Path $root "deck\MotionSQL-Azure.pptx"
$previewDir = Join-Path $root "deck\preview"
$skill     = Join-Path $root "skill\pptxmotions"

Write-Host "==> Installing generator dependencies"
Push-Location $skill
npm install --silent
Pop-Location

Write-Host "==> Building slide: $output"
node (Join-Path $skill "motion.js") $config $output

$soffice = @(
  "C:\Program Files\LibreOffice\program\soffice.exe",
  "C:\Program Files (x86)\LibreOffice\program\soffice.exe"
) | Where-Object { Test-Path $_ } | Select-Object -First 1

if ($soffice) {
  Write-Host "==> Rendering PNG preview"
  New-Item -ItemType Directory -Force -Path $previewDir | Out-Null
  & $soffice --headless --convert-to png --outdir $previewDir $output
} else {
  Write-Host "!! LibreOffice (soffice) not found - skipping PNG preview"
}

Write-Host "Done."
