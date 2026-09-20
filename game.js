'use strict';
/* ============================================================
   RIFT SLAYER — a Diablo 3-inspired single-screen ARPG
   Single-file engine. Served statically on GitHub Pages.
   ============================================================ */

/* ===================== Utilities ===================== */
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const lerp = (a, b, t) => a + (b - a) * t;
const rand = (a, b) => a + Math.random() * (b - a);
const randInt = (a, b) => Math.floor(rand(a, b + 1));
const dist = (x1, y1, x2, y2) => Math.hypot(x2 - x1, y2 - y1);
const angleTo = (x1, y1, x2, y2) => Math.atan2(y2 - y1, x2 - x1);
const angDiff = (a, b) => {
  let d = (b - a) % (Math.PI * 2);
  if (d > Math.PI) d -= Math.PI * 2;
  if (d < -Math.PI) d += Math.PI * 2;
  return d;
};
let _uid = 1;
const uid = () => _uid++;
const pick = arr => arr[Math.floor(Math.random() * arr.length)];
const chance = p => Math.random() < p;

const SVG_NS = 'http://www.w3.org/2000/svg';
const svgCache = new Map();
function svgURL(inner, w = 48, h = 48) {
  const svg = `<svg xmlns="${SVG_NS}" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">${inner}</svg>`;
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
}
function svgImg(inner, w = 48, h = 48) {
  const url = svgURL(inner, w, h);
  if (svgCache.has(url)) return svgCache.get(url);
  const img = new Image();
  img.src = url;
  svgCache.set(url, img);
  return img;
}
function el(tag, cls, html) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (html !== undefined) e.innerHTML = html;
  return e;
}
function fmt(n) { return Math.round(n).toString(); }
function fmt1(n) { return (Math.round(n * 10) / 10).toString(); }

/* ===================== Data: rift types ===================== */
const RIFT_TYPES = {
  fire: { name: 'Fire', color: '#e0512a', accent: '#ffb347', floor1: '#4a1a0e', floor2: '#2b0e07', wall: '#6b2412', glyph: '🔥', trophy: 'Fire Trophy', monsters: ['Emberling', 'Flame Imp'], elite: 'Infernal', boss: 'Pyrelord' },
  ice: { name: 'Ice', color: '#8fd0f0', accent: '#eaf8ff', floor1: '#1c2f3f', floor2: '#12202c', wall: '#2f5368', glyph: '❄️', trophy: 'Ice Trophy', monsters: ['Frostling'], elite: 'Glacial', boss: 'Glacius Titan' },
  earth: { name: 'Earth', color: '#9a7348', accent: '#8fbf6a', floor1: '#3a2c1c', floor2: '#241b10', wall: '#5c452a', glyph: '⛰️', trophy: 'Earth Trophy', monsters: ['Stone Brute'], elite: 'Gargantuan', boss: 'Terra Colossus' },
  darkness: { name: 'Darkness', color: '#7a4fc0', accent: '#c89bff', floor1: '#241633', floor2: '#150d20', wall: '#3c2358', glyph: '🌑', trophy: 'Darkness Trophy', monsters: ['Shade'], elite: 'Cursed Shade', boss: 'Shadow Lord' },
};
const RIFT_KEYS = Object.keys(RIFT_TYPES);

/* ===================== Data: classes / skills / talents ===================== */
const TALENT_TIER_GATE = { 1: 0, 2: 2, 3: 4 }; // distinct trophy types required
const TALENT_COST = [0, 1, 2, 4, 6, 9, 12, 16, 20, 25, 30]; // rank 1..10 cost in trophies
const MAX_TALENT_RANK = 10;

function defSkill(o) { return o; }

const CLASSES = {
  paladin: {
    name: 'Paladin', color: '#e8b64c', desc: 'A defensive melee fighter who wields a mace and shield, infusing them with holy power.',
    base: { maxHealth: 100, maxMana: 34, armor: 18, attackPower: 7, magicPower: 0, attackSpeed: 1.0, critChance: 0.05, healthRegen: 3.2, manaRegen: 1.2, runTime: 6, str: 8, int: 2, sta: 8, moveSpeed: 205 },
    weaponKind: 'mace',
    skills: [
      defSkill({ id: 'smite', name: 'Smite', shape: 'hammer', color: '#ffd980', cost: 18, cd: 3, kind: 'melee', desc: 'Strike with a holy-infused mace for bonus damage; extra damage to darkness monsters.' }),
      defSkill({ id: 'bulwark', name: 'Holy Bulwark', shape: 'shield', color: '#ffd980', cost: 25, cd: 12, kind: 'buff', desc: 'Raise your shield, greatly reducing incoming damage for 4s.' }),
      defSkill({ id: 'consecration', name: 'Consecration', shape: 'nova', color: '#ffd980', cost: 30, cd: 10, kind: 'area', desc: 'Bless the ground around you, dealing holy damage over time.' }),
      defSkill({ id: 'judgment', name: 'Judgment', shape: 'bolt', color: '#ffd980', cost: 25, cd: 5, kind: 'ranged', desc: 'Hurl a bolt of holy light at a distant monster.' }),
      defSkill({ id: 'layonhands', name: 'Lay on Hands', shape: 'heart', color: '#ffd980', cost: 40, cd: 20, kind: 'self', desc: 'Instantly restore a large portion of your health.' }),
    ],
    talents: [
      { id: 'holyInfusion', tier: 1, name: 'Holy Infusion', desc: 'Your mace deals +{v} holy damage on every hit.' },
      { id: 'shieldMastery', tier: 1, name: 'Shield Mastery', desc: '+{v} Armor and +{v2}% chance to block attacks.' },
      { id: 'divineRetribution', tier: 2, name: 'Divine Retribution', desc: 'Reflect {v}% of the damage you take back at the attacker.' },
      { id: 'righteousFury', tier: 2, name: 'Righteous Fury', desc: 'Smite has a {v}% chance to stun the target.' },
      { id: 'blessedRegen', tier: 3, name: 'Blessed Regeneration', desc: 'Regenerate +{v} health per second.' },
    ],
  },
  wizard: {
    name: 'Wizard', color: '#5aa8ff', desc: 'A master of the elemental magics, controlling the battlefield from a distance.',
    base: { maxHealth: 60, maxMana: 90, armor: 5, attackPower: 0, magicPower: 9, attackSpeed: 1.0, critChance: 0.05, healthRegen: 2.2, manaRegen: 2.0, runTime: 5, str: 2, int: 9, sta: 4, moveSpeed: 205 },
    weaponKind: 'wand',
    skills: [
      defSkill({ id: 'fireball', name: 'Fireball', shape: 'flame', color: '#ff7a3c', cost: 25, cd: 3, kind: 'ranged', desc: 'Hurl a ball of fire that deals damage in an area.' }),
      defSkill({ id: 'frostnova', name: 'Frost Nova', shape: 'snow', color: '#9fd8ff', cost: 30, cd: 10, kind: 'area', desc: 'Freeze monsters around you, stopping them in place.' }),
      defSkill({ id: 'chainlightning', name: 'Chain Lightning', shape: 'lightning', color: '#fff07a', cost: 30, cd: 6, kind: 'targeted', desc: 'A bolt of lightning that jumps between nearby monsters.' }),
      defSkill({ id: 'rockwall', name: 'Rock Wall', shape: 'wall', color: '#c8a06a', cost: 25, cd: 14, kind: 'area', desc: 'Raise a wall of earth that blocks movement.' }),
      defSkill({ id: 'regrowth', name: 'Regrowth', shape: 'leaf', color: '#7ae88a', cost: 30, cd: 12, kind: 'self', desc: 'Restore health over a short time.' }),
    ],
    talents: [
      { id: 'elementalAffinity', tier: 1, name: 'Elemental Affinity', desc: 'Your spells deal +{v}% damage.' },
      { id: 'overflowingMana', tier: 1, name: 'Overflowing Mana', desc: '+{v} maximum mana and +{v2} mana regen.' },
      { id: 'scorchedEarth', tier: 2, name: 'Scorched Earth', desc: 'Fireball leaves burning ground that damages monsters.' },
      { id: 'deepFreeze', tier: 2, name: 'Deep Freeze', desc: 'Frost Nova freezes monsters for {v} seconds longer.' },
      { id: 'naturesBoon', tier: 3, name: "Nature's Boon", desc: 'Healing and regeneration you receive is increased by {v}%.' },
    ],
  },
  blademaster: {
    name: 'Blademaster', color: '#e05a5a', desc: 'A swift duelist darting around the battlefield to cut monsters down.',
    base: { maxHealth: 72, maxMana: 46, armor: 8, attackPower: 8, magicPower: 0, attackSpeed: 1.3, critChance: 0.10, healthRegen: 2.6, manaRegen: 1.4, runTime: 7, str: 6, int: 3, sta: 5, moveSpeed: 215 },
    weaponKind: 'blade',
    skills: [
      defSkill({ id: 'whirlwind', name: 'Whirlwind', shape: 'wind', color: '#ff8a8a', cost: 25, cd: 6, kind: 'area', desc: 'Spin with your blades, hitting all nearby monsters.' }),
      defSkill({ id: 'bladeflurry', name: 'Blade Flurry', shape: 'sword', color: '#ff8a8a', cost: 18, cd: 7, kind: 'melee', desc: 'Unleash a rapid flurry of slashes on a single target.' }),
      defSkill({ id: 'shadowstep', name: 'Shadowstep', shape: 'step', color: '#c89bff', cost: 20, cd: 8, kind: 'targeted', desc: 'Teleport to a monster and strike it.' }),
      defSkill({ id: 'lacerate', name: 'Lacerate', shape: 'bleed', color: '#ff6a6a', cost: 20, cd: 6, kind: 'melee', desc: 'A deep cut that makes the target bleed over time.' }),
      defSkill({ id: 'adrenaline', name: 'Adrenaline', shape: 'fury', color: '#ffb04c', cost: 20, cd: 15, kind: 'buff', desc: 'Temporarily increase your attack speed.' }),
    ],
    talents: [
      { id: 'keenEdge', tier: 1, name: 'Keen Edge', desc: 'Your blades ignore {v}% of monster armor.' },
      { id: 'bloodlust', tier: 1, name: 'Bloodlust', desc: 'Your attacks heal you for {v}% of the damage dealt.' },
      { id: 'focus', tier: 2, name: 'Focus', desc: '+{v}% critical strike chance.' },
      { id: 'relentless', tier: 2, name: 'Relentless', desc: 'Bleeds you apply last longer and tick harder.' },
      { id: 'secondWind', tier: 3, name: 'Second Wind', desc: 'Restore +{v} health when you defeat a monster.' },
    ],
  },
};
const CLASS_KEYS = Object.keys(CLASSES);
const DIFFICULTIES = {
  easy: { name: 'Easy', waveMod: -1, mobMod: -1, hpMod: 0.85, dmgMod: 0.8 },
  normal: { name: 'Normal', waveMod: 0, mobMod: 0, hpMod: 1.0, dmgMod: 1.0 },
  hard: { name: 'Hard', waveMod: 2, mobMod: 2, hpMod: 1.25, dmgMod: 1.3 },
};

/* ===================== Data: monsters ===================== */
/* ability handlers are function declarations (hoisted) referenced below */
const MONSTERS = {
  /* Fire */
  Emberling: { type: 'fire', hp: 30, dmg: 5, speed: 112, armor: 0, r: 11, atkInt: 1.1, onHit: 'burn', burnDps: 3, burnDur: 3 },
  'Flame Imp': { type: 'fire', hp: 22, dmg: 4, speed: 95, armor: 0, r: 10, atkInt: 1.4, ranged: true, proj: { kind: 'firebolt', dmg: 5, speed: 240, range: 300 }, onHit: null },
  Infernal: { type: 'fire', role: 'elite', hp: 95, dmg: 9, speed: 82, armor: 2, r: 16, atkInt: 1.4, onHit: 'burn', burnDps: 4, burnDur: 4, abilities: [{ interval: 1.0, action: infernalTrail }], onDeath: infernalDeath },
  Pyrelord: { type: 'fire', role: 'boss', hp: 430, dmg: 13, speed: 70, armor: 3, r: 27, atkInt: 1.6, onHit: 'burn', burnDps: 5, burnDur: 4, aura: { radius: 90, kind: 'burn' }, abilities: [{ interval: 4.5, action: pyrelordVolley }, { interval: 7, action: flameNova }] },
  /* Ice */
  Frostling: { type: 'ice', hp: 34, dmg: 6, speed: 72, armor: 1, r: 12, atkInt: 1.5, onHit: 'chill', chillFactor: 0.45, chillDur: 3 },
  Glacial: { type: 'ice', role: 'elite', hp: 115, dmg: 9, speed: 70, armor: 4, r: 17, atkInt: 1.6, onHit: 'chill', chillFactor: 0.5, chillDur: 3, abilities: [{ interval: 6, action: glacialNova }, { interval: 8, action: glacialShield }] },
  'Glacius Titan': { type: 'ice', role: 'boss', hp: 500, dmg: 14, speed: 65, armor: 5, r: 28, atkInt: 1.8, onHit: 'chill', chillFactor: 0.55, chillDur: 3.5, aura: { radius: 95, kind: 'chill' }, abilities: [{ interval: 4.5, action: glaciusBarrage }, { interval: 8, action: glaciusNova }] },
  /* Earth */
  'Stone Brute': { type: 'earth', hp: 55, dmg: 9, speed: 55, armor: 6, r: 13, atkInt: 1.9, onHit: null },
  Gargantuan: { type: 'earth', role: 'elite', hp: 165, dmg: 12, speed: 50, armor: 12, r: 19, atkInt: 2.0, onHit: null, abilities: [{ interval: 5, action: gargantuanSlam }] },
  'Terra Colossus': { type: 'earth', role: 'boss', hp: 640, dmg: 17, speed: 58, armor: 14, r: 30, atkInt: 2.0, onHit: null, abilities: [{ interval: 4, action: terraBoulder }, { interval: 6.5, action: terraSlam }, { interval: 9, action: terraCharge }] },
  /* Darkness */
  Shade: { type: 'darkness', hp: 30, dmg: 6, speed: 100, armor: 0, r: 10, atkInt: 1.3, onHit: 'weak', weakFactor: 0.7, weakDur: 3, abilities: [{ interval: 5, action: shadeTeleport }] },
  'Cursed Shade': { type: 'darkness', role: 'elite', hp: 105, dmg: 8, speed: 95, armor: 1, r: 15, atkInt: 1.4, onHit: 'weak', weakFactor: 0.65, weakDur: 4, aura: { radius: 85, kind: 'curse' }, abilities: [{ interval: 6, action: shadeTeleport }] },
  'Shadow Lord': { type: 'darkness', role: 'boss', hp: 480, dmg: 12, speed: 80, armor: 3, r: 26, atkInt: 1.6, onHit: 'weak', weakFactor: 0.75, weakDur: 3, aura: { radius: 95, kind: 'curse' }, abilities: [{ interval: 4.5, action: shadowBolts }, { interval: 9, action: shadowSummon }, { interval: 11, action: shadowCurse }] },
};

/* ===================== Data: items ===================== */
const RARITIES = {
  common: { name: 'Common', color: '#cfcfcf', bonus: 0, weight: 55 },
  uncommon: { name: 'Uncommon', color: '#6ee86e', bonus: 1, weight: 26 },
  rare: { name: 'Rare', color: '#5aa8ff', bonus: 2, weight: 13 },
  epic: { name: 'Epic', color: '#c07bff', bonus: 3, weight: 5 },
  legendary: { name: 'Legendary', color: '#ff9d3c', bonus: 3, weight: 1 },
};
const RARITY_KEYS = ['common', 'uncommon', 'rare', 'epic', 'legendary'];

const SLOT_INFO = {
  weapon: { name: 'Weapon', icon: 'weapon' },
  offhand: { name: 'Off-hand', icon: 'shield' },
  helmet: { name: 'Helmet', icon: 'helmet' },
  chest: { name: 'Chest', icon: 'chest' },
  legs: { name: 'Legs', icon: 'legs' },
  boots: { name: 'Boots', icon: 'boots' },
  gloves: { name: 'Gloves', icon: 'gloves' },
  amulet: { name: 'Amulet', icon: 'amulet' },
  ring: { name: 'Ring', icon: 'ring' },
};
const EQUIP_SLOTS = Object.keys(SLOT_INFO);
const ARMOR_SLOTS = ['offhand', 'helmet', 'chest', 'legs', 'boots', 'gloves'];
const JEWELRY_SLOTS = ['amulet', 'ring'];

const ARMOR_BASE = { offhand: 5, helmet: 4, chest: 7, legs: 5, boots: 3, gloves: 3 };
const SLOT_LABELS = {
  weapon: 'Main-hand', offhand: 'Off-hand', helmet: 'Helmet', chest: 'Chest', legs: 'Legs',
  boots: 'Boots', gloves: 'Gloves', amulet: 'Amulet', ring: 'Ring',
};

/* Affix pool (bonus stats). value scales with item level. */
const AFFIXES = [
  { id: 'health', label: 'Health', min: 12, max: 40, step: 4 },
  { id: 'mana', label: 'Mana', min: 8, max: 28, step: 4 },
  { id: 'armor', label: 'Armor', min: 2, max: 10, step: 2 },
  { id: 'attackPower', label: 'Attack Power', min: 2, max: 8, step: 2 },
  { id: 'magicPower', label: 'Magic Power', min: 2, max: 8, step: 2 },
  { id: 'strength', label: 'Strength', min: 1, max: 5, step: 1 },
  { id: 'intellect', label: 'Intellect', min: 1, max: 5, step: 1 },
  { id: 'stamina', label: 'Stamina', min: 1, max: 5, step: 1 },
  { id: 'healthRegen', label: 'Health Regen', min: 1, max: 4, step: 1 },
  { id: 'manaRegen', label: 'Mana Regen', min: 0.5, max: 2, step: 0.5 },
  { id: 'attackSpeed', label: 'Attack Speed', min: 4, max: 15, step: 3, pct: true },
  { id: 'critChance', label: 'Crit Chance', min: 2, max: 8, step: 2, pct: true },
  { id: 'lifeOnHit', label: 'Life on Hit', min: 2, max: 6, step: 2 },
  { id: 'lifePerSecond', label: 'Life per Second', min: 1, max: 4, step: 1 },
  { id: 'lifeSteal', label: 'Life Steal', min: 1, max: 4, step: 1, pct: true },
  { id: 'lifeOnKill', label: 'Life on Kill', min: 3, max: 10, step: 2 },
  { id: 'runTime', label: 'Run Time', min: 1, max: 3, step: 1 },
  { id: 'moveSpeed', label: 'Move Speed', min: 3, max: 10, step: 2, pct: true },
];

