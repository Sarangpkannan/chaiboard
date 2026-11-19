/**
 * Chaiboard 3D Interactive Background & Motion Engine
 * Features:
 * 1. 3D Neon Tubes Cursor from threejs-components (with click-to-randomize colors)
 * 2. GSAP ScrollTrigger Horizontal Continuous Ticker Sentence
 * 3. 3D Card Hover Perspective Tilt & Letter Animations
 */

(function () {
    'use strict';

    // Helper for random hex colors
    const randomColors = (count) => {
        return new Array(count)
            .fill(0)
            .map(() => "#" + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0'));
    };

    let tubesApp = null;
    let isTubesLoaded = false;

    /* ------------------------------------------------------------------ */
    /*  1. Initialize 3D Neon Tubes Cursor (threejs-components)           */
    /* ------------------------------------------------------------------ */
    async function initTubesBackground() {
        let canvas = document.getElementById('tubes-cursor-canvas');
        if (!canvas) {
            let container = document.getElementById('interactive-bg-wrapper');
            if (!container) {
                container = document.createElement('div');
                container.id = 'interactive-bg-wrapper';
                container.className = 'interactive-bg-container';
                document.body.prepend(container);
            }

            canvas = document.createElement('canvas');
            canvas.id = 'tubes-cursor-canvas';
            canvas.className = 'tubes-cursor-canvas';
            canvas.style.touchAction = 'none';
            container.appendChild(canvas);
        }

        try {
            // Dynamic import of the threejs-components tubes cursor module
            const module = await import('https://cdn.jsdelivr.net/npm/threejs-components@0.0.19/build/cursors/tubes1.min.js');
            const TubesCursor = module.default;

            const app = TubesCursor(canvas, {
                tubes: {
                    colors: ["#f967fb", "#53bc28", "#6958d5"],
                    lights: {
                        intensity: 200,
                        colors: ["#83f36e", "#fe8a2e", "#ff008a", "#60aed5"]
                    }
                }
            });

            tubesApp = app;
            window.tubesApp = app;
            isTubesLoaded = true;
            console.log('[Chaiboard] 3D Neon Tubes Cursor initialized successfully');
        } catch (err) {
            console.warn('[Chaiboard] 3D Tubes CDN import unavailable, starting WebGL fallback:', err);
            initFallbackGlowTrail(canvas);
        }

        // Click interaction: clicking anywhere randomizes neon tube and light colors
        window.addEventListener('click', (e) => {
            // Do not switch if clicking on interactive controls
            if (e.target.closest('button, input, select, a, .card, form, label, .modal-content, .cube-wrapper')) {
                return;
            }
            randomizeTubesColors();
        });
    }

    // Color randomizer matching reference
    function randomizeTubesColors() {
        if (!tubesApp || !tubesApp.tubes) return;
        try {
            const colors = randomColors(3);
            const lightsColors = randomColors(4);
            tubesApp.tubes.setColors(colors);
            tubesApp.tubes.setLightsColors(lightsColors);
        } catch (e) {
            console.error('Error randomizing colors:', e);
        }
    }
    window.randomizeTubesColors = randomizeTubesColors;

    /* ------------------------------------------------------------------ */
    /*  Fallback Glow Trail (if WebGL/CDN is unavailable)                */
    /* ------------------------------------------------------------------ */
    function initFallbackGlowTrail(canvas) {
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        let w = canvas.width = window.innerWidth;
        let h = canvas.height = window.innerHeight;

        window.addEventListener('resize', () => {
            w = canvas.width = window.innerWidth;
            h = canvas.height = window.innerHeight;
        });

        const points = [];
        const MAX_PTS = 65;
        let mouse = { x: w / 2, y: h / 2 };

        window.addEventListener('mousemove', e => {
            mouse.x = e.clientX;
            mouse.y = e.clientY;
            points.push({ x: mouse.x, y: mouse.y, age: 0 });
            if (points.length > MAX_PTS) points.shift();
        });

        const palette = ["#f967fb", "#53bc28", "#6958d5"];

        function render() {
            ctx.clearRect(0, 0, w, h);
            if (points.length > 2) {
                ctx.save();
                ctx.globalCompositeOperation = 'screen';
                for (let i = 1; i < points.length; i++) {
                    const p0 = points[i - 1];
                    const p1 = points[i];
                    p1.age++;
                    const alpha = Math.max(0, 1 - p1.age / 50);
                    if (alpha < 0.01) continue;

                    ctx.beginPath();
                    ctx.moveTo(p0.x, p0.y);
                    ctx.lineTo(p1.x, p1.y);
                    ctx.strokeStyle = `rgba(249, 103, 251, ${alpha * 0.75})`;
                    ctx.lineWidth = Math.max(1, (1 - p1.age / 50) * 14);
                    ctx.lineCap = 'round';
                    ctx.shadowBlur = 20;
                    ctx.shadowColor = '#6958d5';
                    ctx.stroke();
                }
                ctx.restore();
            }
            requestAnimationFrame(render);
        }
        requestAnimationFrame(render);
    }

    /* ------------------------------------------------------------------ */
    /*  2. GSAP ScrollTrigger Continuous Horizontal Text Flow             */
    /* ------------------------------------------------------------------ */
    function initHorizontalScrollTicker() {
        if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
            console.warn('[Chaiboard] GSAP / ScrollTrigger not loaded');
            return;
        }

        gsap.registerPlugin(ScrollTrigger);

        const section = document.getElementById('horizontal-ticker');
        const track = document.getElementById('ticker-track');

        if (!section || !track) return;

        // Calculate total horizontal travel distance
        const getScrollDistance = () => {
            return Math.max(0, track.scrollWidth - window.innerWidth + window.innerWidth * 0.12);
        };

        // Smooth continuous horizontal scroll animation
        gsap.to(track, {
            x: () => -getScrollDistance(),
            ease: "none",
            scrollTrigger: {
                trigger: section,
                start: "top top",
                end: () => `+=${getScrollDistance() * 1.3}`,
                pin: true,
                scrub: 1.1,
                anticipatePin: 1,
                invalidateOnRefresh: true
            }
        });

        console.log('[Chaiboard] GSAP ScrollTrigger Horizontal Ticker active');
    }

    /* ------------------------------------------------------------------ */
    /*  3. 3D Card Hover Perspective Tilt                                 */
    /* ------------------------------------------------------------------ */
    function init3DCardTilt() {
        document.querySelectorAll('.card, .auth-card, .metric-card, .sub-project-card, .featured-project-card').forEach(card => {
            if (card.dataset.tiltInit) return;
            card.dataset.tiltInit = 'true';

            card.addEventListener('mousemove', e => {
                const rect = card.getBoundingClientRect();
                const cx = rect.width / 2;
                const cy = rect.height / 2;
                const rx = ((e.clientY - rect.top - cy) / cy) * -6.5;
                const ry = ((e.clientX - rect.left - cx) / cx) * 6.5;
                card.style.transform = `perspective(900px) rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg) translateY(-2px)`;
            });

            card.addEventListener('mouseleave', () => {
                card.style.transform = '';
            });
        });
    }

    /* ------------------------------------------------------------------ */
    /*  4. Letter-by-Letter Animated Headings                             */
    /* ------------------------------------------------------------------ */
    function initAnimatedHeadings() {
        document.querySelectorAll('.animated-h3, .window-title, .section-title, .brand-title').forEach(h => {
            if (h.dataset.lettersInit) return;
            h.dataset.lettersInit = 'true';

            const rawText = h.textContent.trim();
            if (!rawText) return;

            h.innerHTML = '';
            h.classList.add('letter-anim-h3');

            const words = rawText.split(' ');
            let globalIdx = 0;

            words.forEach((word, wIdx) => {
                const wordWrap = document.createElement('span');
                wordWrap.className = 'word-span';

                for (const c of word) {
                    const ls = document.createElement('span');
                    ls.className = 'letter-span';
                    ls.textContent = c;
                    ls.style.animationDelay = `${globalIdx * 28}ms`;
                    wordWrap.appendChild(ls);
                    globalIdx++;
                }

                h.appendChild(wordWrap);

                if (wIdx < words.length - 1) {
                    const sp = document.createElement('span');
                    sp.className = 'letter-space';
                    sp.innerHTML = '&nbsp;';
                    h.appendChild(sp);
                    globalIdx++;
                }
            });
        });
    }

    /* ------------------------------------------------------------------ */
    /*  Boot                                                               */
    /* ------------------------------------------------------------------ */
    function boot() {
        initTubesBackground();

        // Allow DOM to settle before layout measurements
        setTimeout(() => {
            initHorizontalScrollTicker();
            init3DCardTilt();
            initAnimatedHeadings();
        }, 150);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', boot);
    } else {
        boot();
    }

})();
