/* ===== Зерно · модальное окно бронирования =====
   Макеты состояний: 597:2169. Поля и календарь — общие, из forms.css/forms.js.

   Что делает:
   1. Открывает окно по кнопке «Забронировать» в шапке (делегирование: шапку вставляет
      chrome.js позже, ловить её появление незачем). Закрывает по крестику, Esc и клику мимо.
   2. Поле «Посетителей» принимает только цифры.
   3. Поле даты — и календарь, и ручной ввод. Маска «дд.мм.гггг» общая, живёт в forms.js;
      здесь остаётся только разбор введённого и выбор стороны раскрытия календаря.
   4. Проверяет всё при отправке: пустое поле, несуществующая или прошедшая дата
      («Укажите верную дату»), занятый день («Нет свободных мест»).
   5. Проверяет телефон: номер набран целиком и код существует (правила в forms.js).
   6. Требует отметить согласие на обработку данных.
   7. Показывает экран «Заявка принята!». Реальной отправки нет — фронтенд без интеграции. */
(function(){
  'use strict';

  var modal = document.getElementById('booking');
  if (!modal) return;

  var card    = modal.querySelector('.booking__card');
  var form    = modal.querySelector('.booking-form');
  var guests  = modal.querySelector('[data-guests]');
  var phone   = modal.querySelector('[data-phone]');
  var consent = modal.querySelector('[data-consent]');
  var date    = modal.querySelector('[data-date]');
  var api = window.ZernoForms || {};

  // ——— вспомогательное ———
  function поле(el){ return el.closest('.field'); }
  function ошибка(el, текст){
    if (api.показатьОшибку) return api.показатьОшибку(el, текст);
    var f = поле(el); if (!f) return;
    f.classList.add('field--error');
    var hint = f.querySelector('.field__hint');
    if (hint) hint.textContent = текст;
    el.setAttribute('aria-invalid', 'true');
  }
  function снять(el){
    if (api.снятьОшибку) return api.снятьОшибку(el);
    var f = поле(el); if (!f) return;
    f.classList.remove('field--error');
    var hint = f.querySelector('.field__hint');
    if (hint) hint.textContent = '';
    el.removeAttribute('aria-invalid');
  }
  function iso(d){
    return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
  }
  function сегодня(){ var d = new Date(); d.setHours(0,0,0,0); return d; }

  // ——— согласие ———
  // Ошибку показываем той же строкой подсказки, что и у полей, но блок не .field:
  // у согласия нет рамки поля, красить нечего — красим саму коробку галочки.
  function пометитьСогласие(текст){
    if (!consent) return;
    var блок = consent.closest('.booking__consent');
    if (!блок) return;
    блок.classList.toggle('booking__consent--error', !!текст);
    consent.classList.toggle('checkbox--error', !!текст);
    var hint = блок.querySelector('.field__hint');
    if (hint) hint.textContent = текст || '';
    if (текст) consent.setAttribute('aria-invalid', 'true');
    else consent.removeAttribute('aria-invalid');
  }
  if (consent){
    consent.addEventListener('change', function(){ if (consent.checked) пометитьСогласие(''); });
    // Ссылка на политику лежит внутри подписи: клик по ней не должен ставить галочку
    var политика = modal.querySelector('.booking__consent-text a');
    if (политика) политика.addEventListener('click', function(e){ e.stopPropagation(); });
  }

  // ——— открытие и закрытие ———
  var вернутьФокус = null;

  function сброситьОшибки(){
    form.querySelectorAll('.field__control').forEach(снять);
    пометитьСогласие('');
  }
  function открыть(){
    вернутьФокус = document.activeElement;
    // заявку уже отправляли — новое открытие начинаем с чистой формы, а не с прошлых значений
    if (modal.dataset.state === 'success'){
      form.reset();
      if (date && date._dp) date._dp.clear();
    }
    modal.dataset.state = 'form';
    сброситьОшибки();          // прошлые подсветки не должны встречать человека при новом открытии
    modal.classList.add('is-open');
    modal.removeAttribute('aria-hidden');
    // страницу под окном не листаем. Место под полосу прокрутки зарезервировано
    // через scrollbar-gutter на html, поэтому вёрстка и шапка не сдвигаются
    document.body.style.overflow = 'hidden';
    document.body.classList.add('is-booking-open');   // поднимает календарь над окном и делает его компактным
    var первое = form.querySelector('.field__control');
    if (первое) setTimeout(function(){ первое.focus(); }, 60);
  }
  function закрыть(){
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    document.body.classList.remove('is-booking-open');
    if (date && date._dp) date._dp.hide();
    if (вернутьФокус && вернутьФокус.focus) вернутьФокус.focus();
  }

  // кнопка брони в шапке появляется позже — слушаем через документ
  document.addEventListener('click', function(e){
    var кнопка = e.target.closest && e.target.closest('.hd__btn, [data-booking-open]');
    if (!кнопка) return;
    e.preventDefault();
    открыть();
  });
  modal.addEventListener('click', function(e){
    if (e.target === modal) закрыть();                       // клик мимо карточки
    if (e.target.closest('[data-booking-close]')) закрыть();
  });
  document.addEventListener('keydown', function(e){
    if (e.key === 'Escape' && modal.classList.contains('is-open')) закрыть();
  });
  // фокус не должен уходить из открытого окна
  modal.addEventListener('keydown', function(e){
    if (e.key !== 'Tab') return;
    var фокусируемые = card.querySelectorAll('button, [href], input, select, textarea');
    var видимые = Array.prototype.filter.call(фокусируемые, function(el){ return !el.disabled && el.offsetParent !== null; });
    if (!видимые.length) return;
    var первый = видимые[0], последний = видимые[видимые.length - 1];
    if (e.shiftKey && document.activeElement === первый){ e.preventDefault(); последний.focus(); }
    else if (!e.shiftKey && document.activeElement === последний){ e.preventDefault(); первый.focus(); }
  });

  // ——— посетители: только цифры ———
  if (guests){
    guests.addEventListener('input', function(){
      var чисто = guests.value.replace(/\D/g, '').slice(0, 3);   // трёхзначного числа гостей достаточно
      if (чисто !== guests.value) guests.value = чисто;
    });
    guests.setAttribute('inputmode', 'numeric');                 // мобильная клавиатура сразу цифровая
  }

  // ——— дата ———
  function разобрать(v){                 // «дд.мм.гггг» → Date или null
    var m = /^(\d{2})\.(\d{2})\.(\d{4})$/.exec(v.trim());
    if (!m) return null;
    var д = +m[1], мес = +m[2], г = +m[3];
    var d = new Date(г, мес - 1, д);
    // отсеиваем 31.02 и подобное: JS молча переносит такую дату на следующий месяц
    if (d.getDate() !== д || d.getMonth() !== мес - 1 || d.getFullYear() !== г) return null;
    d.setHours(0,0,0,0);
    return d;
  }
  function занят(d){
    if (api.занят) return api.занят(d);
    return (api.занятые || []).indexOf(iso(d)) !== -1;
  }

  // Календарь открывается вниз, но в окне бронирования поле стоит в нижней половине экрана,
  // и на невысоких мониторах список дней уезжает за край. Перед открытием смотрим, где больше
  // места, и разворачиваем календарь в эту сторону.
  function выбратьСторону(){
    var dp = date && date._dp;
    if (!dp) return;
    var r = date.getBoundingClientRect();
    var высота = (dp.$datepicker && dp.$datepicker.offsetHeight) || 340;  // до первого показа берём высоту компактного вида
    var снизу = window.innerHeight - r.bottom, сверху = r.top;
    var сторона = (снизу >= высота + 24 || снизу >= сверху) ? 'bottom left' : 'top left';
    // Только меняем опцию. Вызывать dp.update() здесь нельзя: он пересобирает календарь
    // и заново подставляет в поле сохранённую дату — после этого её не отредактировать
    // руками и календарь перестаёт открываться. Позицию библиотека читает при показе.
    dp.opts.position = сторона;
  }

  if (date){
    date.addEventListener('mousedown', выбратьСторону);
    date.addEventListener('focus', выбратьСторону);
    // После ручного ввода подсказываем календарю выбранный день. Библиотека при каждой
    // записи значения сама шлёт change на поле, поэтому каждая ветка ниже обязана
    // заканчиваться ничем, если календарь уже стоит на этой дате. Иначе получается кольцо:
    // обработчик выбирает дату, выбор переписывает значение, запись шлёт новый change —
    // и поле нельзя ни стереть, ни исправить, календарь возвращает свою дату поверх набранного.
    date.addEventListener('change', function(){
      if (!date._dp) return;
      var выбрана = date._dp.selectedDates[0];
      if (!date.value.trim()){
        if (выбрана) date._dp.clear();                     // поле очистили — снимаем выбор и в календаре
        return;
      }
      var d = разобрать(date.value);
      if (!d || занят(d) || d < сегодня()) return;         // непригодную дату разберёт проверка при отправке
      if (выбрана && выбрана.getTime() === d.getTime()) return;   // календарь уже на этой дате
      date._dp.selectDate(d, { silent:true });
    });
  }

  // ——— проверка при отправке ———
  function проверитьДату(){
    var v = date.value.trim();
    if (!v){ ошибка(date, api.текстПустого || 'Заполните поле'); return false; }
    var d = разобрать(v);
    if (!d || d < сегодня()){ ошибка(date, 'Укажите верную дату'); return false; }
    if (занят(d)){ ошибка(date, 'Нет свободных мест'); return false; }
    снять(date);
    return true;
  }
  function проверить(){
    var первое = null;
    // сначала общее правило: обязательны все поля
    form.querySelectorAll('.field__control').forEach(function(el){
      if (el === date) return;                            // у даты правила свои, ниже
      if (el.classList.contains('select__toggle')) return; // это кнопка своего селекта, значение хранит родной <select>
      if (!el.value.trim()){
        ошибка(el, api.текстПустого || 'Заполните поле');
        if (!первое) первое = el;
      } else снять(el);
    });
    // телефон: по нему подтверждают бронь, половина номера не годится
    var бедаТелефона = phone && phone.value.trim() && api.ошибкаТелефона ? api.ошибкаТелефона(phone.value) : '';
    if (бедаТелефона){
      ошибка(phone, бедаТелефона);
      if (!первое) первое = phone;
    }
    // количество гостей: ноль смысла не имеет
    if (guests && guests.value.trim() && +guests.value < 1){
      ошибка(guests, 'Укажите количество гостей');
      if (!первое) первое = guests;
    }
    var датаОк = проверитьДату();
    if (!датаОк && !первое) первое = date;
    // согласие: без него заявку принимать нельзя
    var согласиеОк = !consent || consent.checked;
    пометитьСогласие(согласиеОк ? '' : 'Отметьте согласие на обработку данных');
    if (!согласиеОк && !первое) первое = consent;
    if (первое) (api.фокус || function(el){ el.focus(); })(первое);
    return !первое && датаОк && согласиеОк;
  }

  form.addEventListener('submit', function(e){
    e.preventDefault();                                   // интеграции с системой броней ещё нет
    if (!проверить()) return;
    modal.dataset.state = 'success';                      // экран «Заявка принята!»
    var кнопкаЗакрыть = modal.querySelector('.booking__success .btn');
    if (кнопкаЗакрыть) кнопкаЗакрыть.focus();
  });

  // ошибку снимаем, как только человек начал править поле
  form.addEventListener('input', function(e){
    if (e.target.classList.contains('field__control')) снять(e.target);
  });
  form.addEventListener('change', function(e){
    if (e.target.classList.contains('field__control')) снять(e.target);
  });
})();
