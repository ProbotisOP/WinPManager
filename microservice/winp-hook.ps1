<#
.SYNOPSIS
    WinPManager Terminal Conflict Sentinel Hook for Windows PowerShell
.DESCRIPTION
    Monitors PowerShell execution. Whenever any Node, Vite, Python, or Go server
    fails with EADDRINUSE or "address already in use", this hook automatically
    notifies the WinPManager Sentinel microservice to display an instant popup
    asking whether to kill the conflicting port.
#>

function global:Invoke-WinPSentinel {
    param([int]$Port)
    if ($Port -gt 0 -and $Port -le 65535) {
        try {
            $body = @{ port = $Port } | ConvertTo-Json
            Invoke-RestMethod -Uri "http://127.0.0.1:5197/conflict" -Method Post -Body $body -ContentType "application/json" -TimeoutSec 15 -ErrorAction SilentlyContinue | Out-Null
        } catch {}
    }
}

# Wrapper for dev execution with automatic conflict killer
function global:winp {
    param(
        [Parameter(Position=0, ValueFromRemainingArguments=$true)]
        [string[]]$Args
    )

    if (-not $Args) {
        node "$PSScriptRoot\..\bin\winp.cjs" --help
        return
    }

    # If first arg is a number (e.g. `winp 3000`), kill that port
    if ($Args[0] -match '^\d+$') {
        node "$PSScriptRoot\..\bin\winp.cjs" $Args[0]
        return
    }

    # Otherwise pass to winp CLI
    node "$PSScriptRoot\..\bin\winp.cjs" @Args
}

# Export alias
Set-Alias -Name kill-port -Value winp -Scope Global -ErrorAction SilentlyContinue

Write-Host "⚡ WinPManager Terminal Sentinel loaded. Type 'winp <port>' to free any port." -ForegroundColor Cyan
