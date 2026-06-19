# sql-migration-advisor — a GitHub Copilot CLI skill

A guided advisor that recommends the **best path to migrate a SQL Server environment
to Azure**. It runs a short structured interview, then scores and returns a grounded
recommendation: **target** (SQL VM / AVS / SQL MI / SQL DB / Fabric SQL DB / Arc SQL MI /
container / Arc in-place), **method** (MI Link / LRS / backup-restore / DAG / DMS /
replication / BACPAC / Fabric Migration Assistant), **downtime class**, **blockers +
remediations**, **cost levers** (AHB / ESU), and the right **Microsoft program**
(Cloud Accelerate Factory / SQL in a Day).

It is the conversational front-end to the knowledge base
[`docs/sql-server-to-azure-migration.md`](../../docs/sql-server-to-azure-migration.md)
and mirrors the **AI Migration Agent I/O contract** in §14 of that document.

> Packaged as a [GitHub Copilot CLI](https://docs.github.com/copilot/how-tos/use-copilot-agents/use-copilot-cli)
> **skill**. Once installed, Copilot CLI lists it under `/skills` and uses it
> automatically whenever you ask how to migrate or modernize SQL Server to Azure.

---

## What's inside

| File | Purpose |
| --- | --- |
| `SKILL.md` | The skill itself — trigger description, principles, the ~10-question interview, and the output-card template. |
| `reference/decision-rules.md` | The deterministic decision engine (Step A target → B method → C blockers → D cost/program), distilled from the knowledge base. |
| `examples/sample-recommendation.md` | A worked end-to-end example (SQL 2014 → Azure SQL MI via LRS). |

No build step, no dependencies — it is a prompt-driven skill (markdown only).

---

## Install as a Copilot CLI skill

Copilot CLI loads personal skills from a folder under `~/.copilot/skills/`. Each skill
is its own subfolder containing a `SKILL.md` (with YAML frontmatter). Install this one
by copying **just this subfolder** into that location.

### Option A — sparse clone of this skill only

**macOS / Linux**

```bash
# clone the repo somewhere, then copy the skill folder into place
git clone https://github.com/fredgis/FY27SQLMotion.git /tmp/FY27SQLMotion
mkdir -p ~/.copilot/skills
cp -R /tmp/FY27SQLMotion/skill/sql-migration-advisor ~/.copilot/skills/
```

**Windows (PowerShell)**

```powershell
git clone https://github.com/fredgis/FY27SQLMotion.git "$env:TEMP\FY27SQLMotion"
New-Item -ItemType Directory -Force -Path "$env:USERPROFILE\.copilot\skills" | Out-Null
Copy-Item -Recurse -Force "$env:TEMP\FY27SQLMotion\skill\sql-migration-advisor" "$env:USERPROFILE\.copilot\skills\"
```

### Option B — clone straight into the skills folder

```bash
# clones the WHOLE repo into the skills dir; Copilot only reads the SKILL.md it finds
git clone https://github.com/fredgis/FY27SQLMotion.git ~/.copilot/skills/sql-migration-advisor
```

> The skill lives at `skill/sql-migration-advisor/` inside the repo. Copilot CLI needs
> the folder that **directly contains `SKILL.md`** to sit under `~/.copilot/skills/`, so
> Option A (copy just the subfolder) keeps things clean.

### Activate

1. Restart Copilot CLI (skills are loaded at startup).
2. Run `/skills` and confirm **`sql-migration-advisor`** is listed.
3. Ask, e.g. *"I want to migrate a SQL Server environment to Azure"* / *"migrer SQL Server vers Azure"* —
   the skill takes over and starts the interview.

---

## How it works

1. **Interview** — Copilot asks ~10 focused questions, one at a time (scope, source
   location & version, primary driver, management model, instance-level feature
   dependencies, largest DB size, downtime tolerance, network & ports, compliance,
   ancillary services). It asks in your language and skips what you've already stated.
2. **Score** — it applies the deterministic rules in `reference/decision-rules.md`.
3. **Recommend** — it returns a per-database card with target, method, downtime class,
   the assessment tool to run next, blockers + remediations, cost levers and program fit.
   It **never** recommends retired tooling (DMA, Azure Data Studio extension, DMS *classic*).

See `examples/sample-recommendation.md` for a full example.

---

## Keep it up to date

The decision rules track Microsoft tooling changes (retirements, version gates, previews).
When the knowledge base `docs/sql-server-to-azure-migration.md` is updated, re-sync
`reference/decision-rules.md` so the advisor stays accurate. Last verified: **June 2026**.

## License

MIT.
