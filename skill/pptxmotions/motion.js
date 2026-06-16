/**
 * pptxmotions - parametric "motion" slide generator
 * --------------------------------------------------
 * Turns a single JSON config into a polished, single-slide "go-to-market motion"
 * deck using PptxGenJS. Design system: Microsoft Fluent palette, two pathway
 * cards (e.g. SI vs ISV), and a bottom band (work / vehicle / ask).
 *
 * Usage:
 *   node motion.js <config.json> [output.pptx]
 *
 * See examples/motion-sql.json for a complete config and README.md for the
 * full schema. Render to PNG for QA with LibreOffice:
 *   soffice --headless --convert-to png --outdir out <output.pptx>
 */
const fs = require("fs");
const path = require("path");
const pptxgen = require("pptxgenjs");

/* ---------- Default theme (Microsoft Fluent) ---------- */
const THEME = {
  NAVY: "0B2447",
  BLUE: "0078D4",
  TEAL: "00B4A6",
  LIGHT: "F3F7FB",
  GREY: "5B6B7B",
  WHITE: "FFFFFF",
  CARD_BLUE: "EAF3FB",
  CARD_TEAL: "E6F7F4",
  INK: "1B2A3A",
  BODY: "33485C",
  FONT_H: "Segoe UI Semibold",
  FONT_B: "Segoe UI",
};

function loadConfig(p) {
  const cfg = JSON.parse(fs.readFileSync(p, "utf8"));
  cfg.theme = Object.assign({}, THEME, cfg.theme || {});
  return cfg;
}

// Convert a config rich-text array [{t, bold, italic, color, accent}] -> pptx runs
function rich(segments, t, accentColor) {
  return (segments || []).map((s) => ({
    text: s.t,
    options: {
      bold: !!s.bold,
      italic: !!s.italic,
      color: s.accent ? accentColor : s.color || t.INK,
      fontFace: t.FONT_B,
    },
  }));
}

const mkShadow = () => ({ type: "outer", color: "0B2447", blur: 8, offset: 3, angle: 90, opacity: 0.12 });

