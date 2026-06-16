# FY27 SQL Motion

> **One business motion, one slide, one source of truth.**
> A template repository for capturing a go-to-market **motion** — its strategy,
> its KPIs, and its executive one-slide summary — in a form anyone on the team
> can read, reuse, and regenerate.

This repo is the **SQL motion** for FY27. It is also the **reference template**
for spinning up new motion repos: the next motion (e.g. the Fabric apps motion)
will live in its own repo with the exact same structure.

---

## 🎯 What we want to do

Drive **Azure SQL** through **two complementary go-to-market paths**, enabled by a
single hands-on vehicle — **"SQL in a Day"**.

| Path | Audience | Approach | KPI |
| ---- | -------- | -------- | --- |
| **Migration** | System Integrators (GSIs) | Migrate SQL workloads to Azure, delivered through GSIs | **Migrate** — number of opportunities (Nbr Opty) |
| **Adoption** | ISV / SDC | ISVs adopt a managed database service and operate on Azure SQL | **Operate** — % of ISVs that adopted a new service |

**Enablement vehicle:** ⚡ *SQL in a Day* — e.g. help CSPs build their own
"SQL in a Day".

**The work**
- List all technical migration assets.
- List all prerequisites to accelerate migrations.
- Define the rationale — *why migrate?* (PG "new born" · SQL Server "new born").

**The ask**
- Funding.
- 8 meetings — lead STU.
- 1 sponsor per GSI.

**GSI partners:** Capgemini · Accenture / Avanade · NTT Data · TCS · IBM (Nordcloud).

---

## 🖼️ The one-slide summary

![FY27 SQL Motion slide](deck/preview/MotionSQL-Azure.png)

The editable deck is in [`deck/MotionSQL-Azure.pptx`](deck/MotionSQL-Azure.pptx).
It is generated from a small JSON config ([`deck/motion-sql.json`](deck/motion-sql.json)),
so the slide is **reproducible** and **version-controlled** — change the config,
regenerate, and the slide stays consistent.

---

## 🧭 Use this repo as a template for a new motion

1. **Create a new repo** from this one (or copy its structure).
2. **Edit the strategy** in this README — paths, KPIs, work, ask.
3. **Edit `deck/motion-sql.json`** (rename it to your motion) with your content.
4. **Regenerate the slide** (see below) and commit the `.pptx` + preview PNG.

```
FY27SQLMotion/
├── README.md                     # the motion: vision, paths, KPIs, ask
├── deck/
│   ├── motion-sql.json           # slide content as data (edit this)
│   ├── MotionSQL-Azure.pptx      # generated slide (commit it)
│   └── preview/MotionSQL-Azure.png
└── skill/pptxmotions/            # the generator (see collapsed section below)
```

---

<details>
<summary>🧩 <b>How the slide is generated — the <code>pptxmotions</code> skill</b> (click to expand)</summary>

<br>

The deck is produced by **`pptxmotions`**, a small parametric generator bundled in
[`skill/pptxmotions/`](skill/pptxmotions). It turns the JSON config into a polished
Microsoft Fluent–styled slide, and is also a
[GitHub Copilot CLI](https://docs.github.com/copilot/how-tos/use-copilot-agents/use-copilot-cli)
skill so Copilot can build/update the slide for you on request.

### Regenerate the slide (standalone)

```bash
cd skill/pptxmotions
npm install                       # installs pptxgenjs
node motion.js ../../deck/motion-sql.json ../../deck/MotionSQL-Azure.pptx
```

Render a PNG preview (requires LibreOffice):

```bash
soffice --headless --convert-to png --outdir ../../deck/preview ../../deck/MotionSQL-Azure.pptx
```

### Use it from Copilot CLI

Install the skill once, then just ask Copilot in natural language.

**macOS / Linux**
```bash
git clone https://github.com/fredgis/pptxskill.git ~/.copilot/skills/pptxmotions
cd ~/.copilot/skills/pptxmotions && npm install
```

**Windows (PowerShell)**
```powershell
git clone https://github.com/fredgis/pptxskill.git "$env:USERPROFILE\.copilot\skills\pptxmotions"
cd "$env:USERPROFILE\.copilot\skills\pptxmotions"; npm install
```

Restart Copilot CLI, run `/skills` to confirm **pptxmotions** is listed, then:

```text
Use the pptxmotions skill to update deck/motion-sql.json and regenerate the slide.
```

The skill, its full config schema, and a fictional sample live in
[`skill/pptxmotions/README.md`](skill/pptxmotions/README.md). Upstream:
<https://github.com/fredgis/pptxskill>.

</details>

---

## License

The generator skill is MIT-licensed (see
[`skill/pptxmotions/LICENSE`](skill/pptxmotions/LICENSE)). Motion content in this
repo is internal material.