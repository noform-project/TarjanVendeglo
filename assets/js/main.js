'use strict';

/* =========================================================
   KITÖLTENDŐ – a vendéglő adatai.
   Ezeket a tulajdonostól kell elkérni. Ami üres (''), ott az
   oldal jól látható helyőrzőt mutat.
   ========================================================= */
const INFO = {
  cim: '',                  // pl. 'Példa utca 1.' (a „Hódmezővásárhely” utána jön magától)
  telefon: '',              // pl. '+36 62 123 4567'
  email: '',                // pl. 'info@tarjanvendeglo.hu'
  nyitvatartas: '',         // pl. 'H–P 10–22, Szo 12–22, V zárva'
  menuar: '',               // pl. '1 990 Ft'
  rendelesIdo: '',          // pl. 'hétköznap 9 és 12 óra között, kiszállítás 11:30-tól'
  kiszallitasiTerulet: '',  // pl. 'Hódmezővásárhely egész területén'
  kiszallitasiDij: '',      // pl. 'ingyenes 2 adagtól, alatta 300 Ft'
  // Az aktuális heti menü, hétfőtől péntekig (leves + „A” és „B” főétel)
  hetiMenu: [
    { leves: '', a: '', b: '' },
    { leves: '', a: '', b: '' },
    { leves: '', a: '', b: '' },
    { leves: '', a: '', b: '' },
    { leves: '', a: '', b: '' }
  ]
};

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- Adatok beírása a helyőrzők helyére ---------- */
function fill(el, value) {
  if (!value) return;
  el.textContent = value;
  el.classList.remove('ph');
}

document.querySelectorAll('[data-info]').forEach((el) => fill(el, INFO[el.dataset.info]));

document.querySelectorAll('[data-menu]').forEach((el) => {
  const [day, field] = el.dataset.menu.split('.');
  fill(el, INFO.hetiMenu[day] && INFO.hetiMenu[day][field]);
});

if (INFO.telefon) {
  const tel = 'tel:' + INFO.telefon.replace(/[^\d+]/g, '');
  document.querySelectorAll('[data-tel]').forEach((a) => { a.href = tel; });
}

const mapsQuery = INFO.cim ? `Tarján Vendéglő, ${INFO.cim}, Hódmezővásárhely` : 'Tarján Vendéglő Hódmezővásárhely';
document.querySelectorAll('[data-maps]').forEach((a) => {
  a.href = 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(mapsQuery);
});

const mailBody = 'Szia!\n\nRendezvényre kérnék ajánlatot.\n\nAlkalom:\nDátum:\nLétszám (kb.):\nTelefonszám:\n\nKöszönöm!';
document.querySelectorAll('[data-mailto]').forEach((a) => {
  a.href = 'mailto:' + INFO.email +
    '?subject=' + encodeURIComponent('Ajánlatkérés rendezvényre – Tarján Vendéglő') +
    '&body=' + encodeURIComponent(mailBody);
});

