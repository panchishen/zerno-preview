/* ===== Зерно · сквозные хедер и футер =====
   Макеты: Header 63:257, Footer 171:595.

   Подключение на любой странице (в <head>):
     <link rel="stylesheet" href="assets/chrome.css">
     <script src="assets/scrub.js"></script>       <!-- нужен полосе прогресса, без defer -->
     <script src="assets/chrome.js" defer></script>
   Разметку скрипт вставляет сам: хедер — в начало <body>, футер — в конец,
   полоса прогресса — отдельным элементом рядом с хедером (не внутри него).

   Режим хедера:
     data-header="reveal" на <body> — выезжает после первого экрана (главная);
     data-header="static" — виден сразу (внутренние страницы);
     data-header="v2" — второй вариант главной: прозрачная шапка на первом экране
       плюс стики-шапка, которая выезжает после него (макет 430:1292).
   Без атрибута режим определяется автоматически: есть #hero → reveal, иначе static.

   Пункты меню — заглушки без переходов (якорная навигация убрана): ховер и курсор
   работают, клик ничего не делает. Реальные ссылки появятся вместе с внутренними страницами. */
(function(){
  'use strict';

  // пути считаем от самого скрипта — работает и из подпапок
  var BASE = new URL('.', document.currentScript.src);
  var LOGO = new URL('logo_hor.svg', BASE).href;
  var HOME = new URL('../index.html', BASE).href; // основная главная (прежний второй вариант)

  var LOGO_VERT = new URL('logo_vert.svg', BASE).href; // вертикальный знак — только в шапке на тёмном
  // Список пунктов один на все шапки и футер. «Мастер-классы» вместо «Конференц-зала»
  // (правка макета 12.08.2026), музей перед рестораном — вслед за порядком блоков
  // на главной (16.08.2026). Макеты: шапки 36:36, 430:1296, 430:1361, футер 159:417
  var NAV = ['Музей', 'Ресторан', 'Мастер-классы', 'События', 'Контакты'];
  // В шапке архивной страницы состав прежний: её компонент (36:36) «Событий» не получил
  var NAV_ARHIVE = NAV.filter(function(t){ return t !== 'События'; });
  // «События» в шапках раскрываются списком разделов по наведению (макет Dropdown 613:886).
  // В футере тот же пункт остаётся обычной ссылкой — там раскрывать нечего, разделы и так на виду
  var SUBMENU = { 'События': ['Афиша мероприятий', 'Новости'] };
  // В футере «События» разворачиваются в свои разделы: раскрывать по наведению там нечего,
  // а места на отдельные строки хватает — сам пункт «События» из списка уходит
  var NAV_FOOTER = NAV.reduce(function(список, t){ return список.concat(SUBMENU[t] || t); }, []);
  var PHONE = { label:'8 (922) 711-09-40', href:'tel:+79227110940' };
  var ADDRESS = 'Свердловский проспект, 40А';
  // в шапке на тёмном адрес сокращён — там в строке ещё и «Контакты» (макет 430:1358)
  var ADDRESS_SHORT = 'Свердловский пр-кт, 40А';
  // Обязательная подпись под знаком: юридически логотип «Зерно» не используется без неё.
  // В верхнем регистре её рисует CSS, здесь текст в обычном — чтобы скринридер не читал по буквам
  var TAGLINE = 'Еда. Развитие. Инновации.';

  // знак с подписью — одинаково устроен в обеих шапках и в футере (макеты 456:1932, 430:1451)
  function brand(cls, href, title, attrs){
    return '<div class="' + cls + '__brand">' +
      '<a class="' + cls + '__logo" href="' + href + '" title="' + title + '"' + (attrs || '') + '>' +
        '<img src="' + LOGO + '" alt="Зерно" width="228" height="55">' +
      '</a>' +
      '<span class="' + cls + '__tagline">' + TAGLINE + '</span>' +
    '</div>';
  }
  // Соцсети — кнопки-иконки (макет Icon button 352:474). Контуры встроены прямо сюда:
  // так они наследуют цвет через currentColor, чего <img src=".svg"> не умеет.
  // Исходники тех же путей — assets/icons/*.svg, там же нормализация глифа в 20×20.
  var SOCIAL = [
    { id:'vk',       label:'VK',       svg:'<g transform="translate(-3.0593 -3.3592) scale(1.249219)"><path d="M6.79 7.3H4.05c.13 6.24 3.25 9.99 8.72 9.99h.31v-3.57c2.01.2 3.53 1.67 4.14 3.57h2.84c-.78-2.84-2.83-4.41-4.11-5.01 1.28-.74 3.08-2.54 3.51-4.98h-2.58c-.56 1.98-2.22 3.78-3.8 3.95V7.3H10.5v6.92c-1.6-.4-3.62-2.34-3.71-6.92Z"/></g>' },
    { id:'max',      label:'MAX',      svg:'<g transform="translate(1.6456 1.7741) scale(0.028560)"><path d="M350.4,9.6C141.8,20.5,4.1,184.1,12.8,390.4c3.8,90.3,40.1,168,48.7,253.7,2.2,22.2-4.2,49.6,21.4,59.3,31.5,11.9,79.8-8.1,106.2-26.4,9-6.1,17.6-13.2,24.2-22,27.3,18.1,53.2,35.6,85.7,43.4,143.1,34.3,299.9-44.2,369.6-170.3C799.6,291.2,622.5-4.6,350.4,9.6h0ZM269.4,504c-11.3,8.8-22.2,20.8-34.7,27.7-18.1,9.7-23.7-.4-30.5-16.4-21.4-50.9-24-137.6-11.5-190.9,16.8-72.5,72.9-136.3,150-143.1,78-6.9,150.4,32.7,183.1,104.2,72.4,159.1-112.9,316.2-256.4,218.6h0Z"/></g>' },
    { id:'telegram', label:'Telegram', svg:'<g transform="translate(-4.9611 -7.3734) scale(1.534684)"><path d="M16.906 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></g>' }
  ];
  function socialButtons(){
    return SOCIAL.map(function(s){
      return '<a class="ft__soc-btn" href="#" data-soon aria-label="' + s.label + '">' +
             '<svg viewBox="0 0 24 24" aria-hidden="true">' + s.svg + '</svg></a>';
    }).join('');
  }
  // заглушки: адреса ещё не известны, но это полноценные <a> — работают hover, фокус и курсор.
  // data-soon — клик по такой ссылке ничего не делает (иначе href="#" бросает страницу наверх)
  function stubs(items, сПодменю){
    return items.map(function(t){
      var под = сПодменю && SUBMENU[t];
      if (!под) return '<a href="#" data-soon>' + t + '</a>';
      return '<span class="nav-sub">' +
        '<a href="#" data-soon aria-haspopup="true" aria-expanded="false">' + t + '</a>' +
        '<span class="nav-sub__list">' +
          под.map(function(s){ return '<a href="#" data-soon>' + s + '</a>' }).join('') +
        '</span>' +
      '</span>';
    }).join('');
  }
  function phone(){
    return '<a href="' + PHONE.href + '">' + PHONE.label + '</a>';
  }

  // ===== МОБИЛЬНОЕ МЕНЮ =====
  // На телефоне горизонтальное меню не помещается ни в одну из шапок, поэтому пункты
  // уезжают в панель на весь экран. Кнопка-бургер стоит в каждой шапке, панель одна
  // на страницу: два одинаковых списка разошлись бы при первой же правке состава.
  function burgerHTML(){
    return '<button class="nav-burger" type="button" aria-label="Меню" ' +
           'aria-expanded="false" aria-controls="mobileNav">' +
           '<span></span><span></span><span></span></button>';
  }
  // Состав тот же, что в футере: «События» своей страницы не имеют и в шапках только
  // разводят на «Афишу» и «Новости». Высотой панель не ограничена, поэтому разделы
  // становятся обычными пунктами, а разводящий уровень исчезает вместе с лишним шагом.
  function mobileNavHTML(){
    var пункты = stubs(NAV_FOOTER);
    return '<div class="mnav" id="mobileNav" hidden>' +
      '<div class="mnav__sheet" role="dialog" aria-modal="true" aria-label="Меню">' +
        '<button class="mnav__close" type="button" aria-label="Закрыть меню">' +
          '<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M26 6.80102L16.7999 16L26 25.2001L25.2001 26L16 16.7999L6.79991 26L6 25.2001L15.199 16L6 6.80102L6.79991 6L16 15.2001L25.2001 6L26 6.80102Z"/></svg>' +
        '</button>' +
        '<nav class="mnav__list" aria-label="Основное меню">' + пункты + '</nav>' +
        '<div class="mnav__contacts">' +
          '<a href="' + PHONE.href + '">' + PHONE.label + '</a>' +
          '<span>' + ADDRESS + '</span>' +
          '<span>Время работы: 8:00–22:00</span>' +
        '</div>' +
        '<button class="mnav__btn" type="button" data-booking-open>Забронировать</button>' +
      '</div>' +
    '</div>';
  }

  function headerHTML(){
    var isHome = !!document.getElementById('hero');
    // на главной клик по логотипу перезапускает интро, на внутренних — ведёт домой
    var brandBlock = isHome
      ? brand('hd', '#', 'Зерно — на главную', ' data-restart')
      : brand('hd', HOME, 'Зерно — на главную');
    // «Главная» — единственный рабочий пункт меню (макет 63:257). На самой главной
    // помечен aria-current="page": и подсветка Link/Default, и подсказка для скринридера
    var home = '<a href="' + HOME + '"' + (isHome ? ' aria-current="page"' : '') + '>Главная</a>';
    return '<header class="site-header" id="siteHeader">' +
      '<div class="hd__in">' +
        brandBlock +
        '<nav class="hd__nav" aria-label="Основное меню">' + home + stubs(NAV_ARHIVE) + '</nav>' +
        // соцсети из хедера временно убраны (макет 63:257) — в футере (171:595) пока остаются
        '<div class="hd__right">' + phone() + '</div>' +
        burgerHTML() +
      '</div>' +
    '</header>';
  }

  // ===== Шапки второго варианта главной (макет 430:1292) =====
  // «2 (on dark)»: прозрачная, лежит на видео первого экрана. Логотип вертикальный и по центру,
  // меню и контакты — по краям. Уезжает вместе с первым экраном, поэтому position:absolute.
  function heroHeaderHTML(){
    // «Контакты» здесь не в меню, а в правой группе — рядом с адресом и телефоном (макет 430:1358)
    return '<header class="hero-header">' +
      '<nav class="hero-header__nav" aria-label="Основное меню">' +
        stubs(NAV.slice(0, -1), true) +   // «Контакты» ушли в правую группу, «Главной» в меню больше нет
      '</nav>' +
      // Два знака: вертикальный — как в макете первого экрана, горизонтальный включается
      // с 1024, когда меню уезжает в бургер и шапка становится однострочной. Переключает
      // их CSS: при смене ширины окна знак меняется сразу, без пересборки разметки.
      '<a class="hero-header__brand" href="#" data-top title="Зерно — наверх">' +
        '<img class="hero-header__logo--vert" src="' + LOGO_VERT + '" alt="Зерно" width="205" height="100">' +
        '<img class="hero-header__logo--hor" src="' + LOGO + '" alt="Зерно" width="228" height="55">' +
        '<span class="hero-header__tagline">' + TAGLINE + '</span>' +
      '</a>' +
      '<div class="hero-header__contacts">' +
        '<span>' + ADDRESS_SHORT + '</span>' + phone() + stubs(NAV.slice(-1)) +
      '</div>' +
      burgerHTML() +
    '</header>';
  }
  // «2»: стики-шапка. От первого варианта отличается раскладкой и кнопкой брони,
  // механика появления общая — класс .site-header--reveal и проверка в init()
  function headerV2HTML(){
    return '<header class="site-header site-header--v2" id="siteHeader">' +
      '<div class="hd__in">' +
        brand('hd', '#', 'Зерно — наверх', ' data-top') +
        '<nav class="hd__nav" aria-label="Основное меню">' +
          stubs(NAV, true) +         // «Главной» в меню больше нет (макет 430:1296)
        '</nav>' +
        '<div class="hd__right">' +
          '<span>' + ADDRESS + '</span>' + phone() +
          '<button class="hd__btn" type="button">Забронировать</button>' +
        '</div>' +
        burgerHTML() +
      '</div>' +
    '</header>';
  }

  // Полоса прогресса — отдельный элемент, не часть шапки: она поверх шапки и не зависит
  // от того, показана та или нет. aria-hidden — то же самое сообщает нативный скроллбар.
  function progressHTML(){
    return '<div class="scroll-progress" id="scrollProgress" aria-hidden="true"><i></i></div>';
  }

  // isV2 отличает только поведение логотипа: во втором варианте он ведёт наверх страницы,
  // в первом — на главную. Подпись под знаком в футере одинаковая у обоих (макет 171:595)
  function footerHTML(isV2){
    var brandBlock = isV2
      ? brand('ft', '#', 'Зерно — наверх', ' data-top')
      : brand('ft', HOME, 'Зерно — на главную');
    return '<footer class="site-footer">' +
      '<div class="ft__in">' +
        brandBlock +
        '<nav class="ft__col" aria-label="Разделы сайта">' + stubs(NAV_FOOTER) + '</nav>' +
        '<div class="ft__col">' +
          phone() +
          '<span>' + ADDRESS + '</span>' +
          '<span>Время работы: 8:00–22:00</span>' +
          '<div class="ft__soc">' + socialButtons() + '</div>' +  // соцсети внизу колонки (макет 159:422: y=132, ниже времени работы)
        '</div>' +
        // правый блок — вторичным цветом (макет 171:595)
        '<div class="ft__col ft__col--secondary">' +
          '<a href="#" data-soon>Политика обработки персональных данных</a>' +
          '<span>2026 © ООО «Объединение «Союзпищепром»</span>' +
          '<span>Комплексное продвижение — <a href="#" data-soon>Алькон</a></span>' +
        '</div>' +
      '</div>' +
    '</footer>';
  }

  // Ширина видимой области без полосы прокрутки. Сетка страницы считается от --vw:
  // 100vw полосу включает (scrollbar-gutter:stable), и правое поле выходило уже левого.
  function ширинаОкна(){
    // ноль приходит, когда вкладка ещё не отрисована (фоновая загрузка): в этот момент
    // переопределять сетку нельзя — контейнер схлопнулся бы до нуля
    var w = document.documentElement.clientWidth;
    if (w > 0) document.documentElement.style.setProperty('--vw', w + 'px');
  }

  function init(){
    ширинаОкна();
    // ResizeObserver, а не событие resize: clientWidth меняется и без изменения окна —
    // например когда полоса прокрутки появляется или исчезает вместе с высотой контента
    if (window.ResizeObserver) new ResizeObserver(ширинаОкна).observe(document.documentElement);
    else addEventListener('resize', ширинаОкна);

    var hero = document.getElementById('hero');
    var mode = document.body.dataset.header || (hero ? 'reveal' : 'static');
    var isV2 = mode === 'v2';

    document.body.insertAdjacentHTML('afterbegin',
      (isV2 ? heroHeaderHTML() + headerV2HTML() : headerHTML()) + progressHTML());
    document.body.insertAdjacentHTML('beforeend', footerHTML(isV2) + mobileNavHTML());

    var header = document.getElementById('siteHeader');

    if ((mode === 'reveal' || isV2) && hero){
      header.classList.add('site-header--reveal');
      var check = function(){
        header.classList.toggle('show', hero.getBoundingClientRect().bottom <= 0);
      };
      addEventListener('scroll', check, { passive:true });
      addEventListener('resize', check);
      check();
    }

    // href="#" у заглушек нужен только ради hover/фокуса — прыгать наверх по клику незачем.
    // data-top — наоборот, наверх и надо: так ведут себя логотипы и «Главная» на самой главной
    document.addEventListener('click', function(e){
      if (!e.target.closest) return;
      if (e.target.closest('[data-soon]')) { e.preventDefault(); return; }
      if (e.target.closest('[data-top]')) {
        e.preventDefault();
        scrollTo({ top:0, behavior:'smooth' });
      }
    });

    // Само раскрытие подменю делает CSS (:hover и :focus-within). Скрипт добавляет то,
    // чего CSS не умеет: сообщает состояние скринридеру и даёт открыть список на тач-экране,
    // где наведения нет вовсе. Второй тап по пункту закрывает, тап мимо — тоже.
    document.querySelectorAll('.nav-sub').forEach(function(обёртка){
      var пункт = обёртка.querySelector('[aria-haspopup]');
      if (!пункт) return;
      function состояние(открыт){ пункт.setAttribute('aria-expanded', открыт ? 'true' : 'false'); }
      обёртка.addEventListener('mouseenter', function(){ состояние(true); });
      обёртка.addEventListener('mouseleave', function(){ обёртка.classList.remove('is-open'); состояние(false); });
      обёртка.addEventListener('focusin',  function(){ состояние(true); });
      обёртка.addEventListener('focusout', function(){
        if (!обёртка.contains(document.activeElement)) состояние(false);
      });
      пункт.addEventListener('click', function(){ состояние(обёртка.classList.toggle('is-open')); });
    });
    // тап мимо закрывает раскрытый на тач список
    document.addEventListener('click', function(e){
      document.querySelectorAll('.nav-sub.is-open').forEach(function(n){
        if (!n.contains(e.target)) n.classList.remove('is-open');
      });
    });

    // ===== Мобильное меню: открытие, закрытие, блокировка прокрутки =====
    // Прокрутку гасим так же, как модалка бронирования (overflow на body): место под полосу
    // прокрутки зарезервировано через scrollbar-gutter, поэтому вёрстка не дёргается.
    var панель = document.getElementById('mobileNav');
    if (панель){
      var бургеры = document.querySelectorAll('.nav-burger');
      var открыта = false;

      function показать(){
        if (открыта) return;
        открыта = true;
        панель.hidden = false;
        // Чтение offsetWidth заставляет браузер пересчитать раскладку прямо сейчас, поэтому
        // закрытое состояние успевает отрисоваться и переход проигрывается. Через rAF было бы
        // тем же по смыслу, но в фоновой вкладке кадры не идут — и панель зависла бы прозрачной.
        void панель.offsetWidth;
        панель.classList.add('is-open');
        document.body.style.overflow = 'hidden';
        бургеры.forEach(function(b){ b.setAttribute('aria-expanded', 'true'); });
        var первая = панель.querySelector('.mnav__close');
        if (первая) первая.focus();
      }
      function спрятать(){
        if (!открыта) return;
        открыта = false;
        панель.classList.remove('is-open');
        document.body.style.overflow = '';
        бургеры.forEach(function(b){ b.setAttribute('aria-expanded', 'false'); });
        // прячем от скринридера и клавиатуры только после того, как панель уехала
        setTimeout(function(){ if (!открыта) панель.hidden = true; }, 300);
      }

      бургеры.forEach(function(b){ b.addEventListener('click', показать); });
      панель.addEventListener('click', function(e){
        // закрывает крестик, любой пункт меню и подложка мимо листа
        if (e.target.closest('.mnav__close, .mnav__list a, .mnav__btn') || e.target === панель) спрятать();
      });
      addEventListener('keydown', function(e){ if (e.key === 'Escape') спрятать(); });
      // окно стало шире брейкпоинта (поворот планшета) — меню в шапке снова на месте,
      // висящая панель только мешала бы
      addEventListener('resize', function(){
        if (открыта && document.documentElement.clientWidth > 1024) спрятать();
      });
    }

    var restart = header.querySelector('[data-restart]');
    if (restart) restart.addEventListener('click', function(e){
      e.preventDefault();
      history.scrollRestoration = 'manual';
      scrollTo(0, 0);
      location.reload();
    });

    // Прогресс прокрутки: 0 — верх страницы, 1 — низ (макет 187:441).
    // Сглажен тем же демпфером, что и hero: рисуем не позицию скролла, а значение, которое
    // её догоняет. Сближение экспоненциальное — скорость сама нарастает и сама гаснет у цели.
    // Идёт последним в init: если на странице забыли scrub.js, упадёт только полоса.
    var bar  = document.getElementById('scrollProgress');
    var fill = bar.querySelector('i');
    createScrub({
      progress: function(){
        var total = document.documentElement.scrollHeight - innerHeight;
        return total > 0 ? Math.min(1, Math.max(0, scrollY / total)) : 0; // короткая страница — делить нельзя
      },
      render: function(p){ fill.style.transform = 'scaleX(' + p + ')'; },
      tau: .15 // «время догона»: больше — мягче и ватнее, меньше — резче и точнее
      // maxSpeed намеренно не задаём: потолок скорости — это про «доиграть до конца», а полосе
      // надо про «плавно нагнать». Экспонента и так тормозит у цели, потолок лишь добавил бы отставания.
    });

    // показ — по «сырому» скроллу, а не по сглаженному: появляться полоса опаздывать не должна
    var showBar = function(){ bar.classList.toggle('show', scrollY > 0); };
    addEventListener('scroll', showBar, { passive:true });
    showBar();
  }

  if (document.readyState === 'loading') addEventListener('DOMContentLoaded', init);
  else init();
})();
