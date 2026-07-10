#requires -Version 5.1
<#
.SYNOPSIS
    Installs the ContosoSales legacy database and its legacy features on a target SQL Server.

.DESCRIPTION
    Runs the SQL scripts in order against the target instance. Run this on the VM against
    localhost, or from a host inside the virtual network. Uses Windows authentication by default,
    or SQL authentication when -SqlUsername and -SqlPassword are supplied.

.EXAMPLE
    ./Install-LegacyDatabase.ps1 -ServerInstance "localhost"
#>
[CmdletBinding()]
param(
    [string]$ServerInstance = 'localhost',
    [string]$SqlUsername,
    [string]$SqlPassword,
    [string]$SqlScriptFolder = (Join-Path $PSScriptRoot '..\sql')
)

$ErrorActionPreference = 'Stop'

$scripts = @(
    '01-create-legacy-db.sql',
    '02-seed-data.sql',
    '03-legacy-features.sql'
)

$useModule = $null -ne (Get-Command Invoke-Sqlcmd -ErrorAction SilentlyContinue)
$useAuth = -not [string]::IsNullOrWhiteSpace($SqlUsername) -and -not [string]::IsNullOrWhiteSpace($SqlPassword)

if (-not $useModule -and -not (Get-Command sqlcmd -ErrorAction SilentlyContinue)) {
    throw 'Neither the Invoke-Sqlcmd cmdlet nor sqlcmd.exe was found. Install the SqlServer module or the SQL command-line tools.'
}

foreach ($name in $scripts) {
    $path = Join-Path $SqlScriptFolder $name
    if (-not (Test-Path $path)) {
        throw "SQL script not found: $path"
    }
    Write-Host "Running $name against $ServerInstance"

    if ($useModule) {
        $params = @{
            ServerInstance         = $ServerInstance
            InputFile              = $path
            TrustServerCertificate = $true
            QueryTimeout           = 0
        }
        if ($useAuth) {
            $params.Username = $SqlUsername
            $params.Password = $SqlPassword
        }
        Invoke-Sqlcmd @params
    }
    else {
        if ($useAuth) {
            sqlcmd -S $ServerInstance -U $SqlUsername -P $SqlPassword -b -i $path
        }
        else {
            sqlcmd -S $ServerInstance -E -b -i $path
        }
        if ($LASTEXITCODE -ne 0) {
            throw "sqlcmd failed on $name with exit code $LASTEXITCODE"
        }
    }
}

Write-Host 'Legacy database installed. ContosoSales and ContosoArchive are ready to inspect.' -ForegroundColor Green