/* Legendary / Epic special effects (implemented in combat & stats) */
const SPECIAL_EFFECTS = [
  { id: 'lifeStealPct', name: '+{v}% Life Steal', apply: s => s.lifeSteal += 0.03 },
  { id: 'thorns', name: 'Thorns: reflect {v} damage', apply: s => s.thorns += 6 },
  { id: 'fireAura', name: 'Burning Aura: {v} fire damage/sec', apply: s => s.fireAura += 8 },
  { id: 'cdr', name: 'Cooldowns reduced by {v}%', apply: s => s.cdr += 12 },
  { id: 'moveSpeedPct', name: '+{v}% move speed', apply: s => s.moveSpeedPct += 8 },
  { id: 'attackSpeedPct', name: '+{v}% attack speed', apply: s => s.attackSpeedPct += 10 },
  { id: 'critChanceFlat', name: '+{v}% crit chance', apply: s => s.critChanceFlat += 6 },
  { id: 'lifeOnKillFlat', name: 'Restore {v} health on kill', apply: s => s.lifeOnKillFlat += 6 },
  { id: 'dodge', name: '+{v}% chance to dodge', apply: s => s.dodge += 0.06 },
  { id: 'multistrike', name: '{v}% chance to strike twice', apply: s => s.multistrike += 0.15 },
];

const WEAPON_MATERIALS = {
  mace: ['Iron Mace', 'War Hammer', 'Flanged Mace', 'Runed Maul', 'Templar Club'],
  blade: ['Steel Blade', 'Falchion', 'Kris', 'Warblade', 'Sabre'],
  wand: ['Oak Wand', 'Crystal Rod', 'Runestaff', 'Elder Staff', 'Starwood Scepter'],
};
const ARMOR_MATERIALS = {
  offhand: ['Buckler', 'Kite Shield', 'Tower Shield', 'Bulwark'],
  helmet: ['Helm', 'Great Helm', 'Sallet', 'Crown'],
  chest: ['Vest', 'Cuirass', 'Chestplate', 'Plate'],
  legs: ['Greaves', 'Legplates', 'Tassets'],
  boots: ['Boots', 'Greaves', 'Sabatons'],
  gloves: ['Gloves', 'Gauntlets', 'Vambraces'],
  amulet: ['Amulet', 'Talisman', 'Pendant'],
  ring: ['Ring', 'Band', 'Loop'],
};
const RARITY_ADJ = {
  common: '', uncommon: 'Sturdy ', rare: 'Fine ', epic: 'Epic ', legendary: 'Legendary ',
};

/* ===================== Item generation ===================== */
function rollRarity(level, shop) {
  // Higher rifts shift weights toward higher rarity; shop is capped at rare, mostly common.
  let w = { common: 55, uncommon: 26, rare: 13, epic: 5, legendary: 1 };
  const shift = Math.min(30, level * 3);
  w.common = Math.max(20, w.common - shift);
  w.uncommon = Math.min(35, w.uncommon + shift * 0.5);
  w.rare = Math.min(25, w.rare + shift * 0.3);
  w.epic = Math.min(14, w.epic + shift * 0.15);
  w.legendary = Math.min(8, w.legendary + shift * 0.08);
  if (shop) { w.epic = 0; w.legendary = 0; w.rare = Math.min(w.rare, 14); w.common = Math.max(w.common, 48); }
  const total = w.common + w.uncommon + w.rare + w.epic + w.legendary;
  let r = Math.random() * total;
  for (const k of RARITY_KEYS) { r -= w[k]; if (r <= 0) return k; }
  return 'common';
}

function rollAffixValue(aff, ilvl) {
  const s = 1 + (ilvl - 1) * 0.35;
  const base = rand(aff.min, aff.max) * s;
  const step = aff.step;
  return Math.max(aff.min, Math.round(base / step) * step);
}

function makeAffix(ilvl, allowed) {
  const pool = AFFIXES.filter(a => allowed(a));
  const aff = pick(pool);
  return { id: aff.id, label: aff.label, value: rollAffixValue(aff, ilvl), pct: !!aff.pct };
}

function statLabel(a) { return (a.pct ? '+' + a.value + '% ' : '+' + a.value + ' ') + a.label; }

function generateItem(slot, ilvl, weaponKind) {
  ilvl = Math.max(1, Math.round(ilvl));
  const shop = arguments[3] === 'shop';
  const rarity = shop ? rollRarity(ilvl, true) : rollRarity(ilvl, false);
  const item = {
    uid: uid(), slot, ilvl, rarity, name: '', stats: {}, damageMin: 0, damageMax: 0, special: null,
  };
  const mat = ARMOR_MATERIALS[slot] ? pick(ARMOR_MATERIALS[slot]) : 'Relic';

  // Base stats by slot
  if (slot === 'weapon') {
    const kind = weaponKind || 'mace';
    const base = 5 + ilvl * 2.2;
    item.damageMin = Math.round(base);
    item.damageMax = Math.round(base + 5 + ilvl * 1.6);
    if (kind === 'wand') { item.stats.magicPower = Math.round(3 + ilvl * 1.2); item.weaponKind = 'wand'; }
    else { item.stats.attackPower = Math.round(3 + ilvl * 1.2); item.weaponKind = kind; }
    item.baseName = pick(WEAPON_MATERIALS[kind]);
    item.name = RARITY_ADJ[rarity] + item.baseName;
  } else if (ARMOR_SLOTS.includes(slot)) {
    item.stats.armor = Math.round(ARMOR_BASE[slot] + ilvl * 1.4);
    if (Math.random() < 0.55) item.stats.health = Math.round(10 + ilvl * 2.6);
    else item.stats.mana = Math.round(7 + ilvl * 1.8);
    item.baseName = mat;
    item.name = RARITY_ADJ[rarity] + mat;
  } else {
    // Jewelry: no armor, one small base + rolls
    if (Math.random() < 0.5) item.stats.health = Math.round(8 + ilvl * 2.0);
    else item.stats.mana = Math.round(6 + ilvl * 1.4);
    item.baseName = mat;
    item.name = RARITY_ADJ[rarity] + mat;
  }

  // Rarity bonus stats
  const bonus = RARITIES[rarity].bonus;
  const isJewelry = JEWELRY_SLOTS.includes(slot);
  const used = new Set(Object.keys(item.stats));
  for (let i = 0; i < bonus; i++) {
    let tries = 0;
    let aff;
    do { aff = makeAffix(ilvl, a => (!used.has(a.id)) && (!isJewelry || a.id !== 'armor')); tries++; } while (tries < 12 && !aff);
    if (!aff) break;
    item.stats[aff.id] = (item.stats[aff.id] || 0) + aff.value;
    used.add(aff.id);
  }

  // Epic special affix / Legendary unique effect
  if (rarity === 'epic' || rarity === 'legendary') {
    const sp = pick(SPECIAL_EFFECTS);
    const scale = rarity === 'legendary' ? 1.5 : 1.0;
    item.special = { id: sp.id, name: sp.name.replace('{v}', Math.round(8 * scale * (0.7 + ilvl * 0.2))) };
  }
  return item;
}

function itemValue(item) {
  let v = 4 + item.ilvl * 3;
  const mult = { common: 1, uncommon: 2, rare: 4, epic: 8, legendary: 16 }[item.rarity];
  return Math.max(1, Math.round(v * mult));
}

function makePotion(kind, qty) {
  const def = {
    health: { name: 'Healing Potion', icon: 'potion-health', color: '#e05555' },
    mana: { name: 'Mana Potion', icon: 'potion-mana', color: '#5588e0' },
    run: { name: 'Run Time Potion', icon: 'potion-run', color: '#55d070' },
  }[kind];
  return { uid: uid(), slot: 'potion', kind, name: def.name, icon: def.icon, color: def.color, qty, rarity: 'common', ilvl: 1, value: 8, stats: {}, damageMin: 0, damageMax: 0 };
}

/* ===================== Icon & sprite SVG ===================== */
function iconSVG(shape, color) {
  const c = color || '#cccccc';
  let body = '';
  switch (shape) {
    case 'hammer': body = `<rect x="6" y="6" width="36" height="8" rx="2" fill="${c}"/><rect x="20" y="14" width="8" height="26" rx="2" fill="${c}"/>`; break;
    case 'shield': body = `<path d="M24 4 L40 10 V24 C40 34 33 40 24 44 C15 40 8 34 8 24 V10 Z" fill="${c}"/>`; break;
    case 'nova': body = `<circle cx="24" cy="24" r="16" fill="none" stroke="${c}" stroke-width="4"/><circle cx="24" cy="24" r="6" fill="${c}"/>`; break;
    case 'bolt': body = `<path d="M28 4 L10 26 H22 L20 44 L38 20 H25 Z" fill="${c}"/>`; break;
    case 'heart': body = `<path d="M24 40 C10 30 6 20 12 14 C17 9 24 12 24 18 C24 12 31 9 36 14 C42 20 38 30 24 40 Z" fill="${c}"/>`; break;
    case 'flame': body = `<path d="M24 4 C30 16 40 20 40 30 C40 39 33 44 24 44 C15 44 8 39 8 30 C8 20 18 16 24 4 Z" fill="${c}"/>`; break;
    case 'snow': body = `<circle cx="24" cy="24" r="14" fill="none" stroke="${c}" stroke-width="3"/><path d="M24 6 V42 M8 24 H40 M12 12 L36 36 M36 12 L12 36" stroke="${c}" stroke-width="3"/>`; break;
    case 'lightning': body = `<path d="M27 4 L12 27 H22 L19 44 L36 20 H26 Z" fill="${c}"/>`; break;
    case 'wall': body = `<rect x="8" y="16" width="32" height="16" rx="2" fill="${c}"/><path d="M8 20 h32 M8 28 h32" stroke="#0005" stroke-width="2"/>`; break;
    case 'leaf': body = `<path d="M40 8 C20 8 8 18 8 34 C8 30 10 26 13 24 C13 32 20 38 30 36 C40 34 44 20 40 8 Z" fill="${c}"/>`; break;
    case 'wind': body = `<path d="M8 22 Q18 12 28 20 Q38 28 42 22 M8 30 Q18 22 28 28 Q36 34 42 30" fill="none" stroke="${c}" stroke-width="4" stroke-linecap="round"/>`; break;
    case 'sword': body = `<rect x="9" y="6" width="30" height="8" rx="2" fill="${c}"/><rect x="21" y="14" width="6" height="24" fill="${c}"/><rect x="17" y="38" width="14" height="6" rx="2" fill="${c}"/>`; break;
    case 'step': body = `<path d="M34 8 C20 12 14 20 14 30 C14 40 20 44 26 40 C30 37 28 30 24 28 C18 26 18 16 30 12 Z" fill="${c}"/>`; break;
    case 'bleed': body = `<path d="M14 10 L34 38 M34 10 L14 38" stroke="${c}" stroke-width="5" stroke-linecap="round"/><circle cx="24" cy="24" r="20" fill="none" stroke="${c}" stroke-width="2"/>`; break;
    case 'fury': body = `<path d="M8 28 L20 28 L16 12 L34 28 L24 28 L28 42 Z" fill="${c}"/>`; break;
    case 'weapon': body = `<path d="M8 36 L32 12 L40 16 L16 40 Z" fill="${c}"/><rect x="30" y="38" width="6" height="6" fill="${c}"/>`; break;
    case 'helmet': body = `<path d="M10 18 H38 V30 C38 38 30 42 24 42 C18 42 10 38 10 30 Z" fill="${c}"/><rect x="10" y="18" width="28" height="5" fill="${c}"/>`; break;
    case 'chest': body = `<path d="M10 12 H38 V30 C38 36 32 40 24 40 C16 40 10 36 10 30 Z" fill="${c}"/>`; break;
    case 'legs': body = `<rect x="12" y="8" width="10" height="34" rx="2" fill="${c}"/><rect x="26" y="8" width="10" height="34" rx="2" fill="${c}"/>`; break;
    case 'boots': body = `<path d="M8 22 H40 V34 C40 38 36 40 32 40 C30 40 28 38 26 40 C23 38 20 38 18 40 C14 40 8 38 8 34 Z" fill="${c}"/>`; break;
    case 'gloves': body = `<path d="M8 20 H40 V34 C40 38 36 40 32 40 H16 C12 40 8 38 8 34 Z" fill="${c}"/>`; break;
    case 'amulet': body = `<circle cx="24" cy="18" r="10" fill="${c}"/><path d="M24 28 V34 M16 40 A12 12 0 0 0 32 40" fill="none" stroke="${c}" stroke-width="3"/>`; break;
    case 'ring': body = `<circle cx="24" cy="24" r="15" fill="none" stroke="${c}" stroke-width="7"/>`; break;
    case 'potion-health': body = `<path d="M18 8 H30 V18 L36 34 V44 H12 V34 L18 18 Z" fill="${c}"/><rect x="16" y="6" width="16" height="4" fill="${c}"/>`; break;
    case 'potion-mana': body = `<path d="M18 8 H30 V18 L36 34 V44 H12 V34 L18 18 Z" fill="${c}"/><rect x="16" y="6" width="16" height="4" fill="${c}"/>`; break;
    case 'potion-run': body = `<path d="M18 8 H30 V18 L36 34 V44 H12 V34 L18 18 Z" fill="${c}"/><rect x="16" y="6" width="16" height="4" fill="${c}"/>`; break;
    case 'trophy': body = `<path d="M16 6 H32 L28 20 H20 Z" fill="${c}"/><rect x="12" y="20" width="24" height="4" fill="${c}"/><rect x="20" y="24" width="8" height="18" fill="${c}"/><rect x="14" y="42" width="20" height="4" fill="${c}"/>`; break;
    case 'gold': body = `<circle cx="24" cy="24" r="15" fill="${c}" stroke="#b8862b" stroke-width="2"/><circle cx="24" cy="24" r="9" fill="none" stroke="#b8862b" stroke-width="2"/>`; break;
    default: body = `<circle cx="24" cy="24" r="16" fill="${c}"/>`;
  }
  return svgURL(body);
}
function imgFromURL(url) {
  if (svgCache.has(url)) return svgCache.get(url);
  const img = new Image();
  img.src = url;
  svgCache.set(url, img);
  return img;
}
function iconImg(shape, color) { return imgFromURL(iconSVG(shape, color)); }

/* Entity sprites (temporary SVG placeholders) */
function playerSprite(classKey) {
  const c = CLASSES[classKey].color;
  const inner = `
    <circle cx="24" cy="26" r="16" fill="${c}" stroke="#0008" stroke-width="2"/>
    <circle cx="24" cy="18" r="9" fill="#e8dcc0"/>
    <rect x="16" y="12" width="16" height="6" rx="3" fill="${c}" stroke="#0005"/>
    <circle cx="20" cy="18" r="2" fill="#20160a"/>
    <circle cx="28" cy="18" r="2" fill="#20160a"/>`;
  return svgImg(inner);
}
function monsterSprite(type, role) {
  const t = RIFT_TYPES[type];
  const size = role === 'boss' ? 64 : role === 'elite' ? 48 : 34;
  const body = t.color, accent = t.accent;
  let inner = '';
  if (role === 'boss') {
    inner = `<circle cx="32" cy="36" r="24" fill="${body}" stroke="#0007" stroke-width="3"/>
      <path d="M10 26 L4 12 L18 20 Z" fill="${body}"/><path d="M54 26 L60 12 L46 20 Z" fill="${body}"/>
      <circle cx="24" cy="30" r="4" fill="#fff"/><circle cx="40" cy="30" r="4" fill="#fff"/>
      <circle cx="24" cy="30" r="2" fill="#111"/><circle cx="40" cy="30" r="2" fill="#111"/>
      <path d="M24 46 Q32 52 40 46" fill="none" stroke="#0008" stroke-width="3"/>`;
  } else if (role === 'elite') {
    inner = `<circle cx="24" cy="26" r="17" fill="${body}" stroke="${accent}" stroke-width="4"/>
      <path d="M24 6 L28 14 L24 12 L20 14 Z" fill="${accent}"/>
      <path d="M7 26 L15 24 L12 28 Z" fill="${accent}"/><path d="M41 26 L33 24 L36 28 Z" fill="${accent}"/>
      <circle cx="19" cy="24" r="3" fill="#fff"/><circle cx="29" cy="24" r="3" fill="#fff"/>
      <circle cx="19" cy="24" r="1.5" fill="#111"/><circle cx="29" cy="24" r="1.5" fill="#111"/>`;
  } else {
    inner = `<circle cx="24" cy="26" r="14" fill="${body}" stroke="#0007" stroke-width="2"/>
      <circle cx="19" cy="24" r="3" fill="#fff"/><circle cx="29" cy="24" r="3" fill="#fff"/>
      <circle cx="19" cy="24" r="1.5" fill="#111"/><circle cx="29" cy="24" r="1.5" fill="#111"/>
      <path d="M19 33 Q24 37 29 33" fill="none" stroke="#0008" stroke-width="2"/>`;
  }
  return svgImg(inner, size, size);
}
function propSprite(kind) {
  const map = {
    rock: `<path d="M8 30 L14 16 L24 20 L34 10 L40 26 L32 34 L18 36 Z" fill="#6b6b6b" stroke="#0007" stroke-width="2"/>`,
    crystal: `<path d="M24 6 L34 20 L28 22 L36 34 L24 42 L12 34 L20 22 L14 20 Z" fill="#8fe0ff" stroke="#0007" stroke-width="2"/>`,
    bone: `<path d="M10 26 H38" stroke="#ddd" stroke-width="6" stroke-linecap="round"/><circle cx="10" cy="22" r="4" fill="#ddd"/><circle cx="10" cy="30" r="4" fill="#ddd"/><circle cx="38" cy="22" r="4" fill="#ddd"/><circle cx="38" cy="30" r="4" fill="#ddd"/>`,
    flame: `<path d="M24 6 C30 18 38 22 38 32 C38 40 32 44 24 44 C16 44 10 40 10 32 C10 22 18 18 24 6 Z" fill="#ff7a3c"/>`,
  };
  return svgImg(map[kind] || map.rock, 48, 48);
}
function townPropSprite(kind, color) {
  const c = color || '#7a6a9a';
  const map = {
    shop: `<path d="M6 40 L24 8 L42 40 Z" fill="${c}"/><rect x="18" y="30" width="12" height="14" fill="#2a2038"/>`,
    wizard: `<circle cx="24" cy="18" r="12" fill="${c}"/><path d="M8 40 L24 24 L40 40 Z" fill="${c}"/><circle cx="24" cy="16" r="4" fill="#ffd980"/>`,
    shrine: `<path d="M24 6 L34 12 V40 H14 V12 Z" fill="${c}"/><path d="M24 6 L34 12 L24 20 L14 12 Z" fill="#ffd980"/>`,
    stash: `<rect x="10" y="14" width="28" height="26" rx="4" fill="${c}"/><rect x="16" y="14" width="16" height="6" fill="#2a2038"/><circle cx="24" cy="20" r="3" fill="#ffd980"/>`,
  };
  return svgImg(map[kind] || map.shop, 48, 48);
}

