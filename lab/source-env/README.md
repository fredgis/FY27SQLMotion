---
title: "Source environment: legacy SQL Server 2016 on a VM"
description: "How to preview or deploy the legacy source environment and install the ContosoSales database with its legacy features."
author: "HVE-SQL demo"
ms.date: 2026-07-07
ms.topic: how-to
---

## What this deploys

This folder builds the legacy source: a Windows virtual machine running a SQL Server 2016 marketplace image, on a small virtual network, reachable over RDP from a single source address you control. On top of that VM you install the `ContosoSales` and `ContosoArchive` databases and the legacy features that drive the migration decision.

You do not have to deploy this to run the demo. The advisor reasons from the inventory in [../knowledge-docs/](../knowledge-docs/) and the SQL under [sql/](sql/). Deploy it only when you want a live SQL Server to point at.

## Layout

| Path | Purpose |
| ------ | --------- |
| `infra/bicep/main.bicep` | Entry point: network plus VM |
| `infra/bicep/modules/network.bicep` | Virtual network, subnet, and network security group |
| `infra/bicep/modules/sqlserver-vm.bicep` | Public IP, network interface, and the SQL Server VM |
| `infra/bicep/main.bicepparam` | Example parameters |
| `scripts/Deploy-SourceEnv.ps1` | What-if by default, deploy with `-Deploy` |
| `scripts/Install-LegacyDatabase.ps1` | Runs the SQL scripts in order |
| `sql/` | The database, seed data, and legacy features |

## Prerequisites

* The Azure CLI (`az`) with the Bicep support, and `az login` completed.
* Owner or Contributor on the target subscription.
* Your current public IP in CIDR form, for the RDP rule. Find it with `curl https://api.ipify.org`.

## Choose a valid image SKU for your region

Marketplace image SKUs vary by region. Confirm an available SQL Server 2016 image before you deploy:

```powershell
az vm image list --publisher MicrosoftSQLServer --offer SQL2016SP2-WS2016 --all --output table
```

If a first deployment reports that image terms must be accepted, accept them once:

```powershell
az vm image terms accept --publisher MicrosoftSQLServer --offer SQL2016SP2-WS2016 --plan SQLDEV
```

## Preview, then deploy

The script runs an Azure what-if by default and creates nothing until you pass `-Deploy` and confirm.

```powershell
# Preview only
./scripts/Deploy-SourceEnv.ps1 -AllowedRdpSourceAddressPrefix "<your-public-ip>/32"

# Create the resources after reviewing the what-if
./scripts/Deploy-SourceEnv.ps1 -AllowedRdpSourceAddressPrefix "<your-public-ip>/32" -Deploy
```

Provide the VM administrator password through the `SQLVM_ADMIN_PASSWORD` environment variable or the secure prompt. The password is never written to a file.

> [!NOTE]
> The script ensures the resource group exists so that what-if can run. An empty resource group is the only thing created in preview mode, and you can remove it with `az group delete`.

## Install the legacy database

SQL Server runs on the VM, and port 1433 is not exposed to the internet, so the database is installed **from the VM**, never from your workstation. The marketplace image adds the VM administrator to the SQL `sysadmin` role, so Windows authentication works out of the box. Pick one of the two methods below.

### Option A - over RDP (recommended)

RDP into the VM (`mstsc /v:<vm-public-ip>`, sign in as the VM administrator). In the Remote Desktop dialog, under **Local Resources -> More...**, tick **Drives** so your workstation's disk is available on the VM. Then, on the VM:

```powershell
# adjust the source path to your local clone
Copy-Item "\\tsclient\C\labs\FY27SQLMotion\lab\source-env" "C:\lab-source" -Recurse
cd C:\lab-source
.\scripts\Install-LegacyDatabase.ps1 -ServerInstance "localhost"
```

### Option B - without RDP, via `az vm run-command`

This runs the install on the VM from your workstation, downloading the SQL from the public repository so nothing has to be copied and no port is opened. Adjust the resource group, VM name, and the raw URL owner/branch to match your deployment:

```powershell
$remote = @'
$base = "https://raw.githubusercontent.com/fredgis/FY27SQLMotion/main/lab/source-env/sql"
New-Item -ItemType Directory -Force C:\labsql | Out-Null
"01-create-legacy-db.sql","02-seed-data.sql","03-legacy-features.sql" | ForEach-Object {
  Invoke-WebRequest "$base/$_" -OutFile "C:\labsql\$_" -UseBasicParsing
  sqlcmd -S localhost -E -b -i "C:\labsql\$_"
}
'@
az vm run-command invoke `
  --resource-group rg-hvesql-demo-weu `
  --name hvesql-demo-sql2016-vm `
  --command-id RunPowerShellScript `
  --scripts $remote
```

> [!NOTE]
> `az vm run-command` executes as `NT AUTHORITY\SYSTEM`. On some images SYSTEM is not a SQL `sysadmin`; if the run reports a login or permission error, use Option A (RDP), where you run as the VM administrator, who is `sysadmin`.

Both methods run the three SQL files in order and leave `ContosoSales` and `ContosoArchive` ready to inspect. Verify from the VM:

```powershell
sqlcmd -S localhost -E -Q "SELECT name FROM sys.databases WHERE name LIKE 'Contoso%'"
```

## Security notes

* Only RDP (port 3389) is allowed inbound, and only from the address prefix you pass. Never widen it to `0.0.0.0/0`.
* The SQL port (1433) is not exposed to the internet. Install the database from the VM itself, or from a host inside the virtual network.
* For a hardened alternative to a public RDP address, place the VM behind Azure Bastion and remove the public IP. That costs more and is out of scope for a short demo.

## Cost control

* The VM accrues cost while it is running. Stop and deallocate it between sessions:

  ```powershell
  az vm deallocate --resource-group rg-hvesql-demo-weu --name hvesql-demo-sql2016-vm
  ```

* Tear the whole environment down when you are done:

  ```powershell
  az group delete --name rg-hvesql-demo-weu --yes --no-wait
  ```
