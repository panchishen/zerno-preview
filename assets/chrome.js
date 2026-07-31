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
     data-header="static" — виден сразу (внутренние страницы).
   Без атрибута режим определяется автоматически: есть #hero → reveal, иначе static.

   Пункты меню — заглушки без переходов (якорная навигация убрана): ховер и курсор
   работают, клик ничего не делает. Реальные ссылки появятся вместе с внутренними страницами. */
(function(){
  'use strict';

  // пути считаем от самого скрипта — работает и из подпапок
  var BASE = new URL('.', document.currentScript.src);
  var LOGO = new URL('logo_hor.svg', BASE).href;
  var HOME = new URL('../index.html', BASE).href; // страница переименована из home.html

  var NAV = ['Ресторан', 'Музей', 'Конференц-зал', 'Контакты'];
  var PHONE = { label:'8 (922) 711-09-40', href:'tel:+79227110940' };
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
  function stubs(items){
    return items.map(function(t){ return '<a href="#" data-soon>' + t + '</a>' }).join('');
  }
  function phone(){
    return '<a href="' + PHONE.href + '">' + PHONE.label + '</a>';
  }

  function headerHTML(){
    var isHome = !!document.getElementById('hero');
    // на главной клик по логотипу перезапускает интро, на внутренних — ведёт домой
    var logo = isHome
      ? '<a class="hd__logo" href="#" title="Зерно — на главную" data-restart>'
      : '<a class="hd__logo" href="' + HOME + '" title="Зерно — на главную">';
    // «Главная» — единственный рабочий пункт меню (макет 63:257). На самой главной
    // помечен aria-current="page": и подсветка Link/Default, и подсказка для скринридера
    var home = '<a href="' + HOME + '"' + (isHome ? ' aria-current="page"' : '') + '>Главная</a>';
    return '<header class="site-header" id="siteHeader">' +
      '<div class="hd__in">' +
        logo +
          '<img src="' + LOGO + '" alt="Зерно — на главную" width="234" height="56">' +
        '</a>' +
        '<nav class="hd__nav" aria-label="Основное меню">' + home + stubs(NAV) + '</nav>' +
        // соцсети из хедера временно убраны (макет 63:257) — в футере (171:595) пока остаются
        '<div class="hd__right">' + phone() + '</div>' +
      '</div>' +
    '</header>';
  }

  // Полоса прогресса — отдельный элемент, не часть шапки: она поверх шапки и не зависит
  // от того, показана та или нет. aria-hidden — то же самое сообщает нативный скроллбар.
  function progressHTML(){
    return '<div class="scroll-progress" id="scrollProgress" aria-hidden="true"><i></i></div>';
  }

  function footerHTML(){
    return '<footer class="site-footer">' +
      '<div class="ft__in">' +
        '<a class="ft__logo" href="' + HOME + '" title="Зерно — на главную">' +
          '<img src="' + LOGO + '" alt="Зерно" width="234" height="56">' +
        '</a>' +
        '<nav class="ft__col" aria-label="Разделы сайта">' + stubs(NAV) + '</nav>' +
        '<div class="ft__col">' +
          phone() +
          '<div class="ft__soc">' + socialButtons() + '</div>' +
          '<span>Свердловский проспект, 40А</span>' +
          '<span>Время работы: 8:00–22:00</span>' +
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

  function init(){
    document.body.insertAdjacentHTML('afterbegin', headerHTML() + progressHTML());
    document.body.insertAdjacentHTML('beforeend', footerHTML());

    var header = document.getElementById('siteHeader');
    var hero = document.getElementById('hero');
    var mode = document.body.dataset.header || (hero ? 'reveal' : 'static');

    if (mode === 'reveal' && hero){
      header.classList.add('site-header--reveal');
      var check = function(){
        header.classList.toggle('show', hero.getBoundingClientRect().bottom <= 0);
      };
      addEventListener('scroll', check, { passive:true });
      addEventListener('resize', check);
      check();
    }

    // href="#" у заглушек нужен только ради hover/фокуса — прыгать наверх по клику незачем
    document.addEventListener('click', function(e){
      var stub = e.target.closest && e.target.closest('[data-soon]');
      if (stub) e.preventDefault();
    });

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