/* ===================== Audio (tiny WebAudio synth) ===================== */
let _actx = null;
function audio() {
  if (!_actx) { try { _actx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { _actx = null; } }
  return _actx;
}
function sfx(name) {
  if (!game.options.soundEnabled || !audio()) return;
  const vol = game.options.volume / 100;
  if (vol <= 0) return;
  const t0 = _actx.currentTime;
  function tone(freq, dur, type, gain, slide) {
    const o = _actx.createOscillator();
    const g = _actx.createGain();
    o.type = type || 'square';
    o.frequency.setValueAtTime(freq, t0);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(20, slide), t0 + dur);
    g.gain.setValueAtTime(gain * vol, t0);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g).connect(_actx.destination);
    o.start(t0); o.stop(t0 + dur);
  }
  switch (name) {
    case 'hit': tone(180, 0.08, 'square', 0.12, 90); break;
    case 'cast': tone(420, 0.12, 'sawtooth', 0.10, 700); break;
    case 'hurt': tone(120, 0.18, 'sawtooth', 0.16, 60); break;
    case 'kill': tone(300, 0.12, 'square', 0.12, 500); tone(150, 0.2, 'square', 0.10, 80); break;
    case 'pickup': tone(520, 0.06, 'triangle', 0.12, 880); tone(780, 0.09, 'triangle', 0.10, 990); break;
    case 'buy': tone(440, 0.09, 'triangle', 0.12, 660); break;
    case 'heal': tone(350, 0.2, 'sine', 0.14, 700); break;
    case 'level': tone(523, 0.1, 'triangle', 0.14, 660); tone(659, 0.1, 'triangle', 0.14, 784); tone(784, 0.2, 'triangle', 0.14, 1046); break;
    case 'death': tone(220, 0.5, 'sawtooth', 0.2, 40); break;
  }
}

/* ===================== Game state ===================== */
let W = 960, H = 540;
let DPR = 1;
const game = {
  state: 'menu', // menu | charCreate | playing
  world: 'town', // town | rift
  paused: false,
  overlay: null, // inventory | shop | shrine | stash | rift | null
  simActive: true,
  player: null,
  monsters: [],
  projectiles: [],
  zones: [],
  walls: [],
  loot: [],
  props: [],
  townLocations: [],
  rift: null,
  mouse: { x: 0, y: 0, down: false },
  attacking: false,
  attackTimer: 0,
  fx: [], // transient visual fx
  time: 0,
};

/* ===================== Save / load ===================== */
const SAVE_KEY = 'riftSlayerSave_v1';
const OPTS_KEY = 'riftSlayerOpts_v1';

function defaultOptions() {
  return {
    volume: 60, soundEnabled: true,
    keys: {
      up: 'KeyW', down: 'KeyS', left: 'KeyA', right: 'KeyD',
      skill1: 'Digit1', skill2: 'Digit2', skill3: 'Digit3', skill4: 'Digit4',
      potion1: 'KeyQ', potion2: 'KeyE', potion3: 'KeyR',
      inventory: 'KeyI', pause: 'Escape',
    },
  };
}
game.options = defaultOptions();
try { const o = JSON.parse(localStorage.getItem(OPTS_KEY)); if (o) game.options = Object.assign(defaultOptions(), o, { keys: Object.assign(defaultOptions().keys, o.keys || {}) }); } catch (e) {}
function saveOptions() { try { localStorage.setItem(OPTS_KEY, JSON.stringify(game.options)); } catch (e) {} }

function serializePlayer() {
  const p = game.player;
  return {
    name: p.name, classKey: p.classKey, difficulty: p.difficulty,
    gold: p.gold, trophies: p.trophies,
    maxRiftLevel: p.maxRiftLevel, maxRiftLevelCleared: p.maxRiftLevelCleared,
    equipment: p.equipment, bag: p.bag, stash: p.stash,
    talents: p.talents, skills: p.skills,
    health: p.hp, mana: p.mp,
  };
}
function saveGame() {
  if (!game.player) return;
  const data = { version: 1, player: serializePlayer() };
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(data)); } catch (e) { toast('Save failed', 'bad'); }
}
function loadGame() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return false;
    const data = JSON.parse(raw);
    if (!data.player) return false;
    return data.player;
  } catch (e) { return false; }
}
function clearSave() { try { localStorage.removeItem(SAVE_KEY); } catch (e) {} }

/* ===================== Derived stats ===================== */
function talentRank(classKey, id) {
  const p = game.player;
  if (!p || p.classKey !== classKey) return 0;
  return p.talents[id] || 0;
}
function talentValue(classKey, id, perRank) {
  return talentRank(classKey, id) * perRank;
}
function talentPerRank(id) {
  return {
    holyInfusion: 3, divineRetribution: 10, righteousFury: 20, blessedRegen: 2,
    elementalAffinity: 10, scorchedEarth: 4, deepFreeze: 0.8, naturesBoon: 15,
    keenEdge: 10, bloodlust: 3, focus: 5, relentless: 40, secondWind: 6,
  }[id] || 0;
}

function recomputeStats() {
  const p = game.player;
  const cls = CLASSES[p.classKey];
  const base = cls.base;
  const s = {
    maxHealth: base.maxHealth, maxMana: base.maxMana, maxRun: base.runTime,
    armor: base.armor, attackPower: base.attackPower, magicPower: base.magicPower,
    attackSpeed: base.attackSpeed, critChance: base.critChance, critMult: 1.5,
    healthRegen: base.healthRegen, manaRegen: base.manaRegen,
    moveSpeed: base.moveSpeed,
    lifeOnHit: 0, lifeSteal: 0, lifeOnKill: 0, thorns: 0, dodge: 0, multistrike: 0,
    cdr: 0, fireAura: 0, holyDamage: 0, blockChance: 0, healMult: 1.0, armorPen: 0,
    magicDamageMult: 1,
    str: base.str, int: base.int, sta: base.sta,
    gearAttackSpeedPct: 0, gearCritPct: 0, gearMoveSpeedPct: 0, gearLifeStealPct: 0,
    critChanceFlat: 0, attackSpeedPct: 0, moveSpeedPct: 0, lifeOnKillFlat: 0,
  };

  // aggregate gear
  for (const slot of EQUIP_SLOTS) {
    const it = p.equipment[slot];
    if (!it) continue;
    for (const k in it.stats) {
      const v = it.stats[k];
      if (k === 'strength') s.str += v;
      else if (k === 'intellect') s.int += v;
      else if (k === 'stamina') s.sta += v;
      else if (k === 'attackSpeed') s.gearAttackSpeedPct += v;
      else if (k === 'critChance') s.gearCritPct += v;
      else if (k === 'moveSpeed') s.gearMoveSpeedPct += v;
      else if (k === 'lifeSteal') s.gearLifeStealPct += v;
      else if (k === 'lifePerSecond') s.healthRegen += v;
      else s[k] = (s[k] || 0) + v;
    }
    if (it.special) {
      const sp = SPECIAL_EFFECTS.find(e => e.id === it.special.id);
      if (sp) sp.apply(s);
    }
  }

  // primary stat conversions
  s.maxHealth += s.sta * 10;
  s.maxMana += s.int * 10;
  s.maxRun += s.sta;
  s.attackPower += s.str * 5;
  s.magicPower += s.int * 5;
  s.manaRegen += s.int * 0.1;

  // class talents
  if (p.classKey === 'paladin') {
    s.holyDamage += talentValue('paladin', 'holyInfusion', 3);
    s.armor += talentValue('paladin', 'shieldMastery', 4);
    s.blockChance += talentValue('paladin', 'shieldMastery', 0.08);
    s.healthRegen += talentValue('paladin', 'blessedRegen', 2);
  } else if (p.classKey === 'wizard') {
    s.magicDamageMult = 1 + talentValue('wizard', 'elementalAffinity', 0.10);
    s.maxMana += talentValue('wizard', 'overflowingMana', 20);
    s.manaRegen += talentValue('wizard', 'overflowingMana', 0.5);
    s.healMult *= (1 + talentValue('wizard', 'naturesBoon', 0.15));
  } else if (p.classKey === 'blademaster') {
    s.armorPen += talentValue('blademaster', 'keenEdge', 0.10);
    s.lifeSteal += talentValue('blademaster', 'bloodlust', 0.03);
    s.critChance += talentValue('blademaster', 'focus', 0.05);
    s.lifeOnKill += talentValue('blademaster', 'secondWind', 6);
  }

  // percentage affixes & specials
  s.critChance += s.gearCritPct / 100 + s.critChanceFlat / 100;
  s.lifeSteal += s.gearLifeStealPct / 100;
  s.attackSpeed = base.attackSpeed * (1 + (s.gearAttackSpeedPct + s.attackSpeedPct) / 100);
  s.moveSpeed = base.moveSpeed * (1 + (s.gearMoveSpeedPct + s.moveSpeedPct) / 100);
  s.maxRun = Math.max(0, s.maxRun);
  s.lifeOnKill += s.lifeOnKillFlat;

  p.stats = s;
}

/* convenience: healing received multiplier applies to all heals */
function healPlayer(amount) {
  const p = game.player;
  const mult = p.stats.healMult || 1.0;
  p.hp = Math.min(p.stats.maxHealth, p.hp + amount * mult);
}
function regenMana(amount) {
  const p = game.player;
  p.mp = Math.min(p.stats.maxMana, p.mp + amount);
}

/* ===================== Combat helpers ===================== */
function weaponDamage() {
  const p = game.player;
  const w = p.equipment.weapon;
  const isMagic = p.classKey === 'wizard';
  if (w && w.slot === 'weapon') {
    if (isMagic) return { min: w.damageMin + Math.floor(p.stats.magicPower / 10), max: w.damageMax + Math.floor(p.stats.magicPower / 10), magic: true };
    return { min: w.damageMin + Math.floor(p.stats.attackPower / 10), max: w.damageMax + Math.floor(p.stats.attackPower / 10), magic: false };
  }
  // unarmed
  if (isMagic) return { min: 4 + Math.floor(p.stats.magicPower / 10), max: 6 + Math.floor(p.stats.magicPower / 10), magic: true };
  return { min: 5 + Math.floor(p.stats.attackPower / 10), max: 8 + Math.floor(p.stats.attackPower / 10), magic: false };
}

function playerDamageRoll(baseMin, baseMax, isMagic, extra) {
  const p = game.player;
  let dmg = rand(baseMin, baseMax) + (extra || 0);
  if (isMagic) dmg *= (p.stats.magicDamageMult || 1);
  if (hasBuff('weaken') || hasBuff('curse')) dmg *= 0.7;
  if (chance(p.stats.critChance)) dmg *= p.stats.critMult;
  return dmg;
}

/* Armor mitigation vs physical; magic ignores armor unless earth boss armor? keep physical only */
function mitigated(amount, target) {
  const armor = target.stats ? target.stats.armor : (target.armor || 0);
  const mult = 1 - Math.min(0.65, armor / (armor + 60));
  return Math.max(1, amount * mult);
}

/* damage to a monster (from player), applies player's lifesteal/lifeOnHit/thorns etc */
function damageMonster(m, amount, opts) {
  opts = opts || {};
  const p = game.player;
  if (!m || m.dead) return;
  let dmg = amount;
  if (!opts.magic) {
    dmg = mitigated(dmg, m);
    if (p.stats.armorPen) dmg *= (1 + p.stats.armorPen);
  }
  if (m.shield && m.shield.remaining > 0) dmg *= (1 - m.shield.factor);
  dmg = Math.max(1, Math.round(dmg));
  if (chance(p.stats.multistrike)) dmg *= 2;

  // holy infusion bonus (paladin melee)
  if (opts.melee) dmg += (p.stats.holyDamage || 0);

  m.hp -= dmg;
  spawnFloat(m.x, m.y - m.r, dmg, opts.color || '#ffd980');

  if (p.stats.lifeOnHit) healPlayer(p.stats.lifeOnHit);
  if (p.stats.lifeSteal) healPlayer(dmg * p.stats.lifeSteal);
  sfx('hit');
  if (m.hp <= 0) killMonster(m);
}

function damagePlayer(amount, source) {
  const p = game.player;
  if (p.dead) return;
  let dmg = amount;
  dmg = mitigated(dmg, { stats: { armor: p.stats.armor } });
  if (hasBuff('curse')) dmg *= 1.25;
  // holy bulwark
  if (hasBuff('bulwark')) dmg *= 0.4;
  // dodge
  if (chance(p.stats.dodge)) { spawnFloat(p.x, p.y - 20, 'dodge', '#9fd8ff'); return; }
  // block
  if (chance(p.stats.blockChance)) { spawnFloat(p.x, p.y - 20, 'block', '#9fd8ff'); dmg *= 0.5; }
  dmg = Math.max(1, Math.round(dmg));
  p.hp -= dmg;
  // divine retribution reflect
  if (p.classKey === 'paladin') {
    const refl = talentValue('paladin', 'divineRetribution', 0.10);
    if (refl > 0 && source) damageMonster(source, dmg * refl, { magic: true });
  }
  // thorns
  if (p.stats.thorns > 0 && source) damageMonster(source, p.stats.thorns, { magic: true });
  spawnFloat(p.x, p.y - 20, '-' + dmg, '#ff7a7a');
  sfx('hurt');
  if (p.hp <= 0) p.hp = 0;
}

function killMonster(m) {
  if (m.dead) return;
  m.dead = true;
  m.deathT = 0;
  sfx('kill');
  // on-death effect
  if (m.onDeath) m.onDeath(m);
  // loot drops
  for (const item of m.carriesLoot || []) dropLoot(item, m.x + rand(-10, 10), m.y + rand(-10, 10));
  m.carriesLoot = [];
  // gold
  const gold = randInt(2, 4 + game.rift.level * 2);
  game.player.gold += gold;
  // life on kill (aggregates gear, second wind talent and special sources)
  if (game.player.stats.lifeOnKill) healPlayer(game.player.stats.lifeOnKill);
  // trophy on boss
  if (m.role === 'boss') {
    const t = m.type;
    game.player.trophies[t] = (game.player.trophies[t] || 0) + 1;
    spawnFloat(m.x, m.y - 30, RIFT_TYPES[t].trophy + '!', RIFT_TYPES[t].accent);
    handleVictory();
  }
  m.hp = 0;
}

function dropLoot(item, x, y) {
  game.loot.push({ item, x, y, t: 0 });
}

/* ===================== Buffs & DoTs ===================== */
function hasBuff(id) {
  return game.player.buffs.some(b => b.id === id && b.remaining > 0);
}
function addBuff(id, duration, params) {
  const p = game.player;
  const ex = p.buffs.find(b => b.id === id);
  if (ex) { ex.remaining = Math.max(ex.remaining, duration); Object.assign(ex, params); return; }
  p.buffs.push({ id, duration, remaining: duration, params: params || {} });
}

function applyDot(target, key, dps, duration) {
  if (target.dots[key]) { target.dots[key].dps = Math.max(target.dots[key].dps, dps); target.dots[key].remaining = Math.max(target.dots[key].remaining, duration); }
  else target.dots[key] = { dps, remaining: duration };
}
function applySlow(target, factor, duration) {
  target.slow = { factor, remaining: Math.max(target.slow ? target.slow.remaining : 0, duration) };
}

/* ===================== Projectiles / zones / walls ===================== */
function spawnProjectile(o) {
  game.projectiles.push(Object.assign({ x: 0, y: 0, vx: 0, vy: 0, r: 6, team: 'player', dmg: 0, speed: 0, life: 3, kind: 'wand', magic: true, aoe: 0, onHitDot: null, color: '#ffd980', pierce: false, hitIds: new Set() }, o));
}
function spawnZone(o) {
  game.zones.push(Object.assign({ team: 'player', dps: 0, r: 60, remaining: 1, color: '#ffd980', kind: 'holy', x: 0, y: 0 }, o));
}

/* ===================== Floating text ===================== */
function spawnFloat(x, y, text, color) {
  game.fx.push({ x, y, text, color: color || '#fff', t: 0, dur: 0.9 });
}

/* ===================== Town locations ===================== */
function buildTown() {
  game.props = [];
  game.townLocations = [
    { id: 'shop', name: 'Shop', x: W * 0.156, y: H * 0.222, r: 46, glyph: '🛒', color: '#c8a06a', desc: 'Buy and sell gear & consumables.' },
    { id: 'wizard', name: 'Grand Wizard', x: W * 0.5, y: H * 0.13, r: 46, glyph: '🔮', color: '#8fa0ff', desc: 'Open a rift.' },
    { id: 'shrine', name: 'Shrine', x: W * 0.854, y: H * 0.278, r: 46, glyph: '⛩️', color: '#ffd980', desc: 'Upgrade talents and assign skills.' },
    { id: 'stash', name: 'Stash', x: W * 0.49, y: H * 0.815, r: 46, glyph: '📦', color: '#9a8a6a', desc: 'Store items.' },
  ];
  // decorative town props (relative to viewport)
  const deco = [
    { kind: 'rock', x: 0.0625, y: 0.111 }, { kind: 'rock', x: 0.9375, y: 0.926 }, { kind: 'crystal', x: 0.9167, y: 0.111 },
    { kind: 'rock', x: 0.083, y: 0.87 }, { kind: 'crystal', x: 0.0625, y: 0.519 }, { kind: 'rock', x: 0.9375, y: 0.556 },
  ];
  game.props = deco.map(d => ({ kind: d.kind, x: W * d.x, y: H * d.y, r: 12, img: propSprite(d.kind) }));
}