/* ---------- Napi menü fülek (ARIA tablist) ---------- */
(function initTabs() {
  const tablist = document.querySelector('.day-tabs');
  if (!tablist) return;
  const tabs = [...tablist.querySelectorAll('[role="tab"]')];
  const panels = tabs.map((t) => document.getElementById(t.getAttribute('aria-controls')));
  const animClasses = ['out-fwd', 'in-fwd', 'out-back', 'in-back'];

  // Hétköznap a mai nap, hétvégén a hétfő
  const weekday = new Date().getDay();             // 0 = vasárnap
  const todayIndex = weekday >= 1 && weekday <= 5 ? weekday - 1 : -1;
  let current = todayIndex >= 0 ? todayIndex : 0;
  let settleTimer;
  if (todayIndex >= 0) tabs[todayIndex].classList.add('is-today');

  tablist.hidden = false;
  panels.forEach((p, i) => {
    p.hidden = i !== current;
    p.querySelector('.day-panel__title').classList.add('visually-hidden');
  });
  setSelected(current);

  // A kiválasztott fül legyen látható a görgethető sávban (oldalgörgetés nélkül)
  const sel = tabs[current];
  tablist.scrollLeft = sel.offsetLeft - (tablist.clientWidth - sel.offsetWidth) / 2;

  function setSelected(i) {
    tabs.forEach((t, k) => {
      t.setAttribute('aria-selected', String(k === i));
      t.tabIndex = k === i ? 0 : -1;
    });
  }

  function settle() {
    panels.forEach((p, k) => {
      p.classList.remove(...animClasses);
      p.hidden = k !== current;
    });
  }

  function select(i, focus) {
    if (focus) tabs[i].focus();
    if (i === current) return;
    const prev = panels[current];
    const next = panels[i];
    const fwd = i > current;
    current = i;
    setSelected(i);
    settle();
    if (reduceMotion) return;

    prev.hidden = false;
    prev.classList.add(fwd ? 'out-fwd' : 'out-back');
    next.classList.add(fwd ? 'in-fwd' : 'in-back');
    next.addEventListener('animationend', settle, { once: true });
    clearTimeout(settleTimer);
    settleTimer = setTimeout(settle, 800);            // biztonsági háló, ha az animationend elmaradna
  }

  tabs.forEach((tab, i) => tab.addEventListener('click', () => select(i, false)));

  tablist.addEventListener('keydown', (e) => {
    const i = tabs.indexOf(document.activeElement);
    if (i < 0) return;
    let to = null;
    if (e.key === 'ArrowRight') to = (i + 1) % tabs.length;
    else if (e.key === 'ArrowLeft') to = (i - 1 + tabs.length) % tabs.length;
    else if (e.key === 'Home') to = 0;
    else if (e.key === 'End') to = tabs.length - 1;
    if (to === null) return;
    e.preventDefault();
    select(to, true);
  });
})();

/* ---------- Egyszer lefutó animációk indítása (IntersectionObserver) ---------- */
(function initReveal() {
  const items = document.querySelectorAll('[data-animate]');
  if (!('IntersectionObserver' in window) || reduceMotion) {
    items.forEach((el) => el.classList.add('is-in'));
    return;
  }
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-in');
      io.unobserve(entry.target);
    });
  }, { threshold: 0.45 });
  items.forEach((el) => io.observe(el));
})();

/* ---------- Teli korsó görgetésre ---------- */
(function initMug() {
  const mug = document.querySelector('[data-mug]');
  if (!mug || reduceMotion || !('IntersectionObserver' in window)) return; // alapból tele van

  const beer = mug.querySelector('.mug__beer');
  const foam = mug.querySelector('.mug__foam');
  const drip = mug.querySelector('.mug__drip');
  const DEPTH = 222;                                   // a korsó belső magassága (SVG egység)
  const clamp01 = (v) => Math.min(1, Math.max(0, v));
  let ticking = false;
  let active = false;

  function update() {
    ticking = false;
    const r = mug.getBoundingClientRect();
    const vh = window.innerHeight;
    // 0: a korsó teteje épp beért alul; 1: a korsó teteje a képernyő felső harmadánál
    const p = clamp01((vh * 0.95 - r.top) / (vh * 0.62));
    const level = clamp01(p / 0.8);
    const f = clamp01((p - 0.78) / 0.14);
    const d = clamp01((p - 0.9) / 0.1);
    beer.style.transform = `translateY(${(1 - level) * DEPTH}px)`;
    foam.style.transform = `translateY(${(1 - f) * 10}px) scale(${0.6 + 0.4 * f}, ${f})`;
    foam.style.opacity = f;
    drip.style.transform = `scaleY(${d})`;
    drip.style.opacity = d > 0 ? 1 : 0;
  }

  function onScroll() {
    if (active && !ticking) {
      ticking = true;
      requestAnimationFrame(update);
    }
  }

  new IntersectionObserver(([entry]) => {
    active = entry.isIntersecting;
    mug.classList.toggle('is-live', active);
    if (active) onScroll();
  }).observe(mug);

  update();
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });
})();

/* ---------- Rendezvénykártyák: „ünneplő” ikonok ---------- */
(function initParty() {
  if (reduceMotion) return;
  document.querySelectorAll('[data-party]').forEach((card) => {
    let timer;
    const party = () => {
      card.classList.remove('is-party');
      void card.offsetWidth;                          // újraindítja az animációt
      card.classList.add('is-party');
      clearTimeout(timer);
      timer = setTimeout(() => card.classList.remove('is-party'), 650);
    };
    card.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') party(); });
    card.addEventListener('click', party);
  });
})();
