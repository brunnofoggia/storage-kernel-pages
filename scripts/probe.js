/* The layout checks, in one place.
 *
 * Two harnesses run this: scripts/verify.mjs (Playwright, used by CI and by any
 * machine with a working Linux Chromium) and scripts/verify-local.mjs (Windows
 * Chrome, for this WSL box where Playwright's browser cannot start). Keeping the
 * assertions here means the two harnesses cannot drift apart on *what* they
 * check — only on how they open a browser.
 *
 * Returns a plain object; it never throws, so a harness can report rather than
 * crash. The judgement of pass/fail lives in the harness.
 */
window.__probe = function () {
  var de = document.documentElement;
  var out = { inner: window.innerWidth, overflow: de.scrollWidth - de.clientWidth };

  /* Anything sticking out past the viewport, except containers that are meant
     to scroll internally (code blocks and wide tables). */
  var wide = [];
  document.querySelectorAll('body *').forEach(function (el) {
    var r = el.getBoundingClientRect();
    if (!r.width) return;
    if (r.right <= de.clientWidth + 1.5 && r.left >= -1.5) return;
    var cs = getComputedStyle(el);
    if (cs.overflowX === 'auto' || cs.overflowX === 'scroll') return;
    if (el.closest('pre, .table-wrap')) return;
    wide.push(el.tagName.toLowerCase()
      + (el.className ? '.' + String(el.className).split(' ')[0] : '')
      + '[' + Math.round(r.left) + '-' + Math.round(r.right) + ']');
  });
  out.offenders = wide.slice(0, 8);

  function visible(sel) {
    return Array.prototype.filter.call(document.querySelectorAll(sel),
      function (e) { return e.offsetParent !== null; });
  }

  /* Both toggles must actually swap content, not just flip an attribute. */
  var startLang = de.getAttribute('data-lang');
  var startCode = de.getAttribute('data-code');

  var enH1 = document.querySelector('h1').innerText.trim();
  de.setAttribute('data-lang', startLang === 'pt' ? 'en' : 'pt');
  var otherH1 = document.querySelector('h1').innerText.trim();
  out.langSwaps = !!otherH1 && enH1 !== otherH1;
  de.setAttribute('data-lang', startLang);

  var first = visible('.code pre')[0];
  var firstText = first ? first.innerText.slice(0, 60) : '';
  de.setAttribute('data-code', startCode === 'ts' ? 'py' : 'ts');
  var second = visible('.code pre')[0];
  var secondText = second ? second.innerText.slice(0, 60) : '';
  out.codeSwaps = !!secondText && firstText !== secondText;
  de.setAttribute('data-code', startCode);

  /* Smallest font actually rendered for text — the design spec sets 12px as the
     floor for labels. */
  var min = 999, minEl = '';
  document.querySelectorAll('p,li,td,th,span,code,a,button,div,h1,h2,h3,h4').forEach(function (el) {
    if (el.children.length || !el.textContent.trim()) return;
    if (el.offsetParent === null) return;
    var px = parseFloat(getComputedStyle(el).fontSize);
    if (px < min) { min = px; minEl = el.tagName.toLowerCase() + '.' + String(el.className).split(' ')[0]; }
  });
  out.minFont = Math.round(min * 100) / 100;
  out.minFontEl = minEl;

  /* Interactive targets under 24px tall fail WCAG 2.2 AA (Target Size Minimum). */
  var small = [];
  document.querySelectorAll('button, .masthead nav a, .dist, .footer-col a').forEach(function (el) {
    if (el.offsetParent === null) return;
    var r = el.getBoundingClientRect();
    if (r.height && r.height < 24) {
      small.push((el.className ? '.' + String(el.className).split(' ')[0] : el.tagName.toLowerCase())
        + ':' + Math.round(r.height));
    }
  });
  out.shortTargets = small.slice(0, 8);

  /* The built page must carry the sprite, not the placeholder, and every <use>
     must resolve to a symbol that exists. */
  var symbols = {};
  document.querySelectorAll('symbol[id]').forEach(function (s) { symbols[s.id] = true; });
  var brokenUses = [];
  document.querySelectorAll('use[href^="#"]').forEach(function (u) {
    var id = u.getAttribute('href').slice(1);
    if (!symbols[id]) brokenUses.push(id);
  });
  out.symbols = Object.keys(symbols).length;
  out.brokenUses = brokenUses.slice(0, 8);

  /* Within one parent, each language variant must appear the same number of
   * times. Comparing presence instead of counts is not enough: dropping one of
   * two Portuguese siblings leaves the parent still holding Portuguese, and the
   * gap goes unnoticed in one of the four toggle combinations.
   *
   * A parent that is legitimately uneven — a changelog where one language has
   * more releases than the other — declares it with data-uneven, so the
   * exception is visible in the markup rather than hidden in this check. */
  var gaps = [];
  [['data-l', ['en', 'pt']], ['data-c', ['py', 'ts']]].forEach(function (pair) {
    var attr = pair[0], values = pair[1];
    var parents = [];
    document.querySelectorAll('[' + attr + ']').forEach(function (el) {
      if (el.parentElement && parents.indexOf(el.parentElement) === -1) {
        parents.push(el.parentElement);
      }
    });
    parents.forEach(function (parent) {
      var uneven = (parent.getAttribute('data-uneven') || '').split(/\s+/);
      if (uneven.indexOf(attr) !== -1) return;

      var counts = values.map(function (v) {
        return Array.prototype.filter.call(parent.children, function (c) {
          return c.getAttribute(attr) === v;
        }).length;
      });
      if (counts[0] === counts[1]) return;

      var where = parent.className
        ? '.' + String(parent.className).split(' ')[0]
        : parent.tagName.toLowerCase();
      gaps.push(values[0] + '=' + counts[0] + ' ' + values[1] + '=' + counts[1]
        + ' under ' + where);
    });
  });
  out.pairGaps = gaps.slice(0, 8);

  /* Section ids are external URL targets, not just internal anchors: the
   * masthead links four of them, and #changelog is the anchor the published
   * package metadata is meant to point at. Renaming one silently breaks whatever
   * points at it, so the set is asserted here. */
  var REQUIRED_IDS = ['top', 'scope', 'install', 'paths', 'io', 'directories',
    'capabilities', 'providers', 'errors', 'extend', 'changelog'];
  out.missingIds = REQUIRED_IDS.filter(function (id) {
    return !document.getElementById(id);
  });

  /* Every in-page link must land on something that exists. */
  var deadLinks = [];
  document.querySelectorAll('a[href^="#"]').forEach(function (a) {
    var id = a.getAttribute('href').slice(1);
    if (id && !document.getElementById(id)) deadLinks.push('#' + id);
  });
  out.deadLinks = deadLinks.filter(function (v, i, arr) {
    return arr.indexOf(v) === i;
  }).slice(0, 8);

  /* What the toggles actually settled on, so a harness can load the page with
     ?code=/?lang= and assert the URL won over storage and the default. */
  out.activeCode = de.getAttribute("data-code");
  out.activeLang = de.getAttribute("data-lang");

  out.copyButtons = document.querySelectorAll('.copy').length;
  return out;
};