function buildRift() {
  game.props = [];
  game.rift.patches = [];
  for (let i = 0; i < 24; i++) {
    game.rift.patches.push({ x: (i * 137) % (W - 90), y: (i * 71) % (H - 70), w: 40 + (i * 37) % 60, h: 30 + (i * 23) % 45 });
  }
  const n = randInt(8, 13);
  for (let i = 0; i < n; i++) {
    const kinds = game.rift.type === 'fire' ? ['rock', 'flame', 'bone'] : game.rift.type === 'ice' ? ['crystal', 'rock'] : game.rift.type === 'earth' ? ['rock', 'bone', 'crystal'] : ['crystal', 'rock', 'bone'];
    const kind = pick(kinds);
    const x = rand(70, W - 70), y = rand(70, H - 70);
    if (dist(x, y, W / 2, H / 2) < 130) continue;
    game.props.push({ kind, x, y, r: 12, img: propSprite(kind) });
  }
}

/* ===================== Rift flow ===================== */
function enterRift(level, type) {
  saveGame(); // pre-rift snapshot
  game.world = 'rift';
  const d = DIFFICULTIES[game.player.difficulty];
  const waves = clamp(2 + level + d.waveMod, 2, 14);
  const mobsPerWave = clamp(3 + level + d.mobMod, 2, 12);
  game.rift = { level, type, waves, mobsPerWave, waveIndex: -1, waveTimer: 1.0, bossSpawned: false, bossDelay: 1.5, cleared: false };
  game.monsters = [];
  game.projectiles = [];
  game.zones = [];
  game.walls = [];
  game.loot = [];
  buildRift();
  // pre-generate loot table and assign to future monsters
  game.rift.lootPool = [];
  const lootCount = Math.max(2, Math.round(level * 1.5) + randInt(0, 2));
  for (let i = 0; i < lootCount; i++) game.rift.lootPool.push(generateItem(pick([...EQUIP_SLOTS, ...EQUIP_SLOTS, 'weapon']), level + randInt(-1, 1), game.player.classKey === 'wizard' ? 'wand' : CLASSES[game.player.classKey].weaponKind));
  placePlayer(W / 2, H / 2);
  game.player.hp = game.player.stats.maxHealth;
  game.player.mp = game.player.stats.maxMana;
  game.player.dots = {}; game.player.buffs = [];
  closeOverlay();
  toast('Rift ' + level + ' — ' + RIFT_TYPES[type].name, 'gold');
  updateHUD();
}

function spawnWave() {
  const r = game.rift;
  r.waveIndex++;
  const t = RIFT_TYPES[r.type];
  const level = r.level;
  const d = DIFFICULTIES[game.player.difficulty];
  const count = r.mobsPerWave;
  for (let i = 0; i < count; i++) {
    const kind = pick(t.monsters);
    spawnMonster(kind, 'regular', level, d);
  }
  // elite
  spawnMonster(t.elite, 'elite', level, d);
}

function spawnMonster(kind, role, level, d) {
  const tpl = MONSTERS[kind];
  const hpMult = (1 + (level - 1) * 0.7) * d.hpMod;
  const dmgMult = (1 + (level - 1) * 0.25) * d.dmgMod;
  const pos = spawnPosition();
  const m = {
    uid: uid(), name: kind, type: tpl.type, role: role || tpl.role || 'regular',
    x: pos.x, y: pos.y, r: tpl.r, hp: tpl.hp * hpMult, maxHp: tpl.hp * hpMult,
    dmg: tpl.dmg * dmgMult, speed: tpl.speed, armor: tpl.armor,
    atkInt: tpl.atkInt, atkTimer: rand(0.3, 1),
    onHit: tpl.onHit, burnDps: tpl.burnDps, burnDur: tpl.burnDur,
    chillFactor: tpl.chillFactor, chillDur: tpl.chillDur,
    weakFactor: tpl.weakFactor, weakDur: tpl.weakDur,
    ranged: !!tpl.ranged, proj: tpl.proj,
    aura: tpl.aura, onDeath: tpl.onDeath,
    dots: {}, slow: null, frozen: 0, stunned: 0, shield: null,
    dead: false, deathT: 0, dash: null,
    sprite: monsterSprite(tpl.type, role),
    carriesLoot: [],
    abilities: (tpl.abilities || []).map(a => ({ interval: a.interval, action: a.action, t: rand(1, a.interval) })),
  };
  // assign loot
  const pool = game.rift.lootPool;
  if (pool.length && (role === 'elite' || role === 'boss' || chance(0.3))) {
    m.carriesLoot.push(pool.pop());
  }
  if (role === 'boss') {
    while (pool.length > 0 && m.carriesLoot.length < 4) m.carriesLoot.push(pool.pop());
  }
  game.monsters.push(m);
  return m;
}

function spawnPosition() {
  const p = game.player;
  for (let i = 0; i < 40; i++) {
    const x = rand(60, W - 60), y = rand(60, H - 60);
    if (dist(x, y, p.x, p.y) > 200) return { x, y };
  }
  return { x: rand(80, W - 80), y: rand(80, H - 80) };
}

function spawnBoss() {
  const r = game.rift;
  const t = RIFT_TYPES[r.type];
  const d = DIFFICULTIES[game.player.difficulty];
  const m = spawnMonster(t.boss, 'boss', r.level, d);
  m.hp = m.maxHp = m.hp; // already scaled
  r.bossSpawned = true;
  toast('⚠ ' + t.boss + ' has appeared!', 'bad');
  sfx('level');
}

/* ===================== Ability handlers (hoisted fns) ===================== */
function infernalTrail(m) {
  spawnZone({ team: 'enemy', x: m.x, y: m.y, r: 34, dps: 6, remaining: 2.5, color: '#ff7a3c', kind: 'firetrail' });
}
function infernalDeath(m) {
  spawnZone({ team: 'enemy', x: m.x, y: m.y, r: 90, dps: 22, remaining: 1.2, color: '#ff7a3c', kind: 'fireburst' });
}
function glacialNova(m) {
  const p = game.player;
  if (dist(m.x, m.y, p.x, p.y) < 140) { applySlow(p, 0.45, 3); spawnFloat(p.x, p.y - 20, 'Slowed', '#9fd8ff'); }
  game.fx.push({ x: m.x, y: m.y, r: 140, color: '#9fd8ff', kind: 'ring', t: 0, dur: 0.6 });
}
function glacialShield(m) { m.shield = { factor: 0.5, remaining: 4 }; }
function gargantuanSlam(m) {
  spawnZone({ team: 'enemy', x: m.x, y: m.y, r: 130, dps: 14, remaining: 1.4, color: '#9a7348', kind: 'shockwave' });
  game.fx.push({ x: m.x, y: m.y, r: 130, color: '#9a7348', kind: 'ring', t: 0, dur: 0.7 });
}
function pyrelordVolley(m) {
  const p = game.player;
  const a = angleTo(m.x, m.y, p.x, p.y);
  for (let i = -2; i <= 2; i++) {
    const aa = a + i * 0.18;
    spawnProjectile({ team: 'enemy', x: m.x, y: m.y, vx: Math.cos(aa) * 260, vy: Math.sin(aa) * 260, r: 8, dmg: m.dmg, speed: 260, life: 3, kind: 'fireball', magic: true, color: '#ff7a3c', onHitDot: { key: 'burn', dps: 4, dur: 3 } });
  }
}
function flameNova(m) {
  spawnZone({ team: 'enemy', x: m.x, y: m.y, r: 150, dps: 20, remaining: 1.3, color: '#ff7a3c', kind: 'firenova' });
  game.fx.push({ x: m.x, y: m.y, r: 150, color: '#ff7a3c', kind: 'ring', t: 0, dur: 0.7 });
}
function glaciusBarrage(m) {
  const p = game.player;
  const a = angleTo(m.x, m.y, p.x, p.y);
  for (let i = -3; i <= 3; i++) {
    const aa = a + i * 0.13;
    spawnProjectile({ team: 'enemy', x: m.x, y: m.y, vx: Math.cos(aa) * 280, vy: Math.sin(aa) * 280, r: 7, dmg: m.dmg * 0.8, speed: 280, life: 3, kind: 'iceshard', magic: true, color: '#9fd8ff', onHitDot: { key: 'chill', factor: 0.5, dur: 2 } });
  }
}
function glaciusNova(m) {
  const p = game.player;
  if (dist(m.x, m.y, p.x, p.y) < 160) { p.frozen = 1.5; spawnFloat(p.x, p.y - 20, 'Frozen!', '#9fd8ff'); }
  game.fx.push({ x: m.x, y: m.y, r: 160, color: '#9fd8ff', kind: 'ring', t: 0, dur: 0.8 });
}
function terraBoulder(m) {
  const p = game.player;
  const a = angleTo(m.x, m.y, p.x, p.y);
  spawnProjectile({ team: 'enemy', x: m.x, y: m.y, vx: Math.cos(a) * 200, vy: Math.sin(a) * 200, r: 14, dmg: m.dmg * 1.4, speed: 200, life: 3.5, kind: 'boulder', magic: false, color: '#9a7348' });
}
function terraSlam(m) {
  spawnZone({ team: 'enemy', x: m.x, y: m.y, r: 150, dps: 18, remaining: 1.5, color: '#9a7348', kind: 'shockwave' });
  game.fx.push({ x: m.x, y: m.y, r: 150, color: '#9a7348', kind: 'ring', t: 0, dur: 0.7 });
}
function terraCharge(m) {
  const p = game.player;
  const a = angleTo(m.x, m.y, p.x, p.y);
  m.dash = { vx: Math.cos(a) * 420, vy: Math.sin(a) * 420, remaining: 0.6 };
}
function shadeTeleport(m) {
  const p = game.player;
  const a = angleTo(p.x, p.y, m.x, m.y);
  m.x = clamp(p.x + Math.cos(a) * 70, 50, W - 50);
  m.y = clamp(p.y + Math.sin(a) * 70, 50, H - 50);
  game.fx.push({ x: m.x, y: m.y, r: 30, color: '#c89bff', kind: 'ring', t: 0, dur: 0.4 });
}
function shadowBolts(m) {
  const p = game.player;
  const a = angleTo(m.x, m.y, p.x, p.y);
  for (let i = -2; i <= 2; i++) {
    const aa = a + i * 0.15;
    spawnProjectile({ team: 'enemy', x: m.x, y: m.y, vx: Math.cos(aa) * 250, vy: Math.sin(aa) * 250, r: 8, dmg: m.dmg, speed: 250, life: 3, kind: 'shadowbolt', magic: true, color: '#7a4fc0' });
  }
}
function shadowSummon(m) {
  const d = DIFFICULTIES[game.player.difficulty];
  for (let i = 0; i < 2; i++) {
    const s = spawnMonster('Shade', 'regular', game.rift.level, d);
    s.x = m.x + rand(-40, 40); s.y = m.y + rand(-40, 40);
  }
}
function shadowCurse(m) {
  const p = game.player;
  addBuff('curse', 6);
  spawnFloat(p.x, p.y - 20, 'Cursed!', '#c89bff');
}

/* ===================== Player ===================== */
function placePlayer(x, y) { const p = game.player; p.x = x; p.y = y; }

function createPlayer(name, classKey, difficulty) {
  const cls = CLASSES[classKey];
  const p = {
    name: name || 'Hero', classKey, difficulty,
    x: W / 2, y: H / 2, r: 14,
    hp: cls.base.maxHealth, mp: cls.base.maxMana, runTime: cls.base.runTime,
    gold: 0, trophies: { fire: 0, ice: 0, earth: 0, darkness: 0 },
    maxRiftLevel: 3, maxRiftLevelCleared: 0,
    equipment: { weapon: null, offhand: null, helmet: null, chest: null, legs: null, boots: null, gloves: null, amulet: null, ring: null },
    bag: [], stash: [],
    talents: {}, skills: cls.skills.slice(0, 4).map(s => s.id),
    buffs: [], dots: {}, frozen: 0, weak: null, dead: false,
    skillCd: {}, move: { x: 0, y: 0 },
    sprite: playerSprite(classKey),
    stats: null,
  };
  // starter gear
  p.equipment.weapon = generateItem('weapon', 1, cls.weaponKind);
  const starter = generateItem('chest', 1, cls.weaponKind);
  p.equipment.chest = starter;
  p.bag.push(makePotion('health', 3), makePotion('mana', 2));
  game.player = p;
  recomputeStats();
  p.hp = p.stats.maxHealth; p.mp = p.stats.maxMana; p.runTime = p.stats.maxRun;
  p.skillCd = { smite: 0, bulwark: 0, consecration: 0, judgment: 0, layonhands: 0, fireball: 0, frostnova: 0, chainlightning: 0, rockwall: 0, regrowth: 0, whirlwind: 0, bladeflurry: 0, shadowstep: 0, lacerate: 0, adrenaline: 0 };
  return p;
}

/* ===================== Skills ===================== */
function getEquippedSkills() {
  return game.player.skills.map(id => id ? (CLASSES[game.player.classKey].skills.find(s => s.id === id) || null) : null);
}
function getSkill(id) { return CLASSES[game.player.classKey].skills.find(s => s.id === id); }
function sanitizeSkills() {
  const p = game.player;
  const all = CLASSES[p.classKey].skills.map(s => s.id);
  const seen = new Set();
  const skills = [];
  for (const id of p.skills) {
    if (id && all.includes(id) && !seen.has(id)) { seen.add(id); skills.push(id); }
    else skills.push('');
  }
  while (skills.length < 4) skills.push('');
  if (skills.length > 4) skills.length = 4;
  p.skills = skills;
}

function castSkill(id) {
  const p = game.player;
  const sk = getSkill(id);
  if (!sk || p.dead || p.frozen > 0) return;
  if (p.skillCd[id] > 0) return;
  if (p.mp < sk.cost) { toast('Not enough mana', 'bad'); return; }
  p.mp -= sk.cost;
  const cdr = 1 - (p.stats.cdr || 0) / 100;
  p.skillCd[id] = sk.cd * cdr;
  sfx('cast');

  const aim = angleTo(p.x, p.y, game.mouse.x, game.mouse.y);
  switch (sk.id) {
    /* Paladin */
    case 'smite': {
      meleeArc(70, Math.PI * 0.9, target => {
        let dmg = playerDamageRoll(weaponDamage().min, weaponDamage().max, false, 15 + (p.stats.holyDamage || 0));
        if (target.type === 'darkness') dmg *= 1.5;
        damageMonster(target, dmg, { melee: true });
        const stunCh = talentValue('paladin', 'righteousFury', 0.20);
        if (chance(stunCh)) target.stunned = Math.max(target.stunned, 1.0);
      });
      game.fx.push({ x: p.x, y: p.y, r: 70, a0: aim - 0.9, a1: aim + 0.9, color: '#ffd980', kind: 'arc', t: 0, dur: 0.25 });
      break;
    }
    case 'bulwark': addBuff('bulwark', 4); break;
    case 'consecration': spawnZone({ team: 'player', x: p.x, y: p.y, r: 95, dps: 8 + Math.floor(p.stats.magicPower / 10), remaining: 5, color: '#ffd980', kind: 'holy' }); break;
    case 'judgment': {
      spawnProjectile({ team: 'player', x: p.x, y: p.y, vx: Math.cos(aim) * 460, vy: Math.sin(aim) * 460, r: 8, dmg: 30 + Math.floor(p.stats.magicPower / 10), speed: 460, life: 2, kind: 'judgment', magic: true, color: '#ffd980', aoe: 40 });
      break;
    }
    case 'layonhands': healPlayer(p.stats.maxHealth * 0.4); spawnFloat(p.x, p.y - 20, '+' + Math.round(p.stats.maxHealth * 0.4), '#7ae88a'); sfx('heal'); break;
    /* Wizard */
    case 'fireball': {
      spawnProjectile({ team: 'player', x: p.x, y: p.y, vx: Math.cos(aim) * 400, vy: Math.sin(aim) * 400, r: 9, dmg: 28 + Math.floor(p.stats.magicPower / 10), speed: 400, life: 2.5, kind: 'fireball', magic: true, color: '#ff7a3c', aoe: 60, scorch: talentRank('wizard', 'scorchedEarth') > 0 });
      break;
    }
    case 'frostnova': {
      const dur = 2.2 + talentValue('wizard', 'deepFreeze', 0.8);
      for (const m of game.monsters) if (!m.dead && dist(p.x, p.y, m.x, m.y) < 115) { m.frozen = Math.max(m.frozen, dur); }
      game.fx.push({ x: p.x, y: p.y, r: 115, color: '#9fd8ff', kind: 'ring', t: 0, dur: 0.7 });
      break;
    }
    case 'chainlightning': {
      const targets = game.monsters.filter(m => !m.dead && dist(p.x, p.y, m.x, m.y) < 320).sort((a, b) => dist(p.x, p.y, a.x, a.y) - dist(p.x, p.y, b.x, b.y));
      const chain = targets.slice(0, 3);
      let prev = { x: p.x, y: p.y };
      chain.forEach((m, i) => {
        const dmg = playerDamageRoll(22, 28, true, Math.floor(p.stats.magicPower / 10));
        damageMonster(m, dmg, { magic: true });
        game.fx.push({ x1: prev.x, y1: prev.y, x2: m.x, y2: m.y, color: '#fff07a', kind: 'bolt', t: 0, dur: 0.3 });
        prev = m;
      });
      break;
    }
    case 'rockwall': {
      const wx = p.x + Math.cos(aim) * 120, wy = p.y + Math.sin(aim) * 120;
      const perp = aim + Math.PI / 2;
      const half = 46;
      game.walls.push({ x1: wx - Math.cos(perp) * half, y1: wy - Math.sin(perp) * half, x2: wx + Math.cos(perp) * half, y2: wy + Math.sin(perp) * half, remaining: 4 });
      break;
    }
    case 'regrowth': addBuff('regrowth', 4); break;
    /* Blademaster */
    case 'whirlwind': {
      for (const m of game.monsters) if (!m.dead && dist(p.x, p.y, m.x, m.y) < 95) {
        damageMonster(m, playerDamageRoll(weaponDamage().min, weaponDamage().max, false), { melee: true });
      }
      game.fx.push({ x: p.x, y: p.y, r: 95, color: '#ff8a8a', kind: 'ring', t: 0, dur: 0.5 });
      break;
    }
    case 'bladeflurry': {
      const target = nearestInArc(60, Math.PI * 0.8, aim);
      if (target) {
        for (let i = 0; i < 4; i++) damageMonster(target, playerDamageRoll(weaponDamage().min, weaponDamage().max, false, 2) * 0.6, { melee: true });
        game.fx.push({ x: p.x, y: p.y, r: 60, a0: aim - 0.8, a1: aim + 0.8, color: '#ff8a8a', kind: 'arc', t: 0, dur: 0.3 });
      } else toast('No target in range', 'bad');
      break;
    }
    case 'shadowstep': {
      const target = game.monsters.filter(m => !m.dead && dist(p.x, p.y, m.x, m.y) < 280).sort((a, b) => dist(game.mouse.x, game.mouse.y, a.x, a.y) - dist(game.mouse.x, game.mouse.y, b.x, b.y))[0];
      if (target) {
        p.x = target.x - Math.cos(aim) * (target.r + 6); p.y = target.y - Math.sin(aim) * (target.r + 6);
        damageMonster(target, playerDamageRoll(weaponDamage().min, weaponDamage().max, false, 12), { melee: true });
        game.fx.push({ x: p.x, y: p.y, r: 40, color: '#c89bff', kind: 'ring', t: 0, dur: 0.4 });
      }
      break;
    }
    case 'lacerate': {
      meleeArc(60, Math.PI * 0.8, target => {
        damageMonster(target, playerDamageRoll(weaponDamage().min, weaponDamage().max, false, 5), { melee: true });
        const mult = 1 + talentValue('blademaster', 'relentless', 0.4);
        applyDot(target, 'bleed', 9 * mult, 4 * mult);
      });
      game.fx.push({ x: p.x, y: p.y, r: 60, a0: aim - 0.8, a1: aim + 0.8, color: '#ff6a6a', kind: 'arc', t: 0, dur: 0.25 });
      break;
    }
    case 'adrenaline': addBuff('adrenaline', 5); break;
  }
  updateHUD();
}