function build(cfg) {
  const t = cfg.theme;
  const pres = new pptxgen();
  pres.layout = "LAYOUT_WIDE"; // 13.3 x 7.5
  pres.author = cfg.author || "pptxmotions";
  pres.title = cfg.title || "Motion";

  const slide = pres.addSlide();
  slide.background = { color: t.WHITE };

  /* ----- Header band ----- */
  const h = cfg.header || {};
  slide.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 13.3, h: 1.18, fill: { color: t.NAVY } });
  slide.addShape(pres.shapes.RECTANGLE, { x: 0, y: 1.18, w: 13.3, h: 0.06, fill: { color: t.TEAL } });
  slide.addText([
    { text: (h.tag ? h.tag + "  " : ""), options: { color: t.TEAL, bold: true, fontFace: t.FONT_H } },
    { text: h.title || "", options: { color: t.WHITE, bold: true, fontFace: t.FONT_H } },
  ], { x: 0.5, y: 0.16, w: 10.4, h: 0.62, fontSize: 25, valign: "middle", margin: 0 });
  if (h.subtitle) {
    slide.addText(h.subtitle, { x: 0.52, y: 0.74, w: 10.2, h: 0.34, fontSize: 12.5, italic: true, color: "C9D7E6", fontFace: t.FONT_B, margin: 0 });
  }
  if (h.badge) {
    const bw = Math.max(1.5, 0.5 + h.badge.length * 0.13);
    slide.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 12.8 - bw, y: 0.34, w: bw, h: 0.5, fill: { color: t.TEAL }, rectRadius: 0.25 });
    slide.addText(h.badge, { x: 12.8 - bw, y: 0.34, w: bw, h: 0.5, align: "center", valign: "middle", bold: true, color: t.NAVY, fontSize: 14, fontFace: t.FONT_H, charSpacing: 1, margin: 0 });
  }

  /* ----- Pathway cards ----- */
  const cardY = 1.5;
  const cardH = cfg.cardH || 2.95;
  const cardW = 5.85;
  const xs = [0.5, 6.95];

  (cfg.pathways || []).slice(0, 2).forEach((p, i) => {
    const x = xs[i];
    const accent = p.accent || (i === 0 ? t.BLUE : t.TEAL);
    const cardFill = p.cardFill || (i === 0 ? t.CARD_BLUE : t.CARD_TEAL);

    slide.addShape(pres.shapes.RECTANGLE, { x, y: cardY, w: cardW, h: cardH, fill: { color: cardFill }, line: { color: accent, width: 1 }, shadow: mkShadow() });
    slide.addShape(pres.shapes.RECTANGLE, { x, y: cardY, w: 0.1, h: cardH, fill: { color: accent } });

    // tag pill + audience
    const tagW = Math.max(2.0, 0.4 + (p.tag || "").length * 0.12);
    slide.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: x + 0.3, y: cardY + 0.22, w: tagW, h: 0.42, fill: { color: accent }, rectRadius: 0.21 });
    slide.addText(p.tag || "", { x: x + 0.3, y: cardY + 0.22, w: tagW, h: 0.42, align: "center", valign: "middle", color: t.WHITE, bold: true, fontSize: 12, fontFace: t.FONT_H, charSpacing: 1, margin: 0 });
    if (p.audience) {
      slide.addText(p.audience, { x: x + tagW + 0.45, y: cardY + 0.22, w: cardW - tagW - 0.7, h: 0.42, valign: "middle", color: t.GREY, bold: true, fontSize: 12, fontFace: t.FONT_B, align: "right", margin: 0 });
    }

    let cur = cardY + 0.74;
    // headline
    slide.addText(rich(p.headline, t, accent), { x: x + 0.3, y: cur, w: cardW - 0.6, h: 0.5, fontSize: 15, color: t.INK, fontFace: t.FONT_B, valign: "top", margin: 0 });
    cur += 0.5;

    // approach chip
    if (p.approach) {
      slide.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: x + 0.3, y: cur, w: cardW - 0.6, h: 0.4, fill: { color: t.WHITE }, line: { color: accent, width: 1 }, rectRadius: 0.08 });
      slide.addText([
        { text: "APPROACH   ", options: { color: accent, bold: true, fontFace: t.FONT_H } },
        { text: p.approach, options: { color: t.INK, bold: true, fontFace: t.FONT_B } },
      ], { x: x + 0.45, y: cur, w: cardW - 0.8, h: 0.4, valign: "middle", fontSize: 12, margin: 0 });
      cur += 0.48;
    }

    // KPI
    if (p.kpi) {
      slide.addText([
        { text: "KPI  ", options: { color: accent, bold: true, fontFace: t.FONT_H, fontSize: 12.5 } },
        { text: p.kpi, options: { color: t.INK, bold: true, fontFace: t.FONT_B, fontSize: 12.5 } },
      ], { x: x + 0.3, y: cur, w: cardW - 0.6, h: 0.3, valign: "middle", margin: 0 });
      cur += 0.32;
    }

    // optional bullets
    if (p.bullets && p.bullets.length) {
      slide.addText(p.bullets.map((b) => ({ text: b, options: { bullet: { code: "2022" }, color: t.BODY, fontSize: 11, fontFace: t.FONT_B, breakLine: true, paraSpaceAfter: 2 } })),
        { x: x + 0.45, y: cur, w: cardW - 0.75, h: 0.55, valign: "top", margin: 0 });
      cur += 0.2 + p.bullets.length * 0.22;
    }

    // optional goal box
    if (p.goal) {
      slide.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: x + 0.3, y: cur, w: cardW - 0.6, h: 0.5, fill: { color: t.WHITE }, line: { color: accent, width: 1 }, rectRadius: 0.06 });
      slide.addText([
        { text: (p.goal.label || "Goal") + "  ", options: { color: accent, bold: true, fontFace: t.FONT_H } },
        { text: p.goal.text, options: { color: t.BODY, fontFace: t.FONT_B } },
      ], { x: x + 0.45, y: cur, w: cardW - 0.85, h: 0.5, valign: "middle", fontSize: 11, margin: 0 });
      cur += 0.6;
    }

    // optional chips (e.g. partners)
    if (p.chips && p.chips.items && p.chips.items.length) {
      if (p.chips.label) {
        slide.addText(p.chips.label, { x: x + 0.3, y: cur, w: cardW - 0.6, h: 0.24, color: t.GREY, bold: true, fontSize: 10, fontFace: t.FONT_B, margin: 0 });
        cur += 0.26;
      }
      let gx = x + 0.3, gy = cur;
      p.chips.items.forEach((c) => {
        const w = 0.26 + c.length * 0.094;
        if (gx + w > x + cardW - 0.25) { gx = x + 0.3; gy += 0.36; }
        slide.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: gx, y: gy, w, h: 0.3, fill: { color: t.WHITE }, line: { color: accent, width: 1 }, rectRadius: 0.05 });
        slide.addText(c, { x: gx, y: gy, w, h: 0.3, align: "center", valign: "middle", color: t.NAVY, bold: true, fontSize: 9.5, fontFace: t.FONT_B, margin: 0 });
        gx += w + 0.1;
      });
    }
  });

  /* ----- Bottom band: work + optional vehicle + ask ----- */
  const bY = cfg.bottomY || 4.68;
  const bH = 1.85;
  const b = cfg.bottom || {};
  const hasVehicle = !!b.vehicle;
  const askW = 4.0;
  const askX = 8.8;
  const workW = hasVehicle ? 5.55 : 7.95;

  // Work panel
  if (b.work) {
    slide.addShape(pres.shapes.RECTANGLE, { x: 0.5, y: bY, w: workW, h: bH, fill: { color: t.LIGHT }, line: { color: "D7E3EE", width: 1 } });
    slide.addShape(pres.shapes.RECTANGLE, { x: 0.5, y: bY, w: 0.1, h: bH, fill: { color: t.NAVY } });
    slide.addText(b.work.title || "THE WORK", { x: 0.72, y: bY + 0.12, w: workW - 0.4, h: 0.3, color: t.NAVY, bold: true, fontSize: 13, fontFace: t.FONT_H, charSpacing: 1, margin: 0 });
    slide.addText((b.work.bullets || []).map((it) => {
      const item = typeof it === "string" ? { text: it } : it;
      return { text: item.text, options: { bullet: { code: "2022" }, color: item.highlight ? t.BLUE : t.BODY, bold: !!item.highlight, breakLine: true, paraSpaceAfter: 3, fontSize: 11 } };
    }), { x: 0.88, y: bY + 0.46, w: workW - 0.5, h: 1.3, valign: "top", fontFace: t.FONT_B, margin: 0 });
  }

  // Vehicle highlight (center)
  if (hasVehicle) {
    const v = b.vehicle;
    slide.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 6.25, y: bY, w: 2.35, h: bH, fill: { color: t.NAVY }, rectRadius: 0.1, shadow: mkShadow() });
    slide.addShape(pres.shapes.RECTANGLE, { x: 6.25, y: bY, w: 2.35, h: 0.06, fill: { color: t.TEAL } });
    if (v.icon) slide.addText(v.icon, { x: 6.25, y: bY + 0.22, w: 2.35, h: 0.5, align: "center", color: t.TEAL, fontSize: 26, fontFace: t.FONT_B, margin: 0 });
    slide.addText(v.name || "", { x: 6.25, y: bY + 0.66, w: 2.35, h: 0.4, align: "center", color: t.WHITE, bold: true, fontSize: 17, fontFace: t.FONT_H, margin: 0 });
    if (v.subtitle) slide.addText(v.subtitle, { x: 6.25, y: bY + 1.04, w: 2.35, h: 0.28, align: "center", color: t.TEAL, fontSize: 10.5, italic: true, fontFace: t.FONT_B, margin: 0 });
    if (v.note) slide.addText(v.note, { x: 6.4, y: bY + 1.34, w: 2.05, h: 0.45, align: "center", color: "C9D7E6", fontSize: 9.5, fontFace: t.FONT_B, margin: 0 });
  }

  // Ask panel
  if (b.ask) {
    slide.addShape(pres.shapes.RECTANGLE, { x: askX, y: bY, w: askW, h: bH, fill: { color: t.NAVY } });
    slide.addShape(pres.shapes.RECTANGLE, { x: askX, y: bY, w: 0.1, h: bH, fill: { color: t.TEAL } });
    slide.addText(b.ask.title || "THE ASK", { x: askX + 0.28, y: bY + 0.12, w: askW - 0.4, h: 0.3, color: t.TEAL, bold: true, fontSize: 13, fontFace: t.FONT_H, charSpacing: 1, margin: 0 });
    slide.addText((b.ask.bullets || []).map((it) => {
      const item = typeof it === "string" ? { text: it } : it;
      return { text: item.text, options: { bullet: { code: "2192" }, color: item.highlight ? t.TEAL : t.WHITE, bold: !!item.highlight, breakLine: true, paraSpaceAfter: 6, fontSize: 12 } };
    }), { x: askX + 0.42, y: bY + 0.5, w: askW - 0.55, h: 1.25, valign: "top", fontFace: t.FONT_B, margin: 0 });
  }

  /* ----- Footer ----- */
  if (cfg.footer) {
    slide.addText(cfg.footer, { x: 0.5, y: 6.66, w: 12.3, h: 0.3, align: "center", color: t.GREY, fontSize: 10, fontFace: t.FONT_B, margin: 0 });
  }

  return pres;
}

function main() {
  const cfgPath = process.argv[2];
  if (!cfgPath) {
    console.error("Usage: node motion.js <config.json> [output.pptx]");
    process.exit(1);
  }
  const cfg = loadConfig(cfgPath);
  const out = process.argv[3] || cfg.output || (path.basename(cfgPath, ".json") + ".pptx");
  const pres = build(cfg);
  pres.writeFile({ fileName: out }).then((f) => console.log("Saved:", f));
}

if (require.main === module) main();
module.exports = { build, loadConfig, THEME };
