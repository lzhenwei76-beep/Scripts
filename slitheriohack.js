// ========== SLITHER.IO HACK - CSP KOMPATIBEL ==========
// Füge diesen Code in die Konsole (F12) ein

(function() {
    'use strict';

    // ========== KONFIGURATION ==========
    let hackStates = {
        zoom: false,
        map: false,
        speed: false,
        autoPlay: false,
        immortal: false,
        noClip: false
    };
    
    let speedMultiplier = 2;
    let originalSpeed = null;
    let autoPlayInterval = null;
    let panelVisible = true;
    let panel = null;
    let content = null;
    let header = null;
    let mapCanvas = null;
    let infoBox = null;

    // ========== SNAKE REFERENZ FINDEN (OHNE EVAL) ==========
    function getSnake() {
        // Direkte Referenzen
        if (typeof window.snake !== 'undefined' && window.snake) return window.snake;
        if (typeof window.mySnake !== 'undefined' && window.mySnake) return window.mySnake;
        if (typeof window.s !== 'undefined' && window.s) return window.s;
        if (typeof window.player !== 'undefined' && window.player) return window.player;
        
        // Suche im globalen Scope nach Objekten mit snake-typischen Eigenschaften
        for (let key in window) {
            try {
                let obj = window[key];
                if (obj && typeof obj === 'object') {
                    // Typische Snake-Eigenschaften
                    if ((obj.xx !== undefined || obj.x !== undefined) && 
                        (obj.yy !== undefined || obj.y !== undefined) &&
                        (obj.mass !== undefined || obj.sz !== undefined)) {
                        console.log(`🐍 Snake gefunden unter: ${key}`);
                        return obj;
                    }
                }
            } catch(e) { /* Sicherheitshalber ignorieren */ }
        }
        return null;
    }

    // ========== ZOOM HACK (Sicher) ==========
    function toggleZoom() {
        hackStates.zoom = !hackStates.zoom;
        if (hackStates.zoom) {
            document.body.style.transform = 'scale(0.6)';
            document.body.style.transformOrigin = 'top left';
            document.body.style.width = '166%';
            console.log('🔍 ZOOM OUT AKTIVIERT (60%)');
        } else {
            document.body.style.transform = '';
            document.body.style.transformOrigin = '';
            document.body.style.width = '';
            console.log('🔍 ZOOM OUT DEAKTIVIERT');
        }
        updateButtons();
    }

    // ========== MAP HACK (Übersichtskarte) ==========
    function toggleMap() {
        hackStates.map = !hackStates.map;
        
        if (hackStates.map) {
            mapCanvas = document.createElement('canvas');
            mapCanvas.id = 'slither-map';
            mapCanvas.style.cssText = `
                position: fixed;
                bottom: 20px;
                left: 20px;
                z-index: 99999;
                width: 180px;
                height: 180px;
                background: rgba(0,0,0,0.75);
                border: 2px solid #e94560;
                border-radius: 8px;
                pointer-events: none;
                font-family: monospace;
            `;
            document.body.appendChild(mapCanvas);
            
            function updateMap() {
                if (!hackStates.map || !mapCanvas) return;
                let ctx = mapCanvas.getContext('2d');
                ctx.fillStyle = 'rgba(0,0,0,0.75)';
                ctx.fillRect(0, 0, 180, 180);
                ctx.fillStyle = '#e94560';
                ctx.font = '10px monospace';
                ctx.fillText('🐍 MAP VIEW', 10, 18);
                
                let s = getSnake();
                if (s) {
                    let x = s.xx !== undefined ? s.xx : (s.x || 0);
                    let y = s.yy !== undefined ? s.yy : (s.y || 0);
                    
                    ctx.fillStyle = '#00ff00';
                    ctx.beginPath();
                    let mapX = 90 + (x / 20);
                    let mapY = 90 + (y / 20);
                    ctx.arc(Math.min(170, Math.max(10, mapX)), Math.min(170, Math.max(10, mapY)), 4, 0, Math.PI * 2);
                    ctx.fill();
                    
                    ctx.fillStyle = '#fff';
                    ctx.font = '8px monospace';
                    ctx.fillText('🐍', mapX-3, mapY-4);
                }
                requestAnimationFrame(updateMap);
            }
            updateMap();
            console.log('🗺️ MINI-MAP AKTIVIERT');
        } else {
            if (mapCanvas) mapCanvas.remove();
            console.log('🗺️ MINI-MAP DEAKTIVIERT');
        }
        updateButtons();
    }

    // ========== SPEED HACK ==========
    function toggleSpeed() {
        hackStates.speed = !hackStates.speed;
        let s = getSnake();
        
        if (s) {
            if (hackStates.speed) {
                if (originalSpeed === null) {
                    originalSpeed = s.spd !== undefined ? s.spd : (s.speed || 10);
                }
                if (s.spd !== undefined) s.spd = originalSpeed * speedMultiplier;
                if (s.speed !== undefined) s.speed = originalSpeed * speedMultiplier;
                console.log(`⚡ SPEED HACK AKTIVIERT (${speedMultiplier}x)`);
            } else {
                if (s.spd !== undefined && originalSpeed) s.spd = originalSpeed;
                if (s.speed !== undefined && originalSpeed) s.speed = originalSpeed;
                console.log('⚡ SPEED HACK DEAKTIVIERT');
            }
        } else {
            console.log('❌ Snake nicht gefunden');
        }
        updateButtons();
    }
    
    function setSpeedMultiplier() {
        let newSpeed = prompt('Geschwindigkeits-Multiplikator (1-10):', speedMultiplier);
        if (newSpeed && !isNaN(newSpeed)) {
            speedMultiplier = parseFloat(newSpeed);
            if (hackStates.speed) {
                let s = getSnake();
                if (s) {
                    let currentSpeed = originalSpeed || 10;
                    if (s.spd !== undefined) s.spd = currentSpeed * speedMultiplier;
                    if (s.speed !== undefined) s.speed = currentSpeed * speedMultiplier;
                }
            }
            console.log(`⚡ Speed auf ${speedMultiplier}x gesetzt`);
        }
    }

    // ========== AUTO-PLAY ==========
    function autoPlayMove() {
        let s = getSnake();
        if (!s || !hackStates.autoPlay) return;
        
        // Finde nächstes Essen
        let foods = null;
        if (typeof window.foods !== 'undefined') foods = window.foods;
        if (typeof window.food !== 'undefined') foods = window.food;
        if (typeof window.f !== 'undefined') foods = window.f;
        
        if (foods && foods.length > 0) {
            let closest = null;
            let closestDist = Infinity;
            let snakeX = s.xx !== undefined ? s.xx : (s.x || 0);
            let snakeY = s.yy !== undefined ? s.yy : (s.y || 0);
            
            for (let f of foods) {
                if (f) {
                    let fx = f.xx !== undefined ? f.xx : (f.x || 0);
                    let fy = f.yy !== undefined ? f.yy : (f.y || 0);
                    let dx = fx - snakeX;
                    let dy = fy - snakeY;
                    let dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist < closestDist) {
                        closestDist = dist;
                        closest = f;
                    }
                }
            }
            
            if (closest) {
                let fx = closest.xx !== undefined ? closest.xx : (closest.x || 0);
                let fy = closest.yy !== undefined ? closest.yy : (closest.y || 0);
                let angle = Math.atan2(fy - snakeY, fx - snakeX);
                
                if (s.ang !== undefined) s.ang = angle;
                if (s.angle !== undefined) s.angle = angle;
                
                // Boosten wenn nah
                if (closestDist < 150) {
                    if (s.boost !== undefined) s.boost = true;
                } else {
                    if (s.boost !== undefined) s.boost = false;
                }
            }
        }
        
        // Vermeide Wände
        let snakeX = s.xx !== undefined ? s.xx : (s.x || 0);
        let snakeY = s.yy !== undefined ? s.yy : (s.y || 0);
        
        if (snakeX < 80) {
            if (s.ang !== undefined) s.ang = 0;
            if (s.angle !== undefined) s.angle = 0;
        }
        if (snakeX > 1920) {
            if (s.ang !== undefined) s.ang = Math.PI;
            if (s.angle !== undefined) s.angle = Math.PI;
        }
        if (snakeY < 80) {
            if (s.ang !== undefined) s.ang = Math.PI / 2;
            if (s.angle !== undefined) s.angle = Math.PI / 2;
        }
        if (snakeY > 1080) {
            if (s.ang !== undefined) s.ang = -Math.PI / 2;
            if (s.angle !== undefined) s.angle = -Math.PI / 2;
        }
    }
    
    function toggleAutoPlay() {
        hackStates.autoPlay = !hackStates.autoPlay;
        
        if (hackStates.autoPlay) {
            autoPlayInterval = setInterval(() => autoPlayMove(), 50);
            console.log('🤖 AUTO-PLAY AKTIVIERT (automatisch essen)');
        } else {
            if (autoPlayInterval) clearInterval(autoPlayInterval);
            console.log('🤖 AUTO-PLAY DEAKTIVIERT');
        }
        updateButtons();
    }

    // ========== UNSTERBLICH ==========
    function toggleImmortal() {
        hackStates.immortal = !hackStates.immortal;
        
        if (hackStates.immortal) {
            // Versuche Kollisionsfunktionen zu überschreiben
            if (typeof window.collision === 'function') {
                window.originalCollision = window.collision;
                window.collision = function() { return false; };
            }
            if (typeof window.checkCollision === 'function') {
                window.originalCheckCollision = window.checkCollision;
                window.checkCollision = function() { return false; };
            }
            console.log('💀 UNSTERBLICH AKTIVIERT');
        } else {
            if (window.originalCollision) window.collision = window.originalCollision;
            if (window.originalCheckCollision) window.checkCollision = window.originalCheckCollision;
            console.log('💀 UNSTERBLICH DEAKTIVIERT');
        }
        updateButtons();
    }

    // ========== MASSEN-COMMANDS ==========
    function giveMass() {
        let s = getSnake();
        if (s) {
            if (s.mass !== undefined) s.mass = 5000;
            if (s.sz !== undefined) s.sz = 50;
            console.log('🍎 MASSE AUF 5000 GESETZT');
        } else {
            console.log('❌ Snake nicht gefunden');
        }
    }
    
    function setMass(value) {
        let s = getSnake();
        if (s) {
            if (s.mass !== undefined) s.mass = parseInt(value);
            console.log(`🍎 MASSE AUF ${value} GESETZT`);
        }
    }
    
    function setSize(value) {
        let s = getSnake();
        if (s) {
            if (s.sz !== undefined) s.sz = parseFloat(value);
            console.log(`📏 GRÖSSE AUF ${value} GESETZT`);
        }
    }

    // ========== INFO BOX ==========
    function showInfoBox() {
        if (infoBox) {
            infoBox.remove();
            infoBox = null;
            return;
        }
        
        infoBox = document.createElement('div');
        infoBox.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            z-index: 100000;
            background: rgba(0,0,0,0.9);
            backdrop-filter: blur(8px);
            border-radius: 12px;
            padding: 12px 16px;
            max-width: 260px;
            font-family: monospace;
            font-size: 10px;
            color: #e0e0e0;
            border: 1px solid #e94560;
            animation: fadeInUp 0.2s ease;
        `;
        
        let style = document.createElement('style');
        style.textContent = `
            @keyframes fadeInUp {
                from { opacity: 0; transform: translateY(10px); }
                to { opacity: 1; transform: translateY(0); }
            }
            @keyframes fadeOutDown {
                from { opacity: 1; transform: translateY(0); }
                to { opacity: 0; transform: translateY(10px); }
            }
        `;
        document.head.appendChild(style);
        
        infoBox.innerHTML = `
            <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                <span style="color: #e94560; font-weight: bold;">🐍 SLITHER.IO HACK</span>
                <span id="info-close" style="cursor: pointer; color: #888;">✕</span>
            </div>
            <div style="text-align: center; margin-bottom: 10px;">by <strong style="color:#e94560">lzhenwei</strong></div>
            <div style="margin: 8px 0;">
                <div>🔍 Z = Zoom Out</div>
                <div>🗺️ M = Mini-Map</div>
                <div>⚡ S = Speed Hack</div>
                <div>🤖 P = Auto-Play</div>
                <div>💀 I = Unsterblich</div>
                <div>🍎 G = +5000 Masse</div>
                <div>🔢 K = Speed Multiplier</div>
                <div>❌ ESC = Stop Auto</div>
            </div>
            <div style="margin-top: 8px; padding-top: 6px; border-top: 1px solid #333; font-size: 9px; text-align: center;">
                💡 KONSOLE: slither.mass(10000) | slither.size(50)
            </div>
        `;
        
        document.body.appendChild(infoBox);
        document.getElementById('info-close').onclick = () => {
            infoBox.style.animation = 'fadeOutDown 0.2s ease';
            setTimeout(() => infoBox.remove(), 200);
            infoBox = null;
        };
    }

    // ========== GUI ERSTELLEN ==========
    function createGUI() {
        if (panel) panel.remove();
        
        panel = document.createElement('div');
        panel.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            z-index: 99999;
            background: #1a1a2e;
            border-radius: 10px;
            font-family: monospace;
            border: 1px solid #e94560;
            width: 48px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.3);
            overflow: hidden;
            text-align: center;
        `;
        
        header = document.createElement('div');
        header.innerHTML = '▼';
        header.style.cssText = `
            padding: 8px;
            text-align: center;
            background: #0f3460;
            color: white;
            font-weight: bold;
            cursor: pointer;
            font-size: 14px;
        `;
        header.onclick = () => {
            if (panelVisible) {
                content.style.display = 'none';
                header.innerHTML = '▲';
                header.style.background = '#e94560';
            } else {
                content.style.display = 'block';
                header.innerHTML = '▼';
                header.style.background = '#0f3460';
            }
            panelVisible = !panelVisible;
        };
        panel.appendChild(header);
        
        content = document.createElement('div');
        content.style.cssText = `padding: 8px;`;
        
        let nameTag = document.createElement('div');
        nameTag.textContent = '🐍';
        nameTag.style.cssText = `
            font-size: 18px;
            color: #e94560;
            margin-bottom: 8px;
            cursor: pointer;
        `;
        nameTag.title = "Info";
        nameTag.onclick = showInfoBox;
        content.appendChild(nameTag);
        
        let btnContainer = document.createElement('div');
        btnContainer.style.cssText = `display: flex; flex-direction: column; align-items: center; gap: 5px;`;
        
        let buttons = [
            { id: 'zoom-btn', icon: '🔍', action: toggleZoom, title: 'Zoom Out (Z)' },
            { id: 'map-btn', icon: '🗺️', action: toggleMap, title: 'Mini-Map (M)' },
            { id: 'speed-btn', icon: '⚡', action: toggleSpeed, title: 'Speed Hack (S)' },
            { id: 'auto-btn', icon: '🤖', action: toggleAutoPlay, title: 'Auto-Play (P)' },
            { id: 'immortal-btn', icon: '💀', action: toggleImmortal, title: 'Immortal (I)' },
            { id: 'mass-btn', icon: '🍎', action: giveMass, title: 'Give Mass (G)' }
        ];
        
        buttons.forEach(btn => {
            let button = document.createElement('button');
            button.id = btn.id;
            button.textContent = btn.icon;
            button.style.cssText = `
                width: 36px;
                height: 36px;
                margin: 5px auto;
                background: #0f3460;
                color: white;
                border: none;
                border-radius: 8px;
                cursor: pointer;
                font-size: 18px;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.1s;
            `;
            button.title = btn.title;
            button.onclick = btn.action;
            btnContainer.appendChild(button);
        });
        
        content.appendChild(btnContainer);
        panel.appendChild(content);
        document.body.appendChild(panel);
        
        window.btns = {
            zoomBtn: document.getElementById('zoom-btn'),
            mapBtn: document.getElementById('map-btn'),
            speedBtn: document.getElementById('speed-btn'),
            autoBtn: document.getElementById('auto-btn'),
            immortalBtn: document.getElementById('immortal-btn')
        };
        
        panelVisible = true;
    }
    
    function updateButtons() {
        if (window.btns) {
            let { zoomBtn, mapBtn, speedBtn, autoBtn, immortalBtn } = window.btns;
            if (zoomBtn) zoomBtn.style.background = hackStates.zoom ? '#e94560' : '#0f3460';
            if (mapBtn) mapBtn.style.background = hackStates.map ? '#e94560' : '#0f3460';
            if (speedBtn) speedBtn.style.background = hackStates.speed ? '#e94560' : '#0f3460';
            if (autoBtn) autoBtn.style.background = hackStates.autoPlay ? '#e94560' : '#0f3460';
            if (immortalBtn) immortalBtn.style.background = hackStates.immortal ? '#e94560' : '#0f3460';
        }
    }
    
    // ========== HOTKEYS ==========
    function handleKeys(e) {
        let key = e.key.toLowerCase();
        switch(key) {
            case 'z': e.preventDefault(); toggleZoom(); break;
            case 'm': e.preventDefault(); toggleMap(); break;
            case 's': e.preventDefault(); toggleSpeed(); break;
            case 'p': e.preventDefault(); toggleAutoPlay(); break;
            case 'i': e.preventDefault(); toggleImmortal(); break;
            case 'g': e.preventDefault(); giveMass(); break;
            case 'k': e.preventDefault(); setSpeedMultiplier(); break;
            case 'h': e.preventDefault(); showInfoBox(); break;
            case 'escape': e.preventDefault(); 
                if (autoPlayInterval) clearInterval(autoPlayInterval);
                hackStates.autoPlay = false;
                updateButtons();
                console.log('🛑 Auto-Play gestoppt');
                break;
        }
    }
    
    // ========== KONSOLE COMMANDS ==========
    window.slither = {
        zoom: toggleZoom,
        map: toggleMap,
        speed: toggleSpeed,
        auto: toggleAutoPlay,
        immortal: toggleImmortal,
        mass: setMass,
        give: giveMass,
        size: setSize,
        speedMult: setSpeedMultiplier,
        info: showInfoBox
    };
    
    // ========== INIT ==========
    function init() {
        createGUI();
        window.addEventListener('keydown', handleKeys);
        
        console.log('%c🐍 SLITHER.IO HACK GELADEN | by lzhenwei 🐍', 'color: #e94560; font-size: 14px; font-weight: bold;');
        console.log('');
        console.log('📌 HOTKEYS:');
        console.log('   Z = Zoom Out');
        console.log('   M = Mini-Map');
        console.log('   S = Speed Hack');
        console.log('   P = Auto-Play (automatisch essen)');
        console.log('   I = Unsterblich');
        console.log('   G = +5000 Masse');
        console.log('   K = Speed Multiplier ändern');
        console.log('   H = Info');
        console.log('   ESC = Auto-Play stoppen');
        console.log('');
        console.log('💡 KONSOLE COMMANDS:');
        console.log('   slither.mass(10000)  → Masse setzen');
        console.log('   slither.size(50)     → Größe setzen');
        console.log('   slither.give()       → +5000 Masse');
        console.log('   slither.speedMult()  → Speed ändern');
        console.log('   slither.auto()       → Auto-Play togglen');
        console.log('   slither.immortal()   → Unsterblich togglen');
        console.log('   slither.info()       → Info anzeigen');
    }
    
    init();
    
})();
