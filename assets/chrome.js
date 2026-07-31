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
  var SOCIAL = ['VK', 'MAX', 'Telegram']; // реальные ссылки добавим, когда будут
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
          '<div class="ft__soc">' + stubs(SOCIAL) + '</div>' +
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
