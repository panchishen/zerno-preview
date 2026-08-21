/* ===== Зерно · поведение полей форм =====
   Макеты: Input 585:744, Calendar 587:913.

   Что делает:
   1. Поля даты. На десктопе — air-datepicker в нашей теме; на тач-устройствах
      подменяет тип на native date, потому что системный пикер там объективно
      удобнее любого нарисованного и человек им пользуется каждый день.
   2. Гасит прошедшие даты и занятые дни (список ниже, пока захардкожен).
   3. Ручной ввод даты: точки расставляются сами после каждой пары цифр.
   4. Селекты: вместо системного списка — свой, по макету Dropdown 585:1648.
   5. Поля времени. Заполняет список слотов и гасит те, что уже прошли,
      если выбран сегодняшний день.
   6. Проверка при отправке: подсвечивает пустые обязательные поля. */
(function(){
  'use strict';

  // ЗАГЛУШКА: занятые дни. На боевом сюда придёт выгрузка из системы броней.
  var ЗАНЯТО = ['2026-08-19','2026-08-28','2026-09-05','2026-09-12'];

  var СЛОТЫ = ['12:00','12:30','13:00','13:30','14:00','14:30','15:00','15:30',
               '16:00','16:30','17:00','17:30','18:00','18:30','19:00','19:30',
               '20:00','20:30','21:00'];

  var ТЕКСТ_ОШИБКИ = 'Заполните поле';
  var ПОДСКАЗКА_ПРОШЛА = 'Эта дата уже прошла';   // макет Tooltip 615:1060
  var ПОДСКАЗКА_ЗАНЯТО = 'Нет свободных мест';    // макет Tooltip 615:1062

  var тач = matchMedia('(pointer: coarse)').matches;
  var iso = function(d){
    return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
  };
  var сегодня = function(){ var d = new Date(); d.setHours(0,0,0,0); return d; };

  function занят(date){ return ЗАНЯТО.indexOf(iso(date)) !== -1; }
  function прошёл(date){ return date < сегодня(); }

  // ---------- Подсказка на недоступных днях (макет Tooltip 615:1060, 615:1062) ----------
  // Зачёркивания в календаре больше нет, прошедшие и занятые дни выглядят одинаково.
  // Что именно не так с днём, объясняем при наведении.
  var подсказка = null;

  function элементПодсказки(){
    if (подсказка) return подсказка;
    подсказка = document.createElement('div');
    подсказка.className = 'tip';
    подсказка.setAttribute('aria-hidden', 'true');   // наведение мышью — не для скринридера,
    document.body.appendChild(подсказка);            // ему те же причины сообщит проверка формы
    return подсказка;
  }
  function показатьПодсказку(текст, цель){
    var t = элементПодсказки();
    t.textContent = текст;
    t.classList.add('is-visible');
    var r = цель.getBoundingClientRect(), отступ = 8;
    var снизу = r.bottom + отступ + t.offsetHeight <= window.innerHeight - отступ;
    t.classList.toggle('tip--above', !снизу);
    var x = r.left + r.width / 2, половина = t.offsetWidth / 2;
    x = Math.min(Math.max(x, отступ + половина), window.innerWidth - отступ - половина);  // не вылезаем за края окна
    t.style.left = Math.round(x) + 'px';
    t.style.top = Math.round(снизу ? r.bottom + отступ : r.top - отступ) + 'px';
  }
  function спрятатьПодсказку(){ if (подсказка) подсказка.classList.remove('is-visible'); }

  function подсказкиДней(dp){
    dp.$datepicker.addEventListener('mouseover', function(e){
      var cell = e.target.closest && e.target.closest('.air-datepicker-cell.-day-.-disabled-');
      if (!cell || !cell.dataset.isoDate) return спрятатьПодсказку();
      var d = new Date(cell.dataset.isoDate + 'T00:00:00');
      if (прошёл(d)) показатьПодсказку(ПОДСКАЗКА_ПРОШЛА, cell);
      else if (занят(d)) показатьПодсказку(ПОДСКАЗКА_ЗАНЯТО, cell);
      else спрятатьПодсказку();
    });
    dp.$datepicker.addEventListener('mouseleave', спрятатьПодсказку);
  }

  // ---------- Дата: ручной ввод ----------
  // Точки ставим сами после каждой пары цифр — человеку остаётся набрать 8 цифр подряд.
  // При стирании точку не возвращаем, иначе последний символ невозможно удалить.
  function собратьДату(цифры, удаление){
    var д = цифры.slice(0,2), м = цифры.slice(2,4), г = цифры.slice(4,8);
    var v = д;
    if (д.length === 2 && (м.length || !удаление)) v += '.';
    v += м;
    if (м.length === 2 && (г.length || !удаление)) v += '.';
    return v + г;
  }
  function маскаДаты(input){
    input.setAttribute('inputmode','numeric');
    input.setAttribute('maxlength','10');                       // «дд.мм.гггг»
    input.addEventListener('input', function(e){
      var удаление = !!(e.inputType && e.inputType.indexOf('delete') === 0);
      var было = input.value;
      var цифрДоКурсора = было.slice(0, input.selectionStart || 0).replace(/\D/g,'').length;
      var стало = собратьДату(было.replace(/\D/g,'').slice(0,8), удаление);
      if (стало === было) return;
      input.value = стало;
      // курсор возвращаем к той же цифре, а не в конец строки — иначе правку в середине не внести
      var поз = 0, цифр = 0;
      while (поз < стало.length && цифр < цифрДоКурсора){ if (/\d/.test(стало[поз])) цифр++; поз++; }
      if (!удаление) while (поз < стало.length && !/\d/.test(стало[поз])) поз++;   // встали за точку
      try { input.setSelectionRange(поз, поз); } catch(err){}
    });
  }

  // ---------- Дата ----------
  function ставитьДату(input){
    if (тач){
      // системный пикер: ему нужен ISO-формат и min; занятые дни он показать не умеет,
      // поэтому их отсекает проверка при отправке
      input.type = 'date';
      input.min = iso(сегодня());
      input.dataset.busy = ЗАНЯТО.join(',');
      return;
    }
    маскаДаты(input);                                  // слушатель вешаем до библиотеки, чтобы она разбирала уже готовое «дд.мм.гггг»
    if (typeof AirDatepicker !== 'function') return;   // библиотека не подключилась — поле остаётся обычным текстовым
    input._dp = new AirDatepicker(input, {
      locale: window.airDatepickerRu,
      autoClose: true,
      // Пока календарь открыт, библиотека перехватывает стрелки и Enter на поле:
      // стрелками она листает дни вместо движения курсора, Enter выбирает день.
      // Для поля, которое можно набрать руками, это мешает — навигацию выключаем,
      // Escape закрывает календарь ниже, своим обработчиком.
      keyboardNav: false,
      minDate: сегодня(),                              // прошедшие дни выбрать нельзя
      dateFormat: 'dd.MM.yyyy',
      // ru-локаль библиотеки пишет «Август, 2026» — в макете запятой нет
      navTitles: { days: 'MMMM yyyy', months: 'yyyy', years: 'yyyy1 — yyyy2' },
      prevHtml: '<svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M8.6 12 15.3 5.3l1.4 1.4L11.4 12l5.3 5.3-1.4 1.4z"/></svg>',
      nextHtml: '<svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M15.4 12 8.7 18.7l-1.4-1.4L12.6 12 7.3 6.7l1.4-1.4z"/></svg>',
      onRenderCell: function(o){
        if (o.cellType !== 'day') return;
        if (прошёл(o.date) || занят(o.date)) return { disabled:true };
      },
      onHide: спрятатьПодсказку,
      onSelect: function(o){
        снятьОшибку(input);
        обновитьВремя(o.date);                          // выбрали сегодня — часть слотов уже прошла
      }
    });
    подсказкиДней(input._dp);

    // Escape закрывает календарь, а не всё окно бронирования: событие до него не доходит
    input.addEventListener('keydown', function(e){
      if (e.key !== 'Escape' || !input._dp.visible) return;
      e.stopPropagation();
      input._dp.hide();
    });
  }

  // ---------- Селект: свой список вместо системного (макет Dropdown 585:1648) ----------
  // Родной <select> остаётся в разметке и хранит значение — его же отправит форма
  // и его же читают проверки. Видимая часть — кнопка и список рядом с ней.
  var номерСелекта = 0;

  function сделатьСелект(select){
    if (select._zselect) return select._zselect;
    var box = select.closest('.field__box') || select.parentNode;
    var id  = 'zselect-' + (++номерСелекта);

    var плейсхолдер = '';
    Array.prototype.forEach.call(select.options, function(o){
      if (!плейсхолдер && !o.value) плейсхолдер = o.textContent;
    });

    var кнопка = document.createElement('button');
    кнопка.type = 'button';
    кнопка.className = select.className + ' select__toggle';   // забирает вид .field__control
    кнопка.setAttribute('role', 'combobox');
    кнопка.setAttribute('aria-haspopup', 'listbox');
    кнопка.setAttribute('aria-expanded', 'false');
    кнопка.setAttribute('aria-controls', id);
    var подпись = document.createElement('span');
    подпись.className = 'select__value';
    кнопка.appendChild(подпись);

    var меню = document.createElement('div');
    меню.id = id;
    меню.className = 'select__menu';
    меню.setAttribute('role', 'listbox');
    меню.hidden = true;

    // Родной селект спрятан, и подпись поля больше не достаётся кнопке сама.
    // Имя собираем из подписи и значения на кнопке: «Время 14:00».
    var подписьПоля = (select.closest('.field') || box).querySelector('.field__label');
    if (подписьПоля){
      if (!подписьПоля.id) подписьПоля.id = id + '-label';
      кнопка.id = id + '-button';
      кнопка.setAttribute('aria-labelledby', подписьПоля.id + ' ' + кнопка.id);
      меню.setAttribute('aria-label', подписьПоля.textContent.trim());
    }

    select.classList.add('select__native');
    select.tabIndex = -1;
    box.classList.add('select');
    box.insertBefore(кнопка, select.nextSibling);
    box.appendChild(меню);

    var активный = -1;
    function пункты(){ return Array.prototype.slice.call(меню.children); }
    function доступные(){
      return пункты().filter(function(el){ return !el.classList.contains('select__option--off'); });
    }

    function собрать(){
      меню.innerHTML = '';
      Array.prototype.forEach.call(select.options, function(o, i){
        if (!o.value) return;                                  // плейсхолдер живёт на кнопке
        var el = document.createElement('div');
        el.className = 'select__option';
        el.setAttribute('role', 'option');
        el.id = id + '-' + i;
        el.dataset.i = i;
        el.textContent = o.textContent;
        el.setAttribute('aria-selected', select.selectedIndex === i ? 'true' : 'false');
        if (o.disabled){ el.classList.add('select__option--off'); el.setAttribute('aria-disabled', 'true'); }
        меню.appendChild(el);
      });
    }
    function показать(){
      var o = select.selectedOptions[0];
      var пусто = !o || !o.value;
      подпись.textContent = пусто ? плейсхолдер : o.textContent;
      кнопка.dataset.placeholder = пусто ? 'true' : 'false';
      кнопка.disabled = select.disabled;
    }
    function обновить(){ собрать(); показать(); }

    function активировать(i){
      var сп = пункты();
      сп.forEach(function(el){ el.classList.remove('is-active'); });
      активный = i;
      var el = сп[i];
      if (!el){ кнопка.removeAttribute('aria-activedescendant'); return; }
      el.classList.add('is-active');
      кнопка.setAttribute('aria-activedescendant', el.id);
      var верх = el.offsetTop, низ = верх + el.offsetHeight;   // длинный список (время) подкручиваем к активному
      if (верх < меню.scrollTop) меню.scrollTop = верх;
      else if (низ > меню.scrollTop + меню.clientHeight) меню.scrollTop = низ - меню.clientHeight;
    }
    function шаг(куда){
      var сп = пункты(), сво = доступные();
      if (!сво.length) return;
      var i = сво.indexOf(сп[активный]);
      if (i === -1) i = куда > 0 ? -1 : сво.length;
      var след = сво[Math.min(Math.max(i + куда, 0), сво.length - 1)];
      активировать(сп.indexOf(след));
    }

    function открыть(){
      if (!меню.hidden || select.disabled) return;
      обновить();
      меню.hidden = false;
      box.classList.add('is-open');
      кнопка.setAttribute('aria-expanded', 'true');
      // снизу может не хватить места — тогда раскрываем вверх
      var r = кнопка.getBoundingClientRect(), h = меню.offsetHeight;
      меню.classList.toggle('select__menu--up', window.innerHeight - r.bottom < h + 16 && r.top > h + 16);
      var выбран = меню.querySelector('[aria-selected="true"]');
      активировать(выбран ? пункты().indexOf(выбран) : пункты().indexOf(доступные()[0]));
    }
    function закрыть(вернутьФокус){
      if (меню.hidden) return;
      меню.hidden = true;
      box.classList.remove('is-open');
      кнопка.setAttribute('aria-expanded', 'false');
      кнопка.removeAttribute('aria-activedescendant');
      if (вернутьФокус) кнопка.focus();
    }
    function выбрать(el){
      if (!el || el.classList.contains('select__option--off')) return;
      select.selectedIndex = +el.dataset.i;
      select.dispatchEvent(new Event('change', { bubbles: true }));  // снимает ошибку, пересчитывает слоты времени
      показать();
      закрыть(true);
    }

    кнопка.addEventListener('click', function(e){
      e.preventDefault();                     // поле обёрнуто в <label> — лишнее действие ни к чему
      if (меню.hidden) открыть(); else закрыть(true);
    });
    кнопка.addEventListener('keydown', function(e){
      var k = e.key;
      if (меню.hidden){
        if (k === 'ArrowDown' || k === 'ArrowUp' || k === 'Enter' || k === ' ' || k === 'Spacebar'){ e.preventDefault(); открыть(); }
        return;
      }
      if (k === 'Escape'){ e.preventDefault(); закрыть(true); }
      else if (k === 'ArrowDown'){ e.preventDefault(); шаг(1); }
      else if (k === 'ArrowUp'){ e.preventDefault(); шаг(-1); }
      else if (k === 'Home'){ e.preventDefault(); активировать(пункты().indexOf(доступные()[0])); }
      else if (k === 'End'){ e.preventDefault(); var д = доступные(); активировать(пункты().indexOf(д[д.length - 1])); }
      else if (k === 'Enter' || k === ' ' || k === 'Spacebar'){ e.preventDefault(); выбрать(пункты()[активный]); }
      else if (k === 'Tab'){ закрыть(false); }
    });
    меню.addEventListener('mousedown', function(e){ e.preventDefault(); });   // фокус остаётся на кнопке
    меню.addEventListener('click', function(e){
      var el = e.target.closest('.select__option');
      if (el) выбрать(el);
    });
    меню.addEventListener('mousemove', function(e){
      var el = e.target.closest('.select__option');
      if (el && !el.classList.contains('select__option--off')) активировать(пункты().indexOf(el));
    });
    document.addEventListener('mousedown', function(e){ if (!box.contains(e.target)) закрыть(false); });
    select.addEventListener('change', показать);              // значение могли поменять снаружи

    обновить();
    select._zselect = { обновить: обновить, закрыть: закрыть, фокус: function(){ кнопка.focus(); } };
    return select._zselect;
  }

  // ---------- Время ----------
  function заполнитьВремя(select){
    select.innerHTML = '';
    var ph = document.createElement('option');
    ph.value = ''; ph.textContent = 'Выберите время'; ph.disabled = true; ph.selected = true;
    select.appendChild(ph);
    СЛОТЫ.forEach(function(t){
      var o = document.createElement('option');
      o.value = t; o.textContent = t;
      select.appendChild(o);
    });
  }
  function обновитьВремя(выбранная){
    var поля = document.querySelectorAll('[data-time]');
    var это_сегодня = выбранная && iso(выбранная) === iso(new Date());
    var сейчас = new Date();
    поля.forEach(function(select){
      Array.prototype.forEach.call(select.options, function(o){
        if (!o.value) return;
        if (!это_сегодня){ o.disabled = false; return; }
        var p = o.value.split(':');
        var t = new Date(); t.setHours(+p[0], +p[1], 0, 0);
        o.disabled = t <= сейчас;                       // прошедшее время сегодня выбрать нельзя
      });
      if (select.selectedOptions[0] && select.selectedOptions[0].disabled) select.value = '';
      if (select._zselect) select._zselect.обновить();   // свой список показывает те же погашенные слоты
    });
  }

  // ---------- Проверка ----------
  function поле(el){ return el.closest('.field'); }
  function показатьОшибку(el, текст){
    var f = поле(el); if (!f) return;
    f.classList.add('field--error');
    var hint = f.querySelector('.field__hint');
    if (hint){ hint.dataset.default = hint.dataset.default || hint.textContent; hint.textContent = текст; }
    el.setAttribute('aria-invalid','true');
  }
  function снятьОшибку(el){
    var f = поле(el); if (!f) return;
    f.classList.remove('field--error');
    var hint = f.querySelector('.field__hint');
    if (hint) hint.textContent = hint.dataset.default || '';
    el.removeAttribute('aria-invalid');
  }
  // у селекта со своим списком фокус ставим на кнопку: родной селект спрятан
  function фокус(el){
    if (el._zselect) return el._zselect.фокус();
    if (el.focus) el.focus();
  }
  function проверить(form){
    var первое = null;
    form.querySelectorAll('.field__control[required]').forEach(function(el){
      if (el.disabled) return;
      if (!el.value.trim()){
        показатьОшибку(el, ТЕКСТ_ОШИБКИ);
        if (!первое) первое = el;
      } else снятьОшибку(el);
    });
    if (первое) фокус(первое);
    return !первое;
  }

  // Общий API для модалки бронирования (booking.js): единый список занятых дней,
  // проверки и подсветка ошибок — чтобы не заводить вторую копию тех же правил.
  window.ZernoForms = {
    занятые: ЗАНЯТО,
    занят: занят,
    прошёл: прошёл,
    показатьОшибку: показатьОшибку,
    снятьОшибку: снятьОшибку,
    фокус: фокус,
    сделатьСелект: сделатьСелект,
    текстПустого: ТЕКСТ_ОШИБКИ
  };

  function init(){
    document.querySelectorAll('[data-date]').forEach(ставитьДату);
    // подсказка стоит по координатам окна — при прокрутке её место уезжает
    addEventListener('scroll', спрятатьПодсказку, true);
    addEventListener('resize', спрятатьПодсказку);
    document.querySelectorAll('[data-time]').forEach(function(s){ заполнитьВремя(s); });
    document.querySelectorAll('select.field__control').forEach(сделатьСелект);
    обновитьВремя(null);

    // после form.reset() значение вернулось к плейсхолдеру — надпись на кнопке тоже
    document.addEventListener('reset', function(e){
      setTimeout(function(){
        e.target.querySelectorAll('select.select__native').forEach(function(s){ s._zselect.обновить(); });
      }, 0);
    });

    // ошибка снимается, как только человек начал исправлять — ругаться дальше незачем
    document.addEventListener('input', function(e){
      if (e.target.classList && e.target.classList.contains('field__control')) снятьОшибку(e.target);
    });
    document.addEventListener('change', function(e){
      if (e.target.classList && e.target.classList.contains('field__control')) снятьОшибку(e.target);
    });
    document.addEventListener('submit', function(e){
      if (!e.target.matches('form[data-validate]')) return;
      if (!проверить(e.target)) e.preventDefault();
    });
  }
  if (document.readyState === 'loading') addEventListener('DOMContentLoaded', init);
  else init();
})();
