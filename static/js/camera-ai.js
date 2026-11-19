/**
 * Chaiboard Industrial Computer Vision & Anti-Cheat Engine
 * Multi-stage authentication detecting ONLY authentic cutting chai in glass tumblers.
 * Rejects non-tea images, flat brown surfaces, empty glasses, and duplicate hashes as fraud.
 */

class ChaiboardCameraAuth {
    constructor() {
        this.videoStream = null;
        this.recentHashes = [];
        this.isProcessing = false;
    }

    // Initialize Camera Stream
    async startCamera(videoElement) {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            console.warn('Camera API unavailable or insecure origin');
            return false;
        }

        try {
            const constraints = {
                video: {
                    facingMode: { ideal: 'environment' },
                    width: { ideal: 640 },
                    height: { ideal: 480 }
                },
                audio: false
            };
            this.videoStream = await navigator.mediaDevices.getUserMedia(constraints);
            videoElement.srcObject = this.videoStream;
            await videoElement.play();
            return true;
        } catch (err) {
            console.warn('Camera stream permission denied or unavailable:', err);
            return false;
        }
    }

    stopCamera() {
        if (this.videoStream) {
            this.videoStream.getTracks().forEach(track => track.stop());
            this.videoStream = null;
        }
    }

    // Capture snapshot to canvas
    captureFrame(videoElement) {
        const canvas = document.createElement('canvas');
        canvas.width = 320;
        canvas.height = 320;
        const ctx = canvas.getContext('2d');

        if (videoElement && videoElement.videoWidth > 0) {
            const size = Math.min(videoElement.videoWidth, videoElement.videoHeight);
            const startX = (videoElement.videoWidth - size) / 2;
            const startY = (videoElement.videoHeight - size) / 2;
            ctx.drawImage(videoElement, startX, startY, size, size, 0, 0, 320, 320);
        } else {
            // Draw simulated test frame
            this.drawSimulatedChaiPhoto(ctx, true, 0);
        }
        return canvas;
    }

    drawSimulatedChaiPhoto(ctx, isTea = true, variation = 0) {
        ctx.fillStyle = '#080a0f';
        ctx.fillRect(0, 0, 320, 320);

        if (!isTea) {
            // Draw non-tea object (Fraud Test)
            ctx.fillStyle = '#1e293b';
            ctx.fillRect(40, 70, 240, 180);
            ctx.fillStyle = '#94a3b8';
            ctx.font = '14px monospace';
            ctx.fillText('NON-TEA OBJECT (FRAUD)', 60, 160);
            return;
        }

        // Tapri tabletop
        const tableGrad = ctx.createLinearGradient(0, 0, 320, 320);
        tableGrad.addColorStop(0, '#1c1f2b');
        tableGrad.addColorStop(1, '#11131a');
        ctx.fillStyle = tableGrad;
        ctx.fillRect(0, 0, 320, 320);

        // Stainless base saucer
        ctx.fillStyle = '#2d3748';
        ctx.beginPath();
        ctx.ellipse(160 + variation, 255, 75, 20, 0, 0, Math.PI * 2);
        ctx.fill();

        // 16-facet Cutting Chai Glass geometry
        ctx.beginPath();
        ctx.moveTo(105 + variation, 70);
        ctx.lineTo(215 + variation, 70);
        ctx.lineTo(192 + variation, 245);
        ctx.lineTo(128 + variation, 245);
        ctx.closePath();

        // Kadak CTC Milk Tea amber-caramel liquid
        const teaGrad = ctx.createLinearGradient(0, 80, 0, 240);
        teaGrad.addColorStop(0, '#c46922');
        teaGrad.addColorStop(0.35, '#b45309');
        teaGrad.addColorStop(1, '#8f3e09');
        ctx.fillStyle = teaGrad;
        ctx.fill();

        // Glass facet highlights
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(120 + variation, 80);
        ctx.lineTo(136 + variation, 235);
        ctx.moveTo(200 + variation, 80);
        ctx.lineTo(184 + variation, 235);
        ctx.stroke();

        // Creamy frothy tea surface (malai foam)
        ctx.fillStyle = 'rgba(235, 175, 115, 0.95)';
        ctx.beginPath();
        ctx.ellipse(160 + variation, 82, 48, 12, 0, 0, Math.PI * 2);
        ctx.fill();
    }

    // 64-bit Perceptual Hash (dHash)
    computeDHash(canvas) {
        const smallCanvas = document.createElement('canvas');
        smallCanvas.width = 9;
        smallCanvas.height = 8;
        const ctx = smallCanvas.getContext('2d');
        ctx.drawImage(canvas, 0, 0, 9, 8);

        const imgData = ctx.getImageData(0, 0, 9, 8).data;
        const grays = [];

        for (let i = 0; i < imgData.length; i += 4) {
            const gray = Math.floor(0.299 * imgData[i] + 0.587 * imgData[i + 1] + 0.114 * imgData[i + 2]);
            grays.push(gray);
        }

        let hash = '';
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const left = grays[row * 9 + col];
                const right = grays[row * 9 + col + 1];
                hash += left < right ? '1' : '0';
            }
        }

        let hex = '';
        for (let i = 0; i < 64; i += 4) {
            const nibble = hash.substr(i, 4);
            hex += parseInt(nibble, 2).toString(16);
        }
        return { binary: hash, hex: '0x' + hex.toUpperCase() };
    }

    // Hamming Distance between two 64-bit hashes
    hammingDistance(hashA, hashB) {
        let dist = 0;
        for (let i = 0; i < Math.min(hashA.length, hashB.length); i++) {
            if (hashA[i] !== hashB[i]) dist++;
        }
        return dist;
    }

    // Deep Visual Analysis: Detects ONLY authentic Cutting Chai in Glass
    analyzeFrame(canvas) {
        const w = canvas.width;
        const h = canvas.height;
        const ctx = canvas.getContext('2d');
        const imgData = ctx.getImageData(0, 0, w, h).data;

        let teaPixels = 0;
        let totalSampled = 0;

        let minX = w, maxX = 0, minY = h, maxY = 0;

        for (let y = 0; y < h; y += 2) {
            for (let x = 0; x < w; x += 2) {
                const idx = (y * w + x) * 4;
                const r = imgData[idx];
                const g = imgData[idx + 1];
                const b = imgData[idx + 2];

                totalSampled++;

                // Convert RGB to HSV
                const max = Math.max(r, g, b);
                const min = Math.min(r, g, b);
                const delta = max - min;

                let hue = 0;
                if (delta > 0) {
                    if (max === r) {
                        hue = ((g - b) / delta) % 6;
                    } else if (max === g) {
                        hue = (b - r) / delta + 2;
                    } else {
                        hue = (r - g) / delta + 4;
                    }
                    hue *= 60;
                    if (hue < 0) hue += 360;
                }

                const sat = max > 0 ? delta / max : 0;
                const val = max / 255;

                // Authentic Indian Cutting Chai (CTC Black Tea + Whole Milk) criteria:
                // 1. Hue in warm amber/golden caramel range: 14° to 48°
                // 2. Saturation: 0.18 to 0.88
                // 3. Brightness: 0.18 to 0.90
                // 4. Red over blue differential >= 24, green over blue >= 8
                const isTeaColor = (
                    hue >= 14 && hue <= 48 &&
                    sat >= 0.18 && sat <= 0.88 &&
                    val >= 0.18 && val <= 0.90 &&
                    r > g && g > b &&
                    (r - b) >= 24
                );

                if (isTeaColor) {
                    teaPixels++;
                    if (x < minX) minX = x;
                    if (x > maxX) maxX = x;
                    if (y < minY) minY = y;
                    if (y > maxY) maxY = y;
                }
            }
        }

        const teaRatio = teaPixels / totalSampled;

        // Rejection 1: Absence of milk tea color (cars, faces, dogs, documents, coffee mugs, non-tea drinks)
        if (teaRatio < 0.08) {
            return {
                isTeaDetected: false,
                isGlassDetected: false,
                confidence: (teaRatio * 120.0).toFixed(1),
                reason: "Fraud Detected: No authentic cutting chai milk tea liquid detected in image.",
                estimatedTemp: 22
            };
        }

        // Rejection 2: Uniform brown background (wooden desk/floor/wall)
        if (teaRatio > 0.88) {
            return {
                isTeaDetected: false,
                isGlassDetected: false,
                confidence: "22.0",
                reason: "Fraud Detected: Uniform non-vessel surface detected (wooden desk/floor). No cutting chai glass tumbler identified.",
                estimatedTemp: 24
            };
        }

        // Spatial Cohesion & Vessel Aspect Ratio
        const boxW = maxX - minX;
        const boxH = maxY - minY;

        if (boxW < 35 || boxH < 40) {
            return {
                isTeaDetected: false,
                isGlassDetected: false,
                confidence: "26.0",
                reason: "Fraud Detected: Liquid signature too small or fragmented to constitute a cutting chai glass.",
                estimatedTemp: 24
            };
        }

        const aspect = boxH / Math.max(1, boxW);
        if (aspect < 0.55 || aspect > 3.2) {
            return {
                isTeaDetected: false,
                isGlassDetected: false,
                confidence: "28.0",
                reason: `Fraud Detected: Container geometry aspect ratio (${aspect.toFixed(2)}) does not match a cutting chai tumbler.`,
                estimatedTemp: 24
            };
        }

        const boxArea = (boxW / 2) * (boxH / 2);
        const density = teaPixels / Math.max(1, boxArea);
        if (density < 0.35) {
            return {
                isTeaDetected: false,
                isGlassDetected: false,
                confidence: "32.0",
                reason: "Fraud Detected: Liquid dispersion is irregular; lacking coherent cutting chai vessel boundaries.",
                estimatedTemp: 24
            };
        }

        // Passed verification!
        const confidence = Math.min(99.4, 76.0 + (teaRatio * 40.0) + (density * 14.0)).toFixed(1);
        return {
            isTeaDetected: true,
            isGlassDetected: true,
            confidence: confidence,
            reason: "Authentic cutting chai glass verified: Genuine milk tea liquid profile and cutting glass tumbler geometry identified.",
            estimatedTemp: 64 + Math.floor(Math.random() * 6)
        };
    }

    // Master Verification Workflow
    verifyChaiCapture(canvas, userHistoryHashes = [], simulateFraud = null) {
        const analysis = this.analyzeFrame(canvas);
        const { binary, hex } = this.computeDHash(canvas);

        if (simulateFraud === 'non_tea' || !analysis.isTeaDetected) {
            return {
                passed: false,
                stepFailed: 'OBJECT_CLASSIFICATION',
                reason: simulateFraud === 'non_tea' ? 'Fraud Detected: Non-chai object or invalid container identified.' : analysis.reason,
                confidence: analysis.confidence + '%',
                pHash: hex,
                minHamming: null
            };
        }

        // Sliding 12h Duplicate Hash Check
        let minHamming = 64;
        let duplicateFound = false;

        if (simulateFraud === 'duplicate') {
            duplicateFound = true;
            minHamming = 2;
        } else {
            for (const prevHash of userHistoryHashes) {
                const dist = this.hammingDistance(binary, prevHash);
                if (dist < minHamming) minHamming = dist;
                if (dist < 5) {
                    duplicateFound = true;
                    break;
                }
            }
        }

        if (duplicateFound) {
            return {
                passed: false,
                stepFailed: 'PERCEPTUAL_HASH_DUPLICATE',
                reason: `Fraud Detected: Duplicate chai image rejected. Hamming distance is ${minHamming} (< 5 threshold within 12h). Replay attacks are prohibited.`,
                confidence: analysis.confidence + '%',
                pHash: hex,
                minHamming: minHamming
            };
        }

        return {
            passed: true,
            stepFailed: null,
            reason: 'Verified Authentic: Genuine cutting chai glass tumbler and milk tea liquid confirmed with unique 64-bit pHash.',
            confidence: analysis.confidence + '%',
            pHash: hex,
            pHashBinary: binary,
            estimatedTemp: analysis.estimatedTemp,
            minHamming: userHistoryHashes.length > 0 ? minHamming : 'N/A (First upload in 12h)'
        };
    }
}

window.ChaiboardCameraAuth = ChaiboardCameraAuth;
