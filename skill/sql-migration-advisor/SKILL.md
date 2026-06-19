---
name: sql-migration-advisor
description: "Recommends the best path to migrate a SQL Server environment to Azure. Runs a short guided interview, then scores and recommends a target (SQL VM, AVS, SQL MI, SQL DB, Fabric SQL DB, Arc SQL MI, container or Arc in-place), a method (MI Link, LRS, backup/restore, DAG, DMS, replication, BACPAC, Fabric Migration Assistant), a downtime class, blockers and remediations, cost levers (AHB, ESU) and the Microsoft program fit (Cloud Accelerate Factory, SQL in a Day). Trigger when the user wants to migrate or modernize SQL Server to Azure, asks for the best or recommended migration path, target or tool, or says 'migrer SQL Server', 'migrate SQL Server', 'SQL to Azure' or 'SQL in a Day'."
license: MIT
---

# SQL Migration Advisor — best path to Azure

Help the user choose the **best migration path** for a SQL Server environment by
running a **short guided interview** and then producing a **grounded, deterministic
recommendation** (target + method + downtime + blockers + cost + program).

This skill encodes the knowledge base
[`docs/sql-server-to-azure-migration.md`](https://github.com/fredgis/FY27SQLMotion/blob/main/docs/sql-server-to-azure-migration.md)
(FY27 SQL Motion, "SQL in a Day"). It mirrors the **AI Migration Agent I/O contract** in §14 of that doc.

## Core principles

- **Interview first, recommend second.** Never guess the path before asking. Ask the
  questions below **one at a time** with the `ask_user` tool, multiple-choice where
  possible. Stop as soon as you have enough to decide; skip irrelevant branches.
- **Ask in the user's language.** If the user writes in French, ask in French.
- **Separate the three layers** (the #1 mistake): **target** (where the DB ends up),
  **control plane** (how you assess/orchestrate), **method** (the data vehicle).
- **Never recommend a retired tool.** DMA (retired 16 Jul 2025), Azure Data Studio +
  SQL Migration extension (retired 28 Feb 2026), and DMS *classic* SQL scenarios
  (retired 15 Mar 2026) are **out**. Entry points today: **SSMS 22 Migration Component**,
  **SQL Server migration in Azure Arc** (portal, Copilot), **modern Azure DMS**,
  **`Az.DataMigration`** CLI/PowerShell at scale.
- **Be honest about previews & limits.** Fabric SQL DB migration is Preview (DACPAC
  ≤ 20 MB, on-prem gateway only, no Private Link). Mirroring is **not** a one-shot
  migration. Containers are **not** fully-managed PaaS.
- **One recommendation per distinct profile.** A large estate has many profiles — run
  the interview once per representative server/database group, or recommend a discovery
  pass first (see Q1).

## Workflow

1. **Frame it.** One sentence: "I'll ask ~8–10 quick questions, then give you a scored
   migration path." If the user already volunteered answers (e.g. "SQL 2014, 2 TB, need
   minimal downtime, uses SQL Agent"), pre-fill those and only ask what's missing.
2. **Interview** using the questionnaire below (`ask_user`, one question per call).
3. **Score** using `reference/decision-rules.md` (Steps A→D). The rules are deterministic —
   apply them, don't improvise.
4. **Output** the recommendation card(s) using the template below. Always include the
   **next assessment tool to run**, the **blockers + remediations**, and the **cost +
   program** lines.
5. **Offer follow-ups:** a per-database table for several DBs, a runbook outline, or a
   one-slide summary (hand off to the `pptxmotions` skill).

## The questionnaire (ask one at a time)

Use `ask_user`. Provide the choices shown; the UI adds a free-form option automatically.
Allow "Not sure / skip" — treat skipped answers with the safe default in brackets.

1. **Scope** — "How big is this migration?"
   - `Single database` · `A few databases (2–10)` · `Large estate (10+ servers/DBs)`
   - → If **large estate**: lead with **Azure Migrate** discovery/business-case +
     **`Az.DataMigration`** automation, then run the rest of the interview against the
     **dominant profile**. Note the estate likely has mixed targets.

2. **Source location** — "Where does the source SQL Server run today?"
   - `On-prem` · `AWS EC2` · `AWS RDS for SQL Server` · `GCP Compute Engine` · `GCP Cloud SQL`
   - → All are supported sources for DMS / LRS / MI Link / native restore. AWS RDS / GCP
     Cloud SQL = managed source (no OS access; backup/restore + DMS paths).

3. **Source version** — "Which SQL Server version is the source?"
   - `2008/2008 R2` · `2012` · `2014` · `2016` · `2017/2019` · `2022` · `2025`
   - → **Hard gates:** MI Link needs **2016+**; LRS needs **2012+**; native restore to MI
     needs **2008+**; transactional replication **to SQL DB** needs **2016–2019 only**.

4. **Primary driver** — "What's the main reason to migrate now?"
   - `End-of-support / ESU pressure` · `Cost optimization` · `App modernization (cloud-native)`
   - `Data-center exit (VMware estate)` · `Analytics / Fabric unification` · `Sovereignty / edge`

5. **Management model** — "How much control do you need over the engine/OS?"
   - `Fully managed PaaS (let Microsoft patch & run it)` (default)
   - `Need OS / file-system / engine control`
   - `Need Kubernetes on-prem / edge / multi-cloud`

6. **Instance-level feature dependencies** (multi-select) — "Does the workload use any of
   these? (pick all that apply)"
   - `FILESTREAM / FileTable` · `PolyBase` · `Cross-DB queries / DTC` · `SQL CLR` ·
     `Linked servers` · `SQL Agent jobs` · `Service Broker` · `None / not sure`
   - → FILESTREAM/FileTable/PolyBase/DTC ⇒ **eliminates SQL DB and SQL MI** (→ VM/AVS/container).
     SQL Agent / cross-DB / linked servers / CLR present (but none of the VM-only ones) ⇒
     **prefer SQL MI over SQL DB**.

7. **Largest database size** — "How large is the biggest database?"
   - `< 150 GB` · `150 GB – 4 TB` · `> 4 TB`
   - → **> 4 TB** on SQL DB ⇒ **Hyperscale** (only viable tier); also flag Backup-to-URL
     size caps (12.8 TB on 2016+) and seed-then-sync for multi-TB.

8. **Downtime tolerance** — "How much cutover downtime can the business accept?"
   - `Near-zero (minutes)` · `Minimal (tens of minutes – a couple of hours)` · `Offline (planned window)`

9. **Network & ports** — "What's the network path to Azure, and can you open ports?"
   - `Good ExpressRoute / high bandwidth` · `Limited WAN` · `Very large multi-TB move`
   - Follow-up if relevant: "Can you open **5022** (MI Link), **1433**, and **443** outbound?"
   - → Limited WAN / multi-TB ⇒ **Data Box seed + AzCopy**, then sync the delta. Blocked
     5022 ⇒ MI Link not viable → fall back to LRS.

10. **Compliance / sovereignty** — "Any data-residency or sovereignty constraints?"
    - `Standard commercial` · `EU data boundary` · `Government / sovereign` · `Edge / air-gapped`
    - → Government/sovereign/edge biases **SQL VM**, **AVS**, or **Arc-enabled SQL MI**.

11. **Ancillary services** (multi-select) — "Anything around the database to bring along?"
    - `SSIS packages` · `SSRS reports` · `SSAS models` · `TDE-encrypted DBs` ·
      `Many SQL Agent jobs` · `None`
    - → Each maps to a remediation (§ blockers): SSIS→Azure-SSIS IR, SSRS→Power BI paginated,
      SSAS→AAS/Power BI, TDE→migrate the **server cert first**, SQL Agent on SQL DB→Elastic Jobs.

*(Optional refinement)* **Workload profile** — "Which best describes the app?"
`Legacy ERP (SAP/Dynamics)` · `Multi-tenant SaaS` · `Modern microservice` ·
`BI / analytics-first` · `General OLTP`. Use it to break ties (see rules Step A).

## Scoring

Apply **`reference/decision-rules.md`** in order:
- **Step A — Target** (decision tree from feature deps, management model, size, driver, sovereignty).
- **Step B — Method** (given target + downtime + source version + size + network).
- **Step C — Downtime class, blockers, remediations** (ports, TDE, logins, ancillary).
- **Step D — Cost levers (AHB / ESU) + Microsoft program fit + assessment tool to run next.**

## Output template (one card per database/profile)

```
## Recommended migration path — <DB or profile name>

🎯 Target            : <SQL VM | AVS | SQL MI | SQL DB (tier) | Fabric SQL DB | Arc SQL MI | Container | Arc in-place>
🔁 Method            : <MI Link | LRS | Native backup/restore | Distributed/Always On AG | DMS (offline) |
                        Transactional replication | BACPAC/SqlPackage | HCX/vMotion | Fabric Migration Assistant | ADF>
⏱  Downtime class    : <near-zero | minimal | offline>
🧭 Assess / orchestrate with : <SSMS 22 Migration Component | SQL migration in Azure Arc | Azure Migrate | modern DMS | Az.DataMigration>

🚧 Blockers          : <e.g. port 5022 both ways; AD DS for DAG; TDE server cert; Windows logins>
🛠  Remediations      : <ordered fixes — e.g. "1) migrate TDE cert first  2) open 5022  3) script logins">
🔌 Ancillary         : <SSIS→Azure-SSIS IR; SSRS→Power BI paginated; SSAS→AAS; SQL Agent→native(MI)/Elastic Jobs(SQL DB)>

💰 Cost levers       : AHB <eligible?/path>; ESU <free on VM | via Arc (paid) on-prem>; sizing: Perfmon ≥7d + ~20% headroom
🎁 Program fit       : <Cloud Accelerate Factory | SQL in a Day | Azure Accelerate / FastTrack>
⚠️  Caveats          : <previews, size caps, SLA notes>
🔗 Why               : <1–2 lines tying the choice to the answers + a Microsoft Learn link>
```

For multiple databases, render a compact table (DB · target · method · downtime · key blocker)
and then expand only the non-obvious ones.

## Guardrails

- If the user's feature set is internally contradictory (e.g. wants **fully-managed SQL DB**
  but needs **FILESTREAM**), say so plainly and present the trade-off (refactor vs change target).
- Always state the **single biggest risk** for the chosen path (usually: ports, TDE cert order,
  network throughput, or a dependency map gap — ~60% of migrations stumble on undocumented
  linked servers / SQL Agent jobs).
- Recommend **DEA capture+replay** as a pre-cutover validation step for performance-sensitive
  workloads.
- Keep links to **Microsoft Learn** (see the doc's §15) so the advice is verifiable.
