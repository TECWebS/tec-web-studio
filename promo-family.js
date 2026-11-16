/* TEC Web Studio — "family" promo theme: hero copy, tree illustration, Family Tree section, falling leaves.
 * Loaded by site.js only when the Worker's active promotion has theme "family".
 * All styling lives in promo.css (body.promo-family block); dates live in the Worker's promos.js.
 */
(function () {
  'use strict';
  if (window.__tecFamilyTheme) return;
  window.__tecFamilyTheme = true;

  // ── 4. HERO COPY: make it about family ──────────────────
  var heroLeft = document.querySelector('.hero-left');
  if (heroLeft) {
    heroLeft.innerHTML =
      '<span class="fam-eyebrow">November Family Tree Special</span>' +
      '<h1>Your Family\u2019s Story Deserves <em>a Home of Its Own.</em></h1>' +
      '<p class="hero-sub">We build a custom family tree website for your family: every person, photo, recipe, and story, in one private place that your whole family can treasure and grow for generations.</p>' +
      '<div class="hero-actions">' +
        '<a href="contact.html" class="btn-primary">Start My Family Tree</a>' +
        '<a href="#family-tree" class="btn-ghost">See What\u2019s Included</a>' +
      '</div>' +
      '<p class="hero-note">Family Tree Build \u00b7 $799 this November \u00b7 Built for you, start to finish</p>';
  }

  // ── 5. HERO VISUAL: a family tree instead of the browser mockup ──
  var heroVisual = document.querySelector('.hero-visual');
  if (heroVisual) {
    var portraits = [
      [200, 150], [120, 205], [280, 205], [75, 120], [325, 120], [150, 105], [250, 105]
    ];
    var frames = portraits.map(function (p, i) {
      var tone = ['#F3D9B1', '#E8C39A', '#D9A877', '#F0CFA6', '#E3B98B', '#EBCB9E', '#DDAF80'][i];
      return '<g transform="translate(' + p[0] + ' ' + p[1] + ')">' +
        '<circle r="26" fill="#FFF6E6" stroke="#7a3a18" stroke-width="3"/>' +
        '<circle cy="-6" r="9" fill="' + tone + '" stroke="#7a3a18" stroke-width="1.5"/>' +
        '<path d="M-15 17 Q0 -1 15 17 Z" fill="' + tone + '" stroke="#7a3a18" stroke-width="1.5"/>' +
        '</g>';
    }).join('');
    heroVisual.innerHTML =
      '<svg class="fam-tree" viewBox="0 0 400 440" role="img" aria-label="Illustration of a family tree with portraits hanging from the branches">' +
        '<ellipse cx="200" cy="415" rx="150" ry="14" fill="rgba(60,25,8,.25)"/>' +
        '<path d="M178 415 C182 340 176 300 170 255 C150 235 120 225 100 205 M222 415 C218 340 224 300 230 255 C250 235 280 225 300 205" stroke="#6b3a1d" stroke-width="20" stroke-linecap="round" fill="none"/>' +
        '<path d="M200 300 C200 240 200 200 200 160 M175 250 C150 230 110 190 85 140 M225 250 C250 230 290 190 315 140 M200 200 C170 180 150 150 150 112 M200 200 C230 180 250 150 250 112" stroke="#6b3a1d" stroke-width="12" stroke-linecap="round" fill="none"/>' +
        '<g opacity=".95">' +
          '<circle cx="200" cy="90" r="62" fill="#D9822B"/><circle cx="130" cy="120" r="52" fill="#C2571F"/>' +
          '<circle cx="270" cy="120" r="52" fill="#E3A33A"/><circle cx="80" cy="170" r="38" fill="#E3A33A"/>' +
          '<circle cx="320" cy="170" r="38" fill="#C2571F"/><circle cx="200" cy="140" r="52" fill="#B8421A"/>' +
        '</g>' + frames +
        '<path d="M160 420 q10-14 20 0 M225 422 q10-14 20 0" stroke="#FFE08A" stroke-width="3" fill="none" stroke-linecap="round"/>' +
      '</svg>';
    heroVisual.removeAttribute('aria-hidden');
  }

  // ── 6. FAMILY TREE PROMO SECTION (right under the hero) ─
  var heroWrap = document.querySelector('.hero-wrap');
  if (heroWrap && !document.getElementById('family-tree')) {
    var sec = document.createElement('section');
    sec.className = 'fam-section';
    sec.id = 'family-tree';
    sec.innerHTML =
      '<div class="fam-inner">' +
        '<div class="fam-head">' +
          '<span class="fam-tag">Gather \u2022 Remember \u2022 Share</span>' +
          '<h2>The Family Tree Build</h2>' +
          '<p>The holidays bring families together. Give yours something that lasts: a beautiful, private website that keeps your people, photos, and stories safe and easy to share with everyone you love.</p>' +
        '</div>' +
        '<div class="fam-grid">' +
          '<div class="fam-card"><div class="fam-ico">\uD83C\uDF33</div><h3>Every Person, Every Branch</h3><p>A custom family backend where you can add and edit people and photos any time, so your tree keeps growing with your family.</p></div>' +
          '<div class="fam-card"><div class="fam-ico">\uD83C\uDF72</div><h3>Recipes &amp; Traditions</h3><p>Optional recipe pages so Grandma\u2019s sweet potato pie and the dishes everyone asks for are never lost.</p></div>' +
          '<div class="fam-card"><div class="fam-ico">\uD83C\uDFA5</div><h3>Videos &amp; Voices</h3><p>Add family videos and stories so the people behind the names stay present for the next generation.</p></div>' +
          '<div class="fam-card"><div class="fam-ico">\uD83D\uDCD6</div><h3>A Photo Book Keepsake</h3><p>Optionally turn your family\u2019s photos into a photo book you can hold, gift, and pass down.</p></div>' +
        '</div>' +
        '<div class="fam-cta">' +
          '<div class="fam-price">$799<small>November special \u00b7 a full year of hosting included</small></div>' +
          '<a href="contact.html" class="fam-btn">Start My Family Tree \u2192</a>' +
          '<p class="fam-steps">You send a request, we build your preview first, and you only pay once you love it.</p>' +
        '</div>' +
      '</div>';
    heroWrap.parentNode.insertBefore(sec, heroWrap.nextSibling);
  }

  // ── 7. FALLING LEAVES ───────────────────────────────────
  if (!window.matchMedia || !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    var colors = ['#C2571F', '#D9822B', '#E3A33A', '#B8421A', '#9C3D1A', '#E8B04A'];
    var shapes = [
      // maple-ish
      '<svg viewBox="0 0 24 24"><path fill="COLOR" d="M12 1l2.2 4.6 3.2-1.2-.8 4.6 4.1-1.3-2.2 4.2 2.7 1.1-5.7 3.2.6 2.3-4.3-1-.2 4.5h-1.2l-.2-4.5-4.3 1 .6-2.3-5.7-3.2 2.7-1.1L1.5 7.7l4.1 1.3-.8-4.6 3.2 1.2z"/></svg>',
      // simple oval leaf with vein
      '<svg viewBox="0 0 24 24"><path fill="COLOR" d="M12 1C5 6 4 14 12 23c8-9 7-17 0-22z"/><path d="M12 5v16" stroke="rgba(0,0,0,.25)" stroke-width="1" fill="none"/></svg>',
      // round oak-ish
      '<svg viewBox="0 0 24 24"><path fill="COLOR" d="M12 2c3 0 4 2 4.5 3.5C19 6 21 8 20 11c2 2 1 5-1.5 6C18 20 15 21 12 22c-3-1-6-2-6.5-5C3 16 2 13 4 11 3 8 5 6 7.500 5.500 8 4 9 2 12 2z"/></svg>'
    ];
    var layer = document.createElement('div');
    layer.className = 'leaf-layer';
    layer.setAttribute('aria-hidden', 'true');
    var count = window.innerWidth < 700 ? 14 : 26;
    for (var i = 0; i < count; i++) {
      var d = document.createElement('div');
      d.className = 'leaf';
      var size = 16 + Math.random() * 20;
      d.style.width = d.style.height = size + 'px';
      d.style.left = (Math.random() * 100) + '%';
      d.style.opacity = (0.65 + Math.random() * 0.3).toFixed(2);
      d.style.animationDuration = (9 + Math.random() * 10) + 's';
      d.style.animationDelay = (-Math.random() * 18) + 's';
      d.style.setProperty('--drift', (Math.random() * 160 - 60) + 'px');
      d.style.setProperty('--spin', (Math.random() > .5 ? 1 : -1) * (360 + Math.random() * 360) + 'deg');
      var c = colors[Math.floor(Math.random() * colors.length)];
      d.innerHTML = shapes[Math.floor(Math.random() * shapes.length)].replace(/COLOR/g, c);
      d.firstChild.style.animationDuration = (3 + Math.random() * 3) + 's';
      layer.appendChild(d);
    }
    document.body.appendChild(layer);
  }
})();
