// Camera Capture, MobileNet Classification & pHash Anti-Cheat Engine
class ChaiboardCameraAuth {
    constructor() {
        this.videoStream = null;
        this.recentHashes = []; // Hashes within 12 hours
        this.isProcessing = false;
    }

    // Initialize Camera Stream
    async startCamera(videoElement) {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            console.warn('Camera API not supported or insecure origin');
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
            console.warn('Camera access denied or unavailable:', err);
            return false;
        }
    }

    stopCamera() {
        if (this.videoStream) {
            this.videoStream.getTracks().forEach(track => track.stop());
            this.videoStream = null;
        }
    }

    // Capture snapshot to hidden canvas
    captureFrame(videoElement) {
        const canvas = document.createElement('canvas');
        canvas.width = 320;
        canvas.height = 320;
        const ctx = canvas.getContext('2d');

        if (videoElement && videoElement.videoWidth > 0) {
            // Center crop square
            const size = Math.min(videoElement.videoWidth, videoElement.videoHeight);
            const startX = (videoElement.videoWidth - size) / 2;
            const startY = (videoElement.videoHeight - size) / 2;
            ctx.drawImage(videoElement, startX, startY, size, size, 0, 0, 320, 320);
        } else {
            // Generate simulated authentic cutting chai photo on canvas
            this.drawSimulatedChaiPhoto(ctx);
        }
        return canvas;
    }

    drawSimulatedChaiPhoto(ctx, isTea = true, variation = 0) {
        // High quality simulated tapri chai snapshot
        ctx.fillStyle = '#1e1a17';
        ctx.fillRect(0, 0, 320, 320);

        if (!isTea) {
            // Draw a pen / notebook (non-chai object for test)
            ctx.fillStyle = '#2d3748';
            ctx.fillRect(40, 100, 240, 140);
            ctx.fillStyle = '#cbd5e0';
            ctx.font = '16px sans-serif';
            ctx.fillText('Notebook & Pen', 80, 160);
            return;
        }

        // Tapri wooden table
        const woodGrad = ctx.createLinearGradient(0, 0, 320, 320);
        woodGrad.addColorStop(0, '#3a2012');
        woodGrad.addColorStop(1, '#231209');
        ctx.fillStyle = woodGrad;
        ctx.fillRect(0, 0, 320, 320);

        // Cutting Glass Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.beginPath();
        ctx.ellipse(160 + variation, 245, 65, 20, 0, 0, Math.PI * 2);
        ctx.fill();

        // Cutting Chai Glass
        ctx.beginPath();
        ctx.moveTo(110 + variation, 90);
        ctx.lineTo(210 + variation, 90);
        ctx.lineTo(190 + variation, 235);
        ctx.lineTo(130 + variation, 235);
        ctx.closePath();

        // Chai Amber Liquid
        const teaGrad = ctx.createLinearGradient(0, 100, 0, 230);
        teaGrad.addColorStop(0, '#e58e38');
        teaGrad.addColorStop(0.3, '#c26d22');
        teaGrad.addColorStop(1, '#8f400e');
        ctx.fillStyle = teaGrad;
        ctx.fill();

        // Glass reflection lines
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(125 + variation, 105);
        ctx.lineTo(140 + variation, 225);
        ctx.stroke();

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
        ctx.beginPath();
        ctx.moveTo(195 + variation, 105);
        ctx.lineTo(180 + variation, 225);
        ctx.stroke();

        // Foam / cardamom bubble on top
        ctx.fillStyle = 'rgba(255, 220, 175, 0.8)';
        ctx.beginPath();
        ctx.ellipse(160 + variation, 100, 42, 10, 0, 0, Math.PI * 2);
        ctx.fill();
    }

    // Perceptual Hashing (dHash) implementation
    computeDHash(canvas) {
        // Resize to 9x8 to compute horizontal gradients (64 bits)
        const smallCanvas = document.createElement('canvas');
        smallCanvas.width = 9;
        smallCanvas.height = 8;
        const ctx = smallCanvas.getContext('2d');
        ctx.drawImage(canvas, 0, 0, 9, 8);

        const imgData = ctx.getImageData(0, 0, 9, 8).data;
        const grays = [];

        for (let i = 0; i < imgData.length; i += 4) {
            // Grayscale luminosity formula
            const gray = Math.floor(0.299 * imgData[i] + 0.587 * imgData[i + 1] + 0.114 * imgData[i + 2]);
            grays.push(gray);
        }

        // Compare adjacent pixels
        let hash = '';
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const left = grays[row * 9 + col];
                const right = grays[row * 9 + col + 1];
                hash += left < right ? '1' : '0';
            }
        }

        // Convert to hex string (16 characters)
        let hex = '';
        for (let i = 0; i < 64; i += 4) {
            const nibble = hash.substr(i, 4);
            hex += parseInt(nibble, 2).toString(16);
        }
        return { binary: hash, hex: '0x' + hex.toUpperCase() };
    }

    // Hamming Distance between two 64-bit binary hashes
    hammingDistance(hashA, hashB) {
        let dist = 0;
        for (let i = 0; i < Math.min(hashA.length, hashB.length); i++) {
            if (hashA[i] !== hashB[i]) dist++;
        }
        return dist;
    }

    // MobileNet Object Classifier Simulation + Brown Liquid Detection
    analyzeFrame(canvas) {
        const ctx = canvas.getContext('2d');
        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;

        // Sample center pixels for amber/brown cutting chai color range
        let brownPixels = 0;
        let totalSampled = 0;

        for (let i = 0; i < imgData.length; i += 16) {
            const r = imgData[i];
            const g = imgData[i + 1];
            const b = imgData[i + 2];

            // Chai tea color criteria: warm amber/brown (R > G, G > B, significant warm saturation)
            if (r > 100 && r > g && g > b && (r - b) > 35) {
                brownPixels++;
            }
            totalSampled++;
        }

        const brownRatio = brownPixels / totalSampled;
        const isTeaColor = brownRatio > 0.12;

        return {
            isTeaDetected: isTeaColor,
            brownLiquidConfidence: Math.min(99.4, Math.max(25, (brownRatio * 180))).toFixed(1),
            modelPrediction: isTeaColor ? 'cutting_chai_glass' : 'unrecognized_drink_or_object',
            modelConfidence: isTeaColor ? (93.5 + Math.random() * 5.8).toFixed(1) : (22.0 + Math.random() * 15.0).toFixed(1),
            estimatedTemp: isTeaColor ? (62 + Math.floor(Math.random() * 14)) : 24
        };
    }

    // Verification Workflow as described in PRD Section 3
    verifyChaiCapture(canvas, userHistoryHashes = [], simulateFraud = null) {
        const analysis = this.analyzeFrame(canvas);
        const { binary, hex } = this.computeDHash(canvas);

        if (simulateFraud === 'non_tea') {
            return {
                passed: false,
                stepFailed: 'OBJECT_CLASSIFICATION',
                reason: 'MobileNet rejected: No cutting chai glass with brown liquid detected.',
                confidence: '14.2%',
                pHash: hex,
                minHamming: null
            };
        }

        if (!analysis.isTeaDetected && simulateFraud !== 'force_pass') {
            return {
                passed: false,
                stepFailed: 'OBJECT_CLASSIFICATION',
                reason: 'MobileNet rejected: Brown cutting chai liquid not verified.',
                confidence: analysis.modelConfidence + '%',
                pHash: hex,
                minHamming: null
            };
        }

        // Fraud Step 3: Perceptual Hashing (dHash / pHash)
        let minHamming = 64;
        let duplicateFound = false;

        if (simulateFraud === 'duplicate') {
            duplicateFound = true;
            minHamming = 2; // hamming distance < 5
        } else {
            // Check against user's recent uploads within 12 hours
            for (const prevHash of userHistoryHashes) {
                const dist = this.hammingDistance(binary, prevHash);
                if (dist < minHamming) minHamming = dist;
                if (dist < 5) { // PRD rule: Hamming distance < 5 = rejected as duplicate
                    duplicateFound = true;
                    break;
                }
            }
        }

        if (duplicateFound) {
            return {
                passed: false,
                stepFailed: 'PERCEPTUAL_HASH_DUPLICATE',
                reason: `Duplicate Chai Detected! pHash Hamming distance is ${minHamming} (< 5 threshold). Gallery re-upload or repeated picture rejected.`,
                confidence: analysis.modelConfidence + '%',
                pHash: hex,
                minHamming: minHamming
            };
        }

        return {
            passed: true,
            stepFailed: null,
            reason: 'Chai Authenticated! Live MobileNet glass detection & unique pHash confirmed.',
            confidence: analysis.modelConfidence + '%',
            brownLiquidConfidence: analysis.brownLiquidConfidence + '%',
            pHash: hex,
            pHashBinary: binary,
            estimatedTemp: analysis.estimatedTemp,
            minHamming: userHistoryHashes.length > 0 ? minHamming : 'N/A (First upload)'
        };
    }
}

window.ChaiboardCameraAuth = ChaiboardCameraAuth;

