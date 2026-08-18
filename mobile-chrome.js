// mobile-chrome.js — bottom tab dock + sticky top bar for narrow viewports.
//
// These replace the desktop sidebar, which is a 240px flex sibling of <main>.
// Each page's own stylesheet hides that sidebar at <=820px (Phase 1); this file
// supplies the touch navigation that takes its place. The sidebar expanded on
// mouseenter, which never fires on touch, so it could not be reused as-is.
//
// Built in JS rather than as per-page markup so the tab list lives in one place
// instead of being copy-pasted into four DC templates. React mounts into the
// <x-dc> host, not <body>, so inserting siblings here is safe from re-renders.
(function () {
  'use strict';
  if (window.__MOBILE_CHROME__) return;
  window.__MOBILE_CHROME__ = true;

  // Keep in sync with the media query in each page's stylesheet and with DEFER
  // in hologram-stage.js. The touch clause matters because a phone in landscape
  // is ~852px wide, which would otherwise fall back to the desktop sidebar --
  // and that sidebar only opens on mouseenter, so on touch it is unreachable.
  var MEDIA = '@media (max-width: 820px), (hover: none) and (pointer: coarse)';

  // `page` is the lowercased filename this tab marks as active; contact is a
  // section of the home page rather than a page of its own, so it has none.
  var TABS = [
    { label: 'home',     href: 'index.html',              page: 'index.html' },
    { label: 'about',    href: 'About.dc.html',           page: 'about.dc.html' },
    { label: 'projects', href: 'Project.dc.html',         page: 'project.dc.html' },
    { label: 'work',     href: 'Work%20Experience.dc.html', page: 'work experience.dc.html' },
    { label: 'contact',  href: 'index.html#contact',      page: null }
  ];

  function currentPage() {
    var f = decodeURIComponent((location.pathname.split('/').pop() || '')).toLowerCase();
    // Portfolio.dc.html is a redirect stub to index.html; treat it as home.
    if (!f || f === 'portfolio.dc.html') f = 'index.html';
    return f;
  }

  // Mirrors the `stampLine` format in the DC components so the clock reads the
  // same on mobile as it does in the desktop sidebar.
  function stamp() {
    var p = new Intl.DateTimeFormat('en-US', {
      month: '2-digit', day: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit', hour12: true,
      timeZone: 'America/Los_Angeles'
    }).formatToParts(new Date()).reduce(function (a, x) { a[x.type] = x.value; return a; }, {});
    return p.month + '/' + p.day + '/' + p.year + '  ' +
           p.hour + ':' + p.minute + (p.dayPeriod || '').toLowerCase() + ' SF';
  }

  function css() {
    return '' +
      '.mc-bar, .mc-dock { display: none; }' +
      MEDIA + ' {' +
      '  .mc-bar {' +
      '    display: flex; align-items: center; justify-content: space-between; gap: 12px;' +
      '    position: sticky; top: 0; z-index: 60; padding: 9px 14px;' +
      '    background: rgba(10,10,12,0.92); -webkit-backdrop-filter: blur(12px); backdrop-filter: blur(12px);' +
      '    border-bottom: 1px solid #1a1a1e;' +
      '  }' +
      '  .mc-brand {' +
      '    background: #e04a2e; color: #fff; padding: 5px 10px 6px; line-height: 1;' +
      "    font-family: 'Courier Prime', monospace; font-weight: 700; font-style: italic;" +
      '    font-size: 15px; letter-spacing: -0.01em; text-decoration: none;' +
      '  }' +
      '  .mc-stamp {' +
      "    font-family: 'Courier Prime', monospace; font-weight: 700; font-size: 10px;" +
      '    color: #8a8a92; letter-spacing: 0.02em; font-variant-numeric: tabular-nums; white-space: nowrap;' +
      '  }' +
      '  .mc-dock {' +
      '    display: grid; grid-template-columns: repeat(' + TABS.length + ', 1fr);' +
      '    position: fixed; left: 0; right: 0; bottom: 0; z-index: 60;' +
      '    background: rgba(10,10,12,0.94); -webkit-backdrop-filter: blur(14px); backdrop-filter: blur(14px);' +
      '    border-top: 1px solid #1a1a1e; padding-bottom: env(safe-area-inset-bottom);' +
      '  }' +
      '  .mc-tab {' +
      '    display: flex; align-items: center; justify-content: center; min-height: 52px;' +
      "    font-family: 'Courier Prime', monospace; font-style: italic; font-size: 11px;" +
      '    color: #8a8a92; text-decoration: none; letter-spacing: 0.02em;' +
      '    border-top: 2px solid transparent; margin-top: -1px;' +
      '    -webkit-tap-highlight-color: transparent; transition: color 0.18s ease;' +
      '  }' +
      '  .mc-tab:active { background: #141419; color: #e8e6e1; }' +
      '  .mc-tab[aria-current="page"] { color: #e04a2e; border-top-color: #e04a2e; }' +
      // Clear the fixed dock so it never sits on top of page-ending content.
      // !important because the DC runtime hoists each page's <helmet> styles
      // into <head> after this deferred script runs, so their reset rule
      // (`html, body { padding: 0 }`) would otherwise land later and win.
      '  body { padding-bottom: calc(52px + env(safe-area-inset-bottom)) !important; }' +
      // The subpages' fixed "back to home" link would collide with the top bar,
      // and the brand block already goes home, so it is redundant here. Not
      // scoped to <main>: Work Experience.dc.html has no <main> wrapper.
      '  a[href$="Portfolio.dc.html"] { display: none !important; }' +
      '}' +
      // A landscape phone is only ~390px tall. The section padding clamps are
      // width-based, so at 852px wide they still resolve to the full desktop
      // 96px, and the 3D tap target takes another 172px - between them the
      // hero lands under the dock. Compress both when the viewport is short.
      '@media (max-height: 520px) and (orientation: landscape) {' +
      '  holo-stage { height: 104px !important; }' +
      '  section { padding-top: 40px !important; padding-bottom: 48px !important; }' +
      '  .mc-bar { padding: 6px 14px; }' +
      '  .mc-tab { min-height: 44px; }' +
      '  body { padding-bottom: calc(44px + env(safe-area-inset-bottom)) !important; }' +
      '}';
  }

  function build() {
    var here = currentPage();

    var style = document.createElement('style');
    style.textContent = css();
    document.head.appendChild(style);

    var bar = document.createElement('div');
    bar.className = 'mc-bar';
    var brand = document.createElement('a');
    brand.className = 'mc-brand';
    brand.href = 'index.html';
    brand.textContent = 'wm.yen';
    var clock = document.createElement('div');
    clock.className = 'mc-stamp';
    clock.textContent = stamp();
    bar.appendChild(brand);
    bar.appendChild(clock);

    var dock = document.createElement('nav');
    dock.className = 'mc-dock';
    dock.setAttribute('aria-label', 'Primary');
    TABS.forEach(function (t) {
      var a = document.createElement('a');
      a.className = 'mc-tab';
      a.href = t.href;
      a.textContent = t.label;
      if (t.page && t.page === here) a.setAttribute('aria-current', 'page');
      // On the home page the contact tab targets a section that is already
      // here, so scroll to it rather than reloading the document.
      if (t.href.indexOf('#') > -1 && here === 'index.html') {
        a.addEventListener('click', function (e) {
          var el = document.querySelector(t.href.slice(t.href.indexOf('#')));
          if (el) { e.preventDefault(); el.scrollIntoView({ behavior: 'smooth' }); }
        });
      }
      dock.appendChild(a);
    });

    // Sticky needs the bar early in <body>'s flow, not appended at the end.
    document.body.insertBefore(bar, document.body.firstChild);
    document.body.appendChild(dock);

    setInterval(function () { clock.textContent = stamp(); }, 1000);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', build);
  } else {
    build();
  }
})();
