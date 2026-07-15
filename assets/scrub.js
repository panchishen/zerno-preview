/* Плавный скраб для scroll-driven анимаций.
   Между позицией скролла и отрисовкой стоит демпфер: render() получает не «где страница
   сейчас», а current — значение, которое догоняет цель по экспоненте и не быстрее maxSpeed.
   Два следствия: рывок колеса не превращается в рывок анимации, а быстрый пролёт секции
   не схлопывает её в один кадр — анимация доигрывает со своей скоростью.

   createScrub({ progress, render, tau, maxSpeed })
     progress()  → доля 0..1: куда анимация должна приехать при текущем скролле
     render(p)   → рисует кадр по доле p
     tau         → «время догона» в секундах: за tau разрыв сокращается на ~63%
     maxSpeed    → потолок скорости в долях прогресса в секунду (1.2 ≈ полный проход
                   таймлайна не быстрее чем за 0.83 с)
*/
(function(){
  const EPS    = 0.0005; // ближе этого к цели — снапим и глушим цикл
  const DT_MAX = 0.05;   // потолок длины кадра: после спящей вкладки не должно быть прыжка

  // один шаг сближения: чистая функция, чтобы её можно было проверить без rAF и DOM
  function step(current, target, dt, tau, maxSpeed){
    const diff = target - current;
    // экспоненциальное сближение считаем через dt — иначе на 120 Гц анимация вдвое быстрее
    let d = diff * (1 - Math.exp(-dt / tau));
    const cap = maxSpeed * dt;
    if (Math.abs(d) > cap) d = d < 0 ? -cap : cap;
    return current + d;
  }

  function createScrub({ progress, render, tau = 0.12, maxSpeed = Infinity }){
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    let current = progress(), target = current, raf = 0, last = 0;
    render(current);

    function frame(now){
      const dt = last ? Math.min((now - last) / 1000, DT_MAX) : 1 / 60;
      last = now;
      const diff = target - current;
      // !(|diff| >= EPS), а не (|diff| < EPS): NaN проваливает любое сравнение, и цикл бы
      // крутился вечно, ведь NaN никогда не сойдётся к цели
      if (!(Math.abs(diff) >= EPS)){ current = target; render(current); raf = 0; last = 0; return; }
      current = step(current, target, dt, tau, maxSpeed);
      render(current);
      raf = requestAnimationFrame(frame);
    }

    function sync(){
      target = progress();
      if (reduced){ current = target; render(current); return; } // без инерции: кадр = позиция
      if (!raf){ last = 0; raf = requestAnimationFrame(frame); }
    }
    function snap(){ // геометрия изменилась — догонять нечего, рисуем цель сразу
      if (raf){ cancelAnimationFrame(raf); raf = 0; last = 0; }
      target = current = progress();
      render(current);
    }

    addEventListener('scroll', sync, { passive:true });
    addEventListener('resize', snap);
    return { sync, snap };
  }

  window.createScrub = createScrub;
  createScrub.step = step; // для проверки математики без rAF
})();
