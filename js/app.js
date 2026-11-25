/* ============================================================
   FOCUSFLOW MINIMAL — Clock + Sticky YouTube
   ============================================================ */

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

/* ---------- STATE ---------- */
const S = { theme: 'dark', ytMuted: false, ytMinimized: true };
function loadState() {
    try {
        const raw = localStorage.getItem('focusflow_min');
        if (raw) Object.assign(S, JSON.parse(raw));
    } catch(e) {}
}
function saveState() { localStorage.setItem('focusflow_min', JSON.stringify(S)); }

/* ============================================================
   NEBULA CANVAS
   ============================================================ */
(function nebula() {
    const canvas = document.getElementById('nebula');
    const ctx = canvas.getContext('2d');
    let W, H, particles = [], mouse = { x: -9999, y: -9999 };
    const MAX_P = 80;
    function resize() {
        W = canvas.width = window.innerWidth * devicePixelRatio;
        H = canvas.height = window.innerHeight * devicePixelRatio;
        canvas.style.width = window.innerWidth + 'px';
        canvas.style.height = window.innerHeight + 'px';
    }
    resize();
    window.addEventListener('resize', resize);
    window.addEventListener('mousemove', e => {
        mouse.x = e.clientX * devicePixelRatio;
        mouse.y = e.clientY * devicePixelRatio;
    });
    class Particle {
        constructor() { this.reset(true); }
        reset(initial) {
            this.x = Math.random() * W;
            this.y = initial ? Math.random() * H : H + 20 * devicePixelRatio;
            this.size = (Math.random() * 2 + 0.5) * devicePixelRatio;
            this.speedY = -(Math.random() * 0.35 + 0.05) * devicePixelRatio;
            this.speedX = (Math.random() - 0.5) * 0.15 * devicePixelRatio;
            this.hue = [265, 190, 155][Math.floor(Math.random() * 3)];
            this.alpha = Math.random() * 0.6 + 0.15;
            this.phase = Math.random() * Math.PI * 2;
            this.pulseSpeed = 0.02 + Math.random() * 0.02;
        }
        update() {
            this.x += this.speedX;
            this.y += this.speedY;
            const dx = this.x - mouse.x, dy = this.y - mouse.y;
            const d2 = dx * dx + dy * dy;
            const maxD = (180 * devicePixelRatio) ** 2;
            if (d2 < maxD) {
                const force = (1 - d2 / maxD) * 0.6;
                this.x += (dx / Math.sqrt(d2 || 1)) * force;
                this.y += (dy / Math.sqrt(d2 || 1)) * force;
            }
            this.phase += this.pulseSpeed;
            if (this.y < -20 || this.x < -20 || this.x > W + 20) this.reset(false);
        }
        draw() {
            const a = this.alpha * (0.7 + 0.3 * Math.sin(this.phase));
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fillStyle = `hsla(${this.hue}, 90%, 65%, ${a})`;
            ctx.shadowColor = `hsla(${this.hue}, 90%, 65%, ${a * 1.5})`;
            ctx.shadowBlur = 8 * devicePixelRatio;
            ctx.fill();
            ctx.shadowBlur = 0;
        }
    }
    for (let i = 0; i < MAX_P; i++) particles.push(new Particle());
    function loop() {
        ctx.clearRect(0, 0, W, H);
        particles.forEach(p => { p.update(); p.draw(); });
        requestAnimationFrame(loop);
    }
    loop();
})();

/* ============================================================
   BUBBLES
   ============================================================ */
function spawnBubbles() {
    const wrap = $('#bubbles');
    for (let i = 0; i < 20; i++) {
        const b = document.createElement('div');
        b.className = 'bubble';
        const size = 20 + Math.random() * 80;
        b.style.width = size + 'px';
        b.style.height = size + 'px';
        b.style.left = Math.random() * 100 + '%';
        b.style.animationDuration = (14 + Math.random() * 16) + 's';
        b.style.animationDelay = (Math.random() * 14) + 's';
        b.style.setProperty('--drift', (Math.random() * 120 - 60) + 'px');
        wrap.appendChild(b);
    }
}

