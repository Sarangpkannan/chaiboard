/**
 * Chaiboard 3D Interactive Background & Motion Engine
 * Cursor-reactive WebGL neon tubes + 3D card tilt + scroll reveal + letter animations.
 * The CDN `threejs-components` import is ESM-only. We skip that and go straight to
 * the high-quality canvas fallback that always works.
 */

(function () {

    /* ------------------------------------------------------------------ */
    /*  Theme Palettes                                                      */
    /* ------------------------------------------------------------------ */
    const THEME_PALETTES = [
        { stroke: '#f59e0b', shadow: '#06b6d4', glow: '#fbbf24' },
        { stroke: '#ec4899', shadow: '#7c3aed', glow: '#c084fc' },
        { stroke: '#06b6d4', shadow: '#10b981', glow: '#38bdf8' }
    ];

    let paletteIndex = 0;

    /* ------------------------------------------------------------------ */
    /*  Canvas 2D Cursor Trail                                              */
    /* ------------------------------------------------------------------ */
    function initCursorTrail() {
        let canvas = document.getElementById('tubes-cursor-canvas');
        if (!canvas) {
            const wrap = document.createElement('div');
            wrap.id = 'interactive-bg-wrapper';
            wrap.className = 'interactive-bg-container';
            document.body.prepend(wrap);

            canvas = document.createElement('canvas');
            canvas.id = 'tubes-cursor-canvas';
            canvas.className = 'tubes-cursor-canvas';
            wrap.appendChild(canvas);
        }

        let w = canvas.width  = window.innerWidth;
        let h = canvas.height = window.innerHeight;

        const ctx = canvas.getContext('2d');
        const points = [];
        const MAX_PTS = 65;
        let mouse = { x: w / 2, y: h / 2 };

        /* ---- respond to mouse ---- */
        window.addEventListener('mousemove', e => {
            mouse.x = e.clientX;
            mouse.y = e.clientY;
            points.push({ x: mouse.x, y: mouse.y, age: 0 });
            if (points.length > MAX_PTS) points.shift();
        });

        /* ---- click cycles palette ---- */
        window.addEventListener('click', e => {
            if (e.target.closest('button, input, select, a, .card, form, label')) return;
            paletteIndex = (paletteIndex + 1) % THEME_PALETTES.length;
        });

        /* ---- resize ---- */
        window.addEventListener('resize', () => {
            w = canvas.width  = window.innerWidth;
            h = canvas.height = window.innerHeight;
        });

        /* ---- render loop ---- */
        const pal = () => THEME_PALETTES[paletteIndex];

        function render() {
            ctx.clearRect(0, 0, w, h);

            if (points.length > 2) {
                ctx.save();
                ctx.globalCompositeOperation = 'screen';

                for (let i = 1; i < points.length; i++) {
                    const p0 = points[i - 1];
                    const p1 = points[i];
                    p1.age++;

                    const alpha = Math.max(0, 1 - p1.age / 55);
                    if (alpha < 0.01) continue;

                    const lw = Math.max(0.5, (1 - p1.age / 55) * 14);

                    ctx.beginPath();
                    ctx.moveTo(p0.x, p0.y);
                    ctx.lineTo(p1.x, p1.y);
                    ctx.strokeStyle = hexAlpha(pal().stroke, alpha * 0.72);
                    ctx.lineWidth   = lw;
                    ctx.lineCap     = 'round';
                    ctx.shadowBlur  = 22;
                    ctx.shadowColor = pal().shadow;
                    ctx.stroke();

                    /* thinner inner glow */
                    ctx.beginPath();
                    ctx.moveTo(p0.x, p0.y);
                    ctx.lineTo(p1.x, p1.y);
                    ctx.strokeStyle = hexAlpha(pal().glow, alpha * 0.45);
                    ctx.lineWidth   = lw * 0.3;
                    ctx.shadowBlur  = 8;
                    ctx.shadowColor = pal().glow;
                    ctx.stroke();
                }
                ctx.restore();
            }

            requestAnimationFrame(render);
        }

        requestAnimationFrame(render);
    }

    /* Hex + alpha helper */
    function hexAlpha(hex, a) {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgba(${r},${g},${b},${a.toFixed(3)})`;
    }

    /* ------------------------------------------------------------------ */
    /*  3D Card Tilt on Hover                                              */
    /* ------------------------------------------------------------------ */
    function init3DCardTilt() {
        document.querySelectorAll('.card, .auth-card, .metric-card').forEach(card => {
            if (card.dataset.tiltInit) return;
            card.dataset.tiltInit = 'true';

            card.addEventListener('mousemove', e => {
                const rect  = card.getBoundingClientRect();
                const cx    = rect.width  / 2;
                const cy    = rect.height / 2;
                const rx    = ((e.clientY - rect.top  - cy) / cy) * -5.5;
                const ry    = ((e.clientX - rect.left - cx) / cx) *  5.5;
                card.style.transform = `perspective(900px) rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg) translateY(-2px)`;
            });

            card.addEventListener('mouseleave', () => {
                card.style.transform = '';
            });
        });
    }

    /* ------------------------------------------------------------------ */
    /*  Intersection Observer Scroll Reveal                                */
    /* ------------------------------------------------------------------ */
    function initScrollReveal() {
        const obs = new IntersectionObserver(entries => {
            entries.forEach(e => {
                if (e.isIntersecting) e.target.classList.add('reveal-in-view');
            });
        }, { threshold: 0.08 });

        document.querySelectorAll(
            '.card, .section-header, .metrics-grid, .sub-project-card, .featured-project-card, .case-studies-container'
        ).forEach(el => {
            if (!el.classList.contains('scroll-3d-reveal')) {
                el.classList.add('scroll-3d-reveal');
            }
            obs.observe(el);
        });
    }

    /* ------------------------------------------------------------------ */
    /*  Letter-by-Letter Heading Animation                                 */
    /* ------------------------------------------------------------------ */
    function initAnimatedHeadings() {
        document.querySelectorAll(
            '.animated-h3, .window-title, .section-title, .brand-title'
        ).forEach(h => {
            if (h.dataset.lettersInit) return;
            h.dataset.lettersInit = 'true';

            const rawText = h.textContent.trim();
            if (!rawText) return;

            h.innerHTML  = '';
            h.classList.add('letter-anim-h3');

            const words  = rawText.split(' ');
            let globalIdx = 0;

            words.forEach((word, wIdx) => {
                const wordWrap = document.createElement('span');
                wordWrap.className = 'word-span';

                for (const c of word) {
                    const ls = document.createElement('span');
                    ls.className   = 'letter-span';
                    ls.textContent = c;
                    ls.style.animationDelay = `${globalIdx * 32}ms`;
                    wordWrap.appendChild(ls);
                    globalIdx++;
                }

                h.appendChild(wordWrap);

                if (wIdx < words.length - 1) {
                    const sp = document.createElement('span');
                    sp.className   = 'letter-space';
                    sp.innerHTML   = '&nbsp;';
                    h.appendChild(sp);
                    globalIdx++;
                }
            });
        });
    }

    /* ------------------------------------------------------------------ */
    /*  Hero Cube Drag / Pause on Interaction                              */
    /* ------------------------------------------------------------------ */
    function initHeroCubeDrag() {
        const cube = document.getElementById('hero-cube');
        if (!cube) return;

        let isDragging = false;
        let startX = 0;
        let currentRot = 0;
        let animPaused = false;

        cube.addEventListener('mousedown', e => {
            isDragging  = true;
            startX      = e.clientX;
            animPaused  = true;
            cube.style.animationPlayState = 'paused';
            e.preventDefault();
        });

        window.addEventListener('mousemove', e => {
            if (!isDragging) return;
            const delta = e.clientX - startX;
            currentRot += delta * 0.4;
            startX = e.clientX;
            cube.style.transform = `rotateX(${currentRot}deg)`;
        });

        window.addEventListener('mouseup', () => {
            if (!isDragging) return;
            isDragging = false;
            cube.style.animationPlayState = 'running';
        });
    }

    /* ------------------------------------------------------------------ */
    /*  Boot                                                               */
    /* ------------------------------------------------------------------ */
    function boot() {
        initCursorTrail();
        initHeroCubeDrag();

        /* Slight delay so the DOM is fully painted before tilt/reveal */
        setTimeout(() => {
            init3DCardTilt();
            initScrollReveal();
            initAnimatedHeadings();
        }, 120);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', boot);
    } else {
        boot();
    }

})();