function meleeArc(radius, spread, fn) {
  const p = game.player;
  const aim = angleTo(p.x, p.y, game.mouse.x, game.mouse.y);
  const half = spread / 2;
  for (const m of game.monsters) {
    if (m.dead) continue;
    const d = dist(p.x, p.y, m.x, m.y);
    if (d <= radius + m.r && Math.abs(angDiff(aim, angleTo(p.x, p.y, m.x, m.y))) <= half) fn(m);
  }
}
function nearestInArc(radius, spread, aim) {
  const p = game.player;
  const half = spread / 2;
  let best = null, bd = Infinity;
  for (const m of game.monsters) {
    if (m.dead) continue;
    const d = dist(p.x, p.y, m.x, m.y);
    if (d <= radius + m.r && Math.abs(angDiff(aim, angleTo(p.x, p.y, m.x, m.y))) <= half && d < bd) { best = m; bd = d; }
  }
  return best;
}

function tryBasicAttack() {
  const p = game.player;
  if (p.dead || p.frozen > 0) return;
  const aim = angleTo(p.x, p.y, game.mouse.x, game.mouse.y);
  const wd = weaponDamage();
  const interval = 1 / (p.stats.attackSpeed * (hasBuff('adrenaline') ? 1.5 : 1));
  if (p.classKey === 'wizard') {
    spawnProjectile({ team: 'player', x: p.x, y: p.y, vx: Math.cos(aim) * 380, vy: Math.sin(aim) * 380, r: 5, dmg: rand(wd.min, wd.max), speed: 380, life: 2, kind: 'wand', magic: true, color: '#9fc8ff' });
  } else {
    const radius = p.classKey === 'paladin' ? 64 : 54;
    let hit = false;
    meleeArc(radius, Math.PI * 0.9, m => {
      damageMonster(m, playerDamageRoll(wd.min, wd.max, false), { melee: true });
      hit = true;
    });
    game.fx.push({ x: p.x, y: p.y, r: radius, a0: aim - 0.9, a1: aim + 0.9, color: p.classKey === 'paladin' ? '#ffd980' : '#ff8a8a', kind: 'arc', t: 0, dur: 0.16 });
  }
}

/* ===================== Movement collision ===================== */
function collide(x, y, r) {
  let nx = clamp(x, r, W - r), ny = clamp(y, r, H - r);
  for (const w of game.walls) {
    if (w.remaining <= 0) continue;
    const dx = w.x2 - w.x1, dy = w.y2 - w.y1;
    const len2 = dx * dx + dy * dy || 1;
    let t = ((nx - w.x1) * dx + (ny - w.y1) * dy) / len2;
    t = clamp(t, 0, 1);
    const cx = w.x1 + t * dx, cy = w.y1 + t * dy;
    const d = dist(nx, ny, cx, cy);
    const min = r + 6;
    if (d < min && d > 0) { nx = cx + (nx - cx) / d * min; ny = cy + (ny - cy) / d * min; }
    else if (d === 0) { ny = cy - min; }
  }
  return { x: nx, y: ny };
}

/* ===================== Update ===================== */
function update(dt) {
  game.time += dt;
  if (game.state !== 'playing' || game.paused || game.overlay) return;

  const p = game.player;
  if (p.dead) { updateFx(dt); return; }
  updatePlayer(dt);
  updateMonsters(dt);
  updateProjectiles(dt);
  updateZones(dt);
  updateLoot(dt);
  updateFx(dt);
  updateRiftFlow(dt);
  updateHUD();

  // death in rift -> reload
  if (p.hp <= 0 && !p.dead) {
    p.dead = true;
    handleDeath();
  }
}

function updatePlayer(dt) {
  const p = game.player;
  const s = p.stats;

  // movement
  let mx = 0, my = 0;
  const k = game.options.keys;
  if (keysDown[k.up]) my -= 1;
  if (keysDown[k.down]) my += 1;
  if (keysDown[k.left]) mx -= 1;
  if (keysDown[k.right]) mx += 1;
  if (mx || my) {
    const len = Math.hypot(mx, my);
    mx /= len; my /= len;
    const running = p.runTime > 0;
    const speed = running ? s.moveSpeed * 1.5 : s.moveSpeed * 0.75;
    if (running) p.runTime = Math.max(0, p.runTime - dt);
    const pos = collide(p.x + mx * speed * dt, p.y + my * speed * dt, p.r);
    p.x = pos.x; p.y = pos.y;
    p.moving = true;
  } else p.moving = false;

  // run time regen
  if (p.runTime < s.maxRun) p.runTime = Math.min(s.maxRun, p.runTime + 0.5 * dt);

  // regen
  healPlayer(s.healthRegen * dt);
  regenMana(s.manaRegen * dt);

  // buffs
  for (let i = p.buffs.length - 1; i >= 0; i--) {
    const b = p.buffs[i];
    b.remaining -= dt;
    if (b.id === 'regrowth') healPlayer(p.stats.maxHealth * 0.035 * dt);
    if (b.remaining <= 0) p.buffs.splice(i, 1);
  }

  // debuffs / dots
  p.frozen = Math.max(0, p.frozen - dt);
  for (const key in p.dots) {
    const d = p.dots[key];
    d.remaining -= dt;
    damagePlayerOverTime(d.dps * dt, key);
    if (d.remaining <= 0) delete p.dots[key];
  }
  if (p.slow) { p.slow.remaining -= dt; if (p.slow.remaining <= 0) p.slow = null; }

  // skill cooldowns
  for (const id in p.skillCd) if (p.skillCd[id] > 0) p.skillCd[id] = Math.max(0, p.skillCd[id] - dt);

  // fire aura (legendary) damages nearby monsters
  if (s.fireAura > 0) {
    for (const m of game.monsters) if (!m.dead && dist(p.x, p.y, m.x, m.y) < 80) m.hp -= s.fireAura * dt;
  }

  // held basic attack
  if (game.attacking) {
    game.attackTimer -= dt;
    if (game.attackTimer <= 0) {
      tryBasicAttack();
      const interval = 1 / (p.stats.attackSpeed * (hasBuff('adrenaline') ? 1.5 : 1));
      game.attackTimer = interval;
    }
  }
}

function damagePlayerOverTime(amount, key) {
  const p = game.player;
  let dmg = amount;
  if (hasBuff('bulwark')) dmg *= 0.4;
  p.hp -= dmg;
  if (p.hp <= 0) p.hp = 0;
}

function updateMonsters(dt) {
  const p = game.player;
  const slowFactor = p.slow ? p.slow.factor : 1;
  const moveMult = slowFactor;
  for (const m of game.monsters) {
    if (m.dead) { m.deathT += dt; continue; }
    // dots
    for (const key in m.dots) {
      const d = m.dots[key];
      d.remaining -= dt;
      m.hp -= d.dps * dt;
      if (d.remaining <= 0) delete m.dots[key];
    }
    if (m.hp <= 0) { killMonster(m); continue; }

    m.frozen = Math.max(0, m.frozen - dt);
    m.stunned = Math.max(0, m.stunned - dt);
    if (m.slow) { m.slow.remaining -= dt; if (m.slow.remaining <= 0) m.slow = null; }
    if (m.shield) { m.shield.remaining -= dt; if (m.shield.remaining <= 0) m.shield = null; }

    // abilities
    for (const ab of m.abilities) {
      ab.t -= dt;
      if (ab.t <= 0) { ab.action(m); ab.t = ab.interval; }
    }

    // aura
    if (m.aura && !m.dead) {
      const d = dist(m.x, m.y, p.x, p.y);
      if (d < m.aura.radius) {
        if (m.aura.kind === 'burn') applyDot(p, 'burn', 5, 1.0);
        else if (m.aura.kind === 'chill') applySlow(p, 0.5, 1.0);
        else if (m.aura.kind === 'curse') addBuff('curse', 1.0);
      }
    }

    if (m.frozen > 0 || m.stunned > 0) continue; // cannot act

    // movement toward player
    const dToP = dist(m.x, m.y, p.x, p.y);
    const ranged = m.ranged;
    const desired = ranged ? (m.proj && m.proj.range ? m.proj.range * 0.6 : 140) : m.r + p.r + 4;

    if (m.dash) {
      m.x = clamp(m.x + m.dash.vx * dt, 20, W - 20);
      m.y = clamp(m.y + m.dash.vy * dt, 20, H - 20);
      m.dash.remaining -= dt;
      if (m.dash.remaining <= 0) m.dash = null;
      if (dist(m.x, m.y, p.x, p.y) < m.r + p.r + 2) { damagePlayer(m.dmg * 1.5, m); m.dash = null; }
      continue;
    }

    if (dToP > desired) {
      const spd = m.speed * (m.slow ? m.slow.factor : 1) * moveMult;
      const a = angleTo(m.x, m.y, p.x, p.y);
      const nx = m.x + Math.cos(a) * spd * dt;
      const ny = m.y + Math.sin(a) * spd * dt;
      // separation from other monsters
      let sx = 0, sy = 0;
      for (const o of game.monsters) {
        if (o === m || o.dead) continue;
        const dd = dist(nx, ny, o.x, o.y);
        if (dd < m.r + o.r && dd > 0) { sx += (nx - o.x) / dd; sy += (ny - o.y) / dd; }
      }
      const pos = collide(nx + sx * 30 * dt, ny + sy * 30 * dt, m.r);
      m.x = pos.x; m.y = pos.y;
    }

    // attack
    m.atkTimer -= dt;
    if (m.atkTimer <= 0) {
      if (dToP <= (ranged ? (m.proj ? m.proj.range : 200) : m.r + p.r + 14)) {
        if (ranged) {
          const a = angleTo(m.x, m.y, p.x, p.y);
          spawnProjectile({ team: 'enemy', x: m.x, y: m.y, vx: Math.cos(a) * m.proj.speed, vy: Math.sin(a) * m.proj.speed, r: 6, dmg: m.proj.dmg || m.dmg, speed: m.proj.speed, life: 3, kind: m.proj.kind, magic: true, color: '#ff7a3c', onHitDot: { key: 'burn', dps: m.burnDps || 3, dur: 3 } });
        } else {
          damagePlayer(m.dmg, m);
          if (m.onHit === 'burn') applyDot(p, 'burn', m.burnDps, m.burnDur);
          else if (m.onHit === 'chill') applySlow(p, m.chillFactor, m.chillDur);
          else if (m.onHit === 'weak') addBuff('weaken', m.weakDur);
        }
      }
      m.atkTimer = m.atkInt;
    }
  }
  // remove dead after short delay
  game.monsters = game.monsters.filter(m => !m.dead || m.deathT < 0.5);
}

function updateProjectiles(dt) {
  for (const pr of game.projectiles) {
    pr.x += pr.vx * dt;
    pr.y += pr.vy * dt;
    pr.life -= dt;
    if (pr.x < 0 || pr.x > W || pr.y < 0 || pr.y > H) pr.life = 0;

    if (pr.team === 'player') {
      for (const m of game.monsters) {
        if (m.dead || pr.hitIds.has(m.uid)) continue;
        if (dist(pr.x, pr.y, m.x, m.y) < m.r + pr.r) {
          hitMonsterByProjectile(pr, m);
          pr.hitIds.add(m.uid);
          if (!pr.pierce) { pr.life = 0; break; }
        }
      }
    } else {
      const p = game.player;
      if (!p.dead && dist(pr.x, pr.y, p.x, p.y) < p.r + pr.r) {
        damagePlayer(pr.dmg, null);
        if (pr.onHitDot) {
          if (pr.onHitDot.key === 'burn') applyDot(p, 'burn', pr.onHitDot.dps, pr.onHitDot.dur);
          else if (pr.onHitDot.key === 'chill') applySlow(p, pr.onHitDot.factor, pr.onHitDot.dur);
        }
        pr.life = 0;
      }
    }
  }
  game.projectiles = game.projectiles.filter(pr => pr.life > 0);
}

function hitMonsterByProjectile(pr, m) {
  const p = game.player;
  if (pr.kind === 'fireball') {
    const dmg = playerDamageRoll(pr.dmg, pr.dmg, true);
    damageMonster(m, dmg, { magic: true });
    if (pr.aoe) {
      for (const o of game.monsters) if (!o.dead && o !== m && dist(pr.x, pr.y, o.x, o.y) < pr.aoe) damageMonster(o, dmg * 0.6, { magic: true });
      if (pr.scorch) spawnZone({ team: 'player', x: pr.x, y: pr.y, r: 60, dps: 6 + talentValue('wizard', 'scorchedEarth', 4), remaining: 3, color: '#ff7a3c', kind: 'scorch' });
    }
    game.fx.push({ x: pr.x, y: pr.y, r: pr.aoe || 30, color: '#ff7a3c', kind: 'boom', t: 0, dur: 0.3 });
  } else if (pr.kind === 'judgment') {
    const dmg = playerDamageRoll(pr.dmg, pr.dmg, true);
    damageMonster(m, dmg, { magic: true });
    if (m.type === 'darkness') damageMonster(m, dmg * 0.5, { magic: true });
    if (pr.aoe) for (const o of game.monsters) if (!o.dead && o !== m && dist(pr.x, pr.y, o.x, o.y) < pr.aoe) damageMonster(o, dmg * 0.5, { magic: true });
  } else {
    damageMonster(m, playerDamageRoll(pr.dmg, pr.dmg, pr.magic), { magic: pr.magic });
  }
}

function updateZones(dt) {
  for (const z of game.zones) {
    z.remaining -= dt;
    if (z.team === 'player') {
      for (const m of game.monsters) if (!m.dead && dist(z.x, z.y, m.x, m.y) < z.r + m.r) m.hp -= z.dps * dt;
    } else {
      const p = game.player;
      if (!p.dead && dist(z.x, z.y, p.x, p.y) < z.r + p.r) damagePlayerOverTime(z.dps * dt, z.kind);
    }
  }
  game.zones = game.zones.filter(z => z.remaining > 0);
}

function updateLoot(dt) {
  for (const l of game.loot) l.t += dt;
  // auto-pickup on rift clear is handled separately; manual pickup via click
}

function updateFx(dt) {
  for (const f of game.fx) f.t += dt;
  game.fx = game.fx.filter(f => f.t < f.dur);
}

function updateRiftFlow(dt) {
  const r = game.rift;
  if (!r) return;
  if (r.cleared) return;
  const alive = game.monsters.filter(m => !m.dead);

  if (!r.bossSpawned) {
    // spawn waves on fixed timer OR when current wave cleared
    const waveCleared = alive.length === 0 && r.waveIndex >= 0;
    r.waveTimer -= dt;
    if (r.waveIndex < r.waves - 1) {
      if (r.waveTimer <= 0 || (waveCleared && r.waveTimer < 17)) {
        spawnWave();
        r.waveTimer = 20;
      }
    } else if (waveCleared) {
      // last wave cleared -> spawn boss after delay
      r.bossDelay -= dt;
      if (r.bossDelay <= 0) spawnBoss();
    }
  }
}

function handleDeath() {
  const p = game.player;
  sfx('death');
  showBanner('Defeated', 'Your progress is lost. Reloading your last save...');
  setTimeout(() => {
    const saved = loadGame();
    if (saved) restorePlayer(saved);
    enterTown();
    p.dead = false;
    hideBanner();
  }, 2200);
}

