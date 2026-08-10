# One-line installer for Windows.
#
# Downloads the app, installs Docker Desktop if needed (via start.bat), and runs it.
#
# Usage (default, prod mode):
#   irm https://raw.githubusercontent.com/kirillketrik/accounting/main/install.ps1 | iex
#
# Usage (dev mode / custom args — invoke as a scriptblock so args pass through):
#   &([scriptblock]::Create((irm https://raw.githubusercontent.com/kirillketrik/accounting/main/install.ps1))) dev
#
# Env vars:
#   $env:ACCOUNTING_DIR   where to install (default: %USERPROFILE%\accounting)

param(
    [string]$Mode = "prod"
)

$ErrorActionPreference = "Stop"

$RepoUrl = "https://github.com/kirillketrik/accounting.git"
$InstallDir = if ($env:ACCOUNTING_DIR) { $env:ACCOUNTING_DIR } else { Join-Path $env:USERPROFILE "accounting" }

function Install-Git {
    Write-Host "git not found - installing via winget..."
    if (Get-Command winget -ErrorAction SilentlyContinue) {
        winget install --id Git.Git -e --source winget --accept-package-agreements --accept-source-agreements
        $env:PATH = [System.Environment]::GetEnvironmentVariable("PATH", "Machine") + ";" + [System.Environment]::GetEnvironmentVariable("PATH", "User")
    } else {
        Write-Error "winget not available. Install Git manually from https://git-scm.com/download/win, then re-run this script."
        exit 1
    }
}

if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
    Install-Git
}

if (Test-Path (Join-Path $InstallDir ".git")) {
    Write-Host "Found an existing install at $InstallDir - updating..."
    git -C $InstallDir pull --ff-only
} else {
    Write-Host "Cloning into $InstallDir..."
    git clone $RepoUrl $InstallDir
}

Set-Location $InstallDir
& "$InstallDir\start.bat" $Mode
