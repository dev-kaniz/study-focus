/* ============================================================
   FOCUSFLOW v2 — App Logic
   ============================================================ */

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

/* ---------- STATE ---------- */
const S = {
    focusMinutes: 0, breakMinutes: 0, waterGlasses: 0, pomodoros: 0,
    tasks: [], history: [], waterGoal: 8, theme: 'dark'
};
function loadState() {
    try {
        const raw = localStorage.getItem('focusflow_v2');
        if (raw) Object.assign(S, JSON.parse(raw));
    } catch(e) {}
}
function saveState() { localStorage.setItem('focusflow_v2', JSON.stringify(S)); }

/* ---------- BUBBLES ---------- */
function spawnBubbles() {
    const wrap = $('#bubbles');
    for (let i = 0; i < 22; i++) {
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

/* ---------- TOAST ---------- */
function toast(msg, type = 'info') {
    const icons = { info: '✨', success: '✅', warn: '⚠️', water: '💧', focus: '🎯', music: '🎵' };
    const el = document.createElement('div');
    el.className = 'toast-msg';
    el.innerHTML = `<span>${icons[type] || '✨'}</span><span>${msg}</span>`;
    $('#toastStack').appendChild(el);
    setTimeout(() => { el.classList.add('out'); setTimeout(() => el.remove(), 300); }, 3200);
}

/* ---------- LOADER ---------- */
window.addEventListener('load', () => {
    setTimeout(() => $('#loader').classList.add('hide'), 1100);
});

/* ---------- THEME ---------- */
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

/* ---------- FOCUS MODE ---------- */
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
    toast(on ? 'Focus mode ON — pure concentration' : 'Focus mode OFF', 'focus');
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

const ringTick = $('#ringTick');
const timeDisplay = $('#timeDisplay');
const modePill = $('#modePill');
const startBtn = $('#startTimer');
const clockStage = $('#clockStage');
const CIRC = 2 * Math.PI * 170; // r=170

function renderTime() {
    const m = Math.floor(remaining / 60).toString().padStart(2, '0');
    const s = (remaining % 60).toString().padStart(2, '0');
    timeDisplay.textContent = `${m}:${s}`;

    const pct = remaining / totalSeconds;
    ringTick.style.strokeDashoffset = CIRC * (1 - pct);

    document.title = `${m}:${s} · ${mode === 'focus' ? 'Focus' : 'Break'} — FocusFlow`;
}

function setMode(newMode) {
    mode = newMode;
    modePill.textContent = mode === 'focus' ? 'FOCUS' : 'BREAK';
    modePill.classList.toggle('break', mode !== 'focus');
    document.body.classList.toggle('break-mode', mode !== 'focus');
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
        S.focusMinutes += mins;
        S.pomodoros++;
        const subject = $('#subjectInput').value.trim() || 'Focus Session';
        addHistory(subject, 'Focus', mins);
        toast(`${mins} min focus complete! Great work 🎯`, 'focus');
        beep();
        // Auto-suggest break
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
        S.breakMinutes += mins;
        addHistory('Break', 'Break', mins);
        toast('Break over. Ready to focus again? 🚀', 'success');
        beep();
        setTimeout(() => {
            totalSeconds = (currentPreset || 25) * 60;
            remaining = totalSeconds;
            setMode('focus');
            renderTime();
        }, 800);
    }
    saveState();
    updateStats();
    renderHistory();
    resetTimer();
}

function beep() {
    try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        [523, 659, 784].forEach((f, i) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.frequency.value = f;
            osc.type = 'sine';
            osc.connect(gain).connect(ctx.destination);
            const t = ctx.currentTime + i * 0.12;
            gain.gain.setValueAtTime(0, t);
            gain.gain.linearRampToValueAtTime(0.2, t + 0.01);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
            osc.start(t); osc.stop(t + 0.4);
        });
    } catch(e) {}
}

/* Start / Pause */
startBtn.addEventListener('click', () => {
    if (interval) pauseTick();
    else startTick();
});

/* Reset */
$('#resetTimer').addEventListener('click', () => {
    resetTimer();
    toast('Timer reset', 'info');
});

/* Skip */
$('#skipTimer').addEventListener('click', () => {
    remaining = 1;
    if (!interval) startTick();
    toast('Skipping ahead…', 'info');
});

/* Presets */
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

/* Custom time */
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
   MUSIC
   ============================================================ */
let ctx = null, ambientNodes = [];
const audio = $('#audioPlayer');

