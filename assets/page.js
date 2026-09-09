/* ==========================================================================
   Зерно · скрипт внутренних страниц (афиша, событие, новости, новость)
   1) меряет высоту сквозной шапки → --header-h
   2) появление элементов .reveal (тот же механизм, что на главной)
   3) лента карточек: фильтр по типу + «Показать ещё»
   ========================================================================== */
(function(){
  'use strict';

  // Общие параметры появления: шаг задержки между соседями и потолок задержки.
  // Ими пользуются и наблюдатель прокрутки, и подгрузка по кнопке — чтобы
  // догруженные карточки выезжали так же, как блоки при скролле.
  var STEP = 0.2, CAP = 1.2;
  var задержка = function(n){ return Math.min(n * STEP, CAP).toFixed(2) + 's'; };
  var безАнимации = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var наблюдатель = null;   // назначается в разделе 2

  // ===== 1. Высота шапки =====
  // Шапку вставляет chrome.js на DOMContentLoaded; setTimeout(0) гарантирует, что
  // замер случится после его init() независимо от порядка подписки на событие.
  function мерить(){
    var шапка = document.getElementById('siteHeader');
    if (шапка) document.documentElement.style.setProperty('--header-h', шапка.offsetHeight + 'px');
  }
  if (document.readyState === 'loading'){
    addEventListener('DOMContentLoaded', function(){ setTimeout(мерить, 0); });
  } else setTimeout(мерить, 0);
  addEventListener('resize', мерить);

  // ===== 1½. Лента чипов на узких экранах =====
  // Ниже 1024 чипы (вкладки меню, фильтры афиши) лежат в горизонтальной ленте с прокруткой
  // (page.css, .chips). Нажатый чип у края экрана оставался бы полускрытым — а вместе с ним
  // и сосед, до которого хочется дотянуться следующим. Поэтому после нажатия лента сама
  // подъезжает так, чтобы активный чип встал по центру видимой части.
  // Обработчик делегированный: и вкладки меню, и фильтры афиши вешают свои клики сами,
  // здесь только прокрутка. Крутится сама лента, а не страница: scrollIntoView мог бы
  // заодно дёрнуть окно по вертикали.
  document.addEventListener('click', function(e){
    var чип = e.target.closest('.chips .chip');
    if (!чип) return;
    var лента = чип.closest('.chips');
    if (лента.scrollWidth <= лента.clientWidth + 1) return;   // всё помещается — ехать некуда
    var л = лента.getBoundingClientRect(), ч = чип.getBoundingClientRect();
    var цель = лента.scrollLeft + (ч.left - л.left) - (л.width - ч.width) / 2;
    лента.scrollTo({ left: Math.max(0, цель), behavior: безАнимации ? 'auto' : 'smooth' });
  });

  // ===== 3. Лента карточек =====
  // Все карточки лежат в ОДНОЙ сетке [data-list] — тогда при любом фильтре ряды
  // остаются по три, а не рассыпаются в колонку. Видно первые ПОРЦИЯ штук из
  // подходящих под фильтр; остальные открывает «Показать ещё».
  var ПОРЦИЯ = 6;
  var сетка = document.querySelector('[data-list]');

  if (сетка){
    var карточки = [].slice.call(сетка.querySelectorAll('.card'));
    var чипы = [].slice.call(document.querySelectorAll('[data-filter]'));
    var пусто = document.querySelector('[data-empty]');
    var ещё = document.querySelector('[data-more]');
    var строкаЕщё = ещё ? (ещё.closest('.more-row') || ещё) : null;
    var показано = ПОРЦИЯ;

    var активныйТип = function(){
      var чип = чипы.filter(function(c){ return c.getAttribute('aria-pressed') === 'true'; })[0];
      return чип ? чип.dataset.filter : '';
    };

    // Показ догруженных карточек той же анимацией, что и при скролле.
    // Синхронно, без requestAnimationFrame: в фоновой вкладке кадры не выдаются,
    // и отложенный показ там не случился бы вовсе.
    var показатьПлавно = function(новые){
      if (!новые.length) return;
      новые.forEach(function(el){ if (наблюдатель) наблюдатель.unobserve(el); });
      if (безАнимации){ новые.forEach(function(el){ el.classList.add('in'); }); return; }
      // стартовый кадр: без него переход из display:none сразу в .in не анимируется
      новые.forEach(function(el){ el.style.transitionDelay = ''; void el.offsetHeight; });
      новые.forEach(function(el, i){
        el.style.transitionDelay = задержка(i);
        el.classList.add('in');
      });
    };

    var отрисовать = function(анимировать){
      var тип = активныйТип();
      var подходящие = карточки.filter(function(c){ return !тип || c.dataset.type === тип; });
      var новые = [];
      карточки.forEach(function(c){
        var место = подходящие.indexOf(c);
        var видима = место > -1 && место < показано;
        if (видима && c.hidden) новые.push(c);
        c.hidden = !видима;
      });
      if (пусто) пусто.hidden = подходящие.length !== 0;
      if (строкаЕщё) строкаЕщё.hidden = подходящие.length <= показано;
      if (анимировать) показатьПлавно(новые);
    };

    чипы.forEach(function(чип){
      чип.addEventListener('click', function(){
        if (чип.getAttribute('aria-pressed') === 'true') return;
        чипы.forEach(function(c){ c.setAttribute('aria-pressed', String(c === чип)); });
        показано = ПОРЦИЯ;          // новый фильтр — снова первая порция
        отрисовать(true);
      });
    });

    if (ещё) ещё.addEventListener('click', function(){
      показано += ПОРЦИЯ;
      отрисовать(true);
    });

    отрисовать(false);              // стартовое состояние: лишние карточки скрыты
  }

  // ===== 2. Появление элементов =====
  var items = [].slice.call(document.querySelectorAll('.reveal'));
  if (!items.length) return;

  if (безАнимации){
    items.forEach(function(el){ el.classList.add('in'); });
    return;
  }

  var order = new Map(items.map(function(el, i){ return [el, i]; }));
  наблюдатель = new IntersectionObserver(function(entries, obs){
    entries.filter(function(e){ return e.isIntersecting; })
      .sort(function(a, b){ return order.get(a.target) - order.get(b.target); })
      .forEach(function(e, n){
        e.target.style.transitionDelay = задержка(n);
        e.target.classList.add('in');
        obs.unobserve(e.target);
      });
  }, { threshold: 0.15, rootMargin: '0px 0px -22% 0px' });

  requestAnimationFrame(function(){ requestAnimationFrame(function(){
    items.forEach(function(el){ наблюдатель.observe(el); });
  }); });
})();
