/* ==========================================================================
   BUBA DROP — игровая логика.
   Чистый JS, без зависимостей. Прогресс хранится в localStorage.
   ========================================================================== */
(function () {
  "use strict";

  window.__BUBA_VERSION = "2.0";

  const BUBA = window.BUBA;
  const ITEMS = BUBA.ITEMS;
  const ITEMS_BY_ID = BUBA.ITEMS_BY_ID;
  const BY_RARITY = BUBA.BY_RARITY;
  const RARITIES = BUBA.RARITIES;
  const RARITY_ORDER = BUBA.RARITY_ORDER;
  const ACHIEVEMENTS = window.BUBA_ACHIEVEMENTS || [];
  const THEMES = window.BUBA_THEMES || [];
  const ACH_BY_ID = {};
  const THEME_BY_ID = {};
  ACHIEVEMENTS.forEach(function (a) { ACH_BY_ID[a.id] = a; });
  THEMES.forEach(function (t) { THEME_BY_ID[t.id] = t; });

  const SAVE_KEY = "buba-drop-save-v1";
  const MAX_PITY = 25;
  const RECENT_LIMIT = 24;
  const THEME_SIZES = {
    classic: "44px 44px", night: "220px 220px", backrooms: "64px 64px",
    toxic: "240px 240px", traffic: "44px 44px", gold: "160px 160px",
    plantation: "180px 180px", bubafic: "280px 280px", secret: "48px 48px",
    cosmos: "260px 260px", chaos: "28px 28px"
  };

  const $ = function (selector, root) { return (root || document).querySelector(selector); };
  const $$ = function (selector, root) { return Array.prototype.slice.call((root || document).querySelectorAll(selector)); };
  const fmt = new Intl.NumberFormat("ru-RU");
  const dateFmt = new Intl.DateTimeFormat("ru-RU", { day: "2-digit", month: "short", year: "numeric" });
  const dateTimeFmt = new Intl.DateTimeFormat("ru-RU", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
  const timeFmt = new Intl.DateTimeFormat("ru-RU", { hour: "2-digit", minute: "2-digit", second: "2-digit" });

  const els = {};
  let state = defaultState();
  let spinning = false;
  let modalOpen = false;
  let activeAnim = null;
  let skipRequested = false;
  let collectionFilter = "all";
  let collectionSearch = "";
  let collectionOwnedOnly = false;
  let collectionSort = "rarity";
  let achFilter = "all";
  let audioCtx = null;
  let toastTimer = null;

  /* ======================================================================
     СОСТОЯНИЕ
     ====================================================================== */

  function defaultState() {
    const rarity = {};
    RARITY_ORDER.forEach(function (key) { rarity[key] = 0; });
    return {
      version: 1,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      lastVisit: Date.now(),
      stats: {
        spins: 0,
        opens: 0,
        rarity: rarity,
        secrets: 0,
        bestRarityOrder: -1,
        bestDropId: null,
        bestRareStreak: 0,
        currentRareStreak: 0,
        bestCommonStreak: 0,
        currentCommonStreak: 0,
        pity: 0,
        pityTriggers: 0,
        nightSpins: 0,
        firstDropAt: null,
        lastDropAt: null
      },
      inventory: {},
      meta: {},
      unlocked: {},
      recent: [],
      settings: { sound: true, particles: true, reduceMotion: false },
      theme: "classic"
    };
  }

  function totalItemsOf(s) {
    return Object.keys(s.inventory || {}).reduce(function (sum, id) {
      return sum + (Number(s.inventory[id]) || 0);
    }, 0);
  }

  function normalizeState(raw) {
    const s = defaultState();
    if (!raw || typeof raw !== "object") return s;

    s.version = 1;
    s.createdAt = Number(raw.createdAt) || Date.now();
    s.updatedAt = Number(raw.updatedAt) || Date.now();
    s.lastVisit = Number(raw.lastVisit) || Date.now();

    if (raw.stats && typeof raw.stats === "object") {
      ["spins", "opens", "secrets", "bestRarityOrder", "bestRareStreak",
        "currentRareStreak", "bestCommonStreak", "currentCommonStreak", "pity",
        "pityTriggers", "nightSpins", "firstDropAt", "lastDropAt"].forEach(function (key) {
        const value = Number(raw.stats[key]);
        if (Number.isFinite(value)) s.stats[key] = value;
      });
      if (raw.stats.rarity && typeof raw.stats.rarity === "object") {
        RARITY_ORDER.forEach(function (key) {
          const value = Number(raw.stats.rarity[key]);
          if (Number.isFinite(value) && value >= 0) s.stats.rarity[key] = value;
        });
      }
      if (typeof raw.stats.bestDropId === "string" && ITEMS_BY_ID[raw.stats.bestDropId]) {
        s.stats.bestDropId = raw.stats.bestDropId;
      }
    }

    if (raw.inventory && typeof raw.inventory === "object") {
      Object.keys(raw.inventory).forEach(function (id) {
        const count = Math.floor(Number(raw.inventory[id]));
        if (ITEMS_BY_ID[id] && Number.isFinite(count) && count > 0) {
          s.inventory[id] = Math.min(count, 1000000000);
        }
      });
    }

    if (raw.meta && typeof raw.meta === "object") {
      Object.keys(raw.meta).forEach(function (id) {
        const m = raw.meta[id];
        if (!ITEMS_BY_ID[id] || !m || typeof m !== "object") return;
        s.meta[id] = {
          firstAt: Number(m.firstAt) || null,
          lastAt: Number(m.lastAt) || null
        };
      });
    }

    if (raw.unlocked && typeof raw.unlocked === "object") {
      ACHIEVEMENTS.forEach(function (a) {
        if (raw.unlocked[a.id]) {
          const at = Number(raw.unlocked[a.id]);
          s.unlocked[a.id] = at > 0 ? at : Date.now();
        }
      });
    }

    if (Array.isArray(raw.recent)) {
      s.recent = raw.recent.filter(function (entry) {
        return entry && ITEMS_BY_ID[entry.id];
      }).slice(0, RECENT_LIMIT).map(function (entry) {
        return {
          id: entry.id,
          at: Number(entry.at) || Date.now(),
          isNew: !!entry.isNew
        };
      });
    }

    if (raw.settings && typeof raw.settings === "object") {
      s.settings.sound = raw.settings.sound !== false;
      s.settings.particles = raw.settings.particles !== false;
      s.settings.reduceMotion = raw.settings.reduceMotion === true;
    }

    if (typeof raw.theme === "string" && THEME_BY_ID[raw.theme]) {
      s.theme = raw.theme;
    }

    // Пересчитываем то, что можно пересчитать: так сохранение не разъедется.
    const counts = {};
    RARITY_ORDER.forEach(function (key) { counts[key] = 0; });
    Object.keys(s.inventory).forEach(function (id) {
      counts[ITEMS_BY_ID[id].rarity] += s.inventory[id];
    });
    s.stats.rarity = counts;
    s.stats.secrets = counts.secret;
    s.stats.spins = Math.max(s.stats.spins, totalItemsOf(s));
    s.stats.pity = Math.max(0, Math.min(MAX_PITY, Math.round(s.stats.pity)));

    let bestOrder = -1;
    let bestId = null;
    Object.keys(s.inventory).forEach(function (id) {
      const item = ITEMS_BY_ID[id];
      if (item.rarityOrder > bestOrder || (item.rarityOrder === bestOrder && (!bestId || item.chance < ITEMS_BY_ID[bestId].chance))) {
        bestOrder = item.rarityOrder;
        bestId = id;
      }
    });
    s.stats.bestRarityOrder = Math.max(s.stats.bestRarityOrder, bestOrder);
    if (!s.stats.bestDropId && bestId) s.stats.bestDropId = bestId;

    if (!THEME_BY_ID[s.theme] || (THEME_BY_ID[s.theme].unlock && !s.unlocked[THEME_BY_ID[s.theme].unlock])) {
      s.theme = "classic";
    }

    return s;
  }

  function loadState() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return defaultState();
      return normalizeState(JSON.parse(raw));
    } catch (error) {
      console.warn("Не удалось прочитать сохранение:", error);
      return defaultState();
    }
  }

  function save(immediate) {
    state.updatedAt = Date.now();
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(state));
      updateSaveNote();
    } catch (error) {
      console.warn("Не удалось сохранить прогресс:", error);
      if (!save.warned) {
        save.warned = true;
        toast({ icon: "💾", title: "Сохранение не работает", text: "Браузер запретил localStorage. Прогресс проживёт только до перезагрузки." });
      }
    }
    if (immediate) return;
  }

  function updateSaveNote() {
    const note = $("#save-note");
    if (note) note.textContent = "Сохранено: " + timeFmt.format(new Date());
  }

  /* ======================================================================
     ПРОИЗВОДНЫЕ ЗНАЧЕНИЯ
     ====================================================================== */

  function uniqueCount() { return Object.keys(state.inventory).length; }
  function dupeCount() {
    return Object.keys(state.inventory).reduce(function (sum, id) {
      return sum + Math.max(0, state.inventory[id] - 1);
    }, 0);
  }
  function ownedInRarity(key) {
    return BY_RARITY[key].filter(function (item) { return (state.inventory[item.id] || 0) > 0; }).length;
  }
  function totalValue() {
    return ITEMS.reduce(function (sum, item) {
      return sum + (state.inventory[item.id] || 0) * item.value;
    }, 0);
  }
  function achievementXp() {
    return ACHIEVEMENTS.reduce(function (sum, a) {
      return sum + (state.unlocked[a.id] ? a.xp : 0);
    }, 0);
  }
  function totalXp() {
    const itemXp = ITEMS.reduce(function (sum, item) {
      return sum + (state.inventory[item.id] || 0) * item.xp;
    }, 0);
    return itemXp + achievementXp();
  }
  function levelInfo(xp) {
    xp = Math.max(0, xp || 0);
    let level = 1;
    while (level < 250 && xp >= 100 * Math.pow(level, 1.5)) level += 1;
    const base = 100 * Math.pow(level - 1, 1.5);
    const next = 100 * Math.pow(level, 1.5);
    return {
      level: level,
      base: base,
      next: next,
      into: xp - base,
      need: Math.max(1, next - base),
      pct: Math.max(0, Math.min(100, ((xp - base) / Math.max(1, next - base)) * 100))
    };
  }
  function rankFor(level) {
    if (level <= 2) return "Новичок";
    if (level <= 4) return "Любитель кейсов";
    if (level <= 7) return "Крутильщик";
    if (level <= 11) return "Буба-фанат";
    if (level <= 16) return "Коллекционер";
    if (level <= 22) return "Буба-магнат";
    if (level <= 29) return "Легенда кейсов";
    return "Сам Буба";
  }
  function unlockedThemesCount() {
    return THEMES.filter(themeUnlocked).length;
  }
  function unlockedAchCount() {
    return ACHIEVEMENTS.filter(function (a) { return !!state.unlocked[a.id]; }).length;
  }
  function themeUnlocked(theme) {
    return !theme.unlock || !!state.unlocked[theme.unlock];
  }
  function achHelpers() {
    return {
      unique: uniqueCount,
      dupes: dupeCount,
      owned: ownedInRarity,
      themeCount: unlockedThemesCount
    };
  }

  /* ======================================================================
     ФОРМАТ
     ====================================================================== */

  function esc(value) {
    return String(value).replace(/[&<>"']/g, function (ch) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch];
    });
  }
  function nf(value) { return fmt.format(Math.round(value || 0)); }
  function compact(value) {
    const n = Math.round(value || 0);
    if (n >= 1000000000) return (n / 1000000000).toFixed(n >= 10000000000 ? 0 : 1).replace(".", ",") + " млрд";
    if (n >= 1000000) return (n / 1000000).toFixed(n >= 10000000 ? 0 : 1).replace(".", ",") + " млн";
    if (n >= 10000) return (n / 1000).toFixed(n >= 100000 ? 0 : 1).replace(".", ",") + " тыс.";
    return nf(n);
  }
  function fmtChance(chance) {
    let text;
    if (chance >= 10) text = chance.toFixed(2);
    else if (chance >= 1) text = chance.toFixed(2);
    else if (chance >= 0.1) text = chance.toFixed(3);
    else text = chance.toFixed(4);
    text = text.replace(/0+$/, "").replace(/\.$/, "").replace(".", ",");
    return text + "%";
  }
  function itemCount(id) { return state.inventory[id] || 0; }
  function itemGlow(item) { return RARITIES[item.rarity].glow; }
  function styleVars(item) {
    const r = RARITIES[item.rarity];
    return "--rc:" + r.color + ";--rc2:" + r.color2 + ";";
  }
  function isNight() { const h = new Date().getHours(); return h >= 0 && h < 5; }

  /* ======================================================================
     ТЕМЫ
     ====================================================================== */

  function applyTheme(id, announce) {
    let theme = THEME_BY_ID[id] || THEMES[0];
    if (!theme || !themeUnlocked(theme)) theme = THEMES[0];
    state.theme = theme.id;

    document.documentElement.dataset.theme = theme.id;
    document.body.dataset.theme = theme.id;
    Object.keys(theme.vars).forEach(function (key) {
      document.documentElement.style.setProperty(key, theme.vars[key]);
    });

    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", theme.vars["--bg"] || "#070a12");

    if (announce) {
      toast({ icon: "🎨", title: "Тема: " + theme.name, text: "Оформление применено и сохранено." });
    }
    renderThemes();
    save();
  }

  /* ======================================================================
     ЗВУК
     ====================================================================== */

  function ensureAudio() {
    if (!state.settings.sound) return null;
    try {
      if (!audioCtx) {
        const Ctx = window.AudioContext || window.webkitAudioContext;
        if (!Ctx) return null;
        audioCtx = new Ctx();
      }
      if (audioCtx.state === "suspended") audioCtx.resume();
      return audioCtx;
    } catch (error) {
      return null;
    }
  }

  function tone(freq, duration, type, gain, when, endFreq) {
    const ctx = ensureAudio();
    if (!ctx) return;
    try {
      const t = ctx.currentTime + (when || 0);
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = type || "sine";
      osc.frequency.setValueAtTime(freq, t);
      if (endFreq) osc.frequency.exponentialRampToValueAtTime(Math.max(20, endFreq), t + duration);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(Math.max(0.0002, gain || 0.04), t + 0.012);
      g.gain.exponentialRampToValueAtTime(0.0001, t + duration);
      osc.connect(g);
      g.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + duration + 0.03);
    } catch (error) { /* звук — не повод падать */ }
  }

  function playClick() { tone(280, 0.07, "triangle", 0.035); }
  function playTick() { tone(1500, 0.018, "square", 0.012); }
  function playReveal(order) {
    const chords = [
      [196, 261.63],
      [261.63, 329.63, 392],
      [329.63, 415.3, 493.88],
      [392, 493.88, 587.33, 783.99],
      [523.25, 659.25, 783.99, 1046.5],
      [440, 554.37, 659.25, 880],
      [466.16, 587.33, 698.46, 932.33],
      [523.25, 659.25, 783.99, 1046.5, 1318.51]
    ];
    const notes = chords[Math.max(0, Math.min(chords.length - 1, order || 0))];
    notes.forEach(function (freq, i) {
      tone(freq, 0.55 + i * 0.06, i === 0 ? "triangle" : "sine", 0.035, i * 0.075);
    });
  }
  function playAchievement() {
    [659.25, 783.99, 1046.5, 1318.51].forEach(function (freq, i) {
      tone(freq, 0.28, "triangle", 0.028, i * 0.08);
    });
  }

  /* ======================================================================
     ЧАСТИЦЫ
     ====================================================================== */

  const fx = { canvas: null, ctx: null, particles: [], raf: null, dpr: 1, w: 0, h: 0 };

  function initFx() {
    fx.canvas = $("#fx");
    if (!fx.canvas) return;
    fx.ctx = fx.canvas.getContext("2d");
    resizeFx();
    window.addEventListener("resize", resizeFx);
  }

  function resizeFx() {
    if (!fx.canvas) return;
    fx.dpr = Math.min(2, window.devicePixelRatio || 1);
    fx.w = window.innerWidth;
    fx.h = window.innerHeight;
    fx.canvas.width = Math.round(fx.w * fx.dpr);
    fx.canvas.height = Math.round(fx.h * fx.dpr);
    fx.ctx.setTransform(fx.dpr, 0, 0, fx.dpr, 0, 0);
  }

  function burst(origin, colors, count, power) {
    if (!state.settings.particles || state.settings.reduceMotion || !fx.ctx) return;
    const rect = origin && origin.getBoundingClientRect ? origin.getBoundingClientRect() : null;
    const x = rect ? rect.left + rect.width / 2 : fx.w / 2;
    const y = rect ? rect.top + rect.height / 2 : fx.h * 0.38;
    const palette = (colors && colors.length ? colors : ["#c8ff3d", "#45d6ff", "#ff5fa2", "#fff"]).filter(Boolean);
    const total = Math.min(180, count || 80);
    for (let i = 0; i < total; i += 1) {
      const angle = Math.random() * Math.PI * 2;
      const speed = (1.5 + Math.random() * 7) * (power || 1);
      fx.particles.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 2.4,
        g: 0.075 + Math.random() * 0.07,
        drag: 0.988,
        size: 2 + Math.random() * 5,
        color: palette[Math.floor(Math.random() * palette.length)],
        rot: Math.random() * Math.PI,
        vr: (Math.random() - 0.5) * 0.28,
        life: 0,
        max: 60 + Math.random() * 55,
        shape: Math.random() < 0.28 ? "circle" : "rect"
      });
    }
    if (fx.particles.length > 420) fx.particles.splice(0, fx.particles.length - 420);
    if (!fx.raf) fx.raf = requestAnimationFrame(tickFx);
  }

  function tickFx() {
    if (!fx.ctx) return;
    fx.ctx.clearRect(0, 0, fx.w, fx.h);
    const alive = [];
    for (let i = 0; i < fx.particles.length; i += 1) {
      const p = fx.particles[i];
      p.life += 1;
      if (p.life > p.max) continue;
      p.vy += p.g;
      p.vx *= p.drag;
      p.vy *= p.drag;
      p.x += p.vx;
      p.y += p.vy;
      p.rot += p.vr;
      const alpha = Math.max(0, 1 - p.life / p.max);
      fx.ctx.save();
      fx.ctx.globalAlpha = alpha;
      fx.ctx.translate(p.x, p.y);
      fx.ctx.rotate(p.rot);
      fx.ctx.fillStyle = p.color;
      if (p.shape === "circle") {
        fx.ctx.beginPath();
        fx.ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
        fx.ctx.fill();
      } else {
        fx.ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
      }
      fx.ctx.restore();
      alive.push(p);
    }
    fx.particles = alive;
    if (alive.length) {
      fx.raf = requestAnimationFrame(tickFx);
    } else {
      fx.raf = null;
      fx.ctx.clearRect(0, 0, fx.w, fx.h);
    }
  }

  /* ======================================================================
     ГАЧА
     ====================================================================== */

  function pickRarity() {
    let roll = Math.random() * 100;
    for (let i = 0; i < RARITY_ORDER.length; i += 1) {
      const key = RARITY_ORDER[i];
      roll -= RARITIES[key].chance;
      if (roll < 0) return key;
    }
    return "common";
  }

  function pickRarityFrom(keys) {
    const total = keys.reduce(function (sum, key) { return sum + RARITIES[key].chance; }, 0);
    let roll = Math.random() * total;
    for (let i = 0; i < keys.length; i += 1) {
      roll -= RARITIES[keys[i]].chance;
      if (roll < 0) return keys[i];
    }
    return keys[keys.length - 1];
  }

  function pickItem(rarityKey) {
    const pool = BY_RARITY[rarityKey];
    let total = 0;
    pool.forEach(function (item) { total += item.weight; });
    let roll = Math.random() * total;
    for (let i = 0; i < pool.length; i += 1) {
      roll -= pool[i].weight;
      if (roll < 0) return pool[i];
    }
    return pool[pool.length - 1];
  }

  function rollItem(ctx) {
    let pityTriggered = false;
    let rarity;
    if (ctx.pity >= MAX_PITY) {
      rarity = pickRarityFrom(["epic", "legendary", "bubafic", "mythic", "secret"]);
      pityTriggered = true;
      ctx.triggers += 1;
    } else {
      rarity = pickRarity();
    }
    const item = pickItem(rarity);
    if (RARITIES[rarity].order >= 3) ctx.pity = 0;
    else ctx.pity += 1;
    return { item: item, pityTriggered: pityTriggered };
  }

  function randomReelItem() {
    return pickItem(pickRarity());
  }

  /* ======================================================================
     СОХРАНЕНИЕ ДРОПОВ
     ====================================================================== */

  function commitDrops(rolled, openType, ctx) {
    const now = Date.now();
    const night = isNight();
    const entries = [];

    rolled.forEach(function (roll) {
      const item = roll.item || roll;
      const previous = state.inventory[item.id] || 0;
      const isNew = previous === 0;
      state.inventory[item.id] = previous + 1;

      if (!state.meta[item.id]) state.meta[item.id] = { firstAt: now, lastAt: now };
      else state.meta[item.id].lastAt = now;
      if (isNew) state.meta[item.id].firstAt = now;

      state.stats.spins += 1;
      state.stats.rarity[item.rarity] += 1;
      if (item.rarity === "secret") state.stats.secrets += 1;
      if (night) state.stats.nightSpins += 1;
      state.stats.lastDropAt = now;
      if (!state.stats.firstDropAt) state.stats.firstDropAt = now;

      const order = RARITIES[item.rarity].order;
      if (order >= 2) {
        state.stats.currentRareStreak += 1;
        state.stats.bestRareStreak = Math.max(state.stats.bestRareStreak, state.stats.currentRareStreak);
      } else {
        state.stats.currentRareStreak = 0;
      }
      if (item.rarity === "common") {
        state.stats.currentCommonStreak += 1;
        state.stats.bestCommonStreak = Math.max(state.stats.bestCommonStreak, state.stats.currentCommonStreak);
      } else {
        state.stats.currentCommonStreak = 0;
      }

      if (order > state.stats.bestRarityOrder) {
        state.stats.bestRarityOrder = order;
        state.stats.bestDropId = item.id;
      } else if (order === state.stats.bestRarityOrder && state.stats.bestDropId) {
        const best = ITEMS_BY_ID[state.stats.bestDropId];
        if (best && item.chance < best.chance) state.stats.bestDropId = item.id;
      }

      state.recent.unshift({ id: item.id, at: now, isNew: isNew });
      entries.push({ item: item, isNew: isNew, count: state.inventory[item.id], at: now });
    });

    if (state.recent.length > RECENT_LIMIT) state.recent.length = RECENT_LIMIT;

    state.stats.opens += 1;
    state.stats.pity = Math.max(0, Math.min(MAX_PITY, ctx.pity));
    state.stats.pityTriggers += ctx.triggers || 0;

    const newAchievements = checkAchievements();
    save();
    renderAll();

    if (ctx.triggers > 0) {
      toast({
        icon: "🛡️",
        title: "Гарант сработал",
        text: "25 прокруток без эпика — и вот тебе эпик или лучше. Мы держим слово."
      });
    }

    if (newAchievements.length) {
      newAchievements.forEach(function (a, i) {
        setTimeout(function () { showAchievementToast(a); }, 450 + i * 520);
      });
    }

    return {
      entries: entries,
      newAchievements: newAchievements,
      previousUnique: uniqueCount() - entries.filter(function (e) { return e.isNew; }).length,
      bestOrder: entries.reduce(function (max, e) { return Math.max(max, RARITIES[e.item.rarity].order); }, 0)
    };
  }

  /* ======================================================================
     ДОСТИЖЕНИЯ
     ====================================================================== */

  function checkAchievements() {
    const helpers = achHelpers();
    const unlockedNow = [];
    let changed = true;
    let guard = 0;

    while (changed && guard < 8) {
      changed = false;
      guard += 1;
      ACHIEVEMENTS.forEach(function (a) {
        if (state.unlocked[a.id]) return;
        let progress;
        try {
          progress = a.progress(state, helpers);
        } catch (error) {
          progress = [0, 1];
        }
        if (progress && progress[0] >= progress[1]) {
          state.unlocked[a.id] = Date.now();
          unlockedNow.push(a);
          changed = true;
        }
      });
    }
    return unlockedNow;
  }

  function showAchievementToast(a) {
    playAchievement();
    const theme = a.theme ? THEME_BY_ID[a.theme] : null;
    toast({
      icon: a.icon,
      title: "Достижение: " + a.name,
      text: "+" + a.xp + " XP" + (theme ? " · открыта тема «" + theme.name + "»" : ""),
      type: "ach",
      duration: 5600
    });
    if (theme) {
      setTimeout(function () {
        toast({ icon: "🎨", title: "Новая тема", text: "«" + theme.name + "» доступна во вкладке «Темы»." });
      }, 700);
    }
    const activeView = currentView();
    if (activeView === "achievements" || activeView === "stats" || activeView === "themes") {
      renderAchievements();
      renderStats();
      renderThemes();
    }
    renderHud();
  }

  /* ======================================================================
     РЕНДЕР
     ====================================================================== */

  function renderAll() {
    renderHud();
    renderRecent();
    renderProgressTiles();
    renderCollection();
    renderAchievements();
    renderStats();
    renderThemes();
    renderPity();
    renderSpinCount();
    renderCollectionProgress();
  }

  function renderHud() {
    if (!els.hudCoins) return;
    els.hudCoins.textContent = compact(totalValue());
    const info = levelInfo(totalXp());
    els.hudLevel.textContent = info.level;
    const levelStat = $(".hud__stat--level");
    if (levelStat) levelStat.title = "Уровень " + info.level + " · " + rankFor(info.level) + " · " + nf(info.into) + " / " + nf(info.need) + " XP";
  }

  function renderPity() {
    if (!els.pityLabel) return;
    const value = state.stats.pity;
    els.pityLabel.textContent = value + " / " + MAX_PITY;
    els.pityBar.style.width = Math.min(100, (value / MAX_PITY) * 100) + "%";
    if (els.pityHint) els.pityHint.textContent = value >= MAX_PITY ? "Гарант готов: следующий дроп — эпик+" : "Гарант эпика: " + value + "/" + MAX_PITY;
  }

  function renderSpinCount() {
    if (els.spinCountLabel) els.spinCountLabel.textContent = "Прокруток: " + nf(state.stats.spins);
  }

  function renderRecent() {
    if (!els.recentList) return;
    if (!state.recent.length) {
      els.recentList.innerHTML = '<div class="recent-empty"><b>Пока пусто</b><span>Первый дроп появится здесь.</span></div>';
      if (els.recentCount) els.recentCount.textContent = "0";
      return;
    }
    if (els.recentCount) els.recentCount.textContent = state.recent.length + " / " + RECENT_LIMIT;
    els.recentList.innerHTML = state.recent.slice(0, 8).map(function (entry) {
      const item = ITEMS_BY_ID[entry.id];
      const r = RARITIES[item.rarity];
      return '<div class="recent-item" style="' + styleVars(item) + '">' +
        '<div class="recent-item__img"><img src="' + item.img + '" alt="" loading="lazy"></div>' +
        '<div class="recent-item__copy"><b>' + esc(item.name) + "</b><span>" + r.label + "</span></div>" +
        "</div>";
    }).join("");
  }

  function renderProgressTiles() {
    if (!els.progressTiles) return;
    const unique = uniqueCount();
    const ach = unlockedAchCount();
    const themes = unlockedThemesCount();
    const spins = state.stats.spins;
    const tiles = [
      { label: "Уникальных предметов", value: unique + " / " + ITEMS.length, bar: (unique / ITEMS.length) * 100, extra: "повторок: " + dupeCount() },
      { label: "Достижений", value: ach + " / " + ACHIEVEMENTS.length, bar: (ach / ACHIEVEMENTS.length) * 100, extra: "тем: " + themes + " / " + THEMES.length },
      { label: "Прокруток", value: nf(spins), bar: Math.min(100, (spins / 1000) * 100), extra: "открытий кейса: " + nf(state.stats.opens) }
    ];
    els.progressTiles.innerHTML = tiles.map(function (tile) {
      return '<div class="progress-tile"><span>' + tile.label + "</span><b>" + tile.value + '</b><div class="bar"><i style="width:' + Math.min(100, tile.bar) + '%"></i></div><span style="font-size:9px;opacity:.65">' + tile.extra + "</span></div>";
    }).join("");
  }

  function renderCollectionProgress() {
    if (!els.rarityProgress) return;
    const unique = uniqueCount();
    els.rarityProgress.innerHTML = RARITY_ORDER.map(function (key) {
      const r = RARITIES[key];
      const pool = BY_RARITY[key];
      const owned = ownedInRarity(key);
      return '<div class="rarity-mini" style="--rc:' + r.color + '">' +
        '<div class="rarity-mini__top"><i></i>' + r.name + "</div>" +
        "<b>" + owned + " / " + pool.length + "</b>" +
        '<div class="bar"><i style="width:' + ((owned / pool.length) * 100) + '%"></i></div>' +
        "</div>";
    }).join("");
    if (els.collectionCount) els.collectionCount.textContent = unique + " / " + ITEMS.length;
    if (els.collectionRing) {
      const pct = Math.round((unique / ITEMS.length) * 100);
      els.collectionRing.style.setProperty("--p", pct);
      if (els.collectionRingLabel) els.collectionRingLabel.textContent = pct + "%";
    }
  }

  function renderRates() {
    if (!els.ratesList) return;
    els.ratesList.innerHTML = RARITY_ORDER.map(function (key) {
      const r = RARITIES[key];
      return '<div class="rate-row" style="--rc:' + r.color + '">' +
        '<i class="rate-dot"></i>' +
        '<span class="rate-row__name">' + r.name + "</span>" +
        '<span class="rate-row__pct">' + fmtChance(r.chance) + "</span>" +
        '<div class="rate-row__bar"><i style="width:' + Math.min(100, (r.chance / 42) * 100) + '%"></i></div>' +
        "</div>";
    }).join("");
  }

  function renderCollection() {
    if (!els.collectionGrid) return;
    const query = collectionSearch.trim().toLowerCase();
    let list = ITEMS.filter(function (item) {
      if (collectionFilter !== "all" && item.rarity !== collectionFilter) return false;
      if (collectionOwnedOnly && !itemCount(item.id)) return false;
      if (query && item.name.toLowerCase().indexOf(query) === -1 && item.desc.toLowerCase().indexOf(query) === -1) return false;
      return true;
    });

    const orderMap = { common: 0, uncommon: 1, rare: 2, epic: 3, legendary: 4, bubafic: 5, mythic: 6, secret: 7 };
    list.sort(function (a, b) {
      if (collectionSort === "name") return a.name.localeCompare(b.name, "ru");
      if (collectionSort === "count") return (itemCount(b.id) - itemCount(a.id)) || (orderMap[b.rarity] - orderMap[a.rarity]) || (a.num - b.num);
      if (collectionSort === "chance") return (a.chance - b.chance) || (b.rarityOrder - a.rarityOrder);
      if (collectionSort === "num") return a.num - b.num;
      return (b.rarityOrder - a.rarityOrder) || (a.num - b.num);
    });

    const frag = document.createDocumentFragment();
    list.forEach(function (item) {
      const count = itemCount(item.id);
      const owned = count > 0;
      const r = RARITIES[item.rarity];
      const card = document.createElement(owned ? "button" : "div");
      if (owned) {
        card.type = "button";
        card.dataset.item = item.id;
      } else {
        card.setAttribute("aria-disabled", "true");
      }
      card.className = "item-card" + (owned ? "" : " is-locked");
      card.style.cssText = styleVars(item);
      card.setAttribute("aria-label", (owned ? "" : "Закрытый предмет: ") + item.name + ", " + r.name);
      card.innerHTML =
        '<div class="item-card__img' + (owned ? "" : " item-card__img--locked") + '">' +
        (owned
          ? '<img src="' + item.img + '" alt="' + esc(item.name) + '" loading="lazy" decoding="async">' +
            '<span class="item-card__count">×' + nf(count) + "</span>" +
            (item.bonus ? '<span class="item-card__bonus">бонус</span>' : "")
          : '<div class="item-card__mystery"><span>?</span><b>Не выбит</b></div>') +
        "</div>" +
        '<div class="item-card__rarity">' + r.label + "</div>" +
        '<div class="item-card__name">' + esc(item.name) + "</div>" +
        '<div class="item-card__foot">' +
        (owned ? "<span>Шанс <b>" + fmtChance(item.chance) + "</b></span>" : "<span>Шанс <b>???</b></span>") +
        "<span>#" + item.num + "</span></div>";
      frag.appendChild(card);
    });
    els.collectionGrid.innerHTML = "";
    els.collectionGrid.appendChild(frag);
    if (els.collectionEmpty) els.collectionEmpty.hidden = list.length > 0;
  }

  function renderAchievements() {
    if (!els.achGrid) return;
    const unlocked = unlockedAchCount();
    const pct = Math.round((unlocked / ACHIEVEMENTS.length) * 100);
    if (els.achCount) els.achCount.textContent = unlocked;
    if (els.achPercent) els.achPercent.textContent = pct + "%";
    if (els.achBar) els.achBar.style.width = pct + "%";
    if (els.achXpEarned) els.achXpEarned.textContent = nf(achievementXp()) + " XP получено";
    if (els.achThemesEarned) els.achThemesEarned.textContent = unlockedThemesCount() + " тем открыто";

    const helpers = achHelpers();
    let list = ACHIEVEMENTS.filter(function (a) {
      if (achFilter === "unlocked") return !!state.unlocked[a.id];
      if (achFilter === "locked") return !state.unlocked[a.id];
      return true;
    });
    if (els.achHint) els.achHint.textContent = "Показано " + list.length + " из " + ACHIEVEMENTS.length;

    els.achGrid.innerHTML = list.map(function (a) {
      const isUnlocked = !!state.unlocked[a.id];
      let progress = [0, 1];
      try { progress = a.progress(state, helpers); } catch (error) { /* ignore */ }
      const cur = Math.min(progress[0], progress[1]);
      const target = progress[1];
      const percent = Math.min(100, (cur / Math.max(1, target)) * 100);
      const theme = a.theme ? THEME_BY_ID[a.theme] : null;
      return '<article class="ach-card ' + (isUnlocked ? "is-unlocked" : "is-locked") + '">' +
        '<div class="ach-icon">' + a.icon + "</div>" +
        '<div class="ach-body">' +
        "<h3>" + esc(a.name) + "</h3>" +
        "<p>" + esc(a.desc) + "</p>" +
        '<div class="ach-meta">' +
        '<span class="ach-xp">+' + nf(a.xp) + " XP</span>" +
        (theme ? '<span class="ach-theme">🎨 ' + esc(theme.name) + "</span>" : "") +
        (isUnlocked ? '<span class="ach-date">' + dateFmt.format(new Date(state.unlocked[a.id])) + "</span>" : "") +
        "</div>" +
        '<div class="ach-progress-bar"><div class="bar"><i style="width:' + percent + '%"></i></div><span>' + nf(cur) + " / " + nf(target) + "</span></div>" +
        "</div>" +
        "</article>";
    }).join("");

    if (els.achGrid.children.length === 0) {
      els.achGrid.innerHTML = '<div class="empty" style="grid-column:1/-1"><span>🏆</span><b>Тут пока пусто</b><p>Измени фильтр — достижения никуда не убежали.</p></div>';
    }
  }

  function renderStats() {
    if (!els.statsGrid) return;
    const unique = uniqueCount();
    const dupes = dupeCount();
    const value = totalValue();
    const xp = totalXp();
    const info = levelInfo(xp);
    const ach = unlockedAchCount();
    const themes = unlockedThemesCount();
    const best = state.stats.bestDropId ? ITEMS_BY_ID[state.stats.bestDropId] : null;
    const bestR = best ? RARITIES[best.rarity] : null;

    if (els.statsLevel) els.statsLevel.textContent = info.level;
    if (els.statsRank) els.statsRank.textContent = rankFor(info.level) + " · ур. " + info.level;
    if (els.statsXp) els.statsXp.textContent = nf(info.into) + " / " + nf(info.need) + " XP";

    const tiles = [
      { value: nf(state.stats.spins), label: "Прокруток всего", extra: "открытий кейса: " + nf(state.stats.opens), color: "var(--glow)" },
      { value: unique + " / " + ITEMS.length, label: "Уникальных предметов", extra: "повторок: " + nf(dupes), color: "var(--glow-2)" },
      { value: compact(value), label: "Буба-коинов", extra: "стоимость коллекции", color: "rgba(255,176,32,.22)" },
      { value: info.level, label: "Уровень", extra: rankFor(info.level), color: "var(--glow)" },
      { value: ach + " / " + ACHIEVEMENTS.length, label: "Достижений", extra: Math.round((ach / ACHIEVEMENTS.length) * 100) + "% пути", color: "rgba(255,95,162,.22)" },
      { value: themes + " / " + THEMES.length, label: "Тем открыто", extra: "оформлений", color: "rgba(69,214,255,.22)" },
      { value: state.stats.rarity.secret, label: "Секреток выбито", extra: "из " + BY_RARITY.secret.length + " возможных", color: "rgba(125,249,255,.22)" },
      { value: best ? bestR.label : "—", label: "Лучший дроп", extra: best ? best.name : "пока ничего", color: bestR ? bestR.glow : "var(--glow)" }
    ];
    els.statsGrid.innerHTML = tiles.map(function (tile) {
      return '<div class="stat-tile" style="--tile-glow:' + tile.color + '"><b>' + esc(tile.value) + "</b><span>" + tile.label + "</span><em>" + esc(tile.extra) + "</em></div>";
    }).join("");

    if (els.statsRarities) {
      const maxCount = Math.max(1, RARITY_ORDER.reduce(function (max, key) { return Math.max(max, state.stats.rarity[key] || 0); }, 0));
      els.statsRarities.innerHTML = RARITY_ORDER.map(function (key) {
        const r = RARITIES[key];
        const count = state.stats.rarity[key] || 0;
        const owned = ownedInRarity(key);
        const pool = BY_RARITY[key];
        return '<div class="stat-rarity" style="--rc:' + r.color + '">' +
          '<div class="stat-rarity__name"><i></i>' + r.name + "</div>" +
          "<b>" + nf(count) + " <small>шт · " + owned + "/" + pool.length + "</small></b>" +
          '<div class="bar"><i style="width:' + Math.min(100, (count / maxCount) * 100) + '%"></i></div>' +
          "</div>";
      }).join("");
    }

    if (els.statsRecords) {
      const records = [
        ["Лучший дроп", best ? best.name + " (" + bestR.label + ")" : "—"],
        ["Лучшая серия редких+", state.stats.bestRareStreak + " подряд"],
        ["Худшая серия обычных", state.stats.bestCommonStreak + " подряд"],
        ["Гарантов сработало", nf(state.stats.pityTriggers)],
        ["Ночных прокруток", nf(state.stats.nightSpins)],
        ["Всего предметов", nf(totalItemsOf(state))],
        ["Повторок", nf(dupes)]
      ];
      els.statsRecords.innerHTML = records.map(function (rec, i) {
        return '<div class="record"><span>' + rec[0] + '</span><b class="' + (i === 0 ? "is-accent" : "") + '">' + esc(rec[1]) + "</b></div>";
      }).join("");
    }

    if (els.statsTimeline) {
      const days = Math.max(1, Math.ceil((Date.now() - state.createdAt) / 86400000));
      const timeline = [
        ["Аккаунт создан", dateFmt.format(new Date(state.createdAt))],
        ["Последний дроп", state.stats.lastDropAt ? dateTimeFmt.format(new Date(state.stats.lastDropAt)) : "—"],
        ["Дней в игре", days],
        ["Сессия", "localStorage"]
      ];
      els.statsTimeline.innerHTML = timeline.map(function (row) {
        return '<div class="timeline-item"><span>' + row[0] + "</span><b>" + row[1] + "</b></div>";
      }).join("");
    }
  }

  function renderThemes() {
    if (!els.themesGrid) return;
    const unlocked = unlockedThemesCount();
    if (els.themeCount) els.themeCount.textContent = unlocked;
    els.themesGrid.innerHTML = THEMES.map(function (theme) {
      const isUnlocked = themeUnlocked(theme);
      const isActive = state.theme === theme.id;
      const ach = theme.unlock ? ACH_BY_ID[theme.unlock] : null;
      const size = THEME_SIZES[theme.id] || "44px 44px";
      const style = [
        "--pv-bg:" + theme.vars["--bg"],
        "--pv-accent:" + theme.vars["--accent"],
        "--pv-accent2:" + theme.vars["--accent-2"],
        "--pv-text:" + theme.vars["--text"],
        "--pv-muted:" + theme.vars["--muted"],
        "--pv-ink:" + theme.vars["--accent-ink"],
        "--pv-glow:" + theme.vars["--glow"],
        "--pv-pattern:" + theme.vars["--pattern"],
        "--pv-size:" + size
      ].join(";");
      return '<button type="button" class="theme-card ' + (isActive ? "is-active" : "") + (isUnlocked ? "" : " is-locked") + '" data-theme-id="' + theme.id + '" style="' + style + '" aria-pressed="' + isActive + '">' +
        '<div class="theme-preview">' +
        '<div class="theme-preview__top"><i></i><i></i><i></i></div>' +
        '<div class="theme-preview__box">Б</div>' +
        '<div class="theme-preview__lines"><i></i><i></i><i></i></div>' +
        '<span class="theme-preview__pill">BUBA DROP</span>' +
        (isUnlocked ? "" : '<div class="theme-preview__lock">🔒</div>') +
        "</div>" +
        '<div class="theme-card__body"><h3>' + esc(theme.name) + "</h3><p>" + esc(theme.desc) + "</p>" +
        '<div class="theme-card__foot"><span class="theme-tag">' + (isActive ? "Активна" : isUnlocked ? "Открыта" : "Закрыта") + "</span>" +
        (isActive ? '<span class="theme-active-badge">● СЕЙЧАС</span>' : isUnlocked ? '<span class="theme-active-badge">ВЫБРАТЬ →</span>' : '<span class="theme-unlock">' + (ach ? "🏆 " + esc(ach.name) : "") + "</span>") +
        "</div></div></button>";
    }).join("");
  }

  /* ======================================================================
     РУЛЕТКА
     ====================================================================== */

  function reelCardHtml(item) {
    const r = RARITIES[item.rarity];
    return '<div class="reel-card" style="' + styleVars(item) + '">' +
      '<div class="reel-card__img"><img src="' + item.img + '" alt="" decoding="async"></div>' +
      '<div class="reel-card__name">' + esc(item.name) + "</div>" +
      '<div class="reel-card__rarity">' + r.label + "</div>" +
      "</div>";
  }

  function buildIdleReel() {
    if (!els.reel) return;
    const cards = [];
    for (let i = 0; i < 22; i += 1) cards.push(reelCardHtml(randomReelItem()));
    els.reel.innerHTML = cards.join("");
    els.reel.style.transform = "translate3d(0,0,0)";
  }

  function buildSpinReel(winner) {
    const total = 46;
    const winnerIndex = 38;
    const cards = [];
    for (let i = 0; i < total; i += 1) {
      cards.push(reelCardHtml(i === winnerIndex ? winner : randomReelItem()));
    }
    els.reel.innerHTML = cards.join("");
    els.reel.style.transform = "translate3d(0,0,0)";
    // Принудительный reflow, чтобы следующий transform анимировался с нуля.
    void els.reel.offsetWidth;
    return { winnerCard: els.reel.children[winnerIndex], winnerIndex: winnerIndex };
  }

  function animateReel(target, duration) {
    return new Promise(function (resolve) {
      const from = "translate3d(0,0,0)";
      const to = "translate3d(" + target + "px,0,0)";
      let finished = false;
      const finish = function () {
        if (finished) return;
        finished = true;
        activeAnim = null;
        els.reel.style.transform = to;
        try { animation.cancel(); } catch (error) { /* ignore */ }
        resolve();
      };
      const animation = els.reel.animate(
        [{ transform: from }, { transform: to }],
        { duration: duration, easing: "cubic-bezier(.08,.72,.08,1)", fill: "forwards" }
      );
      activeAnim = animation;
      animation.onfinish = finish;
      setTimeout(finish, duration + 500);
      startTickLoop(duration);
    });
  }

  function startTickLoop(duration) {
    const viewport = els.reelViewport;
    const track = els.reel;
    if (!viewport || !track || !track.children.length) return;
    const first = track.children[0];
    const step = first.getBoundingClientRect().width + (parseFloat(getComputedStyle(track).gap) || 10);
    const center = viewport.clientWidth / 2;
    let lastIndex = -1;
    let lastTick = 0;
    const started = performance.now();

    const frame = function () {
      if (!activeAnim) return;
      if (performance.now() - started > duration + 400) return;
      const style = getComputedStyle(track).transform;
      let x = 0;
      try {
        if (style && style !== "none") x = new DOMMatrixReadOnly(style).m41;
      } catch (error) { x = 0; }
      const index = Math.floor((center - x) / step);
      if (index !== lastIndex && index >= 0 && index < track.children.length) {
        const now = performance.now();
        if (lastIndex !== -1 && now - lastTick > 28) {
          playTick();
          lastTick = now;
        }
        lastIndex = index;
      }
      requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  }

  async function startSpin() {
    if (spinning || modalOpen) return;
    ensureAudio();
    spinning = true;
    skipRequested = false;
    setSpinBusy(true);
    els.caseStage.classList.add("is-spinning");
    setStatus("Крутим... · пропустить", true);

    try {
      const ctx = { pity: state.stats.pity, triggers: 0 };
      const roll = rollItem(ctx);
      const built = buildSpinReel(roll.item);
      const viewportW = els.reelViewport.clientWidth;
      const cardW = built.winnerCard.getBoundingClientRect().width;
      const jitter = (Math.random() * 2 - 1) * cardW * 0.16;
      const target = viewportW / 2 - (built.winnerCard.offsetLeft + cardW / 2) - jitter;
      const duration = state.settings.reduceMotion ? 650 : 5600;

      await animateReel(target, duration);
      built.winnerCard.classList.add("is-win");
      els.caseStage.classList.remove("is-spinning");
      spinning = false;
      setSpinBusy(false);

      const commit = commitDrops([roll], "single", ctx);
      const entry = commit.entries[0];
      setStatus("Готов к прокрутке");
      playReveal(RARITIES[entry.item.rarity].order);
      setTimeout(function () {
        openReveal(entry, commit, "single");
      }, 420);
    } catch (error) {
      console.error(error);
      spinning = false;
      setSpinBusy(false);
      els.caseStage.classList.remove("is-spinning");
      setStatus("Готов к прокрутке");
      toast({ icon: "⚠️", title: "Что-то сломалось", text: "Попробуй ещё раз. Буба уже разбирается." });
    }
  }

  function setSpinBusy(busy) {
    if (els.spinBtn) els.spinBtn.disabled = busy;
    if (els.reelViewport) els.reelViewport.classList.toggle("is-spinning", busy);
  }

  function setStatus(text, live) {
    if (!els.spinStatus) return;
    els.spinStatus.innerHTML = (live ? '<span class="pulse-dot"></span> ' : "") + esc(text);
  }

  function afterRevealBurst(item, power, targetEl) {
    const r = RARITIES[item.rarity];
    const colors = [r.color, r.color2, "#ffffff", "#c8ff3d"];
    setTimeout(function () {
      const target = targetEl || $(".reveal__img") || els.caseStage;
      const count = r.order >= 5 ? 160 : r.order >= 3 ? 110 : 60;
      burst(target, colors, count, power || 1);
    }, 120);
  }

  /* ======================================================================
     МОДАЛКИ
     ====================================================================== */

  function openModal(html) {
    const root = $("#modal-root");
    if (!root) return;
    root.innerHTML = html;
    document.body.classList.add("modal-open");
    modalOpen = true;
    $$("[data-close]", root).forEach(function (el) {
      el.addEventListener("click", closeModal);
    });
    const firstBtn = $(".modal__card button:not(.modal__close)", root);
    if (firstBtn) setTimeout(function () { firstBtn.focus(); }, 60);
  }

  function closeModal() {
    const root = $("#modal-root");
    if (!root) return;
    root.innerHTML = "";
    document.body.classList.remove("modal-open");
    modalOpen = false;
  }

  function openReveal(entry, commit, source) {
    const item = entry.item;
    const r = RARITIES[item.rarity];
    const isNew = entry.isNew;
    const achCount = commit.newAchievements.length;
    const countText = isNew ? "Новый предмет!" : "Уже было ×" + nf(entry.count - 1);
    const html =
      '<div class="modal" role="dialog" aria-modal="true" aria-labelledby="reveal-title">' +
      '<div class="modal__backdrop" data-close></div>' +
      '<div class="modal__card reveal" style="' + styleVars(item) + '">' +
      '<button class="modal__close" data-close aria-label="Закрыть">×</button>' +
      '<div class="reveal__glow"></div>' +
      '<div class="reveal__rarity">' + r.icon + " " + r.label + " · шанс " + fmtChance(item.chance) + "</div>" +
      '<div class="reveal__img"><img src="' + item.img + '" alt="' + esc(item.name) + '"></div>' +
      '<h2 id="reveal-title">' + esc(item.name) + "</h2>" +
      '<p class="reveal__desc">' + esc(item.desc) + "</p>" +
      '<div class="reveal__sub"><span class="reveal__badge">' + countText + "</span><span>#" + item.num + " в коллекции</span></div>" +
      '<div class="reveal__rewards">' +
      '<span class="reveal__reward">+<b>' + nf(item.value) + "</b> Б</span>" +
      '<span class="reveal__reward">+<b>' + nf(item.xp) + "</b> XP</span>" +
      (achCount ? '<span class="reveal__reward">🏆 +<b>' + achCount + "</b> ачивк" + (achCount === 1 ? "а" : "и") + "</span>" : "") +
      "</div>" +
      '<div class="reveal__actions">' +
      '<button class="btn btn--primary" data-action="again">Ещё раз</button>' +
      '<button class="btn btn--ghost" data-action="collection">В коллекцию</button>' +
      "</div></div></div>";
    openModal(html);
    setTimeout(function () { afterRevealBurst(item); }, 90);
    const again = $('[data-action="again"]', $("#modal-root"));
    if (again) {
      again.addEventListener("click", function () {
        closeModal();
        setTimeout(startSpin, 180);
      });
    }
    const toCollection = $('[data-action="collection"]', $("#modal-root"));
    if (toCollection) {
      toCollection.addEventListener("click", function () {
        closeModal();
        navigate("collection");
      });
    }
  }

  function openItemModal(id) {
    const item = ITEMS_BY_ID[id];
    if (!item) return;
    const count = itemCount(id);
    if (!count) {
      toast({ icon: "🔒", title: "Предмет ещё не выбит", text: "Открой его в кейсе — тогда появятся картинка и подробности." });
      return;
    }
    const r = RARITIES[item.rarity];
    const meta = state.meta[id] || {};
    const dupes = Math.max(0, count - 1);
    const html =
      '<div class="modal" role="dialog" aria-modal="true" aria-labelledby="item-title">' +
      '<div class="modal__backdrop" data-close></div>' +
      '<div class="modal__card detail" style="' + styleVars(item) + '">' +
      '<button class="modal__close" data-close aria-label="Закрыть">×</button>' +
      '<div class="detail__top">' +
      '<div class="detail__img"><img src="' + item.img + '" alt="' + esc(item.name) + '"></div>' +
      '<div class="detail__info">' +
      '<div class="reveal__rarity">' + r.icon + " " + r.label + " · #" + item.num + "</div>" +
      '<h2 id="item-title">' + esc(item.name) + "</h2>" +
      '<p class="detail__desc">' + esc(item.desc) + "</p>" +
      '<div class="detail__stats">' +
      '<div class="detail__stat"><span>Шанс</span><b class="detail__chance">' + fmtChance(item.chance) + "</b></div>" +
      '<div class="detail__stat"><span>Выбито</span><b>' + (count ? "×" + nf(count) : "0") + "</b></div>" +
      '<div class="detail__stat"><span>Повторок</span><b>' + (count ? nf(dupes) : "—") + "</b></div>" +
      '<div class="detail__stat"><span>Ценность</span><b>' + nf(item.value) + " Б</b></div>" +
      "</div>" +
      (meta.firstAt ? '<p style="margin-top:10px;font-size:9.5px">Впервые выбит: ' + dateTimeFmt.format(new Date(meta.firstAt)) + "</p>" : "") +
      "</div></div>" +
      '<div class="reveal__actions" style="margin-top:16px">' +
      '<button class="btn btn--primary" data-close>Понятно</button>' +
      "</div></div></div>";
    openModal(html);
  }

  function openSettings() {
    const tpl = $("#settings-template");
    if (!tpl) return;
    const root = $("#modal-root");
    root.innerHTML = "";
    root.appendChild(tpl.content.cloneNode(true));
    document.body.classList.add("modal-open");
    modalOpen = true;
    $$("[data-close]", root).forEach(function (el) { el.addEventListener("click", closeModal); });

    const sound = $("#setting-sound");
    const particles = $("#setting-particles");
    const motion = $("#setting-motion");
    if (sound) {
      sound.checked = state.settings.sound;
      sound.addEventListener("change", function () {
        state.settings.sound = sound.checked;
        updateSoundUI();
        save();
        if (sound.checked) { ensureAudio(); playClick(); }
        toast({ icon: sound.checked ? "🔊" : "🔇", title: sound.checked ? "Звук включён" : "Звук выключен", text: "Настройка сохранена." });
      });
    }
    if (particles) {
      particles.checked = state.settings.particles;
      particles.addEventListener("change", function () {
        state.settings.particles = particles.checked;
        save();
      });
    }
    if (motion) {
      motion.checked = state.settings.reduceMotion;
      motion.addEventListener("change", function () {
        state.settings.reduceMotion = motion.checked;
        updateMotionUI();
        save();
      });
    }

    const exportBtn = $("#export-btn");
    if (exportBtn) exportBtn.addEventListener("click", exportSave);
    const importBtn = $("#import-btn");
    const importFile = $("#import-file");
    if (importBtn && importFile) {
      importBtn.addEventListener("click", function () { importFile.click(); });
      importFile.addEventListener("change", function () {
        const file = importFile.files && importFile.files[0];
        if (!file) return;
        file.text().then(function (text) {
          let parsed;
          try { parsed = JSON.parse(text); } catch (error) {
            toast({ icon: "⚠️", title: "Не удалось импортировать", text: "Это не JSON-сохранение." });
            return;
          }
          if (!parsed || typeof parsed !== "object" || !parsed.inventory) {
            toast({ icon: "⚠️", title: "Не удалось импортировать", text: "В файле нет инвентаря." });
            return;
          }
          openConfirm("Импортировать сохранение?", "Текущий прогресс заменится данными из файла. Буба не умеет отменять это.", "Импортировать", function () {
            state = normalizeState(parsed);
            state.lastVisit = Date.now();
            applyTheme(state.theme, false);
            updateSoundUI();
            updateMotionUI();
            checkAchievements();
            save(true);
            renderAll();
            buildIdleReel();
            closeModal();
            toast({ icon: "📥", title: "Сохранение импортировано", text: "Уникальных: " + uniqueCount() + " / " + ITEMS.length + "." });
          });
        });
        importFile.value = "";
      });
    }

    const resetBtn = $("#reset-btn");
    if (resetBtn) {
      resetBtn.addEventListener("click", function () {
        openConfirm("Сбросить весь прогресс?", "Все предметы, достижения и темы исчезнут. Отменить это нельзя. Буба будет смотреть.", "Да, сбросить", function () {
          try { localStorage.removeItem(SAVE_KEY); } catch (error) { /* ignore */ }
          state = defaultState();
          state.lastVisit = Date.now();
          applyTheme("classic", false);
          save(true);
          renderAll();
          buildIdleReel();
          updateSoundUI();
          updateMotionUI();
          closeModal();
          toast({ icon: "🧹", title: "Прогресс сброшен", text: "Начинаем с чистого листа. Буба всё видел." });
        }, true);
      });
    }
    updateSaveNote();
  }

  function openConfirm(title, text, action, onConfirm, danger) {
    const html =
      '<div class="modal" role="dialog" aria-modal="true" aria-labelledby="confirm-title">' +
      '<div class="modal__backdrop" data-close></div>' +
      '<div class="modal__card" style="width:min(460px,100%)">' +
      '<button class="modal__close" data-close aria-label="Закрыть">×</button>' +
      '<div class="eyebrow"><span></span> ПОДТВЕРЖДЕНИЕ</div>' +
      '<h2 id="confirm-title">' + esc(title) + "</h2>" +
      "<p>" + esc(text) + "</p>" +
      '<div class="reveal__actions" style="margin-top:20px">' +
      '<button class="btn btn--ghost" data-close>Отмена</button>' +
      '<button class="btn ' + (danger ? "btn--danger" : "btn--primary") + '" data-confirm>' + esc(action) + "</button>" +
      "</div></div></div>";
    openModal(html);
    const btn = $("[data-confirm]", $("#modal-root"));
    if (btn) btn.addEventListener("click", onConfirm);
  }

  function openThemeLocked(theme) {
    const ach = theme.unlock ? ACH_BY_ID[theme.unlock] : null;
    const html =
      '<div class="modal" role="dialog" aria-modal="true">' +
      '<div class="modal__backdrop" data-close></div>' +
      '<div class="modal__card" style="width:min(470px,100%)">' +
      '<button class="modal__close" data-close aria-label="Закрыть">×</button>' +
      '<div class="eyebrow"><span></span> ТЕМА ЗАКРЫТА</div>' +
      "<h2>" + esc(theme.name) + "</h2>" +
      "<p>Эта тема открывается за достижение.</p>" +
      '<div class="reveal__reward" style="margin:14px 0;display:flex;gap:10px;align-items:center">' +
      '<span style="font-size:22px">' + (ach ? ach.icon : "🔒") + "</span>" +
      "<span><b>" + (ach ? esc(ach.name) : "Секрет") + "</b><br><span style='color:var(--muted);font-size:10px'>" + (ach ? esc(ach.desc) : "") + "</span></span>" +
      "</div>" +
      '<div class="reveal__actions">' +
      '<button class="btn btn--primary" data-go-ach>К достижениям</button>' +
      '<button class="btn btn--ghost" data-close>Позже</button>' +
      "</div></div></div>";
    openModal(html);
    const go = $("[data-go-ach]", $("#modal-root"));
    if (go) {
      go.addEventListener("click", function () {
        closeModal();
        navigate("achievements");
      });
    }
  }

  /* ======================================================================
     ТОСТЫ
     ====================================================================== */

  function toast(options) {
    const root = $("#toasts");
    if (!root) return;
    const el = document.createElement("div");
    el.className = "toast" + (options.type ? " toast--" + options.type : "");
    if (options.type === "drop" && options.rarity) el.style.setProperty("--rc", RARITIES[options.rarity].color);
    el.innerHTML = '<div class="toast__icon">' + (options.icon || "•") + "</div>" +
      '<div class="toast__copy"><b>' + esc(options.title || "") + "</b><span>" + esc(options.text || "") + "</span></div>";
    root.appendChild(el);
    while (root.children.length > 4) root.removeChild(root.firstElementChild);
    const duration = options.duration || 4200;
    setTimeout(function () {
      el.classList.add("is-out");
      setTimeout(function () { el.remove(); }, 320);
    }, duration);
  }

  function updateSoundUI() {
    document.body.classList.toggle("is-muted", !state.settings.sound);
    const btn = $("#sound-btn");
    if (btn) btn.title = state.settings.sound ? "Звук включён" : "Звук выключен";
  }

  function updateMotionUI() {
    document.body.classList.toggle("reduce-motion", !!state.settings.reduceMotion);
  }

  /* ======================================================================
     НАВИГАЦИЯ
     ====================================================================== */

  const VIEWS = ["spin", "collection", "achievements", "stats", "themes"];

  function currentView() {
    const active = $(".view.is-active");
    return active ? active.dataset.view : "spin";
  }

  function navigate(view, scroll) {
    if (VIEWS.indexOf(view) === -1) view = "spin";
    $$(".view").forEach(function (section) {
      section.classList.toggle("is-active", section.dataset.view === view);
    });
    $$(".nav__item").forEach(function (item) {
      item.classList.toggle("is-active", item.dataset.nav === view);
    });
    if (scroll !== false) window.scrollTo({ top: 0, behavior: state.settings.reduceMotion ? "auto" : "smooth" });
    try { history.replaceState(null, "", "#" + view); } catch (error) { /* file:// может ругаться */ }

    if (view === "collection") renderCollection();
    if (view === "achievements") renderAchievements();
    if (view === "stats") renderStats();
    if (view === "themes") renderThemes();
    if (view === "spin" && !els.reel.children.length) buildIdleReel();
    closeSettingsIfOpen();
  }

  function closeSettingsIfOpen() {
    // Настройки закрываются только по явному действию, чтобы не мешать вводу.
  }

  /* ======================================================================
     ЭКСПОРТ / ИМПОРТ
     ====================================================================== */

  function exportSave() {
    const data = JSON.stringify(state, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const d = new Date();
    const stamp = d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
    a.href = url;
    a.download = "buba-drop-save-" + stamp + ".json";
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
    toast({ icon: "📤", title: "Сохранение экспортировано", text: "Файл уже скачивается. Не потеряй Бубу." });
  }

  /* ======================================================================
     ИНИЦИАЛИЗАЦИЯ И СОБЫТИЯ
     ====================================================================== */

  function cacheEls() {
    els.hudCoins = $("#hud-coins");
    els.hudLevel = $("#hud-level");
    els.spinBtn = $("#spin-btn");
    els.reel = $("#reel");
    els.reelViewport = $("#reel-viewport");
    els.spinStatus = $("#spin-status");
    els.pityLabel = $("#pity-label");
    els.pityBar = $("#pity-bar");
    els.pityHint = $("#pity-hint");
    els.ratesList = $("#rates-list");
    els.recentList = $("#recent-list");
    els.recentCount = $("#recent-count");
    els.progressTiles = $("#progress-tiles");
    els.collectionGrid = $("#collection-grid");
    els.collectionEmpty = $("#collection-empty");
    els.collectionCount = $("#collection-count");
    els.collectionRing = $("#collection-ring");
    els.collectionRingLabel = $("#collection-ring-label");
    els.rarityProgress = $("#rarity-progress");
    els.achGrid = $("#achievements-grid");
    els.achCount = $("#ach-count");
    els.achPercent = $("#ach-percent");
    els.achBar = $("#ach-bar");
    els.achXpEarned = $("#ach-xp-earned");
    els.achThemesEarned = $("#ach-themes-earned");
    els.achHint = $("#ach-hint");
    els.statsGrid = $("#stats-grid");
    els.statsRarities = $("#stats-rarities");
    els.statsRecords = $("#stats-records");
    els.statsTimeline = $("#stats-timeline");
    els.statsLevel = $("#stats-level");
    els.statsRank = $("#stats-rank");
    els.statsXp = $("#stats-xp");
    els.themesGrid = $("#themes-grid");
    els.themeCount = $("#theme-count");
    els.caseStage = $(".case-stage");
    els.spinCountLabel = $("#spin-count-label");
  }

  function bindNavigation() {
    $$("[data-nav]").forEach(function (el) {
      el.addEventListener("click", function (event) {
        event.preventDefault();
        navigate(el.dataset.nav);
      });
    });
    window.addEventListener("hashchange", function () {
      const view = location.hash.replace("#", "");
      if (VIEWS.indexOf(view) !== -1) navigate(view, false);
    });
  }

  function bindCollection() {
    const filters = $("#rarity-filters");
    if (filters) {
      filters.innerHTML = '<button class="filter-chip is-active" data-filter="all" style="--rc:#ffffff">Все <b style="opacity:.5;font-weight:600">' + ITEMS.length + "</b></button>" +
        RARITY_ORDER.map(function (key) {
          const r = RARITIES[key];
          return '<button class="filter-chip" data-filter="' + key + '" style="--rc:' + r.color + '"><i></i>' + r.name + "</button>";
        }).join("");
      filters.addEventListener("click", function (event) {
        const btn = event.target.closest("[data-filter]");
        if (!btn) return;
        collectionFilter = btn.dataset.filter;
        $$(".filter-chip", filters).forEach(function (chip) { chip.classList.toggle("is-active", chip === btn); });
        renderCollection();
      });
    }

    const search = $("#collection-search");
    if (search) {
      let timer = null;
      search.addEventListener("input", function () {
        clearTimeout(timer);
        timer = setTimeout(function () {
          collectionSearch = search.value;
          renderCollection();
        }, 120);
      });
    }
    const owned = $("#owned-only");
    if (owned) {
      owned.addEventListener("change", function () {
        collectionOwnedOnly = owned.checked;
        renderCollection();
      });
    }
    const sort = $("#collection-sort");
    if (sort) {
      sort.addEventListener("change", function () {
        collectionSort = sort.value;
        renderCollection();
      });
    }
    if (els.collectionGrid) {
      els.collectionGrid.addEventListener("click", function (event) {
        const card = event.target.closest("[data-item]");
        if (card && card.dataset.item) openItemModal(card.dataset.item);
      });
    }
  }

  function bindAchievements() {
    const filters = $("#ach-filters");
    if (!filters) return;
    filters.addEventListener("click", function (event) {
      const btn = event.target.closest("[data-ach-filter]");
      if (!btn) return;
      achFilter = btn.dataset.achFilter;
      $$("button", filters).forEach(function (b) { b.classList.toggle("is-active", b === btn); });
      renderAchievements();
    });
  }

  function bindThemes() {
    if (!els.themesGrid) return;
    els.themesGrid.addEventListener("click", function (event) {
      const card = event.target.closest("[data-theme-id]");
      if (!card) return;
      const theme = THEME_BY_ID[card.dataset.themeId];
      if (!theme) return;
      if (!themeUnlocked(theme)) {
        openThemeLocked(theme);
        return;
      }
      if (state.theme === theme.id) {
        toast({ icon: "🎨", title: "Тема уже активна", text: "«" + theme.name + "» и так на экране." });
        return;
      }
      playClick();
      applyTheme(theme.id, true);
      renderThemes();
    });
  }

  function bindSpins() {
    if (els.spinBtn) els.spinBtn.addEventListener("click", startSpin);
    if (els.reelViewport) {
      els.reelViewport.addEventListener("click", function () {
        if (spinning && activeAnim && !skipRequested) {
          skipRequested = true;
          try { activeAnim.finish(); } catch (error) { /* ignore */ }
        }
      });
    }
  }

  function bindSettingsAndSound() {
    const soundBtn = $("#sound-btn");
    if (soundBtn) {
      soundBtn.addEventListener("click", function () {
        state.settings.sound = !state.settings.sound;
        updateSoundUI();
        save();
        if (state.settings.sound) {
          ensureAudio();
          playClick();
          toast({ icon: "🔊", title: "Звук включён", text: "Щелчки и фанфары вернулись." });
        } else {
          toast({ icon: "🔇", title: "Звук выключен", text: "Тишина. Только Буба в голове." });
        }
      });
    }
    const settingsBtn = $("#settings-btn");
    if (settingsBtn) settingsBtn.addEventListener("click", openSettings);
    const footerSettings = $("#footer-settings");
    if (footerSettings) footerSettings.addEventListener("click", openSettings);
  }

  function bindKeyboard() {
    document.addEventListener("keydown", function (event) {
      const tag = (event.target && event.target.tagName || "").toLowerCase();
      const isTyping = tag === "input" || tag === "textarea" || tag === "select" || event.target.isContentEditable;

      if (event.key === "Escape") {
        if (modalOpen) { closeModal(); event.preventDefault(); }
        return;
      }
      if (isTyping) return;
      if (modalOpen) return;

      if (event.code === "Space" && currentView() === "spin") {
        // Если фокус на кнопке/ссылке — пусть сработает их обычное поведение.
        if (tag === "button" || tag === "a") return;
        event.preventDefault();
        startSpin();
        return;
      }
      if (event.key >= "1" && event.key <= "5") {
        const view = VIEWS[parseInt(event.key, 10) - 1];
        if (view) { event.preventDefault(); navigate(view); }
        return;
      }
      if (event.key === "/") {
        event.preventDefault();
        navigate("collection");
        setTimeout(function () {
          const search = $("#collection-search");
          if (search) search.focus();
        }, 80);
      }
      if (event.key === "s" || event.key === "ы") {
        event.preventDefault();
        const soundBtn = $("#sound-btn");
        if (soundBtn) soundBtn.click();
      }
    });
  }

  function bindMisc() {
    window.addEventListener("beforeunload", function () { save(true); });
    document.addEventListener("visibilitychange", function () {
      if (document.visibilityState === "hidden") save(true);
    });
    document.addEventListener("error", function (event) {
      const target = event.target;
      if (target && target.tagName === "IMG" && !target.dataset.fallback) {
        target.dataset.fallback = "1";
        target.src = "assets/favicon.png";
        target.style.opacity = ".35";
      }
    }, true);
  }

  function preloadImages() {
    const loader = function () {
      ITEMS.forEach(function (item) {
        const img = new Image();
        img.decoding = "async";
        img.src = item.img;
      });
    };
    if ("requestIdleCallback" in window) requestIdleCallback(loader, { timeout: 2500 });
    else setTimeout(loader, 1800);
  }

  function registerSW() {
    if (!("serviceWorker" in navigator)) return;
    if (!/^https?:$/.test(location.protocol)) return;
    navigator.serviceWorker.register("sw.js").catch(function () { /* офлайн-режим не критичен */ });
  }

  function initialRoute() {
    const view = location.hash.replace("#", "");
    navigate(VIEWS.indexOf(view) !== -1 ? view : "spin", false);
  }

  function boot() {
    cacheEls();
    state = loadState();
    applyTheme(state.theme, false);
    updateSoundUI();
    updateMotionUI();
    bindNavigation();
    bindCollection();
    bindAchievements();
    bindThemes();
    bindSpins();
    bindSettingsAndSound();
    bindKeyboard();
    bindMisc();
    initFx();
    renderRates();
    buildIdleReel();
    renderAll();
    initialRoute();

    // Синхронизация достижений для старых/импортированных сохранений — без тостов.
    const lateUnlocks = checkAchievements();
    if (lateUnlocks.length) renderAll();
    save(true);
    updateSaveNote();

    // Небольшое приветствие при первом запуске.
    let welcomed = false;
    try { welcomed = !!localStorage.getItem(SAVE_KEY + ":welcome"); } catch (error) { welcomed = true; }
    if (!welcomed) {
      try { localStorage.setItem(SAVE_KEY + ":welcome", "1"); } catch (error) { /* ignore */ }
      setTimeout(function () {
        toast({ icon: "👋", title: "Добро пожаловать в BUBA DROP", text: "Крути кейс, собирай 88 предметов и открывай темы. Удачи, она понадобится.", duration: 6500 });
      }, 700);
    }

    preloadImages();
    registerSW();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
