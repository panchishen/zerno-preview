/* ===== Зерно · сквозные хедер и футер =====
   Макеты: Header 63:257, Footer 171:595.

   Подключение на любой странице (в <head>):
     <link rel="stylesheet" href="assets/chrome.css">
     <script src="assets/chrome.js" defer></script>
   Разметку скрипт вставляет сам: хедер — в начало <body>, футер — в конец.

   Режим хедера:
     data-header="reveal" на <body> — выезжает после первого экрана (главная);
     data-header="static" — виден сразу (внутренние страницы).
   Без атрибута режим определяется автоматически: есть #hero → reveal, иначе static.

   Пункты меню ведут на якорь текущей страницы, если такая секция на ней есть,
   иначе — на главную с якорем. Поэтому на внутренних страницах меню работает само. */
(function(){
  'use strict';

  // пути считаем от самого скрипта — работает и из подпапок
  var BASE = new URL('.', document.currentScript.src);
  var LOGO = new URL('logo_hor.svg', BASE).href;
  var HOME = new URL('../home.html', BASE).href;

  var NAV = [
    { label:'Ресторан',       id:'restaurant' },
    { label:'Музей',          id:'s3'         },
    { label:'Открытая кухня', id:'kitchen'    },
    { label:'Контакты',       id:'contacts'   }
  ];
  var PHONE = { label:'8 800 550 1898', href:'tel:+78005501898' };
  var SOCIAL = ['VK', 'MAX', 'Telegram']; // реальные ссылки добавим, когда будут

  // якорь своей страницы, если секция здесь есть; иначе — переход на главную
  function href(id){
    return document.getElementById(id) ? '#' + id : HOME + '#' + id;
  }
  function links(items){
    return items.map(function(i){
      return '<a href="' + href(i.id) + '">' + i.label + '</a>';
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
    return '<header class="site-header" id="siteHeader">' +
      '<div class="hd__in">' +
        logo +
          '<img src="' + LOGO + '" alt="Зерно — на главную" width="200" height="48">' +
        '</a>' +
        '<nav class="hd__nav" aria-label="Основное меню">' + links(NAV) + '</nav>' +
        '<div class="hd__right">' + stubs(SOCIAL) + phone() + '</div>' +
      '</div>' +
    '</header>';
  }

  function footerHTML(){
    return '<footer class="site-footer">' +
      '<div class="ft__in">' +
        '<a class="ft__logo" href="' + HOME + '" title="Зерно — на главную">' +
          '<img src="' + LOGO + '" alt="Зерно" width="245" height="59">' +
        '</a>' +
        '<nav class="ft__col" aria-label="Разделы сайта">' + links(NAV) + '</nav>' +
        '<div class="ft__col">' +
          phone() +
          '<div class="ft__soc">' + stubs(SOCIAL) + '</div>' +
          '<span>Свердловский проспект, 40А</span>' +
        '</div>' +
        '<div class="ft__col">' +
          '<a href="#" data-soon>Политика обработки персональных данных</a>' +
          '<span>2026 © ООО «Объединение «Союзпищепром»</span>' +
          '<span>Комплексное продвижение — <a href="#" data-soon>Алькон</a></span>' +
        '</div>' +
      '</div>' +
    '</footer>';
  }

  function init(){
    document.body.insertAdjacentHTML('afterbegin', headerHTML());
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
  }

  if (document.readyState === 'loading') addEventListener('DOMContentLoaded', init);
  else init();
})();
