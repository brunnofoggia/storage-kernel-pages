/* Storage Kernel — page behaviour.
 *
 * Four small things, no framework: the two toggles, their persistence, a copy
 * button per code block, and nav highlighting. The toggles themselves are pure
 * CSS (see styles.css); this only flips an attribute on <html>, so the page is
 * fully readable with JavaScript disabled — it simply stays on the defaults.
 *
 * Both toggles can be set from the URL: ?code=py|ts and ?lang=en|pt. That exists
 * because the published package metadata links here, and a reader arriving from
 * PyPI should see Python whatever they last clicked. Precedence is therefore
 * query, then localStorage, then the attribute already in the markup — an
 * explicit link beats a remembered preference, which beats the default.
 */
(function () {
  'use strict';

  var root = document.documentElement;

  var TOGGLES = {
    /* The keys are repeated in scripts/lib/config.mjs, which the verifiers read.
     * This file runs in the browser and cannot import that one, so the pair is
     * the single unavoidable duplication — change both together. */
    lang: { attr: 'data-lang', key: 'stk.lang', prop: 'setLang', valid: ['en', 'pt'] },
    code: { attr: 'data-code', key: 'stk.code', prop: 'setCode', valid: ['py', 'ts'] }
  };

  var LOCALE = { en: 'en', pt: 'pt-BR' };

  var params = new URLSearchParams(window.location.search);

  function store(key, value) {
    try {
      localStorage.setItem(key, value);
    } catch (e) {
      /* private mode, blocked storage — the toggle still works for this visit */
    }
  }

  function read(key) {
    try {
      return localStorage.getItem(key);
    } catch (e) {
      return null;
    }
  }

  function apply(name, value) {
    var t = TOGGLES[name];
    if (!t || t.valid.indexOf(value) === -1) return;

    root.setAttribute(t.attr, value);
    if (name === 'lang') root.lang = LOCALE[value];

    /* Keep a parameter that is already in the URL truthful, so copying the
     * address after clicking shares what is actually on screen. Never add one
     * that was not there: the page does not rewrite an address nobody
     * parameterised. */
    if (params.has(name) && params.get(name) !== value) {
      params.set(name, value);
      try {
        window.history.replaceState(null, '',
          window.location.pathname + '?' + params + window.location.hash);
      } catch (e) {
        /* file:// refuses replaceState; the toggle still works */
      }
    }

    var buttons = document.querySelectorAll('[' + attrSelector(t.prop) + ']');
    for (var i = 0; i < buttons.length; i++) {
      buttons[i].setAttribute('aria-pressed', String(buttons[i].dataset[t.prop] === value));
    }
    store(t.key, value);
  }

  function attrSelector(prop) {
    return 'data-' + prop.replace(/[A-Z]/g, function (c) {
      return '-' + c.toLowerCase();
    });
  }

  Object.keys(TOGGLES).forEach(function (name) {
    var t = TOGGLES[name];
    var selector = '[' + attrSelector(t.prop) + ']';

    document.querySelectorAll(selector).forEach(function (button) {
      button.addEventListener('click', function () {
        apply(name, button.dataset[t.prop]);
      });
    });

    /* Query, then storage, then the attribute already on <html>. The last one
     * is not merely a default: without it a page shipped with a different
     * default would render that default while the buttons still claimed the
     * old one. */
    var candidates = [params.get(name), read(t.key), root.getAttribute(t.attr)];
    for (var c = 0; c < candidates.length; c++) {
      if (candidates[c] && t.valid.indexOf(candidates[c]) !== -1) {
        apply(name, candidates[c]);
        break;
      }
    }
  });

  /* ── copy buttons ──────────────────────────────────────────────────────
   * Added from script rather than markup: without a clipboard there is
   * nothing for the button to do, so it should not be in the document.
   */
  var canCopy = navigator.clipboard && typeof navigator.clipboard.writeText === 'function';

  if (canCopy) {
    document.querySelectorAll('.code').forEach(function (block) {
      var bar = block.querySelector('.code-bar');
      if (!bar) return;

      var button = document.createElement('button');
      button.type = 'button';
      button.className = 'copy';
      button.textContent = copyLabel();
      button.setAttribute('aria-label', copyLabel());

      bar.appendChild(button);

      button.addEventListener('click', function () {
        /* Only the sample currently shown by the code toggle. */
        var visible = Array.prototype.filter.call(block.querySelectorAll('pre'), function (pre) {
          return pre.offsetParent !== null;
        })[0];
        if (!visible) return;

        navigator.clipboard.writeText(visible.innerText.trim()).then(function () {
          button.dataset.copied = 'true';
          button.textContent = doneLabel();
          setTimeout(function () {
            delete button.dataset.copied;
            button.textContent = copyLabel();
          }, 1600);
        }).catch(function () {
          button.textContent = failLabel();
          setTimeout(function () { button.textContent = copyLabel(); }, 1600);
        });
      });
    });
  }

  function copyLabel() { return root.getAttribute('data-lang') === 'pt' ? 'copiar' : 'copy'; }
  function doneLabel() { return root.getAttribute('data-lang') === 'pt' ? 'copiado' : 'copied'; }
  function failLabel() { return root.getAttribute('data-lang') === 'pt' ? 'falhou' : 'failed'; }

  /* ── nav highlighting ─────────────────────────────────────────────────── */
  var links = Array.prototype.slice.call(document.querySelectorAll('.masthead nav a[href^="#"]'));
  var targets = links
    .map(function (a) { return document.getElementById(a.getAttribute('href').slice(1)); })
    .filter(Boolean);

  if (targets.length && 'IntersectionObserver' in window) {
    var current = null;

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        if (current === entry.target.id) return;
        current = entry.target.id;

        links.forEach(function (a) {
          var on = a.getAttribute('href') === '#' + current;
          if (on) {
            a.setAttribute('aria-current', 'true');
          } else {
            a.removeAttribute('aria-current');
          }
        });
      });
    }, { rootMargin: '-20% 0px -70% 0px' });

    targets.forEach(function (t) { observer.observe(t); });
  }
})();