function handleVictory() {
  const r = game.rift;
  if (r.cleared) return;
  r.cleared = true;
  const t = RIFT_TYPES[r.type];
  const p = game.player;
  p.maxRiftLevel = Math.max(p.maxRiftLevel, r.level + 3);
  p.maxRiftLevelCleared = Math.max(p.maxRiftLevelCleared, r.level);
  game.attacking = false; // stop held auto-attacks once the rift is cleared
  sfx('level');
  // clear remaining threats and celebrate
  game.monsters.forEach(m => { m.dead = true; });
  game.monsters = [];
  game.projectiles = [];
  game.zones = [];
  p.dots = {}; p.buffs = [];
  p.hp = p.stats.maxHealth; p.mp = p.stats.maxMana;
  // auto-collect remaining loot
  for (const l of game.loot) {
    if (addToBag(l.item)) continue;
    if (p.stash.length < 24) p.stash.push(l.item);
  }
  game.loot = [];
  showBanner('Rift Cleared!', t.trophy + ' obtained. Rifts up to level ' + p.maxRiftLevel + ' unlocked.');
  setTimeout(() => {
    enterTown();
    saveGame();
    hideBanner();
  }, 2600);
}

/* ===================== Town / transitions ===================== */
function enterTown() {
  game.world = 'town';
  game.rift = null;
  game.monsters = [];
  game.projectiles = [];
  game.zones = [];
  game.walls = [];
  game.loot = [];
  game.shopStock = null;
  buildTown();
  const p = game.player;
  placePlayer(W * 0.5, H * 0.7);
  p.dots = {}; p.buffs = [];
  p.hp = p.stats.maxHealth; p.mp = p.stats.maxMana; p.runTime = p.stats.maxRun;
  closeOverlay();
  updateHUD();
}

function checkTownInteraction() {
  const p = game.player;
  for (const loc of game.townLocations) {
    if (dist(p.x, p.y, loc.x, loc.y) < loc.r + p.r) return loc;
  }
  return null;
}
function checkLootNear() {
  const p = game.player;
  let best = null, bd = 30;
  for (const l of game.loot) {
    const d = dist(p.x, p.y, l.x, l.y);
    if (d < bd) { best = l; bd = d; }
  }
  return best;
}
function pickupLoot(l) {
  if (!l) return;
  if (addToBag(l.item)) {
    game.loot.splice(game.loot.indexOf(l), 1);
    toast('Picked up ' + l.item.name, 'good');
    sfx('pickup');
  } else {
    toast('Bag is full!', 'bad');
  }
}

function addToBag(item) {
  const p = game.player;
  if (item.slot === 'potion') {
    const ex = p.bag.find(i => i.slot === 'potion' && i.kind === item.kind);
    if (ex) { ex.qty += item.qty; return true; }
  }
  if (p.bag.length >= 24) return false;
  p.bag.push(item);
  return true;
}

/* ===================== Inventory actions ===================== */
function equipItem(item, fromStash) {
  const p = game.player;
  let arr = fromStash ? p.stash : p.bag;
  const idx = arr.indexOf(item);
  if (idx < 0) return;
  const slot = item.slot;
  const old = p.equipment[slot];
  arr.splice(idx, 1);
  p.equipment[slot] = item;
  if (old) arr.push(old);
  recomputeStats();
  // don't let hp exceed new max
  p.hp = Math.min(p.hp, p.stats.maxHealth);
  p.mp = Math.min(p.mp, p.stats.maxMana);
  sfx('buy');
}
function unequipItem(slot) {
  const p = game.player;
  const item = p.equipment[slot];
  if (!item) return;
  if (p.bag.length >= 24) { toast('Bag is full!', 'bad'); return; }
  p.equipment[slot] = null;
  p.bag.push(item);
  recomputeStats();
  p.hp = Math.min(p.hp, p.stats.maxHealth);
  p.mp = Math.min(p.mp, p.stats.maxMana);
}
function sellItem(item) {
  const p = game.player;
  let arr = null, idx = -1;
  if (p.bag.includes(item)) { arr = p.bag; idx = p.bag.indexOf(item); }
  else {
    for (const slot of EQUIP_SLOTS) if (p.equipment[slot] === item) { p.equipment[slot] = null; recomputeStats(); p.hp = Math.min(p.hp, p.stats.maxHealth); p.mp = Math.min(p.mp, p.stats.maxMana); }
  }
  if (arr) arr.splice(idx, 1);
  const v = Math.round(itemValue(item) * 0.4);
  p.gold += v;
  toast('Sold ' + item.name + ' for ' + v + ' gold', 'gold');
  sfx('buy');
}
function dropItem(item) {
  const p = game.player;
  let arr = null, idx = -1;
  if (p.bag.includes(item)) { arr = p.bag; idx = p.bag.indexOf(item); }
  else if (p.equipment[item.slot] === item) { p.equipment[item.slot] = null; recomputeStats(); }
  if (arr) arr.splice(idx, 1);
  dropLoot(item, p.x + rand(-20, 20), p.y + rand(-20, 20));
}
function usePotion(item) {
  const p = game.player;
  if (item.kind === 'health') { healPlayer(p.stats.maxHealth * 0.35); sfx('heal'); spawnFloat(p.x, p.y - 20, '+' + Math.round(p.stats.maxHealth * 0.35), '#7ae88a'); }
  else if (item.kind === 'mana') { regenMana(p.stats.maxMana * 0.4); }
  else if (item.kind === 'run') { p.runTime = p.stats.maxRun; }
  item.qty--;
  if (item.qty <= 0) p.bag.splice(p.bag.indexOf(item), 1);
  toast('Used ' + item.name, 'good');
}
function usePotionKind(kind) {
  const p = game.player;
  const it = p.bag.find(i => i.slot === 'potion' && i.kind === kind);
  if (!it) { toast('No potion of that type', 'bad'); return; }
  usePotion(it);
  updateHUD();
}

/* ===================== Player restore ===================== */
function restorePlayer(data) {
  if (!data || !data.classKey || !CLASSES[data.classKey]) return false;
  const cls = CLASSES[data.classKey];
  const p = {
    name: data.name, classKey: data.classKey, difficulty: data.difficulty,
    x: W / 2, y: H / 2, r: 14,
    hp: data.health, mp: data.mp, runTime: 6,
    gold: data.gold, trophies: data.trophies || { fire: 0, ice: 0, earth: 0, darkness: 0 },
    maxRiftLevel: data.maxRiftLevel || 3, maxRiftLevelCleared: data.maxRiftLevelCleared || 0,
    equipment: data.equipment || {}, bag: data.bag || [], stash: data.stash || [],
    talents: data.talents || {}, skills: data.skills || cls.skills.slice(0, 4).map(s => s.id),
    buffs: [], dots: {}, frozen: 0, weak: null, dead: false,
    skillCd: {}, move: { x: 0, y: 0 }, sprite: playerSprite(data.classKey), stats: null,
  };
  for (const slot of EQUIP_SLOTS) if (!p.equipment[slot]) p.equipment[slot] = null;
  p.skillCd = {};
  for (const s of cls.skills) p.skillCd[s.id] = 0;
  game.player = p;
  sanitizeSkills();
  recomputeStats();
  p.runTime = p.stats.maxRun;
}

/* ===================== Render ===================== */
const canvas = document.getElementById('view');
const ctx = canvas.getContext('2d');

function resizeCanvas() {
  const stage = document.getElementById('stage');
  const w = stage.clientWidth, h = stage.clientHeight;
  if (!w || !h) return;
  DPR = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.round(w * DPR);
  canvas.height = Math.round(h * DPR);
  W = w; H = h;
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  onWorldResized();
}
function onWorldResized() {
  if (game.state !== 'playing') return;
  if (game.world === 'town') buildTown();
  else if (game.world === 'rift' && game.rift) buildRift();
  const p = game.player;
  if (p) { const pos = collide(p.x, p.y, p.r); p.x = pos.x; p.y = pos.y; }
  for (const m of game.monsters) { const pos = collide(m.x, m.y, m.r); m.x = pos.x; m.y = pos.y; }
  for (const l of game.loot) { l.x = clamp(l.x, 20, W - 20); l.y = clamp(l.y, 20, H - 20); }
}

function drawFloor(world) {
  const r = game.rift;
  if (world === 'rift' && r) {
    const t = RIFT_TYPES[r.type];
    ctx.fillStyle = t.floor2;
    ctx.fillRect(0, 0, W, H);
    // tile grid
    ctx.strokeStyle = 'rgba(0,0,0,0.18)';
    ctx.lineWidth = 1;
    for (let x = 0; x < W; x += 32) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
    for (let y = 0; y < H; y += 32) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
    // accent patches (precomputed)
    ctx.fillStyle = t.floor1;
    for (const pt of (r.patches || [])) {
      ctx.globalAlpha = 0.35;
      ctx.fillRect(pt.x, pt.y, pt.w, pt.h);
    }
    ctx.globalAlpha = 1;
    // border wall tint
    ctx.strokeStyle = t.wall; ctx.lineWidth = 6; ctx.strokeRect(3, 3, W - 6, H - 6);
  } else {
    // town
    ctx.fillStyle = '#2a2038';
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = 'rgba(0,0,0,0.2)';
    for (let x = 0; x < W; x += 32) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
    for (let y = 0; y < H; y += 32) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
    // plaza
    ctx.fillStyle = '#3a2f52';
    ctx.beginPath(); ctx.arc(W / 2, H / 2, 120, 0, Math.PI * 2); ctx.fill();
    // road accents
    ctx.fillStyle = '#241b33';
    ctx.fillRect(0, H / 2 - 40, W, 80);
  }
}

function drawImage(img, x, y, size) {
  if (img && img.complete && img.naturalWidth) ctx.drawImage(img, x - size / 2, y - size / 2, size, size);
  else { ctx.fillStyle = '#888'; ctx.beginPath(); ctx.arc(x, y, size / 2, 0, Math.PI * 2); ctx.fill(); }
}

