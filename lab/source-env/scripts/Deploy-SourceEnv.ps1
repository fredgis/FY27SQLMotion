#requires -Version 7.0
<#
.SYNOPSIS
    Previews or deploys the legacy SQL Server 2016 source environment for the HVE-SQL demo.

.DESCRIPTION
    Defaults to an Azure what-if. Creates resources only when -Deploy is passed and you confirm.
    The administrator password is read from the SQLVM_ADMIN_PASSWORD environment variable or a
    secure prompt, and is never written to disk.

.EXAMPLE
    ./Deploy-SourceEnv.ps1 -AllowedRdpSourceAddressPrefix "203.0.113.10/32"
    Runs a what-if only.

.EXAMPLE
    ./Deploy-SourceEnv.ps1 -AllowedRdpSourceAddressPrefix "203.0.113.10/32" -Deploy
    Creates the resources after you confirm.
#>
[CmdletBinding()]
param(
    [string]$SubscriptionId,
    [string]$ResourceGroup = 'rg-hvesql-demo-weu',
    [string]$Location = 'westeurope',
    [Parameter(Mandatory = $true)]
    [string]$AllowedRdpSourceAddressPrefix,
    [string]$AdminUsername = 'contosoadmin',
    [string]$ResourcePrefix = 'hvesql',
    [string]$EnvironmentName = 'demo',
    [switch]$Deploy
)

$ErrorActionPreference = 'Stop'

if (-not (Get-Command az -ErrorAction SilentlyContinue)) {
    throw 'Azure CLI (az) was not found on PATH. Install it and run "az login" first.'
}

$templateFile = Join-Path $PSScriptRoot '..\infra\bicep\main.bicep'
if (-not (Test-Path $templateFile)) {
    throw "Template not found: $templateFile"
}

if ($SubscriptionId) {
    Write-Host "Setting subscription to $SubscriptionId"
    az account set --subscription $SubscriptionId | Out-Null
}

# Resolve the admin password from an environment variable or a secure prompt.
$plainPassword = $env:SQLVM_ADMIN_PASSWORD
if ([string]::IsNullOrWhiteSpace($plainPassword)) {
    $secure = Read-Host -Prompt 'Enter the VM administrator password (minimum 12 characters)' -AsSecureString
    $bstr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
    try {
        $plainPassword = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($bstr)
    }
    finally {
        [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr)
    }
}
if ($null -eq $plainPassword -or $plainPassword.Length -lt 12) {
    throw 'The administrator password must be at least 12 characters.'
}

Write-Host "Ensuring resource group '$ResourceGroup' exists in '$Location' (an empty group is created if missing)."
az group create --name $ResourceGroup --location $Location --only-show-errors | Out-Null

$deployParams = @(
    "location=$Location",
    "resourcePrefix=$ResourcePrefix",
    "environmentName=$EnvironmentName",
    "adminUsername=$AdminUsername",
    "adminPassword=$plainPassword",
    "allowedRdpSourceAddressPrefix=$AllowedRdpSourceAddressPrefix"
)

if (-not $Deploy) {
    Write-Host 'Running what-if. No resources will be created. Pass -Deploy to create them.' -ForegroundColor Cyan
    az deployment group what-if `
        --resource-group $ResourceGroup `
        --template-file $templateFile `
        --parameters $deployParams
    return
}

Write-Host 'You are about to CREATE Azure resources that cost money.' -ForegroundColor Yellow
$confirm = Read-Host 'Type DEPLOY to confirm'
if ($confirm -ne 'DEPLOY') {
    Write-Host 'Cancelled. Nothing was created.'
    return
}

Write-Host 'Deploying the source environment.'
az deployment group create `
    --resource-group $ResourceGroup `
    --template-file $templateFile `
    --parameters $deployParams `
    --query 'properties.outputs' `
    --output json
