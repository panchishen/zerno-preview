/* ===== Зерно · тултип (макет 615:1059) =====
   Подсказка по наведению и по фокусу с клавиатуры.

   Как пользоваться: атрибут data-tooltip="текст" на любом элементе — кнопке, ссылке,
   иконке. Разметку добавлять не нужно: узел один на всю страницу, скрипт переносит его
   к нужному элементу. Так подсказку не режет overflow родителя и не перекрывают соседи.

   Сторона выбирается сама: сверху, а если там не помещается — снизу. По горизонтали
   подсказка стоит по центру элемента и прижимается к краю экрана, если не влезает. */
(function(){
  'use strict';

  var ОТСТУП = 8;        // зазор между элементом и подсказкой
  var ПОЛЕ = 8;          // минимальный отступ от краёв экрана
  var ЗАДЕРЖКА = 150;    // мс: подсказка не должна мелькать, когда курсор просто проезжает мимо
  var ПЕРЕНОС = 40;      // длиннее — переносим по словам, а не тянем в одну строку

  var узел = null, текущий = null, таймер = null;

  function создать(){
    узел = document.createElement('div');
    узел.className = 'tooltip';
    узел.id = 'zerno-tooltip';
    узел.setAttribute('role', 'tooltip');
    document.body.appendChild(узел);
    return узел;
  }

  function поставить(el){
    var э = el.getBoundingClientRect();
    var т = узел.getBoundingClientRect();   // visibility:hidden не мешает: раскладка уже посчитана
    var сверху = э.top - т.height - ОТСТУП;
    var y = сверху >= ПОЛЕ ? сверху : э.bottom + ОТСТУП;
    var x = э.left + э.width / 2 - т.width / 2;
    x = Math.max(ПОЛЕ, Math.min(x, window.innerWidth - т.width - ПОЛЕ));
    узел.style.left = Math.round(x) + 'px';
    узел.style.top  = Math.round(y) + 'px';
  }

  function показать(el){
    var текст = el.getAttribute('data-tooltip');
    if (!текст) return;
    узел = узел || создать();
    узел.textContent = текст;
    узел.classList.toggle('tooltip--wrap', текст.length > ПЕРЕНОС);
    поставить(el);                         // сначала место, потом показ — иначе кадр в старой точке
    узел.classList.add('is-open');
    el.setAttribute('aria-describedby', узел.id);
    текущий = el;
  }

  function скрыть(){
    if (таймер){ clearTimeout(таймер); таймер = null; }
    if (!текущий) return;
    текущий.removeAttribute('aria-describedby');
    текущий = null;
    if (узел) узел.classList.remove('is-open');
  }

  function запросить(el){
    if (текущий === el) return;
    скрыть();
    таймер = setTimeout(function(){ таймер = null; показать(el); }, ЗАДЕРЖКА);
  }

  function цель(e){
    return e.target && e.target.closest ? e.target.closest('[data-tooltip]') : null;
  }

  document.addEventListener('pointerover', function(e){
    var el = цель(e);
    if (el) запросить(el); else скрыть();
  });
  document.addEventListener('pointerdown', function(e){
    if (!цель(e)) скрыть();               // тап мимо убирает подсказку, вызванную тапом
  });
  // фокус с клавиатуры показывает подсказку сразу: там нет случайного «проезда мимо»
  document.addEventListener('focusin', function(e){
    var el = цель(e);
    if (el) { скрыть(); показать(el); }
  });
  document.addEventListener('focusout', скрыть);
  document.addEventListener('keydown', function(e){
    if (e.key === 'Escape') скрыть();
  });
  // при прокрутке и смене размера подсказка уехала бы от своего элемента — проще убрать
  window.addEventListener('scroll', скрыть, true);
  window.addEventListener('resize', скрыть);
})();
