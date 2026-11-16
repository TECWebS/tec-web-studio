// TEC Web Studio — shared behavior
function toggleMenu() {
  var m = document.getElementById('mobileMenu');
  if (m) m.classList.toggle('open');
}

// ── SEASONAL PROMOTIONS ───────────────────────────────────────────────────
// Asks the Worker what's running today. If something is, the site switches to
// that promotion's theme, shows a banner under the menu, and (once per
// visitor per promotion) a popup with the code to copy. When the dates end,
// the Worker stops returning it and everything disappears on its own.
//
// Preview any theme today by adding ?promo-preview=<name> to a page address:
//   newyear · mothers · teacher2for1 · school · familytree · cyber · holiday
// It sticks while you click around; ?promo-preview=off turns it off.
(function () {
  var API = 'https://api.tecwebstudio.com';
  var params = new URLSearchParams(location.search);
  var preview = '';
  try {
    var asked = params.get('promo-preview');
    if (asked === 'off') sessionStorage.removeItem('tec_promo_preview');
    else if (asked) sessionStorage.setItem('tec_promo_preview', asked.slice(0, 30));
    preview = sessionStorage.getItem('tec_promo_preview') || '';
  } catch (e) {}

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function safeUrl(u) { return /^[a-z0-9-]+\.html(\?[\w=&%.+-]*)?$/i.test(u) ? u : 'services.html'; }

  function load(cb) {
    var key = 'tec_promos_' + (preview || 'live');
    try {
      var cached = JSON.parse(sessionStorage.getItem(key) || 'null');
      if (cached && Date.now() - cached.at < 10 * 60000) return cb(cached.promos);
    } catch (e) {}
    fetch(API + '/promos/active' + (preview ? '?preview=' + encodeURIComponent(preview) : ''))
      .then(function (r) { return r.json(); })
      .then(function (j) {
        var promos = (j && j.ok && j.promos) || [];
        try { sessionStorage.setItem(key, JSON.stringify({ at: Date.now(), promos: promos })); } catch (e) {}
        cb(promos);
      })
      .catch(function () { cb([]); });   // if it can't load, the site just looks normal
  }

  function copyCode(code, btn) {
    function done() { var t = btn.getAttribute('data-label') || btn.textContent; btn.setAttribute('data-label', t); btn.textContent = 'Copied!'; setTimeout(function () { btn.textContent = t; }, 1600); }
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(code).then(done, done);
    else { var i = document.createElement('input'); i.value = code; document.body.appendChild(i); i.select(); try { document.execCommand('copy'); } catch (e) {} document.body.removeChild(i); done(); }
  }

  // Falling decorations are SVG drawings only (no emoji or text symbols).
  function flake(sw) {
    var g = '';
    for (var a = 0; a < 360; a += 60) g += '<path transform="rotate(' + a + ' 12 12)" d="M12 12V2.5M9.7 4.8L12 7.1l2.3-2.3"/>';
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="' + sw + '" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + g + '</svg>';
  }
  var HEART = 'M12 21s-7.5-4.6-9.6-9.2C.9 8.4 3 5 6.3 5c2 0 3.700 1.200 5.700 3.300C14 6.200 15.700 5 17.700 5 21 5 23.100 8.400 21.600 11.800 19.500 16.400 12 21 12 21z';
  function heart(filled) {
    return '<svg viewBox="0 0 24 24" aria-hidden="true"' + (filled ? ' fill="currentColor"' : ' fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"') + '><path d="' + HEART + '"/></svg>';
  }
  function flower() {
    var p = '';
    for (var a = 0; a < 360; a += 72) p += '<ellipse cx="12" cy="6.200" rx="3.200" ry="4.600" transform="rotate(' + a + ' 12 12)"/>';
    return '<svg viewBox="0 0 24 24" aria-hidden="true"><g fill="currentColor">' + p + '</g><circle cx="12" cy="12" r="2.600" fill="#fff2c4"/></svg>';
  }
  var FALLING_ART = {
    winter: [flake(1.5), flake(2.2), flake(1.5), '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4.500" fill="currentColor"/></svg>'],
    mothers: [heart(true), flower(), heart(false), flower()]
  };

  // Decorative extras per theme. Moving ones are hidden for visitors whose
  // device asks for reduced motion (see promo.css).
  function heroLayer() {
    var hero = document.querySelector('.hero-wrap') || document.querySelector('.page-hero');
    if (!hero) return null;
    var layer = document.createElement('div');
    layer.className = 'promo-hero-layer'; layer.setAttribute('aria-hidden', 'true');
    hero.insertBefore(layer, hero.firstChild);
    return layer;
  }
  function decorate(theme) {
    var falling = FALLING_ART[theme];
    if (falling) {
      var layer = document.createElement('div');
      layer.className = 'promo-fx'; layer.setAttribute('aria-hidden', 'true');
      var count = theme === 'winter' ? 24 : 14;
      for (var i = 0; i < count; i++) {
        var s = document.createElement('span');
        s.innerHTML = falling[i % falling.length];
        s.style.left = (Math.random() * 100).toFixed(1) + '%';
        s.style.animationDuration = (9 + Math.random() * 10).toFixed(1) + 's';
        s.style.animationDelay = (-Math.random() * 18).toFixed(1) + 's';
        var px = (12 + Math.random() * 14).toFixed(0) + 'px';
        s.style.width = px; s.style.height = px;
        s.style.opacity = (0.35 + Math.random() * 0.5).toFixed(2);
        layer.appendChild(s);
      }
      document.body.appendChild(layer);
    }
    var hero = heroLayer();
    if (!hero) return;
    if (theme === 'newyear') {
      var spots = [[12, 22, 'gold', 0], [80, 18, 'silver', 0.9], [64, 48, 'gold', 1.7], [28, 58, 'white', 2.4], [90, 62, 'gold', 1.2], [46, 16, 'silver', 2.9]];
      spots.forEach(function (f) {
        var el = document.createElement('span');
        el.className = 'fw ' + f[2];
        el.style.left = f[0] + '%'; el.style.top = f[1] + '%'; el.style.animationDelay = f[3] + 's';
        hero.appendChild(el);
      });
    } else if (theme === 'school') {
      hero.innerHTML = '<span class="chalk-doodle d1">A+</span><span class="chalk-doodle d2">2 + 2 = 4</span><span class="chalk-doodle d3"><svg viewBox="0 0 24 24" aria-hidden="true"><polygon points="12 2 15 9 22 9.500 16.500 14 18.500 21 12 17 5.500 21 7.500 14 2 9.500 9 9"/></svg>ABC</span>' +
        '<span class="chalk-stick s1"></span><span class="chalk-stick s2"></span><span class="chalk-eraser"></span><span class="chalk-tray"></span>';
    } else if (theme === 'teacher') {
      hero.innerHTML = '<span class="notebook-label">COMPOSITION<i></i><i></i>Teacher Appreciation</span><span class="notebook-pencil"></span>';
    } else if (theme === 'cyber') {
      hero.innerHTML = '<span class="y2k-win w1"><b>savings.exe</b><span>Loading 30% off&hellip;<i class="y2k-bar"></i></span></span>' +
        '<span class="y2k-win w2"><b>my_website</b><span>New brand?<br>[ Yes! ] [ No ]</span></span>' +
        '<span class="y2k-cursor c1"></span><span class="y2k-cursor c2"></span><span class="y2k-cursor c3"></span>';
    }
  }

  function banner(promos) {
    var p = promos[0];
    var div = document.createElement('div');
    div.className = 'promo-banner'; div.setAttribute('role', 'region'); div.setAttribute('aria-label', 'Current offer');
    div.innerHTML = '<div class="promo-banner-inner">' +
      '<span class="promo-banner-title">' + esc(p.title) + (p.theme === 'cyber' ? '<span class="promo-cursor" aria-hidden="true">_</span>' : '') + '</span>' +
      (p.code ? '<button type="button" class="promo-code-btn" title="Copy code">' + esc(p.code) + '</button>' : '') +
      '<a class="promo-banner-cta" href="' + esc(safeUrl(p.url)) + '">' + esc(p.cta) + '<svg class="promo-arrow" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg></a>' +
      '<span class="promo-banner-ends">' + esc(p.ends) + '</span></div>';
    var header = document.querySelector('header');
    if (header && header.parentNode) header.parentNode.insertBefore(div, header.nextSibling); else document.body.insertBefore(div, document.body.firstChild);
    var btn = div.querySelector('.promo-code-btn');
    if (btn) btn.addEventListener('click', function () { copyCode(p.code, btn); });
  }

  function popup(promos) {
    var p = promos[0];
    var seenKey = 'tec_promo_seen_' + p.id + '_' + new Date().getFullYear();
    try {
      if (p.preview) { if (sessionStorage.getItem(seenKey)) return; sessionStorage.setItem(seenKey, '1'); }
      else { if (localStorage.getItem(seenKey)) return; localStorage.setItem(seenKey, '1'); }
    } catch (e) {}
    var others = promos.slice(1).map(function (o) { return '<li>' + esc(o.title) + (o.code ? ' — code <strong>' + esc(o.code) + '</strong>' : '') + '</li>'; }).join('');
    var wrap = document.createElement('div');
    wrap.className = 'promo-pop-backdrop';
    wrap.innerHTML = '<div class="promo-pop" role="dialog" aria-modal="true" aria-labelledby="promoPopTitle">' +
      '<button type="button" class="promo-pop-x" aria-label="Close"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 5l14 14M19 5L5 19"/></svg></button>' +
      '<p class="promo-pop-eyebrow">' + (p.preview ? 'Preview of this promotion' : 'Limited time · ' + esc(p.ends)) + '</p>' +
      '<h2 id="promoPopTitle">' + esc(p.title) + '</h2>' +
      '<p class="promo-pop-msg">' + esc(p.message) + '</p>' +
      (p.code ? '<div class="promo-pop-code"><span>Your code</span><strong>' + esc(p.code) + '</strong><button type="button" class="promo-pop-copy">Copy code</button></div>' : '') +
      '<div class="promo-pop-actions"><a class="promo-pop-cta" href="' + esc(safeUrl(p.url)) + '">' + esc(p.cta) + '</a><button type="button" class="promo-pop-later">Maybe later</button></div>' +
      (others ? '<ul class="promo-pop-others">' + others + '</ul>' : '') + '</div>';
    document.body.appendChild(wrap);
    var lastFocus = document.activeElement;
    function close() { wrap.parentNode && wrap.parentNode.removeChild(wrap); document.removeEventListener('keydown', onKey); if (lastFocus && lastFocus.focus) lastFocus.focus(); }
    function onKey(e) {
      if (e.key === 'Escape') close();
      if (e.key === 'Tab') {   // keep keyboard focus inside the popup
        var f = wrap.querySelectorAll('button, a'); var first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    }
    wrap.addEventListener('click', function (e) { if (e.target === wrap) close(); });
    wrap.querySelector('.promo-pop-x').addEventListener('click', close);
    wrap.querySelector('.promo-pop-later').addEventListener('click', close);
    var copy = wrap.querySelector('.promo-pop-copy');
    if (copy) copy.addEventListener('click', function () { copyCode(p.code, copy); });
    document.addEventListener('keydown', onKey);
    setTimeout(function () { wrap.classList.add('open'); (copy || wrap.querySelector('.promo-pop-cta')).focus(); }, 30);
  }

  // During the holiday (winter) theme the nav logo becomes the Santa-hat version.
  function swapLogo() {
    var src = 'TEC_Web_Studio_logo_holiday.png';
    var pre = new Image();
    pre.onload = function () {
      var imgs = document.querySelectorAll('header .logo-img');
      for (var i = 0; i < imgs.length; i++) imgs[i].src = src;
    };
    pre.src = src;   // if the file is missing, the normal logo simply stays
  }

  function start() {
    load(function (promos) {
      if (!promos.length) return;
      var link = document.createElement('link');
      link.rel = 'stylesheet'; link.href = 'promo.css';
      document.head.appendChild(link);
      document.body.classList.add('promo-on', 'promo-' + promos[0].theme);
      // The Family Tree section stays on the homepage for as long as that promotion runs.
      // Fall look when its theme is on top; just the section when another theme (Cyber, holiday) is on top.
      var famPromo = promos.filter(function (p) { return p.id === 'familytree'; })[0];
      if (famPromo) {
        window.TEC_FAMILY_MODE = promos[0].theme === 'family' ? 'full' : 'section';
        var fs = document.createElement('script');
        fs.src = 'promo-family.js';
        document.body.appendChild(fs);
      }
      if (promos[0].theme === 'winter') swapLogo();
      banner(promos);
      decorate(promos[0].theme);
      setTimeout(function () { popup(promos); }, 900);
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