function render() {
  ctx.clearRect(0, 0, W, H);
  if (game.state !== 'playing') {
    // dim backdrop behind menus
    drawFloor('town');
    return;
  }

  drawFloor(game.world);

  // props
  for (const pr of game.props) drawImage(pr.img, pr.x, pr.y, 44);

  // town locations
  if (game.world === 'town') {
    const p = game.player;
    for (const loc of game.townLocations) {
      const near = dist(p.x, p.y, loc.x, loc.y) < loc.r + p.r;
      ctx.globalAlpha = near ? 1 : 0.85;
      drawImage(townPropSprite(loc.id, loc.color), loc.x, loc.y, 64);
      // label
      ctx.font = '700 15px Cinzel, Georgia, serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = near ? '#ffe08a' : '#cfc3e8';
      ctx.strokeStyle = 'rgba(0,0,0,0.8)'; ctx.lineWidth = 3;
      ctx.strokeText(loc.name, loc.x, loc.y + 46);
      ctx.fillText(loc.name, loc.x, loc.y + 46);
      if (near) {
        ctx.font = '14px Inter, sans-serif';
        ctx.fillStyle = '#ffe08a';
        ctx.strokeText('[Click to interact]', loc.x, loc.y + 62);
        ctx.fillText('[Click to interact]', loc.x, loc.y + 62);
      }
    }
  }

  // zones
  for (const z of game.zones) {
    ctx.globalAlpha = 0.35;
    ctx.fillStyle = z.color;
    ctx.beginPath(); ctx.arc(z.x, z.y, z.r, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1;
  }

  // walls
  for (const w of game.walls) {
    if (w.remaining <= 0) continue;
    ctx.strokeStyle = '#8a6b45'; ctx.lineWidth = 10; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(w.x1, w.y1); ctx.lineTo(w.x2, w.y2); ctx.stroke();
    ctx.strokeStyle = '#4a3820'; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(w.x1, w.y1); ctx.lineTo(w.x2, w.y2); ctx.stroke();
  }

  // loot
  for (const l of game.loot) {
    const it = l.item;
    const img = iconImg(itemIconShape(it), RARITIES[it.rarity].color);
    ctx.globalAlpha = 0.85;
    drawImage(img, l.x, l.y + Math.sin(game.time * 4 + l.x) * 3, 30);
    ctx.globalAlpha = 1;
    // beam indicator
    ctx.strokeStyle = 'rgba(255,255,255,0.18)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(l.x, l.y + 15); ctx.lineTo(l.x, l.y - 14); ctx.stroke();
  }

  // monsters
  for (const m of game.monsters) {
    if (m.dead) continue;
    const size = m.role === 'boss' ? 64 : m.role === 'elite' ? 48 : 34;
    if (m.frozen > 0) { ctx.globalAlpha = 0.75; }
    drawImage(m.sprite, m.x, m.y, size);
    ctx.globalAlpha = 1;
    if (m.shield) { ctx.strokeStyle = '#9fd8ff'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(m.x, m.y, m.r + 5, 0, Math.PI * 2); ctx.stroke(); }
    if (m.frozen > 0) { ctx.strokeStyle = '#9fd8ff'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(m.x, m.y, m.r + 3, 0, Math.PI * 2); ctx.stroke(); }
    // hp bar
    const bw = size, bh = 5;
    const pct = clamp(m.hp / m.maxHp, 0, 1);
    ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(m.x - bw / 2, m.y - size / 2 - 10, bw, bh);
    ctx.fillStyle = m.role === 'boss' ? '#c07bff' : m.role === 'elite' ? '#ffd980' : '#e05555';
    ctx.fillRect(m.x - bw / 2, m.y - size / 2 - 10, bw * pct, bh);
    if (m.role !== 'regular') {
      ctx.font = '700 11px Cinzel, serif'; ctx.textAlign = 'center'; ctx.fillStyle = '#fff'; ctx.strokeStyle = 'rgba(0,0,0,0.8)'; ctx.lineWidth = 2;
      const nm = m.name;
      ctx.strokeText(nm, m.x, m.y - size / 2 - 16); ctx.fillText(nm, m.x, m.y - size / 2 - 16);
    }
  }

  // player
  const p = game.player;
  if (p && !p.dead) {
    // aim line
    ctx.strokeStyle = 'rgba(255,255,255,0.25)'; ctx.lineWidth = 1; ctx.setLineDash([4, 6]);
    ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(game.mouse.x, game.mouse.y); ctx.stroke();
    ctx.setLineDash([]);
    drawImage(p.sprite, p.x, p.y, 40);
    if (hasBuff('bulwark')) { ctx.strokeStyle = '#ffd980'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(p.x, p.y, p.r + 6, 0, Math.PI * 2); ctx.stroke(); }
  }

  // projectiles
  for (const pr of game.projectiles) {
    ctx.fillStyle = pr.color;
    ctx.beginPath(); ctx.arc(pr.x, pr.y, pr.r, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 1.5;
    ctx.stroke();
  }

  // fx
  for (const f of game.fx) {
    const a = 1 - f.t / f.dur;
    ctx.globalAlpha = Math.max(0, a);
    if (f.kind === 'ring') { ctx.strokeStyle = f.color; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(f.x, f.y, f.r * (0.4 + 0.6 * (f.t / f.dur)), 0, Math.PI * 2); ctx.stroke(); }
    else if (f.kind === 'arc') { ctx.fillStyle = f.color; ctx.beginPath(); ctx.moveTo(f.x, f.y); ctx.arc(f.x, f.y, f.r, f.a0, f.a1); ctx.closePath(); ctx.fill(); }
    else if (f.kind === 'boom') { ctx.fillStyle = f.color; ctx.beginPath(); ctx.arc(f.x, f.y, f.r * (f.t / f.dur), 0, Math.PI * 2); ctx.fill(); }
    else if (f.kind === 'bolt') { ctx.strokeStyle = f.color; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(f.x1, f.y1); ctx.lineTo(f.x2, f.y2); ctx.stroke(); }
    ctx.globalAlpha = 1;
  }

  // floating text
  for (const f of game.fx) {
    if (!f.text) continue;
    const a = 1 - f.t / f.dur;
    ctx.globalAlpha = Math.max(0, a);
    ctx.font = '700 15px Inter, sans-serif'; ctx.textAlign = 'center';
    ctx.fillStyle = f.color; ctx.strokeStyle = 'rgba(0,0,0,0.8)'; ctx.lineWidth = 2;
    ctx.strokeText(f.text, f.x, f.y - f.t * 40); ctx.fillText(f.text, f.x, f.y - f.t * 40);
    ctx.globalAlpha = 1;
  }

  // interaction hint in HUD (DOM) handled in updateHUD
}

/* ===================== HUD ===================== */
function itemIconShape(it) {
  if (it.slot === 'potion') return it.icon;
  return SLOT_INFO[it.slot] ? SLOT_INFO[it.slot].icon : 'ring';
}

function updateHUD() {
  if (game.state !== 'playing') return;
  const p = game.player;
  const s = p.stats;
  const setBar = (id, cur, max) => {
    const fill = document.querySelector('#' + id + ' .fill');
    const lbl = document.querySelector('#' + id + ' .lbl');
    const pct = max > 0 ? clamp(cur / max, 0, 1) : 0;
    fill.style.transform = 'scaleX(' + pct + ')';
    if (id === 'bar-hp') lbl.textContent = Math.ceil(cur) + ' / ' + Math.round(max);
    else if (id === 'bar-mana') lbl.textContent = Math.ceil(cur) + ' / ' + Math.round(max);
    else lbl.textContent = fmt1(cur) + 's';
  };
  setBar('bar-hp', p.hp, s.maxHealth);
  setBar('bar-mana', p.mp, s.maxMana);
  setBar('bar-run', p.runTime, s.maxRun);

  document.getElementById('char-tag').innerHTML = '<b>' + p.name + '</b> — ' + CLASSES[p.classKey].name + ' (' + DIFFICULTIES[p.difficulty].name + ')';

  const res = document.getElementById('resources');
  res.innerHTML = '<span class="gold">🪙 ' + p.gold + ' gold</span>' +
    ['fire', 'ice', 'earth', 'darkness'].map(t => '<span class="trophy" style="color:' + RIFT_TYPES[t].color + '">' + RIFT_TYPES[t].glyph + ' ' + (p.trophies[t] || 0) + '</span>').join('');

  // rift banner
  const rb = document.getElementById('rift-banner');
  if (game.world === 'rift' && game.rift) {
    const r = game.rift;
    let status = r.cleared ? 'Cleared!' : (r.bossSpawned ? 'Boss' : ('Wave ' + (r.waveIndex + 1) + ' / ' + r.waves));
    rb.innerHTML = '<b>' + RIFT_TYPES[r.type].name + ' Rift — Level ' + r.level + '</b> · ' + status;
  } else {
    rb.textContent = '';
  }

  // interaction hint
  const hint = document.getElementById('hint');
  const loot = checkLootNear();
  if (loot) {
    hint.textContent = 'Click to pick up ' + loot.item.name;
  } else if (game.world === 'town') {
    const loc = checkTownInteraction();
    hint.textContent = loc ? 'Click to interact with ' + loc.name : '';
  } else {
    hint.textContent = '';
  }

  renderSkillBar();
}

function renderSkillBar() {
  const p = game.player;
  const skills = getEquippedSkills();
  let sig = skills.map(s => s ? s.id : '-').join(',');
  for (let i = 0; i < 4; i++) {
    const sk = skills[i];
    if (sk) sig += '|' + Math.ceil((p.skillCd[sk.id] || 0) * 10) + (p.mp < sk.cost ? 'L' : '');
  }
  for (const ps of POTION_SLOTS) {
    const pot = p.bag.find(i => i.slot === 'potion' && i.kind === ps.kind);
    sig += '|' + (pot ? pot.qty : 0);
  }
  if (sig === renderSkillBar._sig) return;
  renderSkillBar._sig = sig;

  const bar = document.getElementById('skillbar');
  bar.innerHTML = '';
  const keys = ['skill1', 'skill2', 'skill3', 'skill4'];
  for (let i = 0; i < 4; i++) {
    const sk = skills[i];
    const slot = el('div', 'slot' + (sk ? '' : ' empty'));
    const keyLabel = game.options.keys[keys[i]] || '';
    const kname = keyLabel.replace('Digit', '').replace('Key', '');
    slot.innerHTML = '<span class="key">' + kname + '</span>';
    if (sk) {
      const img = document.createElement('img');
      img.src = iconSVG(sk.shape, sk.color);
      slot.appendChild(img);
      const cd = p.skillCd[sk.id] || 0;
      if (cd > 0) {
        const cde = el('div', 'cd', fmt1(cd));
        slot.appendChild(cde);
      }
      if (p.mp < sk.cost) slot.classList.add('no-mana');
      slot.title = sk.name + ' — ' + sk.desc + ' (cost ' + sk.cost + ' mana)';
    }
    slot.addEventListener('click', () => { if (sk) castSkill(sk.id); });
    bar.appendChild(slot);
  }

  // potion slots
  const div = el('div', 'skillbar-divider');
  bar.appendChild(div);
  for (const ps of POTION_SLOTS) {
    const pot = p.bag.find(i => i.slot === 'potion' && i.kind === ps.kind);
    const slot = el('div', 'slot potion-slot' + (pot ? '' : ' empty'));
    const keyLabel = game.options.keys[ps.key] || '';
    const kname = keyLabel.replace('Digit', '').replace('Key', '');
    slot.innerHTML = '<span class="key">' + kname + '</span>';
    if (pot) {
      const img = document.createElement('img');
      img.src = iconSVG('potion-' + ps.kind, ps.color);
      slot.appendChild(img);
      slot.appendChild(el('span', 'potion-qty', String(pot.qty)));
      slot.title = ps.name + ' (×' + pot.qty + ')';
    }
    slot.addEventListener('click', () => usePotionKind(ps.kind));
    bar.appendChild(slot);
  }
}

/* ===================== Overlays & screens ===================== */
function openOverlay(name) {
  if (!game.player) return;
  game.overlay = name;
  game.paused = false;
  document.getElementById('hud').style.display = 'none';
  closeAllScreens();
  const id = { inventory: 'inventory-screen', shop: 'shop-screen', shrine: 'shrine-screen', stash: 'stash-screen', rift: 'rift-screen' }[name];
  if (id) document.getElementById(id).classList.add('open');
  if (name === 'inventory') renderInventory();
  if (name === 'shop') renderShop();
  if (name === 'shrine') renderShrine();
  if (name === 'stash') renderStash();
  if (name === 'rift') renderRiftSelect();
}
function closeOverlay() {
  game.overlay = null;
  closeAllScreens();
  if (game.state === 'playing') document.getElementById('hud').style.display = 'block';
}
function closeAllScreens() {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('open'));
}

function showScreen(id) {
  closeAllScreens();
  document.getElementById(id).classList.add('open');
  if (game.state === 'playing') document.getElementById('hud').style.display = 'none';
}

/* ===================== Inventory UI ===================== */
function affixMeta(id) {
  const a = AFFIXES.find(x => x.id === id);
  return a ? { label: a.label, pct: !!a.pct } : { label: id, pct: false };
}
function fmtStatVal(id, v) {
  const m = affixMeta(id);
  return m.pct ? v + '%' : String(Math.round(v * 10) / 10);
}
function compareSectionHTML(item) {
  const p = game.player;
  if (!SLOT_INFO[item.slot]) return '';
  const eq = p.equipment[item.slot] || null;
  let html = '<div class="divider"></div><div class="tt-line muted">Compared to equipped (Shift):</div>';
  if (!eq) { html += '<div class="tt-line good">+ Nothing equipped in this slot</div>'; return html; }
  function line(label, cur, old, diff, noSign) {
    const cls = diff > 0 ? 'good' : diff < 0 ? 'bad' : '';
    const pre = noSign ? '' : (diff > 0 ? '+' : '');
    const was = diff !== 0 ? ' (was ' + old + ')' : '';
    return '<div class="tt-line ' + cls + '">' + label + ': ' + pre + cur + was + '</div>';
  }
  if (item.damageMin || eq.damageMin) {
    const a = item.damageMin ? (item.damageMin + '-' + item.damageMax) : '0';
    const b = eq.damageMin ? (eq.damageMin + '-' + eq.damageMax) : '0';
    html += line('Damage', a, b, (item.damageMin || 0) - (eq.damageMin || 0), true);
  }
  const keys = new Set([...Object.keys(item.stats), ...Object.keys(eq.stats)]);
  for (const k of keys) {
    const cur = item.stats[k] || 0, old = eq.stats[k] || 0;
    html += line(affixMeta(k).label, fmtStatVal(k, cur), fmtStatVal(k, old), cur - old);
  }
  return html;
}

function itemTooltipHTML(item, compare) {
  const rar = RARITIES[item.rarity];
  let html = '<div class="tt-name rarity-' + item.rarity + '">' + item.name + '</div>';
  html += '<div class="tt-line">' + (SLOT_LABELS[item.slot] || 'Consumable') + ' · ' + rar.name + ' · ilvl ' + item.ilvl + '</div>';
  if (item.damageMin) html += '<div class="tt-line">' + item.damageMin + '-' + item.damageMax + ' Damage</div>';
  for (const k in item.stats) {
    const v = item.stats[k];
    const m = affixMeta(k);
    html += '<div class="tt-line">+' + v + (m.pct ? '% ' : ' ') + m.label + '</div>';
  }
  if (item.special) html += '<div class="tt-special">' + item.special.name + '</div>';
  if (item.slot === 'potion') html += '<div class="tt-line">Click to use</div>';
  html += '<div class="tt-line">Sell value: ' + Math.round(itemValue(item) * 0.4) + 'g</div>';
  if (compare) html += compareSectionHTML(item);
  return html;
}

let hoveredItem = null;
let tooltipShift = null;
function isShiftDown() { return keysDown['ShiftLeft'] || keysDown['ShiftRight']; }
function refreshTooltip(force) {
  if (!hoveredItem) return;
  const sh = isShiftDown();
  if (!force && sh === tooltipShift) return;
  tooltipShift = sh;
  document.getElementById('tooltip').innerHTML = itemTooltipHTML(hoveredItem, sh);
}

function attachTooltip(node, item) {
  node.addEventListener('mouseenter', () => {
    hoveredItem = item;
    tooltipShift = null;
    const tt = document.getElementById('tooltip');
    tt.innerHTML = itemTooltipHTML(item, isShiftDown());
    tt.style.display = 'block';
  });
  node.addEventListener('mousemove', e => {
    refreshTooltip();
    const tt = document.getElementById('tooltip');
    const r = document.getElementById('stage').getBoundingClientRect();
    tt.style.left = Math.min(e.clientX - r.left + 14, r.width - 310) + 'px';
    tt.style.top = (e.clientY - r.top + 14) + 'px';
  });
  node.addEventListener('mouseleave', () => { hoveredItem = null; tooltipShift = null; document.getElementById('tooltip').style.display = 'none'; });
}

function findItemByUid(id) {
  const p = game.player;
  if (!p) return null;
  for (const it of p.bag) if (it.uid === id) return it;
  for (const slot of EQUIP_SLOTS) if (p.equipment[slot] && p.equipment[slot].uid === id) return p.equipment[slot];
  return null;
}
function makeDraggableCell(cell, it) {
  cell.draggable = true;
  const imgs = cell.querySelectorAll('img');
  for (let i = 0; i < imgs.length; i++) imgs[i].draggable = false;
  cell.addEventListener('dragstart', e => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(it.uid));
    const img = new Image();
    img.src = iconSVG(itemIconShape(it), it.slot === 'potion' ? it.color : RARITIES[it.rarity].color);
    e.dataTransfer.setDragImage(img, 20, 20);
  });
}
function setupDragDrop() {
  document.addEventListener('dragover', e => { e.preventDefault(); if (e.dataTransfer) e.dataTransfer.dropEffect = 'move'; });
  document.addEventListener('drop', e => {
    e.preventDefault();
    const id = parseInt(e.dataTransfer.getData('text/plain'), 10);
    if (!id) return;
    const item = findItemByUid(id);
    if (!item || game.state !== 'playing') return;
    const inv = document.getElementById('inventory-screen');
    if (!inv.classList.contains('open')) return;
    // Drop when released outside the inventory panel (onto the dark backdrop).
    const panel = inv.querySelector('.panel');
    if (!panel || !panel.contains(e.target)) {
      dropItem(item);
      renderInventory();
    }
  });
}

function renderInventory() {
  const p = game.player;
  const eq = document.getElementById('equip-grid');
  eq.innerHTML = '';
  for (const slot of EQUIP_SLOTS) {
    const cell = el('div', 'cell' + (p.equipment[slot] ? ' equipped' : ''));
    if (p.equipment[slot]) {
      const img = document.createElement('img');
      img.src = iconSVG(itemIconShape(p.equipment[slot]), RARITIES[p.equipment[slot].rarity].color);
      cell.appendChild(img);
      attachTooltip(cell, p.equipment[slot]);
      makeDraggableCell(cell, p.equipment[slot]);
      cell.addEventListener('click', () => { unequipItem(slot); renderInventory(); });
    } else {
      cell.innerHTML = '<span class="muted" style="font-size:10px">' + SLOT_LABELS[slot].split(' ')[0] + '</span>';
    }
    eq.appendChild(cell);
  }

  const bag = document.getElementById('bag-grid');
  bag.innerHTML = '';
  document.getElementById('bag-count').textContent = p.bag.length + ' / 24 items';
  for (const it of p.bag) {
    const cell = el('div', 'cell');
    const img = document.createElement('img');
    img.src = iconSVG(itemIconShape(it), it.slot === 'potion' ? it.color : RARITIES[it.rarity].color);
    cell.appendChild(img);
    if (it.qty > 1) { const q = el('span', '', it.qty); q.style.cssText = 'position:absolute;bottom:1px;right:3px;font-size:11px;color:#fff'; cell.appendChild(q); }
    attachTooltip(cell, it);
    makeDraggableCell(cell, it);
    cell.addEventListener('click', () => {
      if (it.slot === 'potion') { usePotion(it); renderInventory(); }
      else equipItem(it, false); renderInventory();
    });
    bag.appendChild(cell);
  }

  // character stats
  const s = p.stats;
  const stats = document.getElementById('char-stats');
  stats.innerHTML = '';
  const rows = [
    ['Health', Math.ceil(s.maxHealth)], ['Mana', Math.ceil(s.maxMana)], ['Armor', Math.round(s.armor)],
    ['Attack Power', Math.round(s.attackPower)], ['Magic Power', Math.round(s.magicPower)],
    ['Attack Speed', fmt1(s.attackSpeed) + '/s'], ['Crit Chance', Math.round(s.critChance * 100) + '%'],
    ['Health Regen', fmt1(s.healthRegen) + '/s'], ['Mana Regen', fmt1(s.manaRegen) + '/s'],
    ['Life on Hit', fmt(s.lifeOnHit)], ['Life Steal', Math.round(s.lifeSteal * 100) + '%'],
    ['Life on Kill', fmt(s.lifeOnKill)], ['Run Time', fmt1(s.maxRun) + 's'],
    ['Move Speed', Math.round(s.moveSpeed)],
  ];
  for (const [k, v] of rows) { stats.appendChild(el('div', 'k', k)); stats.appendChild(el('div', '', String(v))); }
  document.getElementById('inv-gold').textContent = '🪙 ' + p.gold + ' gold';
}

/* ===================== Shop UI ===================== */
function buildShopStock() {
  const p = game.player;
  const ilvl = Math.max(1, p.maxRiftLevelCleared + 1);
  const stock = [];
  // consumables always
  stock.push(makePotion('health', 3), makePotion('mana', 3), makePotion('run', 2));
  // gear
  for (let i = 0; i < 7; i++) {
    const slot = pick([...EQUIP_SLOTS, 'weapon', 'weapon', 'chest', 'helmet']);
    const wk = p.classKey === 'wizard' ? 'wand' : CLASSES[p.classKey].weaponKind;
    stock.push(generateItem(slot, ilvl + randInt(-1, 1), wk, 'shop'));
  }
  return stock;
}

function renderShop() {
  const p = game.player;
  if (!game.shopStock) game.shopStock = buildShopStock();
  const buy = document.getElementById('shop-buy');
  buy.innerHTML = '';
  for (const it of game.shopStock) {
    const v = itemValue(it);
    const row = el('div', 'list-row');
    const img = document.createElement('img');
    img.className = 'icon';
    img.src = iconSVG(itemIconShape(it), it.slot === 'potion' ? it.color : RARITIES[it.rarity].color);
    row.appendChild(img);
    const info = el('div', 'info', '<span class="rarity-' + it.rarity + '">' + it.name + '</span> <span class="muted">— ' + v + 'g</span>' + (it.qty ? ' ×' + it.qty : ''));
    row.appendChild(info);
    const btn = el('button', 'small', 'Buy');
    btn.disabled = p.gold < v;
    btn.addEventListener('click', e => { e.stopPropagation(); buyItem(it); });
    row.appendChild(btn);
    attachTooltip(row, it);
    buy.appendChild(row);
  }

  const sell = document.getElementById('shop-sell');
  sell.innerHTML = '';
  const sellable = [...p.bag, ...EQUIP_SLOTS.filter(s => p.equipment[s]).map(s => p.equipment[s])];
  for (const it of sellable) {
    const row = el('div', 'list-row');
    const img = document.createElement('img');
    img.className = 'icon';
    img.src = iconSVG(itemIconShape(it), it.slot === 'potion' ? it.color : RARITIES[it.rarity].color);
    row.appendChild(img);
    const v = Math.round(itemValue(it) * 0.4);
    const equipped = EQUIP_SLOTS.some(s => p.equipment[s] === it);
    row.appendChild(el('div', 'info', '<span class="rarity-' + it.rarity + '">' + it.name + '</span>' + (equipped ? '<span class="equipped-badge">Equipped</span>' : '') + ' <span class="muted">— ' + v + 'g</span>'));
    const btn = el('button', 'small', 'Sell');
    btn.addEventListener('click', e => { e.stopPropagation(); sellItem(it); renderShop(); });
    row.appendChild(btn);
    attachTooltip(row, it);
    sell.appendChild(row);
  }
  document.getElementById('shop-gold').textContent = '🪙 ' + p.gold + ' gold';
}

function buyItem(it) {
  const p = game.player;
  const v = itemValue(it);
  if (p.gold < v) return;
  if (!addToBag(it)) { toast('Bag is full!', 'bad'); return; }
  p.gold -= v;
  game.shopStock.splice(game.shopStock.indexOf(it), 1);
  toast('Bought ' + it.name, 'good');
  sfx('buy');
  renderShop();
}

/* ===================== Shrine UI ===================== */
function renderShrine() {
  const p = game.player;
  const cls = CLASSES[p.classKey];
  const tal = document.getElementById('shrine-talents');
  tal.innerHTML = '';

  for (const td of cls.talents) {
    const rank = p.talents[td.id] || 0;
    const row = el('div', 'talent-row');
    const info = el('div', 'info');
    const desc = td.desc;
    let descText;
    if (td.id === 'shieldMastery') descText = desc.replace('{v}', rank * 4).replace('{v2}', Math.round(rank * 8));
    else if (td.id === 'overflowingMana') descText = desc.replace('{v}', rank * 20).replace('{v2}', fmt1(rank * 0.5));
    else descText = desc.replace('{v}', rank * talentPerRank(td.id));
    info.innerHTML = '<div class="name">' + td.name + '</div><div class="desc">' + descText + '</div><div class="rank-dots">Rank ' + rank + ' / ' + MAX_TALENT_RANK + '</div><div class="muted" style="font-size:13px">Tier ' + td.tier + ' — requires ' + TALENT_TIER_GATE[td.tier] + ' trophy type(s)</div>';
    row.appendChild(info);

    const maxed = rank >= MAX_TALENT_RANK;
    const up = maxed ? null : talentUpgradeInfo(td, rank);
    let btnLabel = 'Maxed';
    if (!maxed) {
      if (up.gateTypes <= 1) btnLabel = 'Rank Up (' + up.perType + (up.perType === 1 ? ' trophy' : ' trophies') + ')';
      else btnLabel = 'Rank Up (' + up.perType + ' × ' + up.gateTypes + ' types)';
    }
    const btn = el('button', 'small' + (maxed ? '' : ' primary'), btnLabel);
    btn.disabled = maxed || (!maxed && (up.locked || !up.affordable));
    if (!maxed && up.locked) btn.textContent = 'Locked';
    else if (!maxed && up.gateTypes > 1) btn.title = 'Requires ' + up.perType + ' trophies from each of ' + up.gateTypes + ' different types';
    btn.addEventListener('click', () => {
      if (rankUpTalent(td.id)) renderShrine();
    });
    row.appendChild(btn);
    tal.appendChild(row);
  }

  // skill assignment — four dropdowns, one per slot (no duplicate skills)
  sanitizeSkills();
  const sk = document.getElementById('shrine-skills');
  sk.innerHTML = '';
  for (let i = 0; i < 4; i++) {
    const row = el('div', 'skill-slot-row');
    const label = el('label', '', 'Slot ' + (i + 1) + ':');
    const sel = document.createElement('select');
    const emptyOpt = document.createElement('option');
    emptyOpt.value = '';
    emptyOpt.textContent = '— unassigned —';
    if (!p.skills[i]) emptyOpt.selected = true;
    sel.appendChild(emptyOpt);
    for (const s of cls.skills) {
      const opt = document.createElement('option');
      opt.value = s.id;
      opt.textContent = s.name;
      const usedElsewhere = p.skills.some((id, j) => j !== i && id === s.id);
      if (p.skills[i] === s.id) opt.selected = true;
      if (usedElsewhere) opt.disabled = true;
      sel.appendChild(opt);
    }
    sel.addEventListener('change', () => {
      p.skills[i] = sel.value;
      renderShrine();
    });
    row.appendChild(label);
    row.appendChild(sel);
    sk.appendChild(row);
  }
  document.getElementById('shrine-trophies').innerHTML = '<span class="muted">Rift Trophies:</span> ' +
    RIFT_KEYS.map(t => '<span style="color:' + RIFT_TYPES[t].color + '">' + RIFT_TYPES[t].glyph + ' ' + (p.trophies[t] || 0) + '</span>').join(' &nbsp; ');
}

