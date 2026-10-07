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
//   newyear · mothers · teacher2for1 · school · cyber · holiday
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

  // Light, decorative extras per theme. Hidden for anyone whose device asks for reduced motion.
  function decorate(theme) {
    var sets = { winter: ['❄', '❅', '❆', '•'], mothers: ['♥', '❀', '♡', '✿'], teacher: ['✎', '★', '♥'], newyear: ['✦', '✧', '·'], school: ['✎', '✐', '★'] };
    var chars = sets[theme]; if (!chars) return;
    var layer = document.createElement('div');
    layer.className = 'promo-fx'; layer.setAttribute('aria-hidden', 'true');
    var count = theme === 'winter' ? 22 : 14;
    for (var i = 0; i < count; i++) {
      var s = document.createElement('span');
      s.textContent = chars[i % chars.length];
      s.style.left = (Math.random() * 100).toFixed(1) + '%';
      s.style.animationDuration = (9 + Math.random() * 10).toFixed(1) + 's';
      s.style.animationDelay = (-Math.random() * 18).toFixed(1) + 's';
      s.style.fontSize = (10 + Math.random() * 14).toFixed(0) + 'px';
      s.style.opacity = (0.35 + Math.random() * 0.5).toFixed(2);
      layer.appendChild(s);
    }
    document.body.appendChild(layer);
  }

  function banner(promos) {
    var p = promos[0];
    var div = document.createElement('div');
    div.className = 'promo-banner'; div.setAttribute('role', 'region'); div.setAttribute('aria-label', 'Current offer');
    div.innerHTML = '<div class="promo-banner-inner">' +
      '<span class="promo-banner-title">' + esc(p.title) + (p.theme === 'cyber' ? '<span class="promo-cursor" aria-hidden="true">_</span>' : '') + '</span>' +
      (p.code ? '<button type="button" class="promo-code-btn" title="Copy code">' + esc(p.code) + '</button>' : '') +
      '<a class="promo-banner-cta" href="' + esc(safeUrl(p.url)) + '">' + esc(p.cta) + ' &rarr;</a>' +
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
      '<button type="button" class="promo-pop-x" aria-label="Close">&times;</button>' +
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

  function start() {
    load(function (promos) {
      if (!promos.length) return;
      var link = document.createElement('link');
      link.rel = 'stylesheet'; link.href = 'promo.css';
      document.head.appendChild(link);
      document.body.classList.add('promo-on', 'promo-' + promos[0].theme);
      banner(promos);
      decorate(promos[0].theme);
      setTimeout(function () { popup(promos); }, 900);
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