/* ============================================================
   TOAST
   ============================================================ */
function toast(msg, type = 'info') {
    const icons = { info: '✨', success: '✅', warn: '⚠️', focus: '🎯', music: '🎵' };
    const el = document.createElement('div');
    el.className = 'toast-msg';
    el.innerHTML = `<span>${icons[type] || '✨'}</span><span>${msg}</span>`;
    $('#toastStack').appendChild(el);
    setTimeout(() => { el.classList.add('out'); setTimeout(() => el.remove(), 300); }, 3200);
}

/* ============================================================
   LOADER
   ============================================================ */
window.addEventListener('load', () => {
    setTimeout(() => $('#loader').classList.add('hide'), 1200);
});

/* ============================================================
   THEME
   ============================================================ */
$('#themeToggle').addEventListener('click', () => {
    document.body.classList.toggle('light');
    const light = document.body.classList.contains('light');
    S.theme = light ? 'light' : 'dark';
    saveState();
    $('#themeToggle').innerHTML = light
        ? '<i class="fa-solid fa-sun"></i>'
        : '<i class="fa-solid fa-moon"></i>';
});
if (S.theme === 'light') {
    document.body.classList.add('light');
    $('#themeToggle').innerHTML = '<i class="fa-solid fa-sun"></i>';
}

/* ============================================================
   FOCUS MODE
   ============================================================ */
function toggleFocusMode() {
    document.body.classList.toggle('focus-mode');
    const on = document.body.classList.contains('focus-mode');
    $('#focusModeBtn').innerHTML = on
        ? '<i class="fa-solid fa-compress"></i>'
        : '<i class="fa-solid fa-expand"></i>';
    if (on && document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen().catch(() => {});
    } else if (!on && document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
    }
    toast(on ? 'Focus mode ON' : 'Focus mode OFF', 'focus');
}
$('#focusModeBtn').addEventListener('click', toggleFocusMode);

/* ============================================================
   TIMER
   ============================================================ */
let interval = null;
let totalSeconds = 25 * 60;
let remaining = 25 * 60;
let mode = 'focus';
let currentPreset = 25;

const ringFill = $('#ringFill');
const ringSecond = $('#ringSecond');
const ringTip = $('#ringTip');
const timeMM = $('.t-mm');
const timeSS = $('.t-ss');
const timeSub = $('#timeSub');
const modePill = $('#modePill');
const startBtn = $('#startTimer');
const clockStage = $('#clockStage');
const progressLine = $('#progressLine');
const progressPct = $('#progressPct');

const CIRC_MAIN = 2 * Math.PI * 168;
const CIRC_SEC = 2 * Math.PI * 186;
const TIP_RADIUS = 168;

function buildTicks() {
    const g = $('#ticks');
    const cx = 200, cy = 200, rOuter = 190, rInner = 182;
    for (let i = 0; i < 60; i++) {
        const angle = (i / 60) * Math.PI * 2;
        const x1 = cx + Math.cos(angle) * rInner;
        const y1 = cy + Math.sin(angle) * rInner;
        const x2 = cx + Math.cos(angle) * rOuter;
        const y2 = cy + Math.sin(angle) * rOuter;
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', x1); line.setAttribute('y1', y1);
        line.setAttribute('x2', x2); line.setAttribute('y2', y2);
        if (i % 5 === 0) line.setAttribute('stroke-width', '2');
        g.appendChild(line);
    }
}