function stopAmbient() {
    ambientNodes.forEach(n => { try { n.stop && n.stop(); n.disconnect && n.disconnect(); } catch(e){} });
    ambientNodes = [];
}
function noiseBuffer() {
    const size = 2 * ctx.sampleRate;
    const buf = ctx.createBuffer(1, size, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < size; i++) d[i] = Math.random() * 2 - 1;
    return buf;
}
function startAmbient(type) {
    stopAmbient();
    if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === 'suspended') ctx.resume();

    if (type === 'white' || type === 'brown' || type === 'rain') {
        const src = ctx.createBufferSource();
        src.buffer = noiseBuffer();
        src.loop = true;
        let node = src;
        if (type === 'rain') {
            const f = ctx.createBiquadFilter();
            f.type = 'lowpass'; f.frequency.value = 1200;
            src.connect(f); node = f;
        } else if (type === 'brown') {
            const f = ctx.createBiquadFilter();
            f.type = 'lowpass'; f.frequency.value = 500;
            const g = ctx.createGain(); g.gain.value = 0.9;
            src.connect(f).connect(g); node = g;
        }
        const gain = ctx.createGain();
        gain.gain.value = 0.08;
        node.connect(gain).connect(ctx.destination);
        src.start();
        ambientNodes.push(src, gain);
    } else if (type === 'lofi' || type === 'piano') {
        const freqs = type === 'piano'
            ? [261.63, 329.63, 392.00, 523.25]
            : [174.61, 220.00, 261.63, 329.63];
        freqs.forEach((f, i) => {
            const osc = ctx.createOscillator();
            osc.type = type === 'piano' ? 'sine' : 'triangle';
            osc.frequency.value = f * (1 + (Math.random()-0.5) * 0.003);
            const g = ctx.createGain();
            g.gain.value = 0.025;
            const lfo = ctx.createOscillator();
            const lfoG = ctx.createGain();
            lfo.frequency.value = 0.1 + Math.random() * 0.15;
            lfoG.gain.value = 0.01;
            lfo.connect(lfoG).connect(g.gain);
            osc.connect(g).connect(ctx.destination);
            osc.start(); lfo.start();
            ambientNodes.push(osc, g, lfo, lfoG);
        });
    }
    const titles = {
        lofi: ['Lo-Fi Focus', 'Ambient Stream'],
        rain: ['Rain & Thunder', 'Nature Ambience'],
        piano: ['Soft Piano', 'Gentle Keys'],
        white: ['White Noise', 'Focus Stream'],
        brown: ['Brown Noise', 'Deep Focus']
    };
    if (titles[type]) {
        $('#trackTitle').textContent = titles[type][0];
        $('#trackArtist').textContent = titles[type][1];
    }
}

/* Orb click = toggle */
const orb = $('#orb');
const musicLive = $('#musicLive');

orb.addEventListener('click', () => {
    const playing = orb.classList.toggle('playing');
    musicLive.classList.toggle('on', playing);
    if (playing) {
        startAmbient($('#trackSelector').value !== 'custom' ? $('#trackSelector').value : 'lofi');
    } else {
        stopAmbient();
    }
});

$('#trackSelector').addEventListener('change', (e) => {
    const val = e.target.value;
    if (val === 'custom') {
        $('#audioUpload').click();
        return;
    }
    if (orb.classList.contains('playing')) startAmbient(val);
    else {
        orb.classList.add('playing');
        musicLive.classList.add('on');
        startAmbient(val);
    }
});

$('#audioUpload').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    audio.src = URL.createObjectURL(file);
    $('#trackTitle').textContent = file.name.replace(/\.[^.]+$/, '');
    $('#trackArtist').textContent = 'Your Audio';
    stopAmbient();
    audio.play();
    orb.classList.add('playing');
    musicLive.classList.add('on');
});

$('#volume').addEventListener('input', (e) => {
    const v = e.target.value / 100;
    audio.volume = v;
    ambientNodes.forEach(n => {
        if (n.gain) try { n.gain.value = (n.gain.value > 0 ? v * 0.08 : 0.08); } catch(e){}
    });
});

/* ============================================================
   WATER
   ============================================================ */
function renderWater() {
    const wrap = $('#waterRow');
    wrap.innerHTML = '';
    for (let i = 0; i < S.waterGoal; i++) {
        const d = document.createElement('div');
        d.className = 'water-dot' + (i < S.waterGlasses ? ' filled' : '');
        wrap.appendChild(d);
    }
    updateStats();
}
$('#addWater').addEventListener('click', () => {
    if (S.waterGlasses >= S.waterGoal) {
        S.waterGlasses = 0;
        toast('Water reset — new day, new goals 💧', 'water');
    } else {
        S.waterGlasses++;
        toast(`${S.waterGlasses}/${S.waterGoal} glasses — stay hydrated!`, 'water');
    }
    saveState();
    renderWater();
});

/* ============================================================
   TASKS
   ============================================================ */