function talentUpgradeInfo(td, rank) {
  const p = game.player;
  const perType = TALENT_COST[rank + 1];
  const gateTypes = TALENT_TIER_GATE[td.tier];
  const distinct = RIFT_KEYS.filter(t => (p.trophies[t] || 0) > 0).length;
  const locked = distinct < gateTypes;
  let affordable = false;
  if (gateTypes <= 1) {
    const total = RIFT_KEYS.reduce((a, t) => a + (p.trophies[t] || 0), 0);
    affordable = total >= perType;
  } else {
    const eligible = RIFT_KEYS.filter(t => (p.trophies[t] || 0) >= perType).length;
    affordable = eligible >= gateTypes;
  }
  return { perType, gateTypes, distinct, locked, affordable };
}

function rankUpTalent(id) {
  const p = game.player;
  const cls = CLASSES[p.classKey];
  const td = cls.talents.find(t => t.id === id);
  const rank = p.talents[id] || 0;
  if (rank >= MAX_TALENT_RANK) return false;
  const up = talentUpgradeInfo(td, rank);
  if (up.locked || !up.affordable) return false;
  if (up.gateTypes <= 1) {
    // tier 1: any trophy types
    let remaining = up.perType;
    for (const t of RIFT_KEYS) {
      while (remaining > 0 && (p.trophies[t] || 0) > 0) { p.trophies[t]--; remaining--; }
    }
  } else {
    // tier 2+: perType trophies from each of gateTypes distinct types
    const eligible = RIFT_KEYS.filter(t => (p.trophies[t] || 0) >= up.perType);
    for (const t of eligible.slice(0, up.gateTypes)) p.trophies[t] -= up.perType;
  }
  p.talents[id] = rank + 1;
  recomputeStats();
  sfx('level');
  toast('Upgraded ' + td.name + ' to rank ' + (rank + 1), 'good');
  return true;
}

/* ===================== Stash UI ===================== */
function renderStash() {
  const p = game.player;
  const sg = document.getElementById('stash-grid');
  sg.innerHTML = '';
  for (const it of p.stash) {
    const cell = el('div', 'cell');
    const img = document.createElement('img');
    img.src = iconSVG(itemIconShape(it), it.slot === 'potion' ? it.color : RARITIES[it.rarity].color);
    cell.appendChild(img);
    if (it.qty > 1) { const q = el('span', '', it.qty); q.style.cssText = 'position:absolute;bottom:1px;right:3px;font-size:11px;color:#fff'; cell.appendChild(q); }
    attachTooltip(cell, it);
    cell.addEventListener('click', () => { if (addToBag(it)) { p.stash.splice(p.stash.indexOf(it), 1); } else toast('Bag is full!', 'bad'); renderStash(); });
    sg.appendChild(cell);
  }
  const bg = document.getElementById('stash-bag');
  bg.innerHTML = '';
  for (const it of p.bag) {
    const cell = el('div', 'cell');
    const img = document.createElement('img');
    img.src = iconSVG(itemIconShape(it), it.slot === 'potion' ? it.color : RARITIES[it.rarity].color);
    cell.appendChild(img);
    if (it.qty > 1) { const q = el('span', '', it.qty); q.style.cssText = 'position:absolute;bottom:1px;right:3px;font-size:11px;color:#fff'; cell.appendChild(q); }
    attachTooltip(cell, it);
    cell.addEventListener('click', () => { if (p.stash.length < 24) { p.bag.splice(p.bag.indexOf(it), 1); p.stash.push(it); } else toast('Stash is full!', 'bad'); renderStash(); });
    bg.appendChild(cell);
  }
}

/* ===================== Rift select UI ===================== */
function renderRiftSelect() {
  const p = game.player;
  const lv = document.getElementById('rift-levels');
  lv.innerHTML = '';
  game.riftSelect = game.riftSelect || { level: 1, type: 'fire' };
  const sel = game.riftSelect;
  for (let i = 1; i <= p.maxRiftLevel; i++) {
    const b = el('button', 'level-btn' + (sel.level === i ? ' selected' : ''), String(i));
    b.addEventListener('click', () => { sel.level = i; renderRiftSelect(); });
    lv.appendChild(b);
  }
  const types = document.getElementById('rift-types');
  types.innerHTML = '';
  for (const t of RIFT_KEYS) {
    const c = el('div', 'rift-type-card' + (sel.type === t ? ' selected' : ''));
    c.innerHTML = '<div class="glyph">' + RIFT_TYPES[t].glyph + '</div><div style="font-family:Cinzel,serif">' + RIFT_TYPES[t].name + '</div><div class="muted" style="font-size:13px">' + RIFT_TYPES[t].monsters.join(', ') + '</div>';
    c.addEventListener('click', () => { sel.type = t; renderRiftSelect(); });
    types.appendChild(c);
  }
}

/* ===================== Toast & banner ===================== */
function toast(msg, kind) {
  const box = document.getElementById('toasts');
  const t = el('div', 'toast ' + (kind || ''), msg);
  box.appendChild(t);
  setTimeout(() => t.remove(), 3000);
  while (box.children.length > 5) box.firstChild.remove();
}
function showBanner(title, sub) {
  document.getElementById('banner-title').textContent = title;
  document.getElementById('banner-sub').textContent = sub;
  document.getElementById('banner').classList.add('open');
}
function hideBanner() { document.getElementById('banner').classList.remove('open'); }

/* ===================== Options / keybindings ===================== */
const KEY_ACTIONS = [
  ['up', 'Move Up'], ['down', 'Move Down'], ['left', 'Move Left'], ['right', 'Move Right'],
  ['skill1', 'Skill 1'], ['skill2', 'Skill 2'], ['skill3', 'Skill 3'], ['skill4', 'Skill 4'],
  ['potion1', 'Health Potion'], ['potion2', 'Mana Potion'], ['potion3', 'Run Potion'],
  ['inventory', 'Inventory'], ['pause', 'Pause'],
];
const DEFAULT_KEYS = { up: 'KeyW', down: 'KeyS', left: 'KeyA', right: 'KeyD', skill1: 'Digit1', skill2: 'Digit2', skill3: 'Digit3', skill4: 'Digit4', potion1: 'KeyQ', potion2: 'KeyE', potion3: 'KeyR', inventory: 'KeyI', pause: 'Escape' };
const POTION_SLOTS = [
  { key: 'potion1', kind: 'health', name: 'Healing Potion', color: '#e05555' },
  { key: 'potion2', kind: 'mana', name: 'Mana Potion', color: '#5588e0' },
  { key: 'potion3', kind: 'run', name: 'Run Time Potion', color: '#55d070' },
];

function renderOptions() {
  document.getElementById('vol-slider').value = game.options.volume;
  document.getElementById('vol-label').textContent = game.options.volume + '%';
  document.getElementById('sound-toggle').checked = game.options.soundEnabled;
}
function renderKeybinds() {
  const list = document.getElementById('keybind-list');
  list.innerHTML = '';
  for (const [action, label] of KEY_ACTIONS) {
    const row = el('div', 'key-row');
    row.appendChild(el('span', 'kname', label));
    const kv = el('span', 'kval', keyDisplay(game.options.keys[action]));
    kv.addEventListener('click', () => listenForKey(action, kv));
    row.appendChild(kv);
    list.appendChild(row);
  }
}
function keyDisplay(code) {
  if (!code) return '—';
  return code.replace('Digit', '').replace('Key', '').replace('Numpad', 'Num ').replace('Arrow', '');
}
let listeningAction = null;
function listenForKey(action, node) {
  if (listeningAction) { document.querySelectorAll('.kval.listening').forEach(n => n.classList.remove('listening')); }
  listeningAction = action;
  node.classList.add('listening');
  node.textContent = 'Press a key…';
}
function handleKeybindPress(code) {
  if (!listeningAction) return false;
  if (code === 'Escape') { listeningAction = null; renderKeybinds(); return true; }
  game.options.keys[listeningAction] = code;
  saveOptions();
  listeningAction = null;
  renderKeybinds();
  return true;
}

/* ===================== Input ===================== */
const keysDown = {};
let mouse = { x: 0, y: 0 };

function updateMouse(e) {
  const r = canvas.getBoundingClientRect();
  mouse.x = (e.clientX - r.left) * (W / r.width);
  mouse.y = (e.clientY - r.top) * (H / r.height);
  game.mouse = mouse;
}

window.addEventListener('keydown', e => {
  if (listeningAction) { e.preventDefault(); handleKeybindPress(e.code); return; }
  keysDown[e.code] = true;
  if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') refreshTooltip(true);
  if (game.state !== 'playing') return;

  const k = game.options.keys;
  if (e.code === k.pause) {
    if (game.overlay) { closeOverlay(); return; }
    togglePause();
    return;
  }
  if (game.overlay) {
    if (e.code === k.inventory) closeOverlay();
    if (e.code === k.pause) closeOverlay();
    return;
  }
  if (game.paused) { if (e.code === k.pause) togglePause(); return; }

  if (e.code === k.inventory) { openOverlay('inventory'); return; }
  if (e.code === k.skill1) castSkill(game.player.skills[0]);
  if (e.code === k.skill2) castSkill(game.player.skills[1]);
  if (e.code === k.skill3) castSkill(game.player.skills[2]);
  if (e.code === k.skill4) castSkill(game.player.skills[3]);
  if (e.code === k.potion1) usePotionKind('health');
  if (e.code === k.potion2) usePotionKind('mana');
  if (e.code === k.potion3) usePotionKind('run');
});
window.addEventListener('keyup', e => { keysDown[e.code] = false; if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') refreshTooltip(true); });
window.addEventListener('blur', () => { for (const k in keysDown) keysDown[k] = false; });

canvas.addEventListener('mousemove', updateMouse);
canvas.addEventListener('mousedown', e => {
  if (e.button !== 0) return;
  audio(); // unlock audio on gesture
  updateMouse(e);
  if (game.state !== 'playing' || game.paused || game.overlay) return;
  const p = game.player;
  if (p.dead) return;
  // pickup loot (any world, so dropped items can be recovered)
  const l = checkLootNear();
  if (l) { pickupLoot(l); return; }
  // interact with town location
  if (game.world === 'town') {
    const loc = checkTownInteraction();
    if (loc) { openTownLocation(loc.id); return; }
  }
  // attack
  game.attacking = true;
  game.attackTimer = 0;
  tryBasicAttack();
});
canvas.addEventListener('mouseup', e => { if (e.button === 0) game.attacking = false; });
canvas.addEventListener('contextmenu', e => e.preventDefault());

function openTownLocation(id) {
  if (id === 'shop') openOverlay('shop');
  else if (id === 'wizard') openOverlay('rift');
  else if (id === 'shrine') openOverlay('shrine');
  else if (id === 'stash') openOverlay('stash');
}

function togglePause() {
  if (game.state !== 'playing') return;
  game.paused = !game.paused;
  if (game.paused) { showScreen('pause-screen'); }
  else { closeAllScreens(); document.getElementById('hud').style.display = 'block'; }
}

/* ===================== Menu / creation wiring ===================== */
function startNewGame() {
  game.state = 'charCreate';
  showScreen('char-screen');
  renderClassCards();
  renderDifficulties();
}

function renderClassCards() {
  const box = document.getElementById('class-cards');
  box.innerHTML = '';
  game.creation = game.creation || { classKey: 'paladin', difficulty: 'normal' };
  for (const ck of CLASS_KEYS) {
    const cls = CLASSES[ck];
    const card = el('div', 'class-card' + (game.creation.classKey === ck ? ' selected' : ''));
    card.innerHTML = '<img src="' + iconSVG(ck === 'paladin' ? 'shield' : ck === 'wizard' ? 'flame' : 'sword', cls.color) + '" style="width:40px;height:40px" /><div class="name">' + cls.name + '</div><div class="desc">' + cls.desc + '</div>';
    card.addEventListener('click', () => { game.creation.classKey = ck; renderClassCards(); });
    box.appendChild(card);
  }
}
function renderDifficulties() {
  const box = document.getElementById('diff-opts');
  box.innerHTML = '';
  for (const dk of Object.keys(DIFFICULTIES)) {
    const d = DIFFICULTIES[dk];
    const b = el('div', 'diff-opt' + (game.creation.difficulty === dk ? ' selected' : ''));
    b.innerHTML = '<div style="font-family:Cinzel,serif">' + d.name + '</div><div class="muted" style="font-size:13px">' + (dk === 'easy' ? 'Fewer waves' : dk === 'hard' ? 'More waves' : 'Standard') + '</div>';
    b.addEventListener('click', () => { game.creation.difficulty = dk; renderDifficulties(); });
    box.appendChild(b);
  }
}

function createCharacter() {
  const name = document.getElementById('inp-name').value.trim() || 'Hero';
  createPlayer(name, game.creation.classKey, game.creation.difficulty);
  game.state = 'playing';
  closeAllScreens();
  document.getElementById('hud').style.display = 'block';
  enterTown();
  saveGame();
  sfx('level');
  toast('Welcome, ' + name + '!', 'good');
}

/* ===================== Main loop ===================== */
let last = performance.now();
function loop(now) {
  let dt = (now - last) / 1000;
  last = now;
  dt = Math.min(dt, 0.05);
  update(dt);
  render();
  requestAnimationFrame(loop);
}

/* ===================== Boot ===================== */
function refreshMenu() {
  const has = loadGame();
  document.getElementById('btn-continue').disabled = !has;
  document.getElementById('menu-save-info').textContent = has
    ? 'Saved: ' + has.name + ' (' + CLASSES[has.classKey].name + ', ' + DIFFICULTIES[has.difficulty].name + ')'
    : 'No save found. Start a new game to begin.';
}

function boot() {
  // menu
  refreshMenu();
  document.getElementById('btn-continue').addEventListener('click', () => {
    const data = loadGame();
    if (!data) return;
    restorePlayer(data);
    game.state = 'playing';
    closeAllScreens();
    document.getElementById('hud').style.display = 'block';
    enterTown();
    toast('Welcome back, ' + data.name + '!', 'good');
  });
  document.getElementById('btn-new').addEventListener('click', startNewGame);
  document.getElementById('btn-options').addEventListener('click', () => { renderOptions(); showScreen('options-screen'); });
  // (options-done is wired once below, handling both menu and pause return paths)
  document.getElementById('btn-keybinds').addEventListener('click', () => { renderKeybinds(); showScreen('keybind-screen'); });
  document.getElementById('btn-keybind-done').addEventListener('click', () => { saveOptions(); showScreen('options-screen'); });
  document.getElementById('btn-keybind-reset').addEventListener('click', () => { game.options.keys = Object.assign({}, DEFAULT_KEYS); saveOptions(); renderKeybinds(); });

  // volume
  document.getElementById('vol-slider').addEventListener('input', e => { game.options.volume = +e.target.value; document.getElementById('vol-label').textContent = e.target.value + '%'; });
  document.getElementById('sound-toggle').addEventListener('change', e => { game.options.soundEnabled = e.target.checked; });

  // character creation
  document.getElementById('btn-create').addEventListener('click', createCharacter);
  document.getElementById('btn-create-back').addEventListener('click', () => { game.state = 'menu'; showScreen('menu-screen'); refreshMenu(); });
  document.getElementById('inp-name').addEventListener('keydown', e => { if (e.key === 'Enter') createCharacter(); });

  // pause
  document.getElementById('btn-resume').addEventListener('click', togglePause);
  document.getElementById('btn-save').addEventListener('click', () => { saveGame(); toast('Game saved', 'good'); });
  document.getElementById('btn-pause-options').addEventListener('click', () => { renderOptions(); showScreen('options-screen'); });
  document.getElementById('btn-mainmenu').addEventListener('click', () => {
    saveGame();
    game.paused = false; game.overlay = null; game.state = 'menu'; game.world = 'town';
    closeAllScreens(); document.getElementById('hud').style.display = 'none';
    refreshMenu(); showScreen('menu-screen');
  });

  // overlays
  document.getElementById('btn-inv-close').addEventListener('click', closeOverlay);
  document.getElementById('btn-shop-close').addEventListener('click', closeOverlay);
  document.getElementById('btn-shrine-close').addEventListener('click', closeOverlay);
  document.getElementById('btn-stash-close').addEventListener('click', closeOverlay);
  document.getElementById('btn-rift-cancel').addEventListener('click', closeOverlay);
  document.getElementById('btn-rift-enter').addEventListener('click', () => {
    const sel = game.riftSelect || { level: 1, type: 'fire' };
    const level = Math.min(sel.level, game.player.maxRiftLevel);
    enterRift(level, sel.type);
  });

  document.getElementById('btn-options-done').addEventListener('click', () => {
    saveOptions();
    if (game.state === 'playing' && game.paused) showScreen('pause-screen');
    else { showScreen('menu-screen'); refreshMenu(); }
  });

  setupDragDrop();
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);
  showScreen('menu-screen');
  requestAnimationFrame(loop);
}

/* Start once DOM is ready (script is at end of body anyway) */
boot();
