// 3D Cutting Chai Hero Glass with Three.js & Fallback
class Chai3DHero {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.cupsToday = 1;
        this.maxVisualCups = 6;
        this.currentFill = 0.3; // 0 to 1
        this.targetFill = 0.35;
        this.slosh = { x: 0, z: 0, vx: 0, vz: 0 };
        this.isDragging = false;
        this.prevMouse = { x: 0, y: 0 };
        this.rotationVelocity = { x: 0, y: 0.003 };
        this.steamIntensity = 1.0; // scales down after logging
        this.steamParticles = [];

        this.init();
    }

    init() {
        if (!this.container) return;

        if (typeof THREE === 'undefined') {
            console.warn('Three.js not loaded, starting 2D Canvas fallback');
            this.initFallback2D();
            return;
        }

        try {
            this.initThree();
        } catch (err) {
            console.error('Three.js init error, falling back:', err);
            this.initFallback2D();
        }
    }

    initThree() {
        const width = this.container.clientWidth || 320;
        const height = this.container.clientHeight || 340;

        // Scene
        this.scene = new THREE.Scene();

        // Camera
        this.camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 1000);
        this.camera.position.set(0, 1.2, 5.2);
        this.camera.lookAt(0, 0.1, 0);

        // Renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        this.renderer.setSize(width, height);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.container.innerHTML = '';
        this.container.appendChild(this.renderer.domElement);

        // Glass Group for rotation
        this.glassGroup = new THREE.Group();
        this.scene.add(this.glassGroup);

        this.buildCuttingChaiGlass();
        this.buildLiquid();
        this.buildSteam();
        this.buildLighting();
        this.setupEvents();

        this.animate = this.animate.bind(this);
        requestAnimationFrame(this.animate);
    }

    buildCuttingChaiGlass() {
        // Classic Indian Tapri Cutting Glass:
        // Slightly tapered cylinder with bottom fluting/ribs and thick base
        const topRadius = 0.95;
        const bottomRadius = 0.72;
        const glassHeight = 2.4;
        const segments = 16; // 16 facets gives iconic fluted tapri cutting glass look!

        // Outer Glass Cylinder (low-poly fluted tapri glass)
        const outerGeo = new THREE.CylinderGeometry(topRadius, bottomRadius, glassHeight, segments, 1, true);
        const glassMat = new THREE.MeshPhysicalMaterial({
            color: 0xffffff,
            metalness: 0.05,
            roughness: 0.12,
            transmission: 0.75, // glass refraction transparency
            transparent: true,
            opacity: 0.55,
            ior: 1.5,
            reflectivity: 0.9,
            side: THREE.DoubleSide
        });
        this.outerGlass = new THREE.Mesh(outerGeo, glassMat);
        this.outerGlass.position.y = 0;
        this.glassGroup.add(this.outerGlass);

        // Thick Glass Bottom Disc
        const baseGeo = new THREE.CylinderGeometry(bottomRadius * 0.96, bottomRadius * 0.9, 0.22, segments);
        const baseMat = new THREE.MeshPhysicalMaterial({
            color: 0xddf0f8,
            roughness: 0.2,
            transmission: 0.6,
            transparent: true,
            opacity: 0.7
        });
        const baseMesh = new THREE.Mesh(baseGeo, baseMat);
        baseMesh.position.y = -glassHeight / 2 + 0.11;
        this.glassGroup.add(baseMesh);

        // Fluted Ridge Rings (Decorative metal/molded ribs on cutting glass)
        for (let i = 0; i < 4; i++) {
            const hRatio = 0.15 + i * 0.18;
            const r = bottomRadius + (topRadius - bottomRadius) * hRatio;
            const ringGeo = new THREE.TorusGeometry(r * 1.01, 0.02, 6, segments);
            ringGeo.rotateX(Math.PI / 2);
            const ringMat = new THREE.MeshStandardMaterial({
                color: 0xffffff,
                transparent: true,
                opacity: 0.45,
                roughness: 0.3
            });
            const ringMesh = new THREE.Mesh(ringGeo, ringMat);
            ringMesh.position.y = -glassHeight / 2 + glassHeight * hRatio;
            this.glassGroup.add(ringMesh);
        }

        // Tapri Coaster / Wooden table saucer shadow base
        const coasterGeo = new THREE.CylinderGeometry(1.4, 1.4, 0.05, 32);
        const coasterMat = new THREE.MeshStandardMaterial({
            color: 0x241711,
            roughness: 0.8,
            metalness: 0.1
        });
        const coasterMesh = new THREE.Mesh(coasterGeo, coasterMat);
        coasterMesh.position.y = -glassHeight / 2 - 0.05;
        this.glassGroup.add(coasterMesh);
    }

    buildLiquid() {
        this.liquidHeightMax = 2.0;
        this.glassBottomY = -1.1;

        // Chai Liquid Cylinder
        this.liquidGeo = new THREE.CylinderGeometry(0.85, 0.68, 1, 24);
        
        // Rich Indian Cutting Chai Amber Caramel Color
        this.liquidMat = new THREE.MeshStandardMaterial({
            color: 0xc4702b, // Spiced chai milk caramel
            roughness: 0.25,
            metalness: 0.1,
            transparent: true,
            opacity: 0.92
        });
        this.liquidMesh = new THREE.Mesh(this.liquidGeo, this.liquidMat);
        this.glassGroup.add(this.liquidMesh);

        // Chai Top Foam / Malai Surface
        const foamGeo = new THREE.CircleGeometry(0.85, 24);
        foamGeo.rotateX(-Math.PI / 2);
        const foamMat = new THREE.MeshStandardMaterial({
            color: 0xdf9954, // lighter frothy tea top
            roughness: 0.4,
            transparent: true,
            opacity: 0.95
        });
        this.foamMesh = new THREE.Mesh(foamGeo, foamMat);
        this.glassGroup.add(this.foamMesh);

        this.updateLiquidHeight(this.targetFill);
    }

    buildSteam() {
        // Particle steam system
        const particleCount = 45;
        this.steamGroup = new THREE.Group();
        this.glassGroup.add(this.steamGroup);

        const steamGeo = new THREE.SphereGeometry(0.06, 6, 6);
        const steamMat = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.25
        });

        for (let i = 0; i < particleCount; i++) {
            const p = new THREE.Mesh(steamGeo, steamMat.clone());
            this.resetSteamParticle(p);
            p.position.y += Math.random() * 1.5;
            this.steamParticles.push(p);
            this.steamGroup.add(p);
        }
    }

    resetSteamParticle(p) {
        const angle = Math.random() * Math.PI * 2;
        const radius = Math.random() * 0.4;
        p.position.x = Math.cos(angle) * radius;
        p.position.z = Math.sin(angle) * radius;
        p.position.y = this.foamMesh ? this.foamMesh.position.y + 0.1 : 0.2;
        p.userData = {
            vy: 0.012 + Math.random() * 0.018,
            vx: (Math.random() - 0.5) * 0.005,
            vz: (Math.random() - 0.5) * 0.005,
            scaleSpeed: 0.02 + Math.random() * 0.02,
            life: 0,
            maxLife: 60 + Math.random() * 50
        };
        p.scale.set(0.6, 0.6, 0.6);
        p.material.opacity = 0.25 * this.steamIntensity;
    }

    buildLighting() {
        // Ambient soft warm tea light
        const ambient = new THREE.AmbientLight(0xffeedd, 0.9);
        this.scene.add(ambient);

        // Directional warm sunlight / tapri spotlight
        const dirLight = new THREE.DirectionalLight(0xffa751, 1.2);
        dirLight.position.set(4, 5, 4);
        this.scene.add(dirLight);

        // Cool back rim light for glass refraction highlights
        const rimLight = new THREE.DirectionalLight(0x70d6ff, 0.8);
        rimLight.position.set(-4, 3, -3);
        this.scene.add(rimLight);

        // Point light inside tea for internal golden glow
        this.internalGlow = new THREE.PointLight(0xff9438, 1.5, 3);
        this.internalGlow.position.set(0, -0.2, 0);
        this.glassGroup.add(this.internalGlow);
    }

    setupEvents() {
        const dom = this.renderer.domElement;

        const onPointerDown = (e) => {
            this.isDragging = true;
            this.prevMouse = {
                x: e.clientX || (e.touches && e.touches[0].clientX) || 0,
                y: e.clientY || (e.touches && e.touches[0].clientY) || 0
            };
        };

        const onPointerMove = (e) => {
            if (!this.isDragging) return;
            const curX = e.clientX || (e.touches && e.touches[0].clientX) || 0;
            const curY = e.clientY || (e.touches && e.touches[0].clientY) || 0;
            const dx = curX - this.prevMouse.x;
            const dy = curY - this.prevMouse.y;

            this.glassGroup.rotation.y += dx * 0.012;
            this.rotationVelocity.y = dx * 0.002;

            // Fluid slosh impulse from drag
            this.slosh.vx += dx * 0.0015;
            this.slosh.vz += dy * 0.0015;

            this.prevMouse = { x: curX, y: curY };
        };

        const onPointerUp = () => {
            this.isDragging = false;
        };

        dom.addEventListener('mousedown', onPointerDown);
        window.addEventListener('mousemove', onPointerMove);
        window.addEventListener('mouseup', onPointerUp);

        dom.addEventListener('touchstart', onPointerDown, { passive: true });
        window.addEventListener('touchmove', onPointerMove, { passive: true });
        window.addEventListener('touchend', onPointerUp);

        // Accelerometer / Device Orientation support (as requested in PRD)
        if (window.DeviceOrientationEvent) {
            window.addEventListener('deviceorientation', (e) => {
                if (e.gamma !== null && e.beta !== null) {
                    this.slosh.vx += (e.gamma || 0) * 0.0003;
                    this.slosh.vz += ((e.beta || 0) - 45) * 0.0003;
                }
            });
        }

        // Resize
        window.addEventListener('resize', () => {
            if (!this.container || !this.renderer) return;
            const w = this.container.clientWidth;
            const h = this.container.clientHeight;
            this.camera.aspect = w / h;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(w, h);
        });
    }

    triggerSlosh() {
        this.slosh.vx += (Math.random() - 0.5) * 0.08;
        this.slosh.vz += (Math.random() - 0.5) * 0.08;
        if (window.chaiAudio) window.chaiAudio.playClink();
    }

    setCupCount(count) {
        this.cupsToday = count;
        // Map 0 to 6+ cups to fill level 0.1 to 0.95
        const ratio = Math.min(count / this.maxVisualCups, 1.0);
        this.targetFill = 0.12 + ratio * 0.82;
        this.steamIntensity = 1.6; // boosted steam for fresh chai!
        this.triggerSlosh();
    }

    updateLiquidHeight(fillRatio) {
        const height = Math.max(0.1, fillRatio * this.liquidHeightMax);
        const curY = this.glassBottomY + height / 2;

        this.liquidMesh.scale.set(1, height, 1);
        this.liquidMesh.position.y = curY;

        // Top foam follows liquid top
        const foamY = this.glassBottomY + height;
        this.foamMesh.position.y = foamY;
        
        // Scale foam with glass taper
        const taperScale = 0.72 + (0.95 - 0.72) * (fillRatio);
        this.foamMesh.scale.set(taperScale, taperScale, taperScale);
    }

    animate() {
        requestAnimationFrame(this.animate);

        // Fill height lerping
        this.currentFill += (this.targetFill - this.currentFill) * 0.05;
        this.updateLiquidHeight(this.currentFill);

        // Fluid slosh physics (spring damper)
        const spring = 0.08;
        const damping = 0.88;
        this.slosh.vx += -this.slosh.x * spring;
        this.slosh.vz += -this.slosh.z * spring;
        this.slosh.vx *= damping;
        this.slosh.vz *= damping;
        this.slosh.x += this.slosh.vx;
        this.slosh.z += this.slosh.vz;

        // Tilt liquid mesh slightly to represent sloshing
        this.liquidMesh.rotation.z = this.slosh.x * 0.6;
        this.liquidMesh.rotation.x = this.slosh.z * 0.6;
        this.foamMesh.rotation.z = this.slosh.x * 0.7;
        this.foamMesh.rotation.x = -Math.PI / 2 + this.slosh.z * 0.7;

        // Gentle auto rotation when not dragging
        if (!this.isDragging) {
            this.rotationVelocity.y *= 0.96;
            this.glassGroup.rotation.y += this.rotationVelocity.y + 0.004;
        }

        // Steam particles
        if (this.steamIntensity > 0.4) {
            this.steamIntensity *= 0.999;
        }

        const foamY = this.foamMesh.position.y;
        this.steamParticles.forEach(p => {
            p.userData.life++;
            p.position.y += p.userData.vy;
            p.position.x += p.userData.vx;
            p.position.z += p.userData.vz;
            p.scale.x += p.userData.scaleSpeed;
            p.scale.y += p.userData.scaleSpeed;
            p.scale.z += p.userData.scaleSpeed;

            const progress = p.userData.life / p.userData.maxLife;
            p.material.opacity = Math.max(0, (1 - progress) * 0.28 * this.steamIntensity);

            if (p.userData.life >= p.userData.maxLife || p.position.y > foamY + 2.2) {
                this.resetSteamParticle(p);
            }
        });

        this.renderer.render(this.scene, this.camera);
    }

    initFallback2D() {
        // Fallback Canvas 2D renderer in case WebGL is disabled or Three.js CDN blocked
        this.container.innerHTML = '<canvas id="fallback-canvas" width="320" height="340"></canvas>';
        const canvas = document.getElementById('fallback-canvas');
        const ctx = canvas.getContext('2d');
        let angle = 0;

        const render2D = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            angle += 0.02;

            // Draw Tapri Cutting Glass in 2D
            ctx.save();
            ctx.translate(canvas.width / 2, canvas.height / 2 + 20);

            // Coaster
            ctx.fillStyle = '#241711';
            ctx.beginPath();
            ctx.ellipse(0, 110, 80, 20, 0, 0, Math.PI * 2);
            ctx.fill();

            // Glass Body
            ctx.beginPath();
            ctx.moveTo(-60, -100);
            ctx.lineTo(60, -100);
            ctx.lineTo(44, 90);
            ctx.lineTo(-44, 90);
            ctx.closePath();
            ctx.fillStyle = 'rgba(255,255,255,0.08)';
            ctx.fill();
            ctx.strokeStyle = 'rgba(255,255,255,0.3)';
            ctx.lineWidth = 3;
            ctx.stroke();

            // Liquid
            const fillH = 160 * Math.min(this.targetFill, 1.0);
            const liquidY = 85 - fillH;
            ctx.save();
            ctx.beginPath();
            ctx.moveTo(-44, 85);
            ctx.lineTo(44, 85);
            ctx.lineTo(44 + (fillH / 160) * 12, liquidY);
            ctx.lineTo(-44 - (fillH / 160) * 12, liquidY);
            ctx.closePath();
            ctx.fillStyle = '#c4702b';
            ctx.fill();
            ctx.restore();

            // Steam
            ctx.strokeStyle = 'rgba(255,255,255,0.2)';
            ctx.lineWidth = 2;
            for (let i = -1; i <= 1; i++) {
                ctx.beginPath();
                const sx = i * 20;
                ctx.moveTo(sx, liquidY - 10);
                ctx.bezierCurveTo(sx + Math.sin(angle + i) * 15, liquidY - 50, sx - Math.sin(angle + i) * 15, liquidY - 90, sx, liquidY - 130);
                ctx.stroke();
            }

            ctx.restore();
            requestAnimationFrame(render2D);
        };
        requestAnimationFrame(render2D);
    }
}

window.Chai3DHero = Chai3DHero;

