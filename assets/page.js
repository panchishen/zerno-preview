/* ==========================================================================
   Зерно · скрипт внутренних страниц (афиша, событие, новости, новость)
   1) меряет высоту сквозной шапки → --header-h
   2) появление элементов .reveal (тот же механизм, что на главной)
   3) фильтр афиши по типу события (чипы)
   4) «Показать ещё» — раскрывает следующую порцию карточек
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

  // ===== 3. Фильтр по типу события =====
  // Чипы несут data-filter, карточки — data-type. «Все» = пустой фильтр.
  var чипы = [].slice.call(document.querySelectorAll('[data-filter]'));
  var пусто = document.querySelector('[data-empty]');

  function применитьФильтр(тип){
    if (!чипы.length) return;                        // на странице без фильтра делать нечего
    var видимых = 0;
    [].forEach.call(document.querySelectorAll('.month'), function(месяц){
      if (месяц.dataset.hidden === 'true') return;   // ещё не раскрыт кнопкой «показать ещё»
      var карточки = месяц.querySelectorAll('[data-type]');
      if (!карточки.length) return;                  // группа не участвует в фильтрации
      var вМесяце = 0;
      [].forEach.call(карточки, function(карточка){
        var подходит = !тип || карточка.dataset.type === тип;
        карточка.hidden = !подходит;
        if (подходит) вМесяце++;
      });
      месяц.hidden = вМесяце === 0;
      видимых += вМесяце;
    });
    if (пусто) пусто.hidden = видимых !== 0;
  }

  чипы.forEach(function(чип){
    чип.addEventListener('click', function(){
      чипы.forEach(function(c){ c.setAttribute('aria-pressed', String(c === чип)); });
      применитьФильтр(чип.dataset.filter);
    });
  });

  // ===== 4. «Показать ещё» =====
  // Кнопка раскрывает следующий скрытый .month (или .cards-batch) и прячется,
  // когда раскрывать больше нечего.
  var ещё = document.querySelector('[data-more]');
  if (ещё){
    var строка = ещё.closest('.more-row') || ещё;
    var порции = [].slice.call(document.querySelectorAll('[data-batch]'));

    var обновитьКнопку = function(){
      if (!порции.some(function(п){ return п.dataset.hidden === 'true'; })) строка.hidden = true;
    };
    обновитьКнопку();

    ещё.addEventListener('click', function(){
      var следующая = порции.filter(function(п){ return п.dataset.hidden === 'true'; })[0];
      if (!следующая) { строка.hidden = true; return; }
      следующая.dataset.hidden = 'false';
      следующая.hidden = false;

      // фильтр применяем до показа: иначе карточки чужого типа успевают мигнуть
      var активный = чипы.filter(function(c){ return c.getAttribute('aria-pressed') === 'true'; })[0];
      применитьФильтр(активный ? активный.dataset.filter : '');

      var новые = [].slice.call(следующая.querySelectorAll('.reveal'))
        .filter(function(el){ return el.offsetParent !== null; });
      // наблюдатель к ним больше не нужен — показываем вручную
      новые.forEach(function(el){ if (наблюдатель) наблюдатель.unobserve(el); });

      if (безАнимации){
        новые.forEach(function(el){ el.classList.add('in'); });
      } else {
        // Стартовый кадр: чтение offsetHeight заставляет браузер посчитать стили уже
        // показанных, но ещё прозрачных карточек. Без этого переход из display:none
        // сразу в .in не анимируется — не с чего начинать, и карточки появляются рывком.
        // Синхронно, без requestAnimationFrame: в фоновой вкладке кадры не выдаются,
        // и отложенный показ там не случился бы вовсе.
        новые.forEach(function(el){ el.style.transitionDelay = ''; void el.offsetHeight; });
        новые.forEach(function(el, i){
          el.style.transitionDelay = задержка(i);
          el.classList.add('in');
        });
      }

      обновитьКнопку();
    });
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
