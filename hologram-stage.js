// <holo-stage> — light-DOM host for the sea-urchin hologram.
// The scene bundle resolves #hologram-stage / #hologram-status / #hologram-bar
// at module-eval time, so the markup must exist before it is imported.
(function () {
  if (customElements.get('holo-stage')) return;

  const BASE = new URL('.', document.currentScript ? document.currentScript.src : location.href);

  // Matches the mobile breakpoint used by the page stylesheets and
  // mobile-chrome.js. Evaluated once at load; rotating a phone past the
  // breakpoint keeps whatever mode the page started in.
  const mq = (q) => typeof matchMedia === 'function' && matchMedia(q).matches;
  const DEFER = mq('(max-width: 820px)') ||
                mq('(hover: none) and (pointer: coarse)') ||
                mq('(prefers-reduced-motion: reduce)') ||
                !!(navigator.connection && navigator.connection.saveData);
  let booted = null;

  function loadGlb() {
    if (window.__HOLOGRAM_GLB__) return Promise.resolve();
    return new Promise((res, rej) => {
      const s = document.createElement('script');
      s.src = new URL('assets/hologram-glb.js', BASE).href;
      s.onload = res;
      s.onerror = rej;
      document.head.appendChild(s);
    });
  }

  class HoloStage extends HTMLElement {
    connectedCallback() {
      if (this._init) return;
      this._init = true;

      this.style.display = 'block';
      this.style.position = 'relative';
      this.style.width = this.getAttribute('width') || '100%';
      this.style.maxWidth = this.getAttribute('max-width') || this.getAttribute('maxwidth') || '560px';
      // On a phone the full-size stage is 440px of an 844px screen - over half
      // the first screenful, showing a loader. Keep a compact tap target instead.
      this.style.height = DEFER ? '172px' : (this.getAttribute('height') || '420px');
      this.style.margin = this.getAttribute('margin') || '0 auto';

      const stage = document.createElement('div');
      stage.id = 'hologram-stage';
      stage.setAttribute('role', 'img');
      stage.setAttribute('aria-label', 'Interactive 3D hologram of a spiky sea urchin, rendered as warm translucent glass that slowly rotates.');
      stage.style.cssText = 'position:absolute;inset:0;background:#0a0a0c;overflow:hidden;contain:layout paint;' +
        '-webkit-mask-image:radial-gradient(closest-side, #000 58%, rgba(0,0,0,.6) 82%, transparent 100%);' +
        'mask-image:radial-gradient(closest-side, #000 58%, rgba(0,0,0,.6) 82%, transparent 100%);';

      const loader = document.createElement('div');
      loader.style.cssText = 'position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;pointer-events:none;transition:opacity .5s ease;';
      loader.innerHTML =
        '<div id="hologram-status" style="font-family:\'JetBrains Mono\',ui-monospace,monospace;font-size:11px;letter-spacing:.08em;color:#8a8a92;">Loading</div>' +
        '<div style="width:150px;height:2px;background:#2a2a30;border-radius:2px;overflow:hidden;">' +
        '<i id="hologram-bar" style="display:block;height:100%;background:#e04a2e;transform:scaleX(0);transform-origin:left;transition:transform .3s ease;"></i></div>';

      const style = document.createElement('style');
      style.textContent =
        '#hologram-stage canvas{opacity:0;transition:opacity 1.1s cubic-bezier(.16,1,.3,1);}' +
        '#hologram-stage.is-loaded canvas{opacity:1;}' +
        '#hologram-stage.is-loaded .holo-loader{opacity:0;}' +
        '#hologram-stage.has-error #hologram-status{color:#e04a2e;}' +
        '#hologram-stage{cursor:grab;touch-action:none;}' +
        '#hologram-stage:active{cursor:grabbing;}' +
        '@keyframes holoNudge{0%,100%{transform:translateX(-3px)}50%{transform:translateX(3px)}}' +
        '.holo-hint svg{animation:holoNudge 1.9s ease-in-out infinite;}' +
        '@media (prefers-reduced-motion: reduce){.holo-hint svg{animation:none;}}';
      loader.className = 'holo-loader';

      stage.appendChild(loader);
      const fade = document.createElement('div');
      fade.style.cssText = 'position:absolute;inset:-1px;pointer-events:none;background:radial-gradient(closest-side, rgba(10,10,12,0) 42%, rgba(10,10,12,.55) 68%, rgba(10,10,12,.92) 88%, #0a0a0c 100%);';
      stage.appendChild(fade);
      this.appendChild(style);
      this.appendChild(stage);

      // Until now the only affordance for dragging was cursor:grab, which you
      // cannot see without already hovering the model - so most visitors never
      // learn it spins. Show an explicit hint once the scene is actually up, and
      // retire it permanently the moment they drag. Lives on the host, not on
      // #hologram-stage, because that element is radially masked and would fade
      // the label out at the bottom edge.
      const hint = document.createElement('div');
      hint.className = 'holo-hint';
      hint.innerHTML =
        '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
        'stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">' +
        '<path d="M3 12h4"/><path d="M5 10l-2 2 2 2"/>' +
        '<path d="M21 12h-4"/><path d="M19 10l2 2-2 2"/>' +
        '<circle cx="12" cy="12" r="3.2"/></svg>' +
        '<span>drag to rotate</span>';
      hint.style.cssText = 'position:absolute;left:50%;bottom:0;transform:translateX(-50%);' +
        'display:flex;align-items:center;gap:7px;pointer-events:none;white-space:nowrap;' +
        "font-family:'Courier Prime',ui-monospace,monospace;font-size:11px;letter-spacing:.07em;" +
        'color:#8a8a92;opacity:0;transition:opacity .7s ease;';
      this.appendChild(hint);

      const showHint = () => { hint.style.opacity = '1'; };
      if (stage.classList.contains('is-loaded')) showHint();
      else {
        const mo = new MutationObserver(() => {
          if (stage.classList.contains('is-loaded')) { mo.disconnect(); showHint(); }
        });
        mo.observe(stage, { attributes: true, attributeFilter: ['class'] });
      }
      // Capture phase: the scene also binds pointerdown on this element, and we
      // want the hint retired regardless of what it does with the event.
      stage.addEventListener('pointerdown', () => {
        hint.style.opacity = '0';
        setTimeout(() => hint.remove(), 800);
      }, { once: true, capture: true });

      // Defer the (heavy) bundle until the stage is on screen.
      const boot = () => {
        if (booted) return;
        booted = loadGlb()
          .then(() => import(new URL('assets/hologram-scene.js', BASE).href))
          .catch((e) => {
            console.error('[hologram] failed to start', e);
            stage.classList.add('has-error');
            const st = stage.querySelector('#hologram-status');
            if (st) st.textContent = 'Could not load the model.';
          });
      };

      // The scene is ~4.4MB (glb + three.js/postfx) and runs bloom every frame.
      // Narrow screens, reduced-motion and data-saver users get an explicit
      // opt-in instead of paying that on load.
      if (DEFER) {
        const st = stage.querySelector('#hologram-status');
        if (st) st.textContent = 'tap to load 3d';
        const bar = stage.querySelector('#hologram-bar');
        if (bar && bar.parentNode) bar.parentNode.style.display = 'none';
        stage.addEventListener('click', function onTap() {
          stage.removeEventListener('click', onTap);
          if (st) st.textContent = 'Loading';
          if (bar && bar.parentNode) bar.parentNode.style.display = '';
          boot();
        });
      } else if ('IntersectionObserver' in window) {
        const io = new IntersectionObserver((es) => {
          if (es.some((e) => e.isIntersecting)) { io.disconnect(); boot(); }
        }, { rootMargin: '200px' });
        io.observe(this);
      } else boot();
    }
  }

  customElements.define('holo-stage', HoloStage);
})();
