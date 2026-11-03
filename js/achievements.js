/* BUBA DROP — 30 достижений. Условия проверяются по состоянию сохранения. */
(function () {
  "use strict";

  const A = [
    {
      id: "first-drop", name: "Первый пошёл", icon: "🎬", xp: 100, theme: "night",
      desc: "Открой свой первый кейс. Обратной дороги нет.",
      progress: function (s) { return [Math.min(s.stats.spins, 1), 1]; }
    },
    {
      id: "spins-10", name: "Разогрев", icon: "🔥", xp: 150,
      desc: "Прокрути 10 предметов. Разминка перед настоящим безумием.",
      progress: function (s) { return [Math.min(s.stats.spins, 10), 10]; }
    },
    {
      id: "spins-50", name: "Крутильщик", icon: "🎡", xp: 200,
      desc: "50 прокруток. Рука уже сама тянется к кнопке.",
      progress: function (s) { return [Math.min(s.stats.spins, 50), 50]; }
    },
    {
      id: "spins-100", name: "Буба-маньяк", icon: "🌀", xp: 300,
      desc: "100 прокруток. Сон — для слабых, кейсы — для сильных.",
      progress: function (s) { return [Math.min(s.stats.spins, 100), 100]; }
    },
    {
      id: "spins-500", name: "Полтыщи", icon: "🏋️", xp: 500,
      desc: "500 прокруток. Ты уже не игрок, ты часть кейса.",
      progress: function (s) { return [Math.min(s.stats.spins, 500), 500]; }
    },
    {
      id: "spins-1000", name: "Тысячник", icon: "👑", xp: 800, theme: "chaos",
      desc: "1000 прокруток. Буба официально признаёт тебя своим.",
      progress: function (s) { return [Math.min(s.stats.spins, 1000), 1000]; }
    },
    {
      id: "first-rare", name: "Редкий экземпляр", icon: "💙", xp: 150,
      desc: "Выбей первый редкий предмет.",
      progress: function (s) { return [s.stats.rarity.rare > 0 ? 1 : 0, 1]; }
    },
    {
      id: "first-epic", name: "Эпический момент", icon: "💜", xp: 220,
      desc: "Выбей первый эпик. Повод для скрина уже готов.",
      progress: function (s) { return [s.stats.rarity.epic > 0 ? 1 : 0, 1]; }
    },
    {
      id: "first-legendary", name: "Легенда на связи", icon: "🌟", xp: 350, theme: "gold",
      desc: "Выбей первого легендарного Бубу.",
      progress: function (s) { return [s.stats.rarity.legendary > 0 ? 1 : 0, 1]; }
    },
    {
      id: "first-bubafic", name: "Бубафический сдвиг", icon: "♥️", xp: 500,
      desc: "Выбей бубафический предмет. Обратно уже не вернёшься.",
      progress: function (s) { return [s.stats.rarity.bubafic > 0 ? 1 : 0, 1]; }
    },
    {
      id: "first-mythic", name: "Миф подтверждён", icon: "☄️", xp: 750,
      desc: "Выбей мифический предмет. Учёные в шоке.",
      progress: function (s) { return [s.stats.rarity.mythic > 0 ? 1 : 0, 1]; }
    },
    {
      id: "first-secret", name: "Совершенно секретно", icon: "🕵️", xp: 1000, theme: "secret",
      desc: "Выбей секретный предмет. Ты не должен был это видеть.",
      progress: function (s) { return [s.stats.rarity.secret > 0 ? 1 : 0, 1]; }
    },
    {
      id: "set-common", name: "Обычный набор", icon: "🧃", xp: 200,
      desc: "Собери все 6 обычных предметов.",
      progress: function (s, h) { return [h.owned("common"), 6]; }
    },
    {
      id: "set-uncommon", name: "Необычная коллекция", icon: "🍀", xp: 300, theme: "toxic",
      desc: "Собери все 7 необычных предметов.",
      progress: function (s, h) { return [h.owned("uncommon"), 7]; }
    },
    {
      id: "set-rare", name: "Редкий склад", icon: "🧊", xp: 450, theme: "traffic",
      desc: "Собери все 7 редких предметов.",
      progress: function (s, h) { return [h.owned("rare"), 7]; }
    },
    {
      id: "set-epic", name: "Эпическая палата", icon: "🏥", xp: 700,
      desc: "Собери все 20 эпических предметов.",
      progress: function (s, h) { return [h.owned("epic"), 20]; }
    },
    {
      id: "set-legendary", name: "Легендарный шкаф", icon: "🗄️", xp: 1200,
      desc: "Собери все 12 легендарных предметов. Шкаф уже трещит.",
      progress: function (s, h) { return [h.owned("legendary"), 12]; }
    },
    {
      id: "set-bubafic", name: "Бубафический пантеон", icon: "⛩️", xp: 1500, theme: "bubafic",
      desc: "Собери все 12 бубафических предметов.",
      progress: function (s, h) { return [h.owned("bubafic"), 12]; }
    },
    {
      id: "set-mythic", name: "Мифический зоопарк", icon: "🐉", xp: 2500,
      desc: "Собери все 16 мифических предметов.",
      progress: function (s, h) { return [h.owned("mythic"), 16]; }
    },
    {
      id: "unique-25", name: "Четвертак", icon: "🎯", xp: 250, theme: "backrooms",
      desc: "Открой 25 уникальных предметов.",
      progress: function (s, h) { return [h.unique(), 25]; }
    },
    {
      id: "unique-50", name: "Полтинник", icon: "🧩", xp: 500, theme: "plantation",
      desc: "Открой 50 уникальных предметов. Коллекция обретает форму.",
      progress: function (s, h) { return [h.unique(), 50]; }
    },
    {
      id: "full-collection", name: "Буба-вселенная", icon: "🌌", xp: 5000, theme: "cosmos",
      desc: "Собери все 88 предметов. Абсолютный Буба.",
      progress: function (s, h) { return [h.unique(), 88]; }
    },
    {
      id: "dupes-10", name: "Повторюшка", icon: "🔁", xp: 150,
      desc: "Получи 10 повторок. Буба любит тебя дважды.",
      progress: function (s, h) { return [Math.min(h.dupes(), 10), 10]; }
    },
    {
      id: "dupes-50", name: "Хомяк", icon: "🐹", xp: 350,
      desc: "Получи 50 повторок. Склад уже не резиновый.",
      progress: function (s, h) { return [Math.min(h.dupes(), 50), 50]; }
    },
    {
      id: "dupes-100", name: "Склад Бубы", icon: "🏭", xp: 600,
      desc: "Получи 100 повторок. Пора открывать свой магазин.",
      progress: function (s, h) { return [Math.min(h.dupes(), 100), 100]; }
    },
    {
      id: "streak-rare-3", name: "Хет-трик", icon: "🎰", xp: 500,
      desc: "Выбей три редких или выше подряд.",
      progress: function (s) { return [Math.min(s.stats.bestRareStreak, 3), 3]; }
    },
    {
      id: "unlucky-10", name: "Полоса невезения", icon: "🌧️", xp: 200,
      desc: "Выбей 10 обычных подряд. Это тоже талант.",
      progress: function (s) { return [Math.min(s.stats.bestCommonStreak, 10), 10]; }
    },
    {
      id: "secrets-2", name: "Двойной секрет", icon: "🧿", xp: 1500,
      desc: "Выбей два секретных предмета за всё время.",
      progress: function (s) { return [Math.min(s.stats.secrets, 2), 2]; }
    },
    {
      id: "night-owl", name: "Ночной дроп", icon: "🌙", xp: 300,
      desc: "Открой кейс между 00:00 и 05:00. Буба не спит.",
      progress: function (s) { return [s.stats.nightSpins > 0 ? 1 : 0, 1]; }
    },
    {
      id: "themes-5", name: "Темщик", icon: "🎨", xp: 400,
      desc: "Открой 5 тем оформления.",
      progress: function (s, h) { return [h.themeCount(), 5]; }
    }
  ];

  window.BUBA_ACHIEVEMENTS = A;
})();
