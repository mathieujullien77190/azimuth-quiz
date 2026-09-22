// Genere les maquettes SVG (accueil, jeu, resultat) de chaque design.
// Usage : node designs/generate.mjs   ->   ecrit designs/<id>.svg
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const OUT = dirname(fileURLToPath(import.meta.url));
const W = 390;
const H = 844;
const GAP = 60;
const PAD = 48;
const HEADER = 150;
const CANVAS_W = PAD * 2 + W * 3 + GAP * 2;
const CANVAS_H = HEADER + H + PAD;

// ---------- utilitaires ----------
const rad = (d) => (d * Math.PI) / 180;
const f = (n) => Math.round(n * 100) / 100;
const polar = (cx, cy, r, b) => [cx + r * Math.sin(rad(b)), cy - r * Math.cos(rad(b))];
const pts = (list) => list.map(([x, y]) => `${f(x)},${f(y)}`).join(' ');
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
const prng = (seed) => () => {
  seed |= 0;
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

// ---------- les 5 designs (memes palettes que src/themes/) ----------
const SANS = "'Segoe UI', 'Helvetica Neue', Arial, sans-serif";
const themes = [
  {
    id: 'night',
    name: 'Nuit',
    tagline: 'Bleu nuit et ambre, ciel étoilé',
    colors: { background: '#0B1220', surface: '#141E33', surfaceHigh: '#1B2842', border: '#25334F', text: '#F3F6FC', textMuted: '#93A0BC', accent: '#F5B841', accentDark: '#C98A12', onAccent: '#1A1203', truth: '#FACC15', danger: '#FF6B6B', success: '#4ADE80' },
    font: { family: SANS, weight: 800, display: 900, label: 800, labelSpacing: 1.2, titleSpacing: 7 },
    r: { card: 24, button: 28 },
    cardBorder: 1,
    depth: 4,
  },
  {
    id: 'parchment',
    name: 'Parchemin',
    tagline: 'Carte d’explorateur, rose des vents',
    colors: { background: '#EFE3C8', surface: '#F8F0DD', surfaceHigh: '#E7D8B5', border: '#B99B6B', text: '#3A2A18', textMuted: '#7A6448', accent: '#B5482F', accentDark: '#7F2F1D', onAccent: '#FFF6E6', truth: '#2F6F73', danger: '#9C2F2F', success: '#4B7F3A' },
    font: { family: "Georgia, 'Times New Roman', serif", weight: 700, display: 700, label: 700, labelSpacing: 2.2, titleSpacing: 6 },
    r: { card: 12, button: 8 },
    cardBorder: 2,
    depth: 3,
  },
  {
    id: 'neon',
    name: 'Néon',
    tagline: 'Arcade cyber, grille synthwave',
    colors: { background: '#07060F', surface: '#100E1F', surfaceHigh: '#1A1633', border: '#3B2E7A', text: '#F2EFFF', textMuted: '#8F86C9', accent: '#FF2E93', accentDark: '#B3005F', onAccent: '#0A0010', truth: '#00E5FF', danger: '#FF5C5C', success: '#39FF88' },
    font: { family: "Consolas, Menlo, 'Courier New', monospace", weight: 700, display: 800, label: 700, labelSpacing: 1.6, titleSpacing: 6 },
    r: { card: 6, button: 4 },
    cardBorder: 1.5,
    depth: 0,
  },
  {
    id: 'ocean',
    name: 'Océan',
    tagline: 'Lagon, soleil et vagues',
    colors: { background: '#E8F5FA', surface: '#FFFFFF', surfaceHigh: '#D9EEF6', border: '#BFE0EC', text: '#0B2A3C', textMuted: '#557A8C', accent: '#FF7A59', accentDark: '#E0553A', onAccent: '#2A0B03', truth: '#0E9AA7', danger: '#E5484D', success: '#1FA971' },
    font: { family: "'Trebuchet MS', 'Segoe UI', Arial, sans-serif", weight: 700, display: 800, label: 700, labelSpacing: 0.9, titleSpacing: 6 },
    r: { card: 28, button: 28 },
    cardBorder: 0,
    depth: 4,
  },
];

// ---------- boussole (une facture par design) ----------
const needle = (cx, cy, r, b, fill, extra = '') => {
  const list = [polar(cx, cy, r * 0.66, b), polar(cx, cy, r * 0.075, b + 90), polar(cx, cy, r * 0.18, b + 180), polar(cx, cy, r * 0.075, b - 90)];
  return `<polygon points="${pts(list)}" fill="${fill}" ${extra}/>`;
};
const knob = (cx, cy, r, b, fill, kr, stroke) => {
  const [x, y] = polar(cx, cy, r * 0.74, b);
  return `<circle cx="${f(x)}" cy="${f(y)}" r="${f(kr)}" fill="${fill}"${stroke ? ` stroke="${stroke}" stroke-width="3"` : ''}/>`;
};

const compass = (t, cx, cy, r, { guess = null, truth = null } = {}) => {
  const c = t.colors;
  const fs = r * 0.18;
  const letters = (fill, family, weight = 800) =>
    [['N', 0], ['E', 90], ['S', 180], ['O', 270]]
      .map(([label, b]) => {
        const [x, y] = polar(cx, cy, r * 0.68, b);
        return `<text x="${f(x)}" y="${f(y + fs * 0.35)}" font-size="${f(fs)}" font-weight="${weight}" text-anchor="middle" font-family="${family}" fill="${label === 'N' ? c.danger : fill}">${label}</text>`;
      })
      .join('');
  const ticks = (step, colorOf, lenOf, widthOf) => {
    let out = '';
    for (let b = 0; b < 360; b += step) {
      const kind = b % 90 === 0 ? 0 : b % 45 === 0 ? 1 : 2;
      if (lenOf(kind) === 0) continue;
      const [x1, y1] = polar(cx, cy, r * 0.93, b);
      const [x2, y2] = polar(cx, cy, r * (0.93 - lenOf(kind)), b);
      out += `<line x1="${f(x1)}" y1="${f(y1)}" x2="${f(x2)}" y2="${f(y2)}" stroke="${colorOf(kind)}" stroke-width="${widthOf(kind)}" stroke-linecap="round"/>`;
    }
    return out;
  };
  const hub = (fill, stroke) => `<circle cx="${cx}" cy="${cy}" r="${f(r * 0.06)}" fill="${fill}" stroke="${stroke}" stroke-width="2"/>`;
  const fam = t.font.family;
  let out = '<g>';

  if (t.id === 'night') {
    out += `<circle cx="${cx}" cy="${cy}" r="${f(r * 0.96)}" fill="url(#face)" stroke="${c.border}" stroke-width="3"/>`;
    out += `<circle cx="${cx}" cy="${cy}" r="${f(r * 0.5)}" fill="none" stroke="${c.border}" stroke-width="1" stroke-dasharray="3 6"/>`;
    out += ticks(5, (k) => [c.text, c.textMuted, c.border][k], (k) => [0.13, 0.09, 0.05][k], (k) => [2.5, 2, 1.5][k]);
    out += letters(c.textMuted, fam);
  } else if (t.id === 'parchment') {
    out += `<circle cx="${cx}" cy="${cy}" r="${f(r)}" fill="none" stroke="${c.border}" stroke-width="3"/>`;
    out += `<circle cx="${cx}" cy="${cy}" r="${f(r * 0.96)}" fill="url(#face)" stroke="${c.border}" stroke-width="1"/>`;
    // rose des vents : etoile a 8 branches
    const star = [];
    for (let i = 0; i < 16; i += 1) star.push(polar(cx, cy, i % 2 === 0 ? (i % 4 === 0 ? r * 0.6 : r * 0.42) : r * 0.1, (i * 360) / 16));
    out += `<polygon points="${pts(star)}" fill="${c.border}" opacity="0.4"/>`;
    out += `<circle cx="${cx}" cy="${cy}" r="${f(r * 0.5)}" fill="none" stroke="${c.border}" stroke-width="1" opacity="0.6"/>`;
    out += ticks(5, (k) => [c.text, c.textMuted, c.border][k], (k) => [0.13, 0.09, 0.05][k], (k) => [2.5, 1.8, 1.2][k]);
    out += letters(c.text, fam);
  } else if (t.id === 'neon') {
    out += `<circle cx="${cx}" cy="${cy}" r="${f(r * 0.96)}" fill="${c.background}" stroke="${c.border}" stroke-width="3" filter="url(#glow)"/>`;
    out += `<circle cx="${cx}" cy="${cy}" r="${f(r * 0.82)}" fill="none" stroke="${c.truth}" stroke-width="1" opacity="0.35" stroke-dasharray="2 5"/>`;
    out += ticks(5, (k) => [c.text, c.textMuted, c.border][k], (k) => [0.13, 0.09, 0.05][k], (k) => [2.5, 2, 1.5][k]);
    out += letters(c.textMuted, fam);
  } else if (t.id === 'ocean') {
    out += `<circle cx="${cx}" cy="${cy}" r="${f(r)}" fill="#FFFFFF" stroke="${c.border}" stroke-width="8" filter="url(#shadow)"/>`;
    out += `<circle cx="${cx}" cy="${cy}" r="${f(r * 0.9)}" fill="url(#face)"/>`;
    for (let b = 0; b < 360; b += 10) {
      const [x, y] = polar(cx, cy, r * 0.82, b);
      out += `<circle cx="${f(x)}" cy="${f(y)}" r="${b % 90 === 0 ? 3.2 : 1.8}" fill="${b % 90 === 0 ? c.text : c.truth}" opacity="${b % 90 === 0 ? 0.9 : 0.55}"/>`;
    }
    out += letters(c.text, fam);
  } else {
    out += `<circle cx="${cx}" cy="${cy}" r="${f(r * 0.96)}" fill="url(#face)" stroke="${c.text}" stroke-width="1.5"/>`;
    out += ticks(30, () => c.text, (k) => (k === 0 ? 0.12 : 0.06), () => 1.2);
    out += letters(c.textMuted, fam, 600);
  }

  // aiguilles
  const trueFill = c.truth;
  {
    const glow = t.id === 'neon' ? 'filter="url(#glow)"' : '';
    const round = t.id === 'ocean' ? `stroke-linejoin="round" stroke="${c.accent}" stroke-width="4"` : '';
    if (truth !== null) out += needle(cx, cy, r, truth, trueFill, `opacity="0.9" ${glow}`) + knob(cx, cy, r, truth, trueFill, r * 0.028);
    if (guess !== null) out += needle(cx, cy, r, guess, c.accent, `${glow} ${round}`) + knob(cx, cy, r, guess, c.accent, r * 0.04, c.background);
  }
  out += hub(c.background, c.text);
  return out + '</g>';
};

// ---------- decors de fond (le coeur de chaque design) ----------
const decors = {
  night: () => {
    const rnd = prng(11);
    let out = `<rect width="${W}" height="${H}" fill="url(#bg)"/>`;
    for (let i = 0; i < 80; i += 1) {
      out += `<circle cx="${f(rnd() * W)}" cy="${f(rnd() * H * 0.92)}" r="${f(rnd() * 1.3 + 0.3)}" fill="#fff" opacity="${f(0.15 + rnd() * 0.6)}"/>`;
    }
    const nodes = [[290, 64], [326, 96], [312, 138], [352, 168], [338, 214]];
    out += `<polyline points="${pts(nodes)}" fill="none" stroke="#F5B841" stroke-width="1" opacity="0.35"/>`;
    out += nodes.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="2.6" fill="#F5B841" opacity="0.8"/>`).join('');
    out += `<circle cx="195" cy="1000" r="420" fill="none" stroke="#25334F" stroke-width="1.5" opacity="0.7"/>`;
    out += `<circle cx="195" cy="1000" r="340" fill="none" stroke="#25334F" stroke-width="1.5" opacity="0.7"/>`;
    out += `<ellipse cx="195" cy="1000" rx="120" ry="420" fill="none" stroke="#25334F" stroke-width="1.5" opacity="0.7"/>`;
    return out;
  },
  parchment: () => {
    let out = `<rect width="${W}" height="${H}" fill="#EFE3C8"/>`;
    out += `<path d="M30 190 C60 130 150 125 178 178 C198 220 150 250 104 238 C60 230 24 222 30 190Z" fill="#B99B6B" opacity="0.16"/>`;
    out += `<path d="M250 610 C290 570 350 590 356 640 C360 690 310 720 268 700 C236 684 226 640 250 610Z" fill="#B99B6B" opacity="0.16"/>`;
    out += `<path d="M28 806 C120 704 40 628 164 596 S302 526 352 474" fill="none" stroke="#B5482F" stroke-width="2" stroke-dasharray="7 6" opacity="0.5"/>`;
    out += `<path d="M344 466 l16 16 M360 466 l-16 16" stroke="#B5482F" stroke-width="3" stroke-linecap="round" opacity="0.7"/>`;
    out += `<rect width="${W}" height="${H}" fill="url(#vignette)"/>`;
    out += `<rect width="${W}" height="${H}" filter="url(#grain)" opacity="0.5"/>`;
    out += `<rect x="10" y="10" width="${W - 20}" height="${H - 20}" rx="6" fill="none" stroke="#B99B6B" stroke-width="2.5"/>`;
    out += `<rect x="17" y="17" width="${W - 34}" height="${H - 34}" rx="3" fill="none" stroke="#B99B6B" stroke-width="0.9"/>`;
    for (const [x, y, sx, sy] of [[17, 17, 1, 1], [W - 17, 17, -1, 1], [17, H - 17, 1, -1], [W - 17, H - 17, -1, -1]]) {
      out += `<path d="M${x} ${y + sy * 22} Q${x} ${y} ${x + sx * 22} ${y}" fill="none" stroke="#B99B6B" stroke-width="1.6"/><circle cx="${x + sx * 7}" cy="${y + sy * 7}" r="2.4" fill="#B99B6B"/>`;
    }
    return out;
  },
  neon: () => {
    let out = `<rect width="${W}" height="${H}" fill="#07060F"/>`;
    out += `<circle cx="195" cy="700" r="100" fill="url(#sun)" opacity="0.5"/>`;
    out += `<rect y="700" width="${W}" height="${H - 700}" fill="#07060F"/>`;
    let grid = '';
    for (let i = 0; i <= 12; i += 1) {
      const y = 700 + Math.pow(i / 12, 2) * (H - 700);
      grid += `<line x1="0" y1="${f(y)}" x2="${W}" y2="${f(y)}"/>`;
    }
    for (let k = -9; k <= 9; k += 1) grid += `<line x1="195" y1="700" x2="${195 + k * 95}" y2="${H}"/>`;
    out += `<g stroke="#FF2E93" stroke-width="1.2" opacity="0.5" filter="url(#glow)">${grid}</g>`;
    const rnd = prng(5);
    for (let i = 0; i < 26; i += 1) out += `<circle cx="${f(rnd() * W)}" cy="${f(rnd() * 640)}" r="${f(rnd() * 1.1 + 0.4)}" fill="#00E5FF" opacity="${f(0.2 + rnd() * 0.5)}"/>`;
    for (const [x, y, sx, sy] of [[14, 46, 1, 1], [W - 14, 46, -1, 1], [14, H - 14, 1, -1], [W - 14, H - 14, -1, -1]]) {
      out += `<path d="M${x} ${y + sy * 24} V${y} H${x + sx * 24}" fill="none" stroke="#00E5FF" stroke-width="2" filter="url(#glow)"/>`;
    }
    out += `<rect width="${W}" height="${H}" fill="url(#scan)" opacity="0.5"/>`;
    return out;
  },
  ocean: () => {
    let out = `<rect width="${W}" height="${H}" fill="url(#bg)"/>`;
    out += `<circle cx="350" cy="10" r="52" fill="#FF7A59" opacity="0.16"/><circle cx="350" cy="10" r="40" fill="url(#sun)"/>`;
    for (const [x, y, s] of [[70, 74, 1], [210, 46, 0.7], [340, 200, 0.6]]) {
      out += `<g fill="#fff" opacity="0.85" transform="translate(${x} ${y}) scale(${s})"><ellipse cx="0" cy="0" rx="34" ry="12"/><ellipse cx="22" cy="-9" rx="20" ry="12"/><ellipse cx="-16" cy="-7" rx="16" ry="9"/></g>`;
    }
    const wave = (y0, amp, wl, phase, fill, op) => {
      const p = [[0, H]];
      for (let x = 0; x <= W; x += 8) p.push([x, y0 + amp * Math.sin((x / wl) * 2 * Math.PI + phase)]);
      p.push([W, H]);
      return `<polygon points="${pts(p)}" fill="${fill}" opacity="${op}"/>`;
    };
    out += wave(650, 12, 210, 0, '#0E9AA7', 0.16);
    out += wave(700, 14, 170, 1.4, '#0E9AA7', 0.22);
    out += wave(752, 12, 240, 2.6, '#0B6E85', 0.3);
    out += wave(800, 8, 150, 0.6, '#0B4F66', 0.35);
    return out;
  },
};

// ---------- ecrans ----------
const screens = (t) => {
  const c = t.colors;
  const fam = t.font.family;
  const txt = (x, y, s, o = {}) =>
    `<text x="${f(x)}" y="${f(y)}" font-size="${o.size ?? 14}" fill="${o.fill ?? c.text}" font-weight="${o.weight ?? t.font.weight}" text-anchor="${o.anchor ?? 'start'}" letter-spacing="${o.ls ?? 0}" font-family="${fam}">${esc(o.upper ? s.toUpperCase() : s)}</text>`;
  const label = (x, y, s, o = {}) => txt(x, y, s, { size: 11, fill: c.textMuted, weight: t.font.label, ls: t.font.labelSpacing, upper: true, ...o });
  const cardFilter = t.id === 'neon' ? ' filter="url(#cardGlow)"' : t.id === 'ocean' ? ' filter="url(#shadow)"' : '';
  const card = (x, y, w, h) =>
    `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${t.r.card}" fill="${c.surface}"${t.cardBorder ? ` stroke="${c.border}" stroke-width="${t.cardBorder}"` : ''}${cardFilter}/>`;
  const button = (x, y, w, h, s, ghost = false) => {
    const rx = Math.min(t.r.button, h / 2);
    if (ghost) return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="none" stroke="${c.border}" stroke-width="1.5"/>${txt(x + w / 2, y + h / 2 + 6, s, { size: 18, anchor: 'middle' })}`;
    return (
      (t.depth ? `<rect x="${x}" y="${y + t.depth}" width="${w}" height="${h}" rx="${rx}" fill="${c.accentDark}"/>` : '') +
      `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${c.accent}"${t.id === 'neon' ? ' filter="url(#glow)"' : ''}/>` +
      txt(x + w / 2, y + h / 2 + 6, s, { size: 18, anchor: 'middle', fill: c.onAccent, ls: 0.3 })
    );
  };
  const status = () =>
    txt(32, 32, '9:41', { size: 13, weight: 600 }) +
    `<rect x="${W - 62}" y="23" width="24" height="11" rx="3" fill="none" stroke="${c.text}" stroke-width="1.2" opacity="0.8"/><rect x="${W - 60}" y="25" width="16" height="7" rx="1.5" fill="${c.text}" opacity="0.8"/>` +
    `<g fill="${c.text}" opacity="0.8"><rect x="${W - 96}" y="29" width="3" height="5"/><rect x="${W - 91}" y="26" width="3" height="8"/><rect x="${W - 86}" y="23" width="3" height="11"/></g>`;
  const flag = (x, y) =>
    `<g clip-path="url(#flagClip)" transform="translate(${x} ${y})"><rect width="54" height="36" fill="#C4272F"/><rect x="18" width="18" height="36" fill="#015197"/><circle cx="9" cy="14" r="3.2" fill="#F9CF02"/><rect x="6.6" y="19" width="4.8" height="9" fill="#F9CF02"/></g><rect x="${x}" y="${y}" width="54" height="36" rx="5" fill="none" stroke="${c.border}" stroke-width="1"/>`;
  const topBar = (score) =>
    txt(24, 76, '✕  Quitter', { size: 15, fill: c.textMuted }) + txt(W - 24, 78, score, { size: 18, fill: c.accent, anchor: 'end' });
  const cityCard = () => {
    let out = card(24, 92, 342, 176);
    out += `<rect x="40" y="108" width="112" height="26" rx="${Math.min(t.r.button, 13)}" fill="${c.surfaceHigh}"/>` + label(96, 125, 'Manche 4 / 10', { anchor: 'middle', size: 10.5 });
    for (let i = 0; i < 10; i += 1) out += `<circle cx="${262 + i * 10.4}" cy="121" r="3.6" fill="${i < 4 ? c.accent : c.border}"/>`;
    out += flag(168, 146);
    out += txt(195, 216, 'Oulan-Bator', { size: 34, weight: t.font.display, anchor: 'middle', ls: -0.5 });
    out += txt(195, 238, 'Mongolie', { size: 16, fill: c.accent, anchor: 'middle' });
    out += txt(195, 258, 'Où se trouve-t-elle depuis Paris ?', { size: 12, fill: c.textMuted, anchor: 'middle', weight: 400 });
    return out;
  };

  // --- accueil ---
  let home = status();
  home += txt(195, 106, 'FULL AZIMUT', { size: 36, fill: c.accent, anchor: 'middle', weight: t.font.display, ls: t.font.titleSpacing });
  home += txt(195, 134, 'Où est cette ville ? Cap et distance, à toi de jouer.', { size: 12.5, fill: c.textMuted, anchor: 'middle', weight: 400 });
  home += compass(t, 195, 290, 112, { guess: 42 });
  home += card(24, 430, 342, 116);
  const rules = ['Une ville s’affiche.', 'Oriente la boussole vers elle.', 'Estime la distance qui vous sépare.'];
  rules.forEach((s, i) => {
    const y = 466 + i * 32;
    home += `<circle cx="56" cy="${y - 5}" r="11" fill="${c.surfaceHigh}"/>`;
    home += i === 0 ? `<circle cx="56" cy="${y - 7}" r="3.6" fill="${c.accent}"/><path d="M56 ${y + 1} L52 ${y - 5} H60Z" fill="${c.accent}"/>` : '';
    home += i === 1 ? `<circle cx="56" cy="${y - 5}" r="6" fill="none" stroke="${c.accent}" stroke-width="1.6"/><polygon points="56,${y - 9} 58,${y - 5} 56,${y - 1} 54,${y - 5}" fill="${c.accent}"/>` : '';
    home += i === 2 ? `<rect x="49" y="${y - 8}" width="14" height="6" rx="1" fill="none" stroke="${c.accent}" stroke-width="1.5"/><path d="M52 ${y - 8}v3M55 ${y - 8}v4M58 ${y - 8}v3M61 ${y - 8}v4" stroke="${c.accent}" stroke-width="1"/>` : '';
    home += txt(80, y, s, { size: 14.5, weight: 600 });
  });
  home += txt(195, 716, 'Record : 7 420 pts', { size: 14.5, fill: c.textMuted, anchor: 'middle' });
  home += button(24, 742, 342, 56, 'Jouer');

  // --- jeu ---
  let game = status() + topBar('2 315 pts') + cityCard();
  game += compass(t, 195, 392, 100, { guess: 48 });
  game += txt(195, 528, 'NE · 48°', { size: 26, fill: c.accent, anchor: 'middle', weight: t.font.display });
  game += card(24, 548, 342, 142);
  game += label(40, 578, 'Distance estimée');
  game += txt(350, 582, '8 000 km', { size: 26, fill: c.accent, anchor: 'end', weight: t.font.display });
  const tx = 55 + 0.8796 * 280;
  game += `<rect x="40" y="620" width="310" height="8" rx="4" fill="${c.surfaceHigh}"/><rect x="40" y="620" width="${f(tx - 40)}" height="8" rx="4" fill="${c.accent}"/>`;
  game += `<circle cx="${f(tx)}" cy="624" r="15" fill="${c.surface}" stroke="${c.accent}" stroke-width="4"/>`;
  [[0.3, '100 km'], [0.61, '1 000 km'], [0.91, '10 000 km']].forEach(([ratio, s]) => {
    game += `<circle cx="${f(55 + ratio * 280)}" cy="624" r="2" fill="${c.background}" opacity="0.6"/>` + txt(55 + ratio * 280, 664, s, { size: 10, fill: c.textMuted, anchor: 'middle', weight: 400 });
  });
  game += button(24, 712, 342, 56, 'Valider');

  // --- resultat ---
  let result = status() + topBar('3 227 pts') + cityCard();
  result += compass(t, 195, 372, 84, { guess: 48, truth: 56 });
  result += card(24, 470, 342, 322);
  result += txt(195, 532, '+912', { size: 52, fill: c.accent, anchor: 'middle', weight: t.font.display });
  result += txt(195, 552, 'points', { size: 13, fill: c.textMuted, anchor: 'middle', weight: 400 });
  [['Direction', '+434', 'NE · 48°', 'NE · 56°', '  (écart 8°)', 590], ['Distance', '+478', '8 000 km', '7 682 km', '', 652]].forEach(([name, pts_, mine, real, extra, y]) => {
    result += label(40, y, name) + txt(350, y + 2, pts_, { size: 18, fill: c.success, anchor: 'end' });
    result += `<text x="40" y="${y + 24}" font-size="14" font-family="${fam}" fill="${c.textMuted}"><tspan fill="${c.accent}" font-weight="${t.font.weight}">${mine}</tspan>  →  <tspan fill="${c.truth}" font-weight="${t.font.weight}">${real}</tspan>${extra}</text>`;
  });
  result += `<text x="195" y="712" font-size="12" text-anchor="middle" font-family="${fam}"><tspan fill="${c.accent}" font-weight="${t.font.weight}">● ta réponse</tspan>    <tspan fill="${c.truth}" font-weight="${t.font.weight}">● réalité</tspan></text>`;
  result += button(40, 726, 310, 50, 'Manche suivante');

  return [home, game, result];
};

// ---------- assemblage ----------
const defs = (t) => {
  const c = t.colors;
  const faceInner = { night: '#1B2842', parchment: '#F8F0DD', neon: '#1A1633', ocean: '#FFFFFF' }[t.id];
  const faceOuter = { night: '#0B1220', parchment: '#DFC99C', neon: '#07060F', ocean: '#CFEAF4' }[t.id];
  return `<defs>
  <radialGradient id="face" cx="50%" cy="45%" r="60%"><stop offset="0" stop-color="${faceInner}"/><stop offset="1" stop-color="${faceOuter}"/></radialGradient>
  <radialGradient id="bg" cx="50%" cy="30%" r="90%"><stop offset="0" stop-color="${t.id === 'ocean' ? '#BFE6F5' : '#14213D'}"/><stop offset="1" stop-color="${t.id === 'ocean' ? '#E8F5FA' : c.background}"/></radialGradient>
  <linearGradient id="sun" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${t.id === 'ocean' ? '#FFB199' : '#7A2CFF'}"/><stop offset="1" stop-color="${t.id === 'ocean' ? '#FF7A59' : '#FF2E93'}"/></linearGradient>
  <radialGradient id="vignette" cx="50%" cy="50%" r="75%"><stop offset="0.55" stop-color="#7A5A2A" stop-opacity="0"/><stop offset="1" stop-color="#7A5A2A" stop-opacity="0.28"/></radialGradient>
  <filter id="grain" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="2" seed="4"/><feColorMatrix values="0 0 0 0 0.35  0 0 0 0 0.24  0 0 0 0 0.1  0 0 0 0.16 0"/></filter>
  <filter id="glow" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
  <filter id="cardGlow" x="-10%" y="-10%" width="120%" height="120%"><feDropShadow dx="0" dy="0" stdDeviation="6" flood-color="#FF2E93" flood-opacity="0.35"/></filter>
  <filter id="shadow" x="-15%" y="-15%" width="130%" height="140%"><feDropShadow dx="0" dy="5" stdDeviation="7" flood-color="#0B2A3C" flood-opacity="0.16"/></filter>
  <pattern id="scan" width="4" height="4" patternUnits="userSpaceOnUse"><rect width="4" height="1" fill="#000" opacity="0.35"/></pattern>
  <clipPath id="phone"><rect width="${W}" height="${H}" rx="44"/></clipPath>
  <clipPath id="flagClip"><rect width="54" height="36" rx="5"/></clipPath>
</defs>`;
};

// Designs retenus (les autres ont ete ecartes ; leurs palettes restent ci-dessus pour memoire).
const KEPT = new Set(['night']);

for (const t of themes.filter((candidate) => KEPT.has(candidate.id))) {
  const [home, game, result] = screens(t);
  const decor = decors[t.id]();
  const titles = ['Accueil', 'Partie', 'Résultat'];
  const phones = [home, game, result]
    .map((content, i) => {
      const x = PAD + i * (W + GAP);
      return `<g transform="translate(${x} ${HEADER})">
  <text x="${W / 2}" y="-14" font-size="13" text-anchor="middle" fill="#8B8B99" font-family="${SANS}" letter-spacing="2">${titles[i].toUpperCase()}</text>
  <g clip-path="url(#phone)">${decor}${content}</g>
  <rect width="${W}" height="${H}" rx="44" fill="none" stroke="#3A3A46" stroke-width="3"/>
</g>`;
    })
    .join('\n');
  const chips = Object.entries(t.colors)
    .filter(([k]) => ['background', 'surface', 'surfaceHigh', 'border', 'text', 'textMuted', 'accent', 'truth'].includes(k))
    .map(([k, v], i) => `<g transform="translate(${PAD + i * 118} 92)"><rect width="30" height="30" rx="8" fill="${v}" stroke="#555566" stroke-width="1"/><text x="40" y="13" font-size="11" fill="#E8E8F0" font-family="${SANS}">${k}</text><text x="40" y="27" font-size="11" fill="#8B8B99" font-family="Consolas, monospace">${v}</text></g>`)
    .join('');

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${CANVAS_W}" height="${CANVAS_H}" viewBox="0 0 ${CANVAS_W} ${CANVAS_H}">
<title>Full Azimut — design ${esc(t.name)}</title>
${defs(t)}
<rect width="${CANVAS_W}" height="${CANVAS_H}" fill="#1E1E26"/>
<text x="${PAD}" y="58" font-size="34" font-weight="800" fill="#F4F4F8" font-family="${SANS}">${esc(t.name)}</text>
<text x="${PAD + 12 + esc(t.name).length * 21}" y="58" font-size="16" fill="#8B8B99" font-family="${SANS}">${esc(t.tagline)}</text>
${chips}
${phones}
</svg>
`;
  writeFileSync(join(OUT, `${t.id}.svg`), svg);
  console.log(`ecrit ${t.id}.svg (${Math.round(svg.length / 1024)} Ko)`);
}
