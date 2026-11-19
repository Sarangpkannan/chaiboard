/**
 * Chaiboard Industrial 3D Cutting Chai Visualizer
 * High-fidelity WebGL simulation of authentic Indian cutting chai in a 16-faceted glass tumbler.
 * Features PBR glass transmission (IOR 1.517), volumetric milk tea fluid, froth meniscus,
 * floating spice particles, thermal steam physics, inertia 360° drag orbit, and cursor parallax.
 */

class Chai3DHero {
    constructor(containerId) {
        this.container = typeof containerId === 'string' ? document.getElementById(containerId) : containerId;
        this.cupsToday = 0;
        this.maxVisualCups = 6;
        this.currentFill = 0.45;
        this.targetFill = 0.45;
        this.slosh = { x: 0, z: 0, vx: 0, vz: 0 };
        this.isDragging = false;
        this.prevMouse = { x: 0, y: 0 };
        this.rotationVelocity = { x: 0, y: 0.003 };
        this.mouseParallax = { x: 0, y: 0, targetX: 0, targetY: 0 };
        this.steamIntensity = 1.0;
        this.steamParticles = [];

        this.init();
    }

    init() {
        if (!this.container) return;

        if (typeof THREE === 'undefined') {
            console.warn('Three.js not found, falling back to 2D Canvas');
            this.initFallback2D();
            return;
        }

        try {
            this.initThree();
        } catch (err) {
            console.error('Three.js initialization failed:', err);
            this.initFallback2D();
        }
    }

    initThree() {
        const width = this.container.clientWidth || 340;
        const height = this.container.clientHeight || 380;

        // Scene
        this.scene = new THREE.Scene();

        // Camera
        this.camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 100);
        this.camera.position.set(0, 1.4, 5.4);
        this.camera.lookAt(0, 0.15, 0);

        // Renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
        this.renderer.setSize(width, height);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.15;
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

        this.container.innerHTML = '';
        this.container.appendChild(this.renderer.domElement);

        // Master Model Group
        this.modelGroup = new THREE.Group();
        this.scene.add(this.modelGroup);

        // Rotating Glass Group
        this.glassGroup = new THREE.Group();
        this.modelGroup.add(this.glassGroup);

        this.buildCuttingChaiGlass();
        this.buildKadakLiquid();
        this.buildThermalSteam();
        this.buildIndustrialLighting();
        this.setupEventListeners();

