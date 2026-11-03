/* BUBA DROP — данные предметов и редкостей.
   Всё статично, никаких сборщиков: можно кидать папку прямо на GitHub Pages. */
(function () {
  "use strict";

  const RARITIES = {
    common: {
      order: 0, name: "Обычные", label: "Обычный", icon: "●",
      chance: 42, color: "#aab6c8", color2: "#5f6b7d",
      glow: "rgba(170,182,200,.38)", xp: 5, coins: 25,
      blurb: "Мусор, но родной"
    },
    uncommon: {
      order: 1, name: "Необычные", label: "Необычный", icon: "◆",
      chance: 25, color: "#3ddc97", color2: "#0f8f5f",
      glow: "rgba(61,220,151,.38)", xp: 12, coins: 60,
      blurb: "Уже интереснее"
    },
    rare: {
      order: 2, name: "Редкие", label: "Редкий", icon: "◆",
      chance: 16, color: "#4c9dff", color2: "#1d4ed8",
      glow: "rgba(76,157,255,.42)", xp: 30, coins: 150,
      blurb: "Можно похвастаться"
    },
    epic: {
      order: 3, name: "Эпические", label: "Эпический", icon: "✦",
      chance: 8, color: "#b06bff", color2: "#6d28d9",
      glow: "rgba(176,107,255,.46)", xp: 80, coins: 400,
      blurb: "Повод для скрина"
    },
    legendary: {
      order: 4, name: "Легендарные", label: "Легендарный", icon: "★",
      chance: 4, color: "#ffb020", color2: "#b45309",
      glow: "rgba(255,176,32,.5)", xp: 220, coins: 1200,
      blurb: "Сердце стучит"
    },
    bubafic: {
      order: 5, name: "Бубафические", label: "Бубафический", icon: "♥",
      chance: 3, color: "#ff5fa2", color2: "#9d174d",
      glow: "rgba(255,95,162,.5)", xp: 500, coins: 2500,
      blurb: "За гранью"
    },
    mythic: {
      order: 6, name: "Мифические", label: "Мифический", icon: "☄",
      chance: 1.5, color: "#ff4757", color2: "#991b1b",
      glow: "rgba(255,71,87,.54)", xp: 1200, coins: 6000,
      blurb: "Только для избранных"
    },
    secret: {
      order: 7, name: "Секретные", label: "Секретный", icon: "✪",
      chance: 0.5, color: "#7df9ff", color2: "#7c3aed",
      glow: "rgba(125,249,255,.55)", xp: 3000, coins: 20000,
      blurb: "Ты не должен был это видеть"
    }
  };

  const RAW = [
    /* ---------- ОБЫЧНЫЕ (6) ---------- */
    { id: "pivo-buby", name: "Пиво бубы", rarity: "common", desc: "Классика жанра. Открывается с щелчком, пахнет подвалом и большими планами." },
    { id: "shaurma-svetofor", name: "Шаурма с мясом из светофора", rarity: "common", desc: "Мясо красное, жёлтое и зелёное одновременно. Ешь быстро, пока не загорелся красный." },
    { id: "chipsy-lava", name: "Чипсы «Лава-лава, мать шалава»", rarity: "common", desc: "Острые настолько, что язык подаёт заявление на увольнение." },
    { id: "petuh-buba", name: "Петух Буба", rarity: "common", desc: "Кукарекает в пять утра и требует, чтобы ты встал и что-то сделал со своей жизнью." },
    { id: "privet-petya", name: "Привет, Петя", rarity: "common", desc: "Просто привет, Петя. Не спрашивай. Петя знает." },
    { id: "dohlyy-genka", name: "Дохлый Генка", rarity: "common", desc: "Лежит, молчит, но всё ещё в коллекции. Генка был хорошим человеком. Наверное." },

    /* ---------- НЕОБЫЧНЫЕ (7) ---------- */
    { id: "latte-yagody", name: "Латте с ягодами жырлы-бырлы-хырлы-хырлы", rarity: "uncommon", desc: "Бариста произнёс название трижды и вызвал демона. Демон попросил овсяное молоко." },
    { id: "e-aga", name: "Э? Ага.", rarity: "uncommon", desc: "Универсальный ответ на любой вопрос. Работает даже на экзамене, если уверенно кивать." },
    { id: "buba-goluboy-general", name: "Буба и голубой генерал", rarity: "uncommon", desc: "Генерал в голубом, Буба в недоумении. Политическая обстановка стабильно непонятная." },
    { id: "drobovik-buby", name: "Дробовик Бубы", rarity: "uncommon", desc: "Стреляет не патронами, а фразами «ну ты понял». Эффект оглушительный." },
    { id: "papa-chicken-gun", name: "Папа любит чикен-ган", rarity: "uncommon", desc: "Семейная традиция: воскресный обед, жареная курица и баллистическая экспертиза." },
    { id: "izbienie", name: "Избиение", rarity: "uncommon", desc: "Кадр из драмы, в которой никто не помнит сюжет, но все помнят звук." },
    { id: "perchatka-buby", name: "Перчатка Бубы", rarity: "uncommon", desc: "Одна перчатка. Вторая, по легенде, ушла в другой кейс и стала секретной." },

    /* ---------- РЕДКИЕ (7) ---------- */
    { id: "buba-gladiator", name: "Буба-гладиатор", rarity: "rare", desc: "Арена, песок, жара. Буба вышел с одним желанием: чтобы это закончилось поскорее." },
    { id: "buba-himzashita", name: "Буба в химзащите", rarity: "rare", desc: "Костюм выдерживает кислоту, радиацию и разговоры о политике. Почти." },
    { id: "kopye-buby", name: "Копьё Бубы", rarity: "rare", desc: "Оружие ближнего боя и дальнего недопонимания." },
    { id: "payday-buba", name: "ПейДей Буба", rarity: "rare", desc: "В маске, с дробовиком, но всё равно пришёл за зарплатой в конверте." },
    { id: "chernyy-buba-plantacii", name: "Чёрный Буба на плантациях", rarity: "rare", desc: "Собирает не хлопок, а лайки. Урожай в этом сезоне особенно токсичный." },
    { id: "legionery", name: "Легионеры", rarity: "rare", desc: "Строй, дисциплина, синхронный шаг. Один из них точно не Буба, но кто именно — неизвестно." },
    { id: "bomba-v-shkafu", name: "Бомба в шкафу", rarity: "rare", desc: "Тикает. Ты делаешь вид, что не слышишь. Шкаф делает вид, что он не при делах." },

    /* ---------- ЭПИЧЕСКИЕ (20) ---------- */
    { id: "chernye-svinki", name: "Чёрные свинки", rarity: "epic", desc: "Они не злые. Просто очень внимательно смотрят, как ты открываешь кейсы." },
    { id: "buba-dva-raza", name: "Буба два раза", rarity: "epic", desc: "Один Буба — хорошо. Два Бубы — уже очередь. Три — это уже митинг." },
    { id: "ryzen-rodnenkiy", name: "Ryzen, родненький", rarity: "epic", desc: "Тёплый, шумный, с девятью вентиляторами. Греет не хуже батареи и любит тебя как сына." },
    { id: "duhi-buby", name: "Духи с запахом Бубы", rarity: "epic", desc: "Верхние ноты: подвал. Средние: чеснок. База: что-то, что нельзя описывать." },
    { id: "moi-kubiki-suka", name: "МОИ КУБИКИ, СУКА", rarity: "epic", desc: "Их снова кто-то трогал. Следствие ведётся, подозреваемый — весь чат." },
    { id: "trubka-kapitana", name: "Трубка капитана Бубы", rarity: "epic", desc: "Курит исключительно мудрость. Дым пахнет старыми мемами и морской солью." },
    { id: "tancpol-bub", name: "Танцпол Буб", rarity: "epic", desc: "Музыка гремит, Бубы танцуют. Никто не знает движений, но все уверены в себе." },
    { id: "kompyuter-buby", name: "Компьютер Бубы", rarity: "epic", desc: "Работает на Windows XP, тянет только кейсы и разговоры о смысле жизни." },
    { id: "privet-motya", name: "Привет, Мотя", rarity: "epic", desc: "Мотя не отвечает. Мотя уже третий день в глубокой медитации над кейсом." },
    { id: "platforma-shariki", name: "Платформа с шариками", rarity: "epic", desc: "Физика здесь опциональна. Шарики летают, потому что так решили." },
    { id: "buba-iz-foresta", name: "Буба из Фореста", rarity: "epic", desc: "Вышел из леса, принёс грибы и странное чувство, что за ним наблюдают." },
    { id: "ugolok-daunizma", name: "Уголок даунизма", rarity: "epic", desc: "Уютное место, где можно ничего не делать и не чувствовать вины. Диван уже занят." },
    { id: "vtb-buba", name: "ВТБ Буба", rarity: "epic", desc: "Одобряет кредит на мечту. Процентная ставка — твоё душевное спокойствие." },
    { id: "boevoy-orkestr", name: "Боевой оркестр Буб", rarity: "epic", desc: "Играет так громко, что противник сдаётся и просит сыграть на бис." },
    { id: "dom-buby", name: "Дом Бубы", rarity: "epic", desc: "Сгорел, но уют остался. Внутри всё ещё пахнет шашлыком и плохими решениями." },
    { id: "otchim-buby", name: "Отчим Бубы", rarity: "epic", desc: "Пришёл, посмотрел, сказал «ну это не по-мужски» и ушёл в закат." },
    { id: "buba-terrorist", name: "Буба-террорист", rarity: "epic", desc: "Плащ, бомбы, серьёзное лицо. На самом деле просто не нашёл выход из метро." },
    { id: "dom-buby-tafa", name: "Дом Бубы Тафа", rarity: "epic", desc: "Дом, который выжил после всего. Таф, видимо, строил с запасом." },
    { id: "obkonchennyy-buba", name: "Обконченный Буба", rarity: "epic", desc: "Слишком много кейсов, слишком мало сна. Взгляд уже не здесь." },
    { id: "mishko", name: "Мiшко", rarity: "epic", desc: "Мiшко знает всё. Мiшко видел всё. Мiшко просто хочет, чтобы ты закрыл вкладку и поспал." },

    /* ---------- ЛЕГЕНДАРНЫЕ (12) ---------- */
    { id: "spermitto-dildako", name: "Спермитто Дилдако", rarity: "legendary", desc: "Легенда, которую нельзя произносить вслух на семейном ужине. Произноси шёпотом." },
    { id: "dolg-za-neft", name: "Долг за нефть", rarity: "legendary", desc: "Ты думал, это кейс. А это счёт. Оплата по QR-коду, желательно до пятницы." },
    { id: "keys-s-dengami", name: "Кейс с деньгами", rarity: "legendary", desc: "Внутри деньги. Много. Но кейс не открывается. Классика." },
    { id: "kulbk1d", name: "КулbК1д", rarity: "legendary", desc: "Читается как пароль от чужого Wi-Fi. Выглядит как человек, который знает, где лежит Wi-Fi." },
    { id: "detskiy-standap", name: "Детский Стендап", rarity: "legendary", desc: "Выходит на сцену, рассказывает про садик. Зал плачет. Не от смеха." },
    { id: "uranovaya-palochka", name: "Урановая палочка", rarity: "legendary", desc: "Светится в темноте, нагревается в кармане, одобрена наукой и МАГАТЭ. Наверное." },
    { id: "partiya-kotosti", name: "Партия котости и Бубы", rarity: "legendary", desc: "Политическая сила с программой: больше котиков, меньше тараканов. Тараканы против." },
    { id: "buba-slasher", name: "Буба-слешер", rarity: "legendary", desc: "Кричит «Я БУБА» и бежит с ножом. Сценарий писался на салфетке." },
    { id: "kirasasir", name: "Кирасасир", rarity: "legendary", desc: "Броня, которая защищает от всего, кроме критики в интернете." },
    { id: "btr-i-buba", name: "БТР и Буба", rarity: "legendary", desc: "БТР есть. Буба есть. Проблема в том, что права у Бубы нет." },
    { id: "zagryaznennaya-aes", name: "Загрязнённая АЭС", rarity: "legendary", desc: "Фонит так, что кейс начинает светиться раньше, чем ты его открыл. Не трогай руками." },
    { id: "mshchnoy-odel-svetofora", name: "Мщсний одел Светофора", rarity: "legendary", desc: "Форма, которая делает тебя заметным за три квартала. Скрытность — ноль, стиль — десять." },

    /* ---------- БУБАФИЧЕСКИЕ (12) ---------- */
    { id: "tak-tak-salfetki", name: "Так, так, салфетки", rarity: "bubafic", desc: "Буба готовится к важному разговору. Салфетки — его единственная поддержка." },
    { id: "idite-nahuy-uchitelya", name: "Идите нахуй все учителя", rarity: "bubafic", desc: "Девиз на футболке, который школа пыталась запретить. Не вышло." },
    { id: "gruppa-bub", name: "Группа Буб", rarity: "bubafic", desc: "Три Бубы, один микрофон, ноль слуха. Мировой тур начинается в гараже." },
    { id: "podlodka-bimba", name: "Подлодка «Бiмба»", rarity: "bubafic", desc: "Погружается на глубину, где нет Wi-Fi, но есть Бубы. Экипаж: один Буба и много надежды." },
    { id: "srushchiy-buba", name: "Срущий Буба", rarity: "bubafic", desc: "Застигнут врасплох. Теперь это достояние коллекции и повод для семейной терапии." },
    { id: "orkestr-personazhey", name: "Оркестр персонажей", rarity: "bubafic", desc: "Каждый играет свою партию. Никто не слушает дирижёра. Звучит неожиданно эпично." },
    { id: "buba-na-rakete", name: "Буба на ракете", rarity: "bubafic", desc: "Куда летит — неизвестно. Зачем — тоже. Но летит уверенно." },
    { id: "buba-nachalnik-smeny", name: "Буба — начальник смены", rarity: "bubafic", desc: "Подписывает отпуск только по пятницам. В остальные дни — «работаем, братцы»." },
    { id: "buba-bez-ruki", name: "Буба без руки", rarity: "bubafic", desc: "Руку потерял в неравном бою с кейсом. Вторую руку оставил для коллекции." },
    { id: "12-oklok", name: "12 о'клок", rarity: "bubafic", desc: "Полночь. Буба смотрит в зеркало. В зеркале — ещё один Буба. Не оборачивайся." },
    { id: "sbityy-buba", name: "Сбитый Буба", rarity: "bubafic", desc: "Летал выше всех. Приземлился в коллекцию. Мемориал уже собирает донаты." },
    { id: "zhirnyy-buba-lazery", name: "Жирный Буба с лазэрами", rarity: "bubafic", desc: "Лазеры из глаз, вес из сердца. Передвигается медленно, но неотвратимо." },

    /* ---------- МИФИЧЕСКИЕ (16) ---------- */
    { id: "kolyaska-buby", name: "Инвалидная коляска Бубы", rarity: "mythic", desc: "Тюнингована, светится, играет музыку. Буба не сдаётся, он дрифтует." },
    { id: "sviti-foks-dzhudi", name: "Свити Фокс и зайка Джуди Хопс", rarity: "mythic", desc: "Кроссовер, о котором никто не просил, но все тайно хотели. Дело раскрыто." },
    { id: "lozhka-buby", name: "Ложка Бубы", rarity: "mythic", desc: "Единственный столовый прибор, который умеет открывать кейсы. И суп." },
    { id: "prosti-syr", name: "Прости, сыр", rarity: "mythic", desc: "Сыр не виноват. Сыр просто оказался не в том месте. Прости, сыр." },
    { id: "nozh-buba-drop", name: "Нож «БУБА ДРОП»", rarity: "mythic", desc: "Наносит урон, но главное — с него начинается любой хороший кейс. Не трогай лезвие." },
    { id: "lyuis", name: "Автомат «Лъюис»", rarity: "mythic", desc: "Стреляет очередями мемов. Перезарядка — через чувство юмора." },
    { id: "ya-uzhe-krasnyy", name: "Я УЖЕ КРАСНЫЙ", rarity: "mythic", desc: "Красный от злости, от стыда или от краски — уже неважно. Главное, что громко." },
    { id: "buba-gost-1337", name: "Буба гость 1337", rarity: "mythic", desc: "Пришёл без приглашения, съел всё, остался на неделю. Легендарный гость." },
    { id: "buba-edit", name: "Буба-эдит", rarity: "mythic", desc: "Отредактирован до идеала. Потом ещё раз. И ещё. Теперь он не отражается в зеркалах." },
    { id: "buba-terrorist-mythic", name: "Буба-террорист 2.0", rarity: "mythic", desc: "Сиквел, который сняли без бюджета, но с душой. Взрывы стали дороже, шутки — мрачнее." },
    { id: "pochemu-on-kruglyy", name: "Почему он круглый?", rarity: "mythic", desc: "Никто не знает. Учёные молчат. Буба просто круглый, и это работает." },
    { id: "telifon", name: "Телифон", rarity: "mythic", desc: "Звонит только в три утра. На том конце провода — тишина и слабое «алло» из 2007 года." },
    { id: "zelenyy-slonik", name: "Зелёный слоник", rarity: "mythic", desc: "Маленький, зелёный, с большими планами. Планы — захватить тумбочку." },
    { id: "monstr-mshchnogo-odela", name: "Монстр из Мщсного одела", rarity: "mythic", desc: "Пришёл из формы, ушёл в кошмар. Стирать нельзя, гладить тем более." },
    { id: "buba-iz-bekrums", name: "Буба из Бэкрумс", rarity: "mythic", desc: "Нашёл выход из жёлтого лабиринта. Выход вёл в другой кейс. Классика." },
    { id: "buba-homelander", name: "Буба Хоумлендер", rarity: "mythic", desc: "Улыбается так, будто сейчас что-то скажет. Лучше не досматривать." },

    /* ---------- СЕКРЕТНЫЕ (8) ---------- */
    { id: "tiki-tiki-tiki", name: "Тiкi Тiкi Тiкi", rarity: "secret", desc: "Повтори три раза. Теперь он в твоей коллекции. И в твоей голове." },
    { id: "buba-britanskie-kolonizatory", name: "Бубы — британские колонизаторы", rarity: "secret", desc: "Принесли цивилизацию, чай и странные правила. Бубы остались навсегда." },
    { id: "buba-iz-huss-valley", name: "Буба из Huss Valley 📍", rarity: "secret", desc: "Локация засекречена. На карте только пин и запах шаурмы." },
    { id: "rip-sora-2", name: "RIP SORA 2", rarity: "secret", desc: "Он ушёл, но обещал вернуться. Коллекция хранит его память и немного пикселей." },
    { id: "koren-81-11", name: "√81/11", rarity: "secret", desc: "Математика не сходится. Никто не знает, что это значит. Это и есть ответ." },
    { id: "sam-buba", name: "Сам Буба", rarity: "secret", desc: "Не предмет. Не мем. Не человек. Сам Буба — это состояние души и причина всех кейсов." },
    { id: "suka-on-belyy", name: "СУКА, ОН БЕЛЫЙ, ЕБАШЬ ЕГО БЛЯТЬ", rarity: "secret", desc: "Кричит вся команда. Белый. Большой. Не двигается. Это не баг, это легенда." },
    { id: "porvannyy-tuz", name: "Порванный туз", rarity: "secret", weight: 0.5, bonus: true, desc: "Бонусный предмет из кармана Бубы. Туз порван, везение — нет. Выпадает реже остальных секретов." }
  ];

  const ITEMS = RAW.map(function (item, index) {
    const rarity = RARITIES[item.rarity];
    return {
      id: item.id,
      name: item.name,
      rarity: item.rarity,
      desc: item.desc,
      img: "assets/items/" + item.id + ".webp",
      num: index + 1,
      weight: item.weight || 1,
      bonus: !!item.bonus,
      xp: rarity.xp,
      value: rarity.coins,
      rarityOrder: rarity.order
    };
  });

  const ITEMS_BY_ID = {};
  ITEMS.forEach(function (item) { ITEMS_BY_ID[item.id] = item; });

  const BY_RARITY = {};
  Object.keys(RARITIES).forEach(function (key) {
    const pool = ITEMS.filter(function (item) { return item.rarity === key; });
    const weightSum = pool.reduce(function (sum, item) { return sum + item.weight; }, 0);
    pool.forEach(function (item) {
      item.chance = RARITIES[key].chance * (item.weight / weightSum);
    });
    BY_RARITY[key] = pool;
  });

  window.BUBA = {
    RARITIES: RARITIES,
    RARITY_ORDER: ["common", "uncommon", "rare", "epic", "legendary", "bubafic", "mythic", "secret"],
    ITEMS: ITEMS,
    ITEMS_BY_ID: ITEMS_BY_ID,
    BY_RARITY: BY_RARITY,
    TOTAL_ITEMS: ITEMS.length
  };
})();
