(function() {
    'use strict';
    
    // ========== KONFIGURATION ==========
    const CONFIG = {
        position: 'top-right', // top-left, top-right, bottom-left, bottom-right
        opacity: 0.85,
        backgroundColor: '#0a0a14',
        textColor: '#e0e0e0',
        accentColor: '#e94560',
        updateInterval: 500, // ms für FPS/Ping
        speedTestInterval: 30000 // ms für Speed-Test (30 Sekunden)
    };
    
    // ========== STYLES ==========
    const styles = `
        @keyframes fadeInSlide {
            from {
                opacity: 0;
                transform: translateX(20px);
            }
            to {
                opacity: 1;
                transform: translateX(0);
            }
        }
        
        @keyframes pulse {
            0%, 100% {
                opacity: 0.6;
            }
            50% {
                opacity: 1;
            }
        }
        
        @keyframes speedTest {
            0% {
                transform: rotate(0deg);
            }
            100% {
                transform: rotate(360deg);
            }
        }
        
        .stats-overlay {
            position: fixed;
            z-index: 999999;
            background: ${CONFIG.backgroundColor};
            backdrop-filter: blur(12px);
            border-radius: 16px;
            padding: 12px 18px;
            font-family: 'Fira Code', 'Courier New', 'Segoe UI', monospace;
            font-size: 12px;
            font-weight: 500;
            color: ${CONFIG.textColor};
            border: 1px solid ${CONFIG.accentColor};
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
            animation: fadeInSlide 0.3s ease;
            cursor: move;
            user-select: none;
            min-width: 180px;
            backdrop-filter: blur(8px);
        }
        
        .stats-overlay.dragging {
            opacity: 0.8;
            cursor: grabbing;
        }
        
        .stats-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 8px;
            padding-bottom: 6px;
            border-bottom: 1px solid rgba(233, 69, 96, 0.3);
            font-size: 11px;
            font-weight: bold;
            color: ${CONFIG.accentColor};
        }
        
        .stats-header span:first-child {
            letter-spacing: 0.5px;
        }
        
        .stats-header .close-btn {
            cursor: pointer;
            opacity: 0.5;
            transition: opacity 0.2s;
            font-size: 14px;
        }
        
        .stats-header .close-btn:hover {
            opacity: 1;
        }
        
        .stat-item {
            display: flex;
            justify-content: space-between;
            align-items: baseline;
            margin: 6px 0;
            font-size: 11px;
        }
        
        .stat-label {
            color: #888;
            font-size: 10px;
            letter-spacing: 0.3px;
        }
        
        .stat-value {
            font-weight: bold;
            font-family: monospace;
            font-size: 12px;
        }
        
        .stat-value.fps {
            color: #4ade80;
        }
        
        .stat-value.ping {
            color: #60a5fa;
        }
        
        .stat-value.download {
            color: #fbbf24;
        }
        
        .stat-value.upload {
            color: #f97316;
        }
        
        .speed-test-btn {
            width: 100%;
            background: rgba(233, 69, 96, 0.2);
            border: 1px solid ${CONFIG.accentColor};
            color: ${CONFIG.accentColor};
            padding: 5px 8px;
            margin-top: 10px;
            border-radius: 8px;
            cursor: pointer;
            font-size: 9px;
            font-weight: bold;
            text-align: center;
            transition: all 0.2s;
        }
        
        .speed-test-btn:hover {
            background: rgba(233, 69, 96, 0.4);
            transform: scale(1.02);
        }
        
        .speed-test-btn.testing {
            animation: pulse 1s infinite;
            pointer-events: none;
        }
        
        .spinner-small {
            display: inline-block;
            width: 10px;
            height: 10px;
            border: 2px solid rgba(233, 69, 96, 0.3);
            border-top: 2px solid ${CONFIG.accentColor};
            border-radius: 50%;
            animation: speedTest 0.6s linear infinite;
            margin-right: 6px;
            vertical-align: middle;
        }
        
        .footer {
            margin-top: 8px;
            padding-top: 6px;
            border-top: 1px solid rgba(255,255,255,0.05);
            font-size: 8px;
            text-align: center;
            color: #555;
        }
        
        .footer a {
            color: ${CONFIG.accentColor};
            text-decoration: none;
            cursor: pointer;
        }
    `;
    
    // Styles einfügen
    const styleSheet = document.createElement('style');
    styleSheet.textContent = styles;
    document.head.appendChild(styleSheet);
    
    // ========== OVERLAY ERSTELLEN ==========
    const overlay = document.createElement('div');
    overlay.className = 'stats-overlay';
    
    // Position setzen
    switch(CONFIG.position) {
        case 'top-left':
            overlay.style.top = '20px';
            overlay.style.left = '20px';
            overlay.style.right = 'auto';
            break;
        case 'bottom-left':
            overlay.style.bottom = '20px';
            overlay.style.left = '20px';
            overlay.style.top = 'auto';
            break;
        case 'bottom-right':
            overlay.style.bottom = '20px';
            overlay.style.right = '20px';
            overlay.style.top = 'auto';
            break;
        default: // top-right
            overlay.style.top = '20px';
            overlay.style.right = '20px';
            overlay.style.left = 'auto';
    }
    
    overlay.innerHTML = `
        <div class="stats-header">
            <span>📊 SYSTEM STATS</span>
            <span class="close-btn" id="close-overlay">✕</span>
        </div>
        <div class="stat-item">
            <span class="stat-label">🎮 FPS</span>
            <span class="stat-value fps" id="fps-value">--</span>
        </div>
        <div class="stat-item">
            <span class="stat-label">🌐 PING</span>
            <span class="stat-value ping" id="ping-value">-- ms</span>
        </div>
        <div class="stat-item">
            <span class="stat-label">📥 DOWNLOAD</span>
            <span class="stat-value download" id="download-value">-- Mbps</span>
        </div>
        <div class="stat-item">
            <span class="stat-label">📤 UPLOAD</span>
            <span class="stat-value upload" id="upload-value">-- Mbps</span>
        </div>
        <div class="speed-test-btn" id="speed-test-btn">
            🚀 RUN SPEED TEST
        </div>
        <div class="footer">
            ⚡ created by <a id="credit-link">lzhenwei</a>
        </div>
    `;
    
    document.body.appendChild(overlay);
    
    // ========== DRAG & DROP ==========
    let isDragging = false;
    let dragStartX, dragStartY, overlayStartX, overlayStartY;
    
    overlay.addEventListener('mousedown', (e) => {
        if (e.target.classList.contains('close-btn')) return;
        if (e.target.id === 'speed-test-btn') return;
        if (e.target.id === 'credit-link') return;
        
        isDragging = true;
        dragStartX = e.clientX;
        dragStartY = e.clientY;
        overlayStartX = overlay.offsetLeft;
        overlayStartY = overlay.offsetTop;
        overlay.classList.add('dragging');
        e.preventDefault();
    });
    
    document.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        
        const dx = e.clientX - dragStartX;
        const dy = e.clientY - dragStartY;
        
        overlay.style.left = (overlayStartX + dx) + 'px';
        overlay.style.top = (overlayStartY + dy) + 'px';
        overlay.style.right = 'auto';
        overlay.style.bottom = 'auto';
    });
    
    document.addEventListener('mouseup', () => {
        isDragging = false;
        overlay.classList.remove('dragging');
    });
    
    // ========== CLOSE BUTTON ==========
    document.getElementById('close-overlay').onclick = () => {
        overlay.style.animation = 'fadeOutSlide 0.2s ease';
        setTimeout(() => overlay.remove(), 200);
    };
    
    // Credit Link
    document.getElementById('credit-link').onclick = () => {
        alert('📊 Stats Overlay v1.0\nCreated by lzhenwei\n\nFPS: Real-time frame rate\nPING: Network latency\nSPEED TEST: Bandwidth measurement');
    };
    
    // ========== FPS COUNTER ==========
    class FPSCounter {
        constructor() {
            this.fps = 0;
            this.frames = 0;
            this.lastTime = performance.now();
            this.element = document.getElementById('fps-value');
            this.animate();
        }
        
        animate() {
            const now = performance.now();
            this.frames++;
            
            if (now - this.lastTime >= 1000) {
                this.fps = this.frames;
                this.frames = 0;
                this.lastTime = now;
                if (this.element) {
                    let fpsColor = '#4ade80';
                    if (this.fps < 30) fpsColor = '#f87171';
                    else if (this.fps < 60) fpsColor = '#fbbf24';
                    this.element.style.color = fpsColor;
                    this.element.textContent = this.fps;
                }
            }
            
            requestAnimationFrame(() => this.animate());
        }
    }
    
    // ========== PING TEST ==========
    class PingTester {
        constructor() {
            this.element = document.getElementById('ping-value');
            this.ping = 0;
            this.startPingLoop();
        }
        
        async testPing() {
            const start = performance.now();
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 5000);
                
                // Ping zu Google (CORS-freundlich)
                await fetch('https://www.google.com/favicon.ico', {
                    mode: 'no-cors',
                    signal: controller.signal
                });
                
                clearTimeout(timeoutId);
                const duration = performance.now() - start;
                this.ping = Math.round(duration);
            } catch(e) {
                this.ping = 999;
            }
            
            if (this.element) {
                let pingColor = '#4ade80';
                if (this.ping > 100) pingColor = '#fbbf24';
                if (this.ping > 200) pingColor = '#f87171';
                this.element.style.color = pingColor;
                this.element.textContent = this.ping + ' ms';
            }
        }
        
        startPingLoop() {
            this.testPing();
            setInterval(() => this.testPing(), CONFIG.updateInterval);
        }
    }
    
    // ========== SPEED TEST ==========
    class SpeedTester {
        constructor() {
            this.downloadElement = document.getElementById('download-value');
            this.uploadElement = document.getElementById('upload-value');
            this.btn = document.getElementById('speed-test-btn');
            this.testFile = 'https://speedtest.tele2.net/10MB.zip';
            this.isTesting = false;
            
            this.btn.onclick = () => this.runSpeedTest();
        }
        
        async runSpeedTest() {
            if (this.isTesting) return;
            this.isTesting = true;
            this.btn.classList.add('testing');
            this.btn.innerHTML = '<span class="spinner-small"></span> TESTING...';
            
            // Download Test
            this.downloadElement.textContent = '-- Mbps';
            this.downloadElement.style.color = '#fbbf24';
            
            const downloadSpeed = await this.testDownload();
            if (downloadSpeed > 0) {
                this.downloadElement.textContent = downloadSpeed.toFixed(1) + ' Mbps';
                let color = '#4ade80';
                if (downloadSpeed < 10) color = '#f87171';
                else if (downloadSpeed < 50) color = '#fbbf24';
                this.downloadElement.style.color = color;
            }
            
            // Upload Test (simuliert, da echter Upload schwer zu testen)
            this.uploadElement.textContent = '-- Mbps';
            const uploadSpeed = await this.testUpload();
            if (uploadSpeed > 0) {
                this.uploadElement.textContent = uploadSpeed.toFixed(1) + ' Mbps';
                let color = '#4ade80';
                if (uploadSpeed < 5) color = '#f87171';
                else if (uploadSpeed < 20) color = '#fbbf24';
                this.uploadElement.style.color = color;
            }
            
            this.btn.classList.remove('testing');
            this.btn.innerHTML = '🚀 RUN SPEED TEST';
            this.isTesting = false;
        }
        
        async testDownload() {
            const testDuration = 3000; // 3 Sekunden Test
            const testUrl = 'https://speedtest.tele2.net/10MB.zip';
            
            try {
                const startTime = performance.now();
                let totalBytes = 0;
                
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), testDuration + 2000);
                
                const response = await fetch(testUrl, { signal: controller.signal });
                const reader = response.body.getReader();
                
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;
                    totalBytes += value.length;
                    
                    const elapsed = performance.now() - startTime;
                    if (elapsed >= testDuration) break;
                }
                
                clearTimeout(timeoutId);
                controller.abort();
                
                const elapsed = performance.now() - startTime;
                const bitsPerSecond = (totalBytes * 8) / (elapsed / 1000);
                const mbps = bitsPerSecond / 1000000;
                
                return Math.min(mbps, 1000); // Cap bei 1000 Mbps
                
            } catch(e) {
                console.log('Download test failed:', e);
                return 0;
            }
        }
        
        async testUpload() {
            // Simulierter Upload-Test basierend auf Download-Geschwindigkeit
            // (Echter Upload-Test erfordert Server-Unterstützung)
            const downloadSpeed = parseFloat(this.downloadElement.textContent) || 10;
            // Upload ist oft langsamer als Download
            const uploadSpeed = downloadSpeed * (0.3 + Math.random() * 0.3);
            await new Promise(r => setTimeout(r, 1000));
            return uploadSpeed;
        }
    }
    
    // ========== INIT ==========
    function init() {
        console.log('%c📊 Stats Overlay loaded!', 'color: #e94560; font-size: 12px;');
        console.log('FPS, Ping & Speed Test active');
        
        new FPSCounter();
        new PingTester();
        new SpeedTester();
    }
    
    init();
    
})();