function renderTime() {
    const m = Math.floor(remaining / 60).toString().padStart(2, '0');
    const s = (remaining % 60).toString().padStart(2, '0');
    timeMM.textContent = m;
    timeSS.textContent = s;
    const mins = Math.floor(remaining / 60);
    const secs = remaining % 60;
    timeSub.textContent = `${mins} min · ${secs} sec`;

    const elapsedFrac = 1 - remaining / totalSeconds;
    ringFill.style.strokeDashoffset = CIRC_MAIN * elapsedFrac;

    const secFrac = (remaining % 60) / 60;
    ringSecond.style.strokeDashoffset = CIRC_SEC * (1 - secFrac);

    const tipAngle = -90 + elapsedFrac * 360;
    const tipRad = tipAngle * Math.PI / 180;
    const cx = 200 + Math.cos(tipRad) * TIP_RADIUS;
    const cy = 200 + Math.sin(tipRad) * TIP_RADIUS;
    ringTip.setAttribute('cx', cx);
    ringTip.setAttribute('cy', cy);

    const pct = Math.round(elapsedFrac * 100);
    progressLine.style.width = pct + '%';
    progressPct.textContent = pct + '%';

    document.title = `${m}:${s} · ${mode === 'focus' ? 'Focus' : 'Break'} — FocusFlow`;
}

function setMode(newMode) {
    mode = newMode;
    modePill.textContent = mode === 'focus' ? 'FOCUS' : 'BREAK';
    modePill.classList.toggle('break', mode !== 'focus');
}

function startTick() {
    clockStage.classList.add('running');
    startBtn.classList.add('paused');
    startBtn.innerHTML = '<i class="fa-solid fa-pause"></i><span>Pause</span>';
    interval = setInterval(() => {
        remaining--;
        renderTime();
        if (remaining <= 0) {
            clearInterval(interval);
            interval = null;
            completeSession();
        }
    }, 1000);
}

function pauseTick() {
    clockStage.classList.remove('running');
    startBtn.classList.remove('paused');
    startBtn.innerHTML = '<i class="fa-solid fa-play"></i><span>Resume</span>';
    clearInterval(interval);
    interval = null;
}

function resetTimer() {
    clearInterval(interval);
    interval = null;
    remaining = totalSeconds;
    clockStage.classList.remove('running');
    startBtn.classList.remove('paused');
    startBtn.innerHTML = '<i class="fa-solid fa-play"></i><span>Start</span>';
    renderTime();
}

function completeSession() {
    const mins = Math.round(totalSeconds / 60);
    if (mode === 'focus') {
        toast(`${mins} min focus complete! Great work 🎯`, 'focus');
        beep();
        setTimeout(() => {
            totalSeconds = 5 * 60;
            remaining = totalSeconds;
            setMode('break');
            renderTime();
            toast('Time for a short 5-min break ☕', 'info');
            currentPreset = 5;
            $$('.preset').forEach(p => p.classList.remove('active'));
        }, 800);
    } else {
        toast('Break over. Ready to focus again? 🚀', 'success');
        beep();
        setTimeout(() => {
            totalSeconds = (currentPreset || 25) * 60;
            remaining = totalSeconds;
            setMode('focus');
            renderTime();
        }, 800);
    }
    resetTimer();
}

function beep() {
    try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        [523, 659, 784, 1047].forEach((f, i) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.frequency.value = f;
            osc.type = 'sine';
            osc.connect(gain).connect(ctx.destination);
            const t = ctx.currentTime + i * 0.12;
            gain.gain.setValueAtTime(0, t);
            gain.gain.linearRampToValueAtTime(0.18, t + 0.01);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
            osc.start(t); osc.stop(t + 0.4);
        });
    } catch(e) {}
}

startBtn.addEventListener('click', () => { if (interval) pauseTick(); else startTick(); });
$('#resetTimer').addEventListener('click', () => { resetTimer(); toast('Timer reset', 'info'); });
$('#skipTimer').addEventListener('click', () => {
    remaining = 1;
    if (!interval) startTick();
    toast('Skipping ahead…', 'info');
});

$$('.preset[data-min]').forEach(btn => {
    btn.addEventListener('click', () => {
        const min = +btn.dataset.min;
        currentPreset = min;
        totalSeconds = min * 60;
        remaining = totalSeconds;
        resetTimer();
        setMode('focus');
        renderTime();
        $$('.preset').forEach(p => p.classList.remove('active'));
        btn.classList.add('active');
        $('#customPanel').classList.remove('open');
        toast(`${min} min preset loaded`, 'focus');
    });
});

