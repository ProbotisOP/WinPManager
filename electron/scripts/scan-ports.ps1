$ErrorActionPreference = "SilentlyContinue"

try {
    # 1. Get all TCP connections in Listen state
    $connections = Get-NetTCPConnection -State Listen -ErrorAction SilentlyContinue
    if (-not $connections) {
        Write-Output "[]"
        exit 0
    }

    # Extract unique PIDs
    $pids = $connections.OwningProcess | Where-Object { $_ -gt 0 } | Select-Object -Unique

    if (-not $pids) {
        Write-Output "[]"
        exit 0
    }

    # 2. Query process details via Win32_Process
    $filterChunks = @()
    $chunkSize = 30
    for ($i = 0; $i -lt $pids.Count; $i += $chunkSize) {
        $chunk = $pids[$i..[Math]::Min($i + $chunkSize - 1, $pids.Count - 1)]
        $filterChunks += ($chunk | ForEach-Object { "ProcessId = $_" }) -join " or "
    }

    $processMap = @{}
    foreach ($filter in $filterChunks) {
        if ($filter) {
            $procs = Get-CimInstance Win32_Process -Filter $filter -Property ProcessId, Name, ExecutablePath, CommandLine, ParentProcessId, WorkingSetSize, CreationDate -ErrorAction SilentlyContinue
            foreach ($p in $procs) {
                $processMap[$p.ProcessId] = $p
            }
        }
    }

    # 3. Combine connections and processes
    $portGroups = $connections | Group-Object -Property LocalPort, OwningProcess

    $results = @()
    foreach ($group in $portGroups) {
        $first = $group.Group[0]
        $pidNum = [int]$first.OwningProcess
        $portNum = [int]$first.LocalPort
        $addresses = ($group.Group | Select-Object -ExpandProperty LocalAddress -Unique) -join ", "

        $proc = $processMap[$pidNum]
        $procName = if ($proc -and $proc.Name) { $proc.Name } else { "Unknown" }
        $exePath = if ($proc -and $proc.ExecutablePath) { $proc.ExecutablePath } else { "" }
        $cmdLine = if ($proc -and $proc.CommandLine) { $proc.CommandLine } else { "" }
        $parentPid = if ($proc -and $proc.ParentProcessId) { [int]$proc.ParentProcessId } else { 0 }
        $memBytes = if ($proc -and $proc.WorkingSetSize) { [int64]$proc.WorkingSetSize } else { 0 }
        $creation = if ($proc -and $proc.CreationDate) { $proc.CreationDate.ToString("o") } else { "" }

        $results += [PSCustomObject]@{
            port = $portNum
            pid = $pidNum
            processName = $procName
            executablePath = $exePath
            commandLine = $cmdLine
            parentPid = $parentPid
            memoryBytes = $memBytes
            createdAt = $creation
            addresses = $addresses
            protocol = "TCP"
        }
    }

    $results = $results | Sort-Object -Property port
    $results | ConvertTo-Json -Depth 3 -Compress
}
catch {
    Write-Output "[]"
}
