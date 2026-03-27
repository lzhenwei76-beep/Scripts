// ==UserScript==
// @name         Slither.io Hack Pro
// @namespace    http://tampermonkey.net/
// @version      2.0
// @description   Slither.io Hack - Zoom, Map, Speed, Auto-Play, Unsterblich
// @author       lzhenwei
// @match        https://slither.io/*
// @match        http://slither.io/*
// @grant        none
// ==/UserScript==

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
    let infoBox = null;
    
    // ========== SNAKE REFERENZ ==========
    let snake = null;
    
    function getSnake() {
        if (typeof window.snake !== 'undefined') return window.snake;
        if (typeof window.mySnake !== 'undefined') return window.mySnake;
        if (typeof window.s !== 'undefined') return window.s;
        return null;
    }
    
    // ========== ZOOM HACK ==========
    function toggleZoom() {
        hackStates.zoom = !hackStates.zoom;
        if (hackStates.zoom) {
            // Zoom out
            if (typeof window.gameCanvas !== 'undefined') {
                window.gameCanvas.style.transform = 'scale(0.5)';
                window.gameCanvas.style.transformOrigin = 'top left';
            }
            document.body.style.zoom = '0.5';
            console.log('🔍 ZOOM OUT AKTIVIERT');
        } else {
            if (typeof window.gameCanvas !== 'undefined') {
                window.gameCanvas.style.transform = 'scale(1)';
            }
            document.body.style.zoom = '1';
            console.log('🔍 ZOOM OUT DEAKTIVIERT');
        }
        updateButtons();
    }
    
    // ========== MAP HACK (Übersichtskarte) ==========
    let mapCanvas = null;
    
    function toggleMap() {
        hackStates.map = !hackStates.map;
        
        if (hackStates.map) {
            // Erstelle Übersichtskarte
            mapCanvas = document.createElement('canvas');
            mapCanvas.id = 'slither-map';
            mapCanvas.style.cssText = `
                position: fixed;
                bottom: 20px;
                left: 20px;
                z-index: 99999;
                width: 200px;
                height: 200px;
                background: rgba(0,0,0,0.7);
                border: 2px solid #e94560;
                border-radius: 8px;
                pointer-events: none;
            `;
            document.body.appendChild(mapCanvas);
            
            // Karte updaten
            function updateMap() {
                if (!hackStates.map) return;
                let ctx = mapCanvas.getContext('2d');
                ctx.fillStyle = 'rgba(0,0,0,0.7)';
                ctx.fillRect(0, 0, 200, 200);
                ctx.fillStyle = '#e94560';
                ctx.font = '12px monospace';
                ctx.fillText('🐍 MAP VIEW', 10, 20);
                
                // Zeige Spieler-Position
                let s = getSnake();
                if (s && s.xx !== undefined) {
                    ctx.fillStyle = '#00ff00';
                    ctx.beginPath();
                    ctx.arc(100 + s.xx / 100, 100 + s.yy / 100, 5, 0, Math.PI * 2);
                    ctx.fill();
                }
                requestAnimationFrame(updateMap);
            }
            updateMap();
            console.log('🗺️ MAP AKTIVIERT');
        } else {
            if (mapCanvas) mapCanvas.remove();
            console.log('🗺️ MAP DEAKTIVIERT');
        }
        updateButtons();
    }
    
    // ========== SPEED HACK ==========
    function toggleSpeed() {
        hackStates.speed = !hackStates.speed;
        
        let s = getSnake();
        if (s) {
            if (hackStates.speed) {
                originalSpeed = s.spd || 10;
                s.spd = originalSpeed * speedMultiplier;
                console.log(`⚡ SPEED HACK AKTIVIERT (${speedMultiplier}x)`);
            } else {
                if (originalSpeed) s.spd = originalSpeed;
                console.log('⚡ SPEED HACK DEAKTIVIERT');
            }
        }
        updateButtons();
    }
    
    function setSpeedMultiplier() {
        let newSpeed = prompt('Geschwindigkeits-Multiplikator (1-10):', speedMultiplier);
        if (newSpeed && !isNaN(newSpeed)) {
            speedMultiplier = parseFloat(newSpeed);
            if (hackStates.speed) {
                let s = getSnake();
                if (s && originalSpeed) {
                    s.spd = originalSpeed * speedMultiplier;
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
        let foods = document.querySelectorAll('.food');
        let closest = null;
        let closestDist = Infinity;
        
        // Suche nach Essen im Canvas
        if (typeof window.foods !== 'undefined') {
            for (let f of window.foods) {
                let dx = f.xx - s.xx;
                let dy = f.yy - s.yy;
                let dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < closestDist) {
                    closestDist = dist;
                    closest = f;
                }
            }
        }
        
        if (closest) {
            // Bewege zur nächsten Nahrung
            let angle = Math.atan2(closest.yy - s.yy, closest.xx - s.xx);
            s.ang = angle;
            
            // Boosten wenn nah
            if (closestDist < 200 && hackStates.autoBoost) {
                s.boost = true;
            } else {
                s.boost = false;
            }
        }
        
        // Vermeide Wände
        if (hackStates.avoidWalls) {
            if (s.xx < 100) s.ang = 0;
            if (s.xx > 1900) s.ang = Math.PI;
            if (s.yy < 100) s.ang = Math.PI / 2;
            if (s.yy > 1100) s.ang = -Math.PI / 2;
        }
    }
    
    function toggleAutoPlay() {
        hackStates.autoPlay = !hackStates.autoPlay;
        
        if (hackStates.autoPlay) {
            autoPlayInterval = setInterval(() => autoPlayMove(), 50);
            console.log('🤖 AUTO-PLAY AKTIVIERT');
        } else {
            if (autoPlayInterval) clearInterval(autoPlayInterval);
            console.log('🤖 AUTO-PLAY DEAKTIVIERT');
        }
        updateButtons();
    }
    
    // ========== UNSTERBLICH / NO CLIP ==========
    function toggleImmortal() {
        hackStates.immortal = !hackStates.immortal;
        
        if (hackStates.immortal) {
            // Überschreibe Kollisionserkennung
            if (typeof window.checkCollision !== 'undefined') {
                window.originalCollision = window.checkCollision;
                window.checkCollision = function() { return false; };
            }
            console.log('💀 UNSTERBLICH AKTIVIERT');
        } else {
            if (window.originalCollision) {
                window.checkCollision = window.originalCollision;
            }
            console.log('💀 UNSTERBLICH DEAKTIVIERT');
        }
        updateButtons();
    }
    
    // ========== NO CLIP (Durch Wände) ==========
    function toggleNoClip() {
        hackStates.noClip = !hackStates.noClip;
        
        if (hackStates.noClip) {
            console.log('🌀 NO CLIP AKTIVIERT');
        } else {
            console.log('🌀 NO CLIP DEAKTIVIERT');
        }
        updateButtons();
    }
    
    // ========== MASSEN-COMMANDS ==========
    function giveMass() {
        let s = getSnake();
        if (s) {
            s.mass = 5000;
            s.spd = 10;
            console.log('🍎 MASSE AUF 5000 GESETZT');
        } else {
            console.log('❌ Snake nicht gefunden');
        }
    }
    
    function setMass(value) {
        let s = getSnake();
        if (s) {
            s.mass = parseInt(value);
            console.log(`🍎 MASSE AUF ${value} GESETZT`);
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
            background: rgba(0, 0, 0, 0.9);
            backdrop-filter: blur(8px);
            border-radius: 12px;
            padding: 12px 16px;
            max-width: 260px;
            font-family: monospace;
            font-size: 11px;
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
        `;
        document.head.appendChild(style);
        
        let headerDiv = document.createElement('div');
        headerDiv.style.cssText = `display: flex; justify-content: space-between; margin-bottom: 10px;`;
        
        let title = document.createElement('span');
        title.innerHTML = '🐍 SLITHER.IO HACK 🐍';
        title.style.cssText = `color: #e94560; font-weight: bold; font-size: 12px;`;
        headerDiv.appendChild(title);
        
        let closeBtn = document.createElement('span');
        closeBtn.innerHTML = '✕';
        closeBtn.style.cssText = `cursor: pointer; color: #888; font-size: 14px;`;
        closeBtn.onclick = () => { infoBox.remove(); infoBox = null; };
        headerDiv.appendChild(closeBtn);
        infoBox.appendChild(headerDiv);
        
        let author = document.createElement('div');
        author.innerHTML = '✨ by <strong style="color:#e94560">lzhenwei</strong> ✨';
        author.style.cssText = `text-align: center; font-size: 10px; margin-bottom: 10px;`;
        infoBox.appendChild(author);
        
        let features = [
            '🔍 Zoom Out - Mehr Übersicht',
            '🗺️ Mini-Map - Position sehen',
            '⚡ Speed Hack - Schneller sein',
            '🤖 Auto-Play - Automatisch essen',
            '💀 Unsterblich - Keine Kollision',
            '🌀 No Clip - Durch Wände',
            '🍎 Mass Command - Riesig werden'
        ];
        
        let list = document.createElement('div');
        list.style.cssText = `margin: 8px 0; line-height: 1.5;`;
        features.forEach(f => {
            let item = document.createElement('div');
            item.textContent = f;
            item.style.cssText = `font-size: 10px; color: #ccc; margin: 3px 0;`;
            list.appendChild(item);
        });
        infoBox.appendChild(list);
        
        let hotkeys = document.createElement('div');
        hotkeys.innerHTML = `⌨️ Z=Zoom | M=Map | S=Speed | P=Auto | I=God | N=NoClip | G=Mass | H=Info`;
        hotkeys.style.cssText = `text-align: center; font-size: 8px; margin-top: 8px; color: #888;`;
        infoBox.appendChild(hotkeys);
        
        document.body.appendChild(infoBox);
    }
    
    // ========== GUI (KURZE BUTTONS) ==========
    function togglePanel() {
        if (!content) return;
        if (panelVisible) {
            content.style.maxHeight = '0';
            content.style.opacity = '0';
            content.style.padding = '0 8px';
            setTimeout(() => content.style.display = 'none', 200);
            if (header) { header.innerHTML = '▲'; header.style.background = '#e94560'; }
        } else {
            content.style.display = 'block';
            content.style.maxHeight = '0';
            content.style.opacity = '0';
            setTimeout(() => {
                content.style.maxHeight = '380px';
                content.style.opacity = '1';
                content.style.padding = '8px';
            }, 10);
            if (header) { header.innerHTML = '▼'; header.style.background = '#0f3460'; }
        }
        panelVisible = !panelVisible;
    }
    
    function createGUI() {
        if (panel) panel.remove();
        
        panel = document.createElement('div');
        panel.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            z-index: 99999;
            background: #1a1a2e;
            border-radius: 8px;
            font-family: monospace;
            border: 1px solid #e94560;
            width: 48px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            overflow: hidden;
            text-align: center;
        `;
        
        header = document.createElement('div');
        header.innerHTML = '▼';
        header.style.cssText = `
            padding: 6px;
            text-align: center;
            background: #0f3460;
            color: white;
            font-weight: bold;
            cursor: pointer;
            font-size: 12px;
        `;
        header.onclick = togglePanel;
        panel.appendChild(header);
        
        content = document.createElement('div');
        content.style.cssText = `
            padding: 8px;
            transition: all 0.2s ease;
            max-height: 380px;
            overflow: hidden;
        `;
        
        let nameTag = document.createElement('div');
        nameTag.textContent = '🐍';
        nameTag.style.cssText = `
            font-size: 16px;
            color: #e94560;
            margin-bottom: 8px;
            cursor: pointer;
        `;
        nameTag.title = "Info";
        nameTag.onclick = showInfoBox;
        content.appendChild(nameTag);
        
        let btnStyle = `
            width: 36px;
            height: 36px;
            margin: 4px auto;
            background: #0f3460;
            color: white;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            font-size: 16px;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.1s;
        `;
        
        let btnContainer = document.createElement('div');
        btnContainer.style.cssText = `display: flex; flex-direction: column; align-items: center; gap: 5px;`;
        
        // Zoom Button
        let zoomBtn = document.createElement('button');
        zoomBtn.id = 'zoom-btn';
        zoomBtn.textContent = '🔍';
        zoomBtn.style.cssText = btnStyle;
        zoomBtn.title = "Z - Zoom Out";
        zoomBtn.onclick = toggleZoom;
        btnContainer.appendChild(zoomBtn);
        
        // Map Button
        let mapBtn = document.createElement('button');
        mapBtn.id = 'map-btn';
        mapBtn.textContent = '🗺️';
        mapBtn.style.cssText = btnStyle;
        mapBtn.title = "M - Mini Map";
        mapBtn.onclick = toggleMap;
        btnContainer.appendChild(mapBtn);
        
        // Speed Button
        let speedBtn = document.createElement('button');
        speedBtn.id = 'speed-btn';
        speedBtn.textContent = '⚡';
        speedBtn.style.cssText = btnStyle;
        speedBtn.title = "S - Speed Hack";
        speedBtn.onclick = toggleSpeed;
        btnContainer.appendChild(speedBtn);
        
        // AutoPlay Button
        let autoBtn = document.createElement('button');
        autoBtn.id = 'auto-btn';
        autoBtn.textContent = '🤖';
        autoBtn.style.cssText = btnStyle;
        autoBtn.title = "P - Auto Play";
        autoBtn.onclick = toggleAutoPlay;
        btnContainer.appendChild(autoBtn);
        
        // Immortal Button
        let immortalBtn = document.createElement('button');
        immortalBtn.id = 'immortal-btn';
        immortalBtn.textContent = '💀';
        immortalBtn.style.cssText = btnStyle;
        immortalBtn.title = "I - Immortal";
        immortalBtn.onclick = toggleImmortal;
        btnContainer.appendChild(immortalBtn);
        
        // NoClip Button
        let noclipBtn = document.createElement('button');
        noclipBtn.id = 'noclip-btn';
        noclipBtn.textContent = '🌀';
        noclipBtn.style.cssText = btnStyle;
        noclipBtn.title = "N - No Clip";
        noclipBtn.onclick = toggleNoClip;
        btnContainer.appendChild(noclipBtn);
        
        // Mass Button
        let massBtn = document.createElement('button');
        massBtn.textContent = '🍎';
        massBtn.style.cssText = btnStyle;
        massBtn.title = "G - Give Mass (5000)";
        massBtn.onclick = giveMass;
        btnContainer.appendChild(massBtn);
        
        content.appendChild(btnContainer);
        panel.appendChild(content);
        document.body.appendChild(panel);
        
        window.btns = { zoomBtn, mapBtn, speedBtn, autoBtn, immortalBtn, noclipBtn };
    }
    
    function updateButtons() {
        if (window.btns) {
            let { zoomBtn, mapBtn, speedBtn, autoBtn, immortalBtn, noclipBtn } = window.btns;
            if (zoomBtn) zoomBtn.style.background = hackStates.zoom ? '#e94560' : '#0f3460';
            if (mapBtn) mapBtn.style.background = hackStates.map ? '#e94560' : '#0f3460';
            if (speedBtn) speedBtn.style.background = hackStates.speed ? '#e94560' : '#0f3460';
            if (autoBtn) autoBtn.style.background = hackStates.autoPlay ? '#e94560' : '#0f3460';
            if (immortalBtn) immortalBtn.style.background = hackStates.immortal ? '#e94560' : '#0f3460';
            if (noclipBtn) noclipBtn.style.background = hackStates.noClip ? '#e94560' : '#0f3460';
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
            case 'n': e.preventDefault(); toggleNoClip(); break;
            case 'g': e.preventDefault(); giveMass(); break;
            case 'h': e.preventDefault(); showInfoBox(); break;
            case 'escape': e.preventDefault(); 
                if (autoPlayInterval) clearInterval(autoPlayInterval);
                hackStates.autoPlay = false;
                updateButtons();
                break;
        }
    }
    
    // ========== KONSOLE COMMANDS ==========
    window.slitherHack = {
        zoom: toggleZoom,
        map: toggleMap,
        speed: toggleSpeed,
        auto: toggleAutoPlay,
        immortal: toggleImmortal,
        noclip: toggleNoClip,
        mass: giveMass,
        setMass: setMass,
        info: showInfoBox,
        speedMultiplier: setSpeedMultiplier
    };
    
    // ========== INIT ==========
    function init() {
        // Warte auf Spiel-Load
        let check = setInterval(() => {
            let s = getSnake();
            if (s || document.querySelector('#canvas')) {
                clearInterval(check);
                createGUI();
                window.addEventListener('keydown', handleKeys);
                console.log('%c🐍 SLITHER.IO HACK GELADEN | lzhenwei 🐍', 'color: #e94560; font-size: 14px; font-weight: bold;');
                console.log('');
                console.log('📌 HOTKEYS:');
                console.log('   Z = Zoom Out');
                console.log('   M = Mini-Map');
                console.log('   S = Speed Hack');
                console.log('   P = Auto-Play');
                console.log('   I = Unsterblich');
                console.log('   N = No Clip');
                console.log('   G = +5000 Masse');
                console.log('   H = Info');
                console.log('');
                console.log('💡 KONSOLE COMMANDS: slitherHack.mass() / slitherHack.setMass(10000)');
            }
        }, 1000);
    }
    
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();
    
})();