        this.animate = this.animate.bind(this);
        requestAnimationFrame(this.animate);
    }

    buildCuttingChaiGlass() {
        // Iconic Indian Tapri Cutting Glass:
        // 16-faceted tapered tumbler with thick heavy-duty optical glass base
        const topRadius = 0.98;
        const bottomRadius = 0.72;
        const glassHeight = 2.45;
        const facets = 16; // 16 facets gives the signature cutting glass reflection

        // 1. Outer Faceted Glass Cylinder
        const outerGeo = new THREE.CylinderGeometry(topRadius, bottomRadius, glassHeight, facets, 1, true);
        const glassPbrMaterial = new THREE.MeshPhysicalMaterial({
            color: 0xf4f8fa,
            metalness: 0.04,
            roughness: 0.08,
            transmission: 0.92, // Glass refraction transparency
            transparent: true,
            opacity: 0.88,
            ior: 1.517, // Standard soda-lime glass refractive index
            reflectivity: 0.9,
            clearcoat: 1.0,
            clearcoatRoughness: 0.06,
            side: THREE.DoubleSide
        });

        this.outerGlass = new THREE.Mesh(outerGeo, glassPbrMaterial);
        this.outerGlass.position.y = 0;
        this.glassGroup.add(this.outerGlass);

        // 2. Thick Optical Glass Bottom (Solid base plate typical of street cutting glasses)
        const baseThickness = 0.28;
        const baseGeo = new THREE.CylinderGeometry(bottomRadius * 0.98, bottomRadius * 0.92, baseThickness, facets);
        const baseMat = new THREE.MeshPhysicalMaterial({
            color: 0xe6f2f8,
            roughness: 0.12,
            transmission: 0.82,
            transparent: true,
            opacity: 0.92,
            ior: 1.52
        });
        const baseMesh = new THREE.Mesh(baseGeo, baseMat);
        baseMesh.position.y = -glassHeight / 2 + baseThickness / 2;
        this.glassGroup.add(baseMesh);

        // 3. Molded Glass Rib Rings (Structural grip ridges)
        for (let i = 0; i < 4; i++) {
            const hRatio = 0.18 + i * 0.18;
            const r = bottomRadius + (topRadius - bottomRadius) * hRatio;
            const ridgeGeo = new THREE.TorusGeometry(r * 1.008, 0.022, 8, facets);
            ridgeGeo.rotateX(Math.PI / 2);
            const ridgeMat = new THREE.MeshStandardMaterial({
                color: 0xffffff,
                transparent: true,
                opacity: 0.4,
                roughness: 0.2
            });
            const ridgeMesh = new THREE.Mesh(ridgeGeo, ridgeMat);
            ridgeMesh.position.y = -glassHeight / 2 + glassHeight * hRatio;
            this.glassGroup.add(ridgeMesh);
        }

        // 4. Smooth Glass Rim Bead
        const rimGeo = new THREE.TorusGeometry(topRadius * 1.005, 0.035, 12, facets);
        rimGeo.rotateX(Math.PI / 2);
        const rimMesh = new THREE.Mesh(rimGeo, glassPbrMaterial);
        rimMesh.position.y = glassHeight / 2;
        this.glassGroup.add(rimMesh);

        // 5. Sleek Industrial Saucer / Stainless Base
        const saucerGeo = new THREE.CylinderGeometry(1.45, 1.35, 0.06, 32);
        const saucerMat = new THREE.MeshStandardMaterial({
            color: 0x16181f,
            metalness: 0.85,
            roughness: 0.25
        });
        const saucerMesh = new THREE.Mesh(saucerGeo, saucerMat);
        saucerMesh.position.y = -glassHeight / 2 - 0.05;
        this.glassGroup.add(saucerMesh);
    }

    buildKadakLiquid() {
        this.liquidHeightMax = 1.95;
        this.glassBottomY = -1.05;

        // Liquid Column Cylinder
        this.liquidGeo = new THREE.CylinderGeometry(0.88, 0.68, 1, 32);
        
        // Authentic Indian Kadak Cutting Chai: Rich warm caramel-amber milk tea
        this.liquidMat = new THREE.MeshStandardMaterial({
            color: 0xb95d18,
            roughness: 0.22,
            metalness: 0.08,
            transparent: true,
            opacity: 0.95
        });
        this.liquidMesh = new THREE.Mesh(this.liquidGeo, this.liquidMat);
        this.glassGroup.add(this.liquidMesh);

        // Tea Top Foam / Malai Surface (Creamy froth layer)
        const foamGeo = new THREE.CircleGeometry(0.88, 32);
        foamGeo.rotateX(-Math.PI / 2);
        const foamMat = new THREE.MeshStandardMaterial({
            color: 0xe5a96c,
            roughness: 0.45,
            metalness: 0.02,
            transparent: true,
            opacity: 0.96
        });
        this.foamMesh = new THREE.Mesh(foamGeo, foamMat);
        this.glassGroup.add(this.foamMesh);

        // Cardamom & Spiced Tea Flecks floating on froth surface
        const flecksCount = 18;
        const fleckGeo = new THREE.BufferGeometry();
        const fleckPositions = new Float32Array(flecksCount * 3);
        for (let i = 0; i < flecksCount; i++) {
            const rad = Math.random() * 0.72;
            const ang = Math.random() * Math.PI * 2;
            fleckPositions[i * 3] = Math.cos(ang) * rad;
            fleckPositions[i * 3 + 1] = 0.008; // slightly above foam
            fleckPositions[i * 3 + 2] = Math.sin(ang) * rad;
        }
        fleckGeo.setAttribute('position', new THREE.BufferAttribute(fleckPositions, 3));
        const fleckMat = new THREE.PointsMaterial({
            color: 0x4a2408,
            size: 0.035,
            transparent: true,
            opacity: 0.85
        });
        this.flecksPoints = new THREE.Points(fleckGeo, fleckMat);
        this.foamMesh.add(this.flecksPoints);

        this.updateLiquidHeight(this.targetFill);
    }

    buildThermalSteam() {
        const particleCount = 42;
        this.steamGroup = new THREE.Group();
        this.glassGroup.add(this.steamGroup);

        const steamGeo = new THREE.SphereGeometry(0.065, 8, 8);
        const steamMat = new THREE.MeshBasicMaterial({
            color: 0xfafafa,
            transparent: true,
            opacity: 0.22
        });

        for (let i = 0; i < particleCount; i++) {
            const p = new THREE.Mesh(steamGeo, steamMat.clone());
            this.resetSteamParticle(p);
            p.position.y += Math.random() * 1.6;
            this.steamParticles.push(p);
            this.steamGroup.add(p);
        }
    }

    resetSteamParticle(p) {
        const angle = Math.random() * Math.PI * 2;
        const radius = Math.random() * 0.42;
        p.position.x = Math.cos(angle) * radius;
        p.position.z = Math.sin(angle) * radius;
        p.position.y = this.foamMesh ? this.foamMesh.position.y + 0.08 : 0.2;
        p.userData = {
            vy: 0.014 + Math.random() * 0.018,
            vx: (Math.random() - 0.5) * 0.006,
            vz: (Math.random() - 0.5) * 0.006,
            scaleSpeed: 0.022 + Math.random() * 0.02,
            life: 0,
            maxLife: 65 + Math.random() * 45
        };
        p.scale.set(0.5, 0.5, 0.5);
        p.material.opacity = 0.24 * this.steamIntensity;
    }

    buildIndustrialLighting() {
        // Ambient soft fill
        const ambient = new THREE.AmbientLight(0xedf2f7, 0.85);
        this.scene.add(ambient);

        // Key light: Warm radiant amber light
        const keyLight = new THREE.DirectionalLight(0xffb366, 1.4);
        keyLight.position.set(4, 5, 4);
        this.scene.add(keyLight);

        // Rim Light: High-tech cool cyan highlight on glass facets
        const rimLight = new THREE.DirectionalLight(0x38bdf8, 1.1);
        rimLight.position.set(-4, 3.5, -3.5);
        this.scene.add(rimLight);

        // Internal Golden Amber Liquid Glow
        this.internalGlow = new THREE.PointLight(0xf59e0b, 1.6, 3.2);
        this.internalGlow.position.set(0, -0.15, 0);
        this.glassGroup.add(this.internalGlow);
    }

    setupEventListeners() {
        const dom = this.renderer.domElement;

        const onPointerDown = (e) => {
            this.isDragging = true;
            this.prevMouse = {
                x: e.clientX || (e.touches && e.touches[0].clientX) || 0,
                y: e.clientY || (e.touches && e.touches[0].clientY) || 0
            };
        };

        const onPointerMove = (e) => {
            const curX = e.clientX || (e.touches && e.touches[0].clientX) || 0;
            const curY = e.clientY || (e.touches && e.touches[0].clientY) || 0;

            // Parallax tracking even when not dragging
            const rect = dom.getBoundingClientRect();
            const relX = ((curX - rect.left) / rect.width - 0.5) * 2;
            const relY = ((curY - rect.top) / rect.height - 0.5) * 2;
            this.mouseParallax.targetX = relX * 0.35;
            this.mouseParallax.targetY = relY * 0.25;

            if (!this.isDragging) return;

            const dx = curX - this.prevMouse.x;
            const dy = curY - this.prevMouse.y;

            this.glassGroup.rotation.y += dx * 0.012;
            this.rotationVelocity.y = dx * 0.002;

            // Liquid slosh impulse
            this.slosh.vx += dx * 0.0016;
            this.slosh.vz += dy * 0.0016;

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

        // Window resize
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
        this.slosh.vx += (Math.random() - 0.5) * 0.09;
        this.slosh.vz += (Math.random() - 0.5) * 0.09;
        if (window.chaiAudio && typeof window.chaiAudio.playClink === 'function') {
            window.chaiAudio.playClink();
        }
    }

    setCupCount(count) {
        this.cupsToday = count;
        const ratio = Math.min(count / this.maxVisualCups, 1.0);
        this.targetFill = 0.2 + ratio * 0.75;
        this.steamIntensity = 1.6;
        this.triggerSlosh();
    }

    updateLiquidHeight(fillRatio) {
        const height = Math.max(0.12, fillRatio * this.liquidHeightMax);
        const curY = this.glassBottomY + height / 2;

        this.liquidMesh.scale.set(1, height, 1);
        this.liquidMesh.position.y = curY;

        // Top foam layer
        const foamY = this.glassBottomY + height;
        this.foamMesh.position.y = foamY;

        // Scale foam with faceted glass taper
        const taperScale = 0.72 + (0.98 - 0.72) * fillRatio;
        this.foamMesh.scale.set(taperScale, taperScale, taperScale);
    }

    animate() {
        requestAnimationFrame(this.animate);

        // Lerp fill level
        this.currentFill += (this.targetFill - this.currentFill) * 0.05;
        this.updateLiquidHeight(this.currentFill);

        // Fluid slosh physics (spring damper)
        const spring = 0.075;
        const damping = 0.89;
        this.slosh.vx += -this.slosh.x * spring;
        this.slosh.vz += -this.slosh.z * spring;
        this.slosh.vx *= damping;
        this.slosh.vz *= damping;
        this.slosh.x += this.slosh.vx;
        this.slosh.z += this.slosh.vz;

        // Tilt liquid and foam
        this.liquidMesh.rotation.z = this.slosh.x * 0.55;
        this.liquidMesh.rotation.x = this.slosh.z * 0.55;
        this.foamMesh.rotation.z = this.slosh.x * 0.65;
        this.foamMesh.rotation.x = -Math.PI / 2 + this.slosh.z * 0.65;

        // Smooth rotation when not dragging
        if (!this.isDragging) {
            this.rotationVelocity.y *= 0.96;
            this.glassGroup.rotation.y += this.rotationVelocity.y + 0.004;
        }

        // Parallax cursor response on the model group
        this.mouseParallax.x += (this.mouseParallax.targetX - this.mouseParallax.x) * 0.05;
        this.mouseParallax.y += (this.mouseParallax.targetY - this.mouseParallax.y) * 0.05;
        this.modelGroup.rotation.y = this.mouseParallax.x;
        this.modelGroup.rotation.x = -this.mouseParallax.y * 0.5;

        // Thermal steam particles
        if (this.steamIntensity > 0.4) {
            this.steamIntensity *= 0.9992;
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
            p.material.opacity = Math.max(0, (1 - progress) * 0.26 * this.steamIntensity);

            if (p.userData.life >= p.userData.maxLife || p.position.y > foamY + 2.4) {
                this.resetSteamParticle(p);
            }
        });

        this.renderer.render(this.scene, this.camera);
    }

    initFallback2D() {
        this.container.innerHTML = '<canvas id="fallback-canvas" width="340" height="380" style="width:100%;height:100%;"></canvas>';
        const canvas = document.getElementById('fallback-canvas');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        let angle = 0;

        const render2D = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            angle += 0.02;

            ctx.save();
            ctx.translate(canvas.width / 2, canvas.height / 2 + 10);

            // Base Saucer
            ctx.fillStyle = '#16181f';
            ctx.beginPath();
            ctx.ellipse(0, 115, 85, 22, 0, 0, Math.PI * 2);
            ctx.fill();

            // Glass Body
            ctx.beginPath();
            ctx.moveTo(-65, -110);
            ctx.lineTo(65, -110);
            ctx.lineTo(48, 95);
            ctx.lineTo(-48, 95);
            ctx.closePath();
            ctx.fillStyle = 'rgba(255,255,255,0.06)';
            ctx.fill();
            ctx.strokeStyle = 'rgba(255,255,255,0.35)';
            ctx.lineWidth = 2.5;
            ctx.stroke();

            // Kadak Chai Liquid
            const fillH = 170 * Math.min(this.targetFill, 1.0);
            const liquidY = 90 - fillH;
            ctx.save();
            ctx.beginPath();
            ctx.moveTo(-48, 90);
            ctx.lineTo(48, 90);
            ctx.lineTo(48 + (fillH / 170) * 14, liquidY);
            ctx.lineTo(-48 - (fillH / 170) * 14, liquidY);
            ctx.closePath();
            ctx.fillStyle = '#b95d18';
            ctx.fill();

            // Froth Top
            ctx.fillStyle = '#e5a96c';
            ctx.beginPath();
            const topW = 48 + (fillH / 170) * 14;
            ctx.ellipse(0, liquidY, topW, 9, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();

            // Steam
            ctx.strokeStyle = 'rgba(255,255,255,0.2)';
            ctx.lineWidth = 2;
            for (let i = -1; i <= 1; i++) {
                ctx.beginPath();
                const sx = i * 22;
                ctx.moveTo(sx, liquidY - 8);
                ctx.bezierCurveTo(sx + Math.sin(angle + i) * 16, liquidY - 50, sx - Math.sin(angle + i) * 16, liquidY - 95, sx, liquidY - 140);
                ctx.stroke();
            }

            ctx.restore();
            requestAnimationFrame(render2D);
        };
        requestAnimationFrame(render2D);
    }
}

window.Chai3DHero = Chai3DHero;