$('#customTimeBtn').addEventListener('click', () => {
    $('#customPanel').classList.toggle('open');
});
$('#customCancel').addEventListener('click', () => {
    $('#customPanel').classList.remove('open');
});
$('#customApply').addEventListener('click', () => {
    const m = Math.max(0, Math.min(180, +$('#customMin').value || 0));
    const s = Math.max(0, Math.min(59, +$('#customSec').value || 0));
    if (m === 0 && s === 0) return toast('Please enter a valid time', 'warn');
    totalSeconds = m * 60 + s;
    remaining = totalSeconds;
    currentPreset = m;
    resetTimer();
    setMode('focus');
    renderTime();
    $('#customPanel').classList.remove('open');
    $$('.preset').forEach(p => p.classList.remove('active'));
    toast(`Custom timer set: ${m}m ${s}s`, 'focus');
});

/* ============================================================
   STICKY YOUTUBE PLAYER
   ============================================================ */
const ytPlayer = $('#ytPlayer');
const ytFrame = $('#ytFrame');
const ytOverlay = $('#ytOverlay');
const ytTitle = $('#ytTitle');
const ytSub = $('#ytSub');
const ytPlayPause = $('#ytPlayPause');
const ytVolume = $('#ytVolume');
const ytExpand = $('#ytExpand');
const ytClose = $('#ytClose');

let ytApi = null;         // YT.Player instance
let ytCurrentId = 'jfKfPfyJRdk';
let ytCurrentName = 'Lo-Fi Study Beats';
let ytIsPlaying = false;
let ytIsMuted = false;
let ytLoaded = false;

/* Load YT IFrame API */
function loadYTAPI() {
    if (window.YT && window.YT.Player) { initYTPlayer(); return; }
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    tag.onerror = () => {
        toast('YouTube API blocked — check connection', 'warn');
    };
    document.head.appendChild(tag);
    window.onYouTubeIframeAPIReady = initYTPlayer;
}

function initYTPlayer() {
    if (ytApi) return;
    ytApi = new YT.Player('ytFrame', {
        videoId: ytCurrentId,
        playerVars: {
            autoplay: 0,
            controls: 1,
            modestbranding: 1,
            rel: 0,
            playsinline: 1,
            origin: window.location.origin
        },
        events: {
            onReady: (e) => {
                ytLoaded = true;
                ytApi.setVolume(60);
                ytOverlay.classList.add('hide');
                // Auto-play muted for browser policy
                ytApi.mute();
                ytApi.playVideo();
                setTimeout(() => {
                    ytApi.unMute();
                    ytApi.setVolume(60);
                }, 300);
            },
            onStateChange: (e) => {
                if (e.data === YT.PlayerState.PLAYING) {
                    ytIsPlaying = true;
                    ytPlayPause.innerHTML = '<i class="fa-solid fa-pause"></i>';
                    ytSub.textContent = 'Now playing';
                } else if (e.data === YT.PlayerState.PAUSED) {
                    ytIsPlaying = false;
                    ytPlayPause.innerHTML = '<i class="fa-solid fa-play"></i>';
                    ytSub.textContent = 'Paused';
                } else if (e.data === YT.PlayerState.ENDED) {
                    ytIsPlaying = false;
                    ytPlayPause.innerHTML = '<i class="fa-solid fa-play"></i>';
                    ytSub.textContent = 'Ended';
                } else if (e.data === YT.PlayerState.BUFFERING) {
                    ytSub.textContent = 'Buffering…';
                }
            },
            onError: () => {
                toast('Video unavailable in your region', 'warn');
            }
        }
    });
}

/* Overlay click → load & play */
ytOverlay.addEventListener('click', () => {
    ytOverlay.classList.add('hide');
    loadYTAPI();
    // Expand on load
    ytPlayer.classList.remove('minimized');
    S.ytMinimized = false;
    saveState();
    updateExpandIcon();
});

/* Play / pause */
ytPlayPause.addEventListener('click', () => {
    if (!ytApi) { loadYTAPI(); return; }
    if (ytIsPlaying) {
        ytApi.pauseVideo();
    } else {
        ytApi.playVideo();
    }
});