function renderTasks() {
    const list = $('#taskList');
    const badge = $('#taskBadge');
    list.innerHTML = '';
    const doneCount = S.tasks.filter(t => t.done).length;
    badge.textContent = `${doneCount}/${S.tasks.length}`;
    if (S.tasks.length === 0) {
        list.innerHTML = '<li style="justify-content:center;color:var(--text-faint);border-style:dashed;">No tasks yet — add one above ✨</li>';
        return;
    }
    S.tasks.forEach((t, i) => {
        const li = document.createElement('li');
        if (t.done) li.classList.add('done');
        li.innerHTML = `
            <input type="checkbox" ${t.done ? 'checked' : ''} data-i="${i}">
            <span class="task-text">${escapeHtml(t.text)}</span>
            <button class="task-del" data-i="${i}"><i class="fa-solid fa-xmark"></i></button>
        `;
        list.appendChild(li);
    });
    $$('#taskList input[type=checkbox]').forEach(cb => {
        cb.addEventListener('change', e => {
            S.tasks[+e.target.dataset.i].done = e.target.checked;
            saveState(); renderTasks();
        });
    });
    $$('#taskList .task-del').forEach(btn => {
        btn.addEventListener('click', e => {
            S.tasks.splice(+e.currentTarget.dataset.i, 1);
            saveState(); renderTasks();
        });
    });
}
function addTask() {
    const inp = $('#taskInput');
    const v = inp.value.trim();
    if (!v) return;
    S.tasks.push({ text: v, done: false });
    inp.value = '';
    saveState(); renderTasks();
    toast('Task added ✨', 'success');
}
$('#addTask').addEventListener('click', addTask);
$('#taskInput').addEventListener('keypress', e => { if (e.key === 'Enter') addTask(); });

/* ============================================================
   HISTORY
   ============================================================ */
function addHistory(subject, mode, minutes) {
    S.history.unshift({ subject, mode, minutes, time: new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}) });
    if (S.history.length > 30) S.history.pop();
    saveState();
}
function renderHistory() {
    const body = $('#historyBody');
    if (S.history.length === 0) {
        body.innerHTML = '<div class="empty">No sessions yet. Start your first focus block 🚀</div>';
        return;
    }
    body.innerHTML = S.history.slice(0, 8).map(h => `
        <div class="history-item">
            <span class="hi-subject">${escapeHtml(h.subject)}</span>
            <span class="hi-mode ${h.mode === 'Break' ? 'break' : ''}">${h.mode}</span>
            <span class="hi-dur">${h.minutes}m</span>
            <span class="hi-time">${h.time}</span>
        </div>
    `).join('');
}

/* ============================================================
   STATS
   ============================================================ */
function updateStats() {
    $('#statFocus').innerHTML = S.focusMinutes + '<small>m</small>';
    $('#statBreak').innerHTML = S.breakMinutes + '<small>m</small>';
    $('#statWater').textContent = S.waterGlasses;
    $('#statStreak').textContent = S.pomodoros;

    const maxFocus = Math.max(S.focusMinutes, 120);
    const maxBreak = Math.max(S.breakMinutes, 60);
    const maxPom = Math.max(S.pomodoros, 10);
    $('#statFocusBar').style.width = Math.min(100, (S.focusMinutes / maxFocus) * 100) + '%';
    $('#statBreakBar').style.width = Math.min(100, (S.breakMinutes / maxBreak) * 100) + '%';
    $('#statWaterBar').style.width = Math.min(100, (S.waterGlasses / S.waterGoal) * 100) + '%';
    $('#statStreakBar').style.width = Math.min(100, (S.pomodoros / maxPom) * 100) + '%';
}

/* ============================================================
   SUBJECT
   ============================================================ */
const SUBJECTS = ['Math', 'Physics', 'Chemistry', 'Biology', 'English', 'History', 'Programming'];
function renderSubjectTags() {
    const wrap = $('#subjectTags');
    wrap.innerHTML = SUBJECTS.map(s => `<span class="subject-tag">${s}</span>`).join('');
    $$('.subject-tag').forEach(tag => {
        tag.addEventListener('click', () => {
            $('#subjectInput').value = tag.textContent;
            $('#subjectLine').textContent = tag.textContent + ' Session';
            saveState();
        });
    });
}
$('#subjectInput').addEventListener('input', e => {
    $('#subjectLine').textContent = (e.target.value.trim() || 'Deep Work Session');
});

/* ============================================================
   UTIL
   ============================================================ */
function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

/* ============================================================
   KEYBOARD SHORTCUTS
   ============================================================ */
document.addEventListener('keydown', e => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        if (e.key === 'Escape') e.target.blur();
        return;
    }
    if (e.code === 'Space') { e.preventDefault(); startBtn.click(); }
    if (e.key === 'r' || e.key === 'R') $('#resetTimer').click();
    if (e.key === 'f' || e.key === 'F') toggleFocusMode();
    if (e.key === 'm' || e.key === 'M') orb.click();
    if (e.key === 'w' || e.key === 'W') $('#addWater').click();
    if (e.key === 't' || e.key === 'T') $('#themeToggle').click();
    if (e.key === 'Escape' && document.body.classList.contains('focus-mode')) toggleFocusMode();
});

/* ============================================================
   INIT
   ============================================================ */
function init() {
    loadState();
    spawnBubbles();
    setMode('focus');
    renderTime();
    renderWater();
    renderTasks();
    renderHistory();
    updateStats();
    renderSubjectTags();
    $('#subjectLine').textContent = 'Deep Work Session';
    $('#customMin').value = 30;
}
init();

console.log('%c⚡ FocusFlow v2 loaded', 'background:linear-gradient(90deg,#7c5cff,#00d4ff);color:#fff;padding:8px 16px;border-radius:8px;font-weight:700;font-size:14px;');
console.log('Shortcuts → SPACE:start/pause  R:reset  F:focus-mode  M:music  W:water  T:theme  ESC:exit');
