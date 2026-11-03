/* BUBA DROP — темы оформления. Открываются достижениями. */
(function () {
  "use strict";

  const THEMES = [
    {
      id: "classic", name: "Буба-классика", tag: "Стартовая",
      desc: "Тёмный подвал, неоновый лайм и запах свежих кейсов.",
      unlock: null,
      vars: {
        "--bg": "#070a12",
        "--bg-soft": "#0a0f1b",
        "--surface": "rgba(16,23,40,.84)",
        "--surface-2": "#131d30",
        "--surface-3": "#1a2740",
        "--text": "#f2f6ff",
        "--muted": "#8b98ad",
        "--accent": "#c8ff3d",
        "--accent-2": "#45d6ff",
        "--accent-ink": "#0c1004",
        "--line": "rgba(255,255,255,.09)",
        "--glow": "rgba(200,255,61,.24)",
        "--glow-2": "rgba(69,214,255,.2)",
        "--pattern": "linear-gradient(rgba(255,255,255,.028) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.028) 1px, transparent 1px)"
      }
    },
    {
      id: "night", name: "Ночной дроп", tag: "За достижение",
      desc: "Фиолетовая ночь, холодный неон и бессонница на всю катушку.",
      unlock: "first-drop",
      vars: {
        "--bg": "#05060f",
        "--bg-soft": "#080a18",
        "--surface": "rgba(18,20,42,.86)",
        "--surface-2": "#141733",
        "--surface-3": "#1c2044",
        "--text": "#f4f2ff",
        "--muted": "#9897b8",
        "--accent": "#a78bfa",
        "--accent-2": "#22d3ee",
        "--accent-ink": "#0b0618",
        "--line": "rgba(167,139,250,.16)",
        "--glow": "rgba(167,139,250,.28)",
        "--glow-2": "rgba(34,211,238,.22)",
        "--pattern": "radial-gradient(circle at 20% 30%, rgba(139,92,246,.16), transparent 38%), radial-gradient(circle at 80% 20%, rgba(34,211,238,.1), transparent 32%), radial-gradient(1px 1px at 12% 22%, rgba(255,255,255,.7), transparent 60%), radial-gradient(1px 1px at 38% 68%, rgba(255,255,255,.5), transparent 60%), radial-gradient(1px 1px at 67% 34%, rgba(255,255,255,.55), transparent 60%), radial-gradient(1px 1px at 84% 76%, rgba(255,255,255,.45), transparent 60%)"
      }
    },
    {
      id: "backrooms", name: "Бэкрумс", tag: "За достижение",
      desc: "Жёлтые обои, гудение лампы и 25 предметов, которых не должно существовать.",
      unlock: "unique-25",
      vars: {
        "--bg": "#171307",
        "--bg-soft": "#1d1809",
        "--surface": "rgba(44,36,14,.86)",
        "--surface-2": "#2c250f",
        "--surface-3": "#3a3115",
        "--text": "#fff5cf",
        "--muted": "#b7a875",
        "--accent": "#e3c56b",
        "--accent-2": "#9c8a4d",
        "--accent-ink": "#171203",
        "--line": "rgba(227,197,107,.16)",
        "--glow": "rgba(227,197,107,.24)",
        "--glow-2": "rgba(156,138,77,.2)",
        "--pattern": "repeating-linear-gradient(90deg, rgba(227,197,107,.055) 0 2px, transparent 2px 64px), repeating-linear-gradient(0deg, rgba(227,197,107,.035) 0 2px, transparent 2px 64px)"
      }
    },
    {
      id: "toxic", name: "Химзащита", tag: "За достижение",
      desc: "Кислотно-зелёный костюм, противогаз и полный набор необычных.",
      unlock: "set-uncommon",
      vars: {
        "--bg": "#05110b",
        "--bg-soft": "#07170f",
        "--surface": "rgba(13,34,22,.86)",
        "--surface-2": "#102b1c",
        "--surface-3": "#163a27",
        "--text": "#eafff1",
        "--muted": "#86b598",
        "--accent": "#4ade80",
        "--accent-2": "#a3e635",
        "--accent-ink": "#04140a",
        "--line": "rgba(74,222,128,.16)",
        "--glow": "rgba(74,222,128,.26)",
        "--glow-2": "rgba(163,230,53,.2)",
        "--pattern": "radial-gradient(circle at 18% 22%, rgba(74,222,128,.13), transparent 36%), radial-gradient(circle at 82% 78%, rgba(163,230,53,.09), transparent 34%), repeating-linear-gradient(45deg, rgba(0,0,0,.12) 0 12px, transparent 12px 24px)"
      }
    },
    {
      id: "traffic", name: "Светофор", tag: "За достижение",
      desc: "Красный, жёлтый, зелёный — и все редкие предметы твои.",
      unlock: "set-rare",
      vars: {
        "--bg": "#0a0a0c",
        "--bg-soft": "#101012",
        "--surface": "rgba(28,28,31,.88)",
        "--surface-2": "#232327",
        "--surface-3": "#2e2e33",
        "--text": "#f7f7f4",
        "--muted": "#a0a09a",
        "--accent": "#ffcc00",
        "--accent-2": "#ff3b30",
        "--accent-ink": "#171202",
        "--line": "rgba(255,204,0,.16)",
        "--glow": "rgba(255,204,0,.24)",
        "--glow-2": "rgba(255,59,48,.2)",
        "--pattern": "repeating-linear-gradient(135deg, rgba(255,204,0,.07) 0 22px, transparent 22px 44px), repeating-linear-gradient(45deg, rgba(255,59,48,.045) 0 22px, transparent 22px 44px)"
      }
    },
    {
      id: "gold", name: "Золотой Буба", tag: "За достижение",
      desc: "Всё блестит, даже обычные чипсы. Легенда обязывает.",
      unlock: "first-legendary",
      vars: {
        "--bg": "#120e05",
        "--bg-soft": "#181207",
        "--surface": "rgba(38,29,11,.86)",
        "--surface-2": "#2c2110",
        "--surface-3": "#3d2d15",
        "--text": "#fff7e2",
        "--muted": "#bda877",
        "--accent": "#ffd166",
        "--accent-2": "#ff9f1c",
        "--accent-ink": "#1a1102",
        "--line": "rgba(255,209,102,.18)",
        "--glow": "rgba(255,209,102,.28)",
        "--glow-2": "rgba(255,159,28,.22)",
        "--pattern": "radial-gradient(circle at 50% 0%, rgba(255,209,102,.15), transparent 55%), repeating-linear-gradient(115deg, rgba(255,255,255,.032) 0 2px, transparent 2px 16px)"
      }
    },
    {
      id: "plantation", name: "Плантация", tag: "За достижение",
      desc: "Тёплый закат, зелёные поля и 50 уникальных экспонатов.",
      unlock: "unique-50",
      vars: {
        "--bg": "#0b1007",
        "--bg-soft": "#10160a",
        "--surface": "rgba(24,35,15,.86)",
        "--surface-2": "#1d2b13",
        "--surface-3": "#283a1b",
        "--text": "#f4ffe8",
        "--muted": "#9db387",
        "--accent": "#8fbc5a",
        "--accent-2": "#d4a373",
        "--accent-ink": "#0a1304",
        "--line": "rgba(143,188,90,.17)",
        "--glow": "rgba(143,188,90,.24)",
        "--glow-2": "rgba(212,163,115,.2)",
        "--pattern": "repeating-linear-gradient(115deg, rgba(143,188,90,.075) 0 2px, transparent 2px 30px), radial-gradient(circle at 80% 10%, rgba(212,163,115,.09), transparent 40%)"
      }
    },
    {
      id: "bubafic", name: "Бубафический рай", tag: "За достижение",
      desc: "Розовый туман, сердечки и полный пантеон бубафических.",
      unlock: "set-bubafic",
      vars: {
        "--bg": "#150612",
        "--bg-soft": "#1b0818",
        "--surface": "rgba(40,12,34,.86)",
        "--surface-2": "#311027",
        "--surface-3": "#431638",
        "--text": "#fff0fa",
        "--muted": "#c493b2",
        "--accent": "#ff5fa2",
        "--accent-2": "#c084fc",
        "--accent-ink": "#1a0412",
        "--line": "rgba(255,95,162,.17)",
        "--glow": "rgba(255,95,162,.28)",
        "--glow-2": "rgba(192,132,252,.22)",
        "--pattern": "radial-gradient(circle at 20% 20%, rgba(255,95,162,.15), transparent 38%), radial-gradient(circle at 80% 70%, rgba(192,132,252,.13), transparent 40%)"
      }
    },
    {
      id: "secret", name: "Секретный терминал", tag: "За достижение",
      desc: "Матрица, сканлайны и первый секретный предмет. Никому не говори.",
      unlock: "first-secret",
      vars: {
        "--bg": "#02090b",
        "--bg-soft": "#031013",
        "--surface": "rgba(6,28,30,.88)",
        "--surface-2": "#082226",
        "--surface-3": "#0c3034",
        "--text": "#e8fffb",
        "--muted": "#7eb3ae",
        "--accent": "#00ffc8",
        "--accent-2": "#00b3ff",
        "--accent-ink": "#00110d",
        "--line": "rgba(0,255,200,.16)",
        "--glow": "rgba(0,255,200,.26)",
        "--glow-2": "rgba(0,179,255,.2)",
        "--pattern": "repeating-linear-gradient(0deg, rgba(0,255,200,.045) 0 1px, transparent 1px 4px), linear-gradient(rgba(0,255,200,.025) 1px, transparent 1px), linear-gradient(90deg, rgba(0,255,200,.025) 1px, transparent 1px)"
      }
    },
    {
      id: "cosmos", name: "Космос Бубы", tag: "За достижение",
      desc: "Все 88 предметов собраны. Буба вышел на орбиту.",
      unlock: "full-collection",
      vars: {
        "--bg": "#05030f",
        "--bg-soft": "#080518",
        "--surface": "rgba(20,15,45,.86)",
        "--surface-2": "#17123a",
        "--surface-3": "#211a50",
        "--text": "#f3efff",
        "--muted": "#9f96c4",
        "--accent": "#a78bfa",
        "--accent-2": "#22d3ee",
        "--accent-ink": "#080418",
        "--line": "rgba(167,139,250,.17)",
        "--glow": "rgba(167,139,250,.28)",
        "--glow-2": "rgba(34,211,238,.22)",
        "--pattern": "radial-gradient(circle at 15% 20%, rgba(124,58,237,.2), transparent 42%), radial-gradient(circle at 85% 75%, rgba(34,211,238,.13), transparent 38%), radial-gradient(1px 1px at 10% 30%, rgba(255,255,255,.75), transparent 60%), radial-gradient(1px 1px at 28% 80%, rgba(255,255,255,.55), transparent 60%), radial-gradient(1px 1px at 55% 18%, rgba(255,255,255,.65), transparent 60%), radial-gradient(1px 1px at 72% 58%, rgba(255,255,255,.5), transparent 60%), radial-gradient(1px 1px at 92% 32%, rgba(255,255,255,.6), transparent 60%)"
      }
    },
    {
      id: "chaos", name: "Розовый хаос", tag: "За достижение",
      desc: "1000 прокруток сломали тебе восприятие цвета. Наслаждайся.",
      unlock: "spins-1000",
      vars: {
        "--bg": "#14020a",
        "--bg-soft": "#1b0310",
        "--surface": "rgba(44,7,23,.87)",
        "--surface-2": "#360818",
        "--surface-3": "#4a0b22",
        "--text": "#fff1f5",
        "--muted": "#ca8fa2",
        "--accent": "#ff2e63",
        "--accent-2": "#ffb703",
        "--accent-ink": "#1a0207",
        "--line": "rgba(255,46,99,.18)",
        "--glow": "rgba(255,46,99,.3)",
        "--glow-2": "rgba(255,183,3,.22)",
        "--pattern": "repeating-linear-gradient(135deg, rgba(255,46,99,.075) 0 14px, transparent 14px 28px), radial-gradient(circle at 80% 20%, rgba(255,183,3,.11), transparent 40%)"
      }
    }
  ];

  window.BUBA_THEMES = THEMES;
})();