/* Mute / unmute */
ytVolume.addEventListener('click', () => {
    if (!ytApi) { loadYTAPI(); return; }
    if (ytIsMuted) {
        ytApi.unMute();
        ytVolume.innerHTML = '<i class="fa-solid fa-volume-high"></i>';
        ytIsMuted = false;
    } else {
        ytApi.mute();
        ytVolume.innerHTML = '<i class="fa-solid fa-volume-xmark"></i>';
        ytIsMuted = true;
    }
});

/* Expand / minimize */
function updateExpandIcon() {
    if (ytPlayer.classList.contains('minimized')) {
        ytExpand.innerHTML = '<i class="fa-solid fa-up-right-and-down-left-from-center"></i>';
    } else {
        ytExpand.innerHTML = '<i class="fa-solid fa-down-left-and-up-right-to-center"></i>';
    }
}
ytExpand.addEventListener('click', () => {
    ytPlayer.classList.toggle('minimized');
    S.ytMinimized = ytPlayer.classList.contains('minimized');
    saveState();
    updateExpandIcon();
});

/* Close */
ytClose.addEventListener('click', () => {
    ytPlayer.classList.add('hidden-player');
    if (ytApi) { try { ytApi.pauseVideo(); } catch(e){} }
    setTimeout(() => {
        toast('Player hidden — press Y to bring back', 'info');
    }, 300);
});

/* Preset switching */
$$('.yt-chip').forEach(chip => {
    chip.addEventListener('click', () => {
        $$('.yt-chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        ytCurrentId = chip.dataset.id;
        ytCurrentName = chip.dataset.name;
        ytTitle.textContent = ytCurrentName;
        if (!ytApi) { loadYTAPI(); return; }
        ytApi.loadVideoById(ytCurrentId);
        if (ytApi.isMuted && ytApi.isMuted()) {
            ytApi.unMute();
            ytApi.setVolume(60);
        }
        toast(`Now playing: ${ytCurrentName}`, 'music');
    });
});

/* Restore player with Y shortcut */
document.addEventListener('keydown', e => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        if (e.key === 'Escape') e.target.blur();
        return;
    }
    if (e.code === 'Space') { e.preventDefault(); startBtn.click(); }
    if (e.key === 'r' || e.key === 'R') $('#resetTimer').click();
    if (e.key === 'f' || e.key === 'F') toggleFocusMode();
    if (e.key === 't' || e.key === 'T') $('#themeToggle').click();
    if (e.key === 'y' || e.key === 'Y') {
        if (ytPlayer.classList.contains('hidden-player')) {
            ytPlayer.classList.remove('hidden-player');
            toast('Player restored', 'music');
        } else {
            ytPlayer.classList.toggle('minimized');
            S.ytMinimized = ytPlayer.classList.contains('minimized');
            saveState();
            updateExpandIcon();
        }
    }
    if (e.key === 'm' || e.key === 'M') ytPlayPause.click();
    if (e.key === 'Escape' && document.body.classList.contains('focus-mode')) toggleFocusMode();
});

/* ============================================================
   INIT
   ============================================================ */
function init() {
    loadState();
    spawnBubbles();
    buildTicks();
    setMode('focus');
    renderTime();
    updateExpandIcon();
    // Restore minimized state
    if (!S.ytMinimized) ytPlayer.classList.remove('minimized');
    // Restore theme
    if (S.theme === 'light') {
        document.body.classList.add('light');
        $('#themeToggle').innerHTML = '<i class="fa-solid fa-sun"></i>';
    }
}
init();

console.log('%c⚡ FocusFlow Minimal loaded', 'background:linear-gradient(90deg,#7c5cff,#00d4ff,#00ffa3);color:#fff;padding:8px 16px;border-radius:8px;font-weight:700;font-size:14px;');
console.log('Shortcuts → SPACE:timer  R:reset  F:focus  T:theme  Y:player toggle  M:play/pause  ESC:exit');
