// ============ STATE ============
const state = {
    focusMinutes: 0,
    breakMinutes: 0,
    waterGlasses: 0,
    pomodoros: 0,
    tasks: [],
    history: [],
    waterGoal: 8
};

// ============ LOAD FROM LOCALSTORAGE ============
function loadState() {
    const saved = localStorage.getItem('focusflow');
    if (saved) Object.assign(state, JSON.parse(saved));
}
function saveState() {
    localStorage.setItem('focusflow', JSON.stringify(state));
}

// ============ BUBBLE ANIMATION ============
function createBubbles() {
    const container = document.getElementById('bubbles');
    const count = 25;
    for (let i = 0; i < count; i++) {
        const b = document.createElement('div');
        b.className = 'bubble';
        const size = Math.random() * 60 + 15;
        b.style.width = size + 'px';
        b.style.height = size + 'px';
        b.style.left = Math.random() * 100 + '%';
        b.style.animationDuration = (Math.random() * 15 + 12) + 's';
        b.style.animationDelay = (Math.random() * 10) + 's';
        container.appendChild(b);
    }
}

// ============ LOADER ============
window.addEventListener('load', () => {
    setTimeout(() => {
        document.getElementById('loader').classList.add('hide');
    }, 1200);
});

// ============ THEME TOGGLE ============
document.getElementById('themeToggle').addEventListener('click', () => {
    document.body.classList.toggle('light');
    const isLight = document.body.classList.contains('light');
    localStorage.setItem('theme', isLight ? 'light' : 'dark');
    document.getElementById('themeToggle').innerHTML = isLight
        ? '<i class="fa-solid fa-sun"></i>'
        : '<i class="fa-solid fa-moon"></i>';
});
if (localStorage.getItem('theme') === 'light') {
    document.body.classList.add('light');
    document.getElementById('themeToggle').innerHTML = '<i class="fa-solid fa-sun"></i>';
}

// ============ FULLSCREEN ============
document.getElementById('fullscreenBtn').addEventListener('click', () => {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen();
    } else {
        document.exitFullscreen();
    }
});

// ============ TOAST ============
const toastEl = document.getElementById('liveToast');
const toast = new bootstrap.Toast(toastEl, { delay: 3000 });
function showToast(msg) {
    document.getElementById('toastMsg').textContent = msg;
    toast.show();
}

// ============ MUSIC PLAYER ============
const audioPlayer = document.getElementById('audioPlayer');
const playBtn = document.getElementById('playBtn');
const vinyl = document.getElementById('vinyl');
const bars = document.getElementById('bars');
const trackTitle = document.getElementById('trackTitle');
const trackArtist = document.getElementById('trackArtist');
const trackSelector = document.getElementById('trackSelector');
const audioUpload = document.getElementById('audioUpload');

// Built-in ambient tones using Web Audio API (no external files needed)
let audioCtx = null, ambientNodes = [];

function stopAmbient() {
    ambientNodes.forEach(n => { try { n.stop(); } catch(e){} });
    ambientNodes = [];
}
function playAmbient(type) {
    stopAmbient();
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const ctx = audioCtx;

    if (type === 'white') {
        // White noise
        const bufferSize = 2 * ctx.sampleRate;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
        const src = ctx.createBufferSource();
        src.buffer = buffer; src.loop = true;
        const gain = ctx.createGain(); gain.gain.value = 0.1;
        src.connect(gain).connect(ctx.destination);
        src.start();
        ambientNodes.push(src, gain);
        trackTitle.textContent = 'White Noise';
        trackArtist.textContent = 'Focus Stream';
    } else if (type === 'rain') {
        // Rain-like noise (filtered)
        const bufferSize = 2 * ctx.sampleRate;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
        const src = ctx.createBufferSource(); src.buffer = buffer; src.loop = true;
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass'; filter.frequency.value = 1500;
        const gain = ctx.createGain(); gain.gain.value = 0.15;
        src.connect(filter).connect(gain).connect(ctx.destination);
        src.start();
        ambientNodes.push(src, filter, gain);
        trackTitle.textContent = 'Rain & Thunder';
        trackArtist.textContent = 'Nature Ambience';
    } else if (type === 'lofi' || type === 'piano' || type === 'nature') {
        // Soft tones
        const freqs = type === 'piano' ? [261.63, 329.63, 392.00] : [196, 246.94, 293.66];
        freqs.forEach((f, i) => {
            const osc = ctx.createOscillator();
            osc.type = type === 'piano' ? 'sine' : 'triangle';
            osc.frequency.value = f;
            const gain = ctx.createGain();
            gain.gain.value = 0.03;
            osc.connect(gain).connect(ctx.destination);
            osc.start();
            ambientNodes.push(osc, gain);
        });
        trackTitle.textContent = type === 'piano' ? 'Soft Piano' : type === 'lofi' ? 'Lo-Fi Focus Beat' : 'Nature Sounds';
        trackArtist.textContent = 'Ambient Study Mix';
    }
}

trackSelector.addEventListener('change', () => {
    const val = trackSelector.value;
    if (val === 'custom') {
        audioUpload.classList.remove('d-none');
        audioUpload.click();
        return;
    }
    audioUpload.classList.add('d-none');
    if (audioPlayer.src) audioPlayer.pause();
    playAmbient(val);
    if (!playBtn.classList.contains('playing')) togglePlay();
});

audioUpload.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    audioPlayer.src = url;
    trackTitle.textContent = file.name.replace(/\.[^/.]+$/, '');
    trackArtist.textContent = 'Your Audio';
    stopAmbient();
    audioPlayer.play();
    playBtn.innerHTML = '<i class="fa-solid fa-pause"></i>';
    playBtn.classList.add('playing');
    vinyl.classList.add('spin');
    bars.classList.add('active');
});

function togglePlay() {
    const playing = playBtn.classList.toggle('playing');
    if (playing) {
        playBtn.innerHTML = '<i class="fa-solid fa-pause"></i>';
        vinyl.classList.add('spin');
        bars.classList.add('active');
        if (audioPlayer.src) audioPlayer.play().catch(()=>{});
    } else {
        playBtn.innerHTML = '<i class="fa-solid fa-play"></i>';
        vinyl.classList.remove('spin');
        bars.classList.remove('active');
        if (audioPlayer.src) audioPlayer.pause();
    }
}
playBtn.addEventListener('click', () => {
    if (!audioPlayer.src && trackSelector.value !== 'custom') {
        playAmbient(trackSelector.value);
    }
    togglePlay();
});

document.getElementById('volume').addEventListener('input', (e) => {
    const v = e.target.value / 100;
    audioPlayer.volume = v;
    ambientNodes.forEach(n => {
        if (n.gain) try { n.gain.value = v * 0.1; } catch(e){}
    });
});

document.getElementById('nextBtn').addEventListener('click', () => {
    const options = ['lofi','rain','piano','nature','white'];
    const current = trackSelector.value;
    let idx = options.indexOf(current);
    idx = (idx + 1) % options.length;
    trackSelector.value = options[idx];
    if (playBtn.classList.contains('playing')) playAmbient(options[idx]);
});
document.getElementById('prevBtn').addEventListener('click', () => {
    const options = ['lofi','rain','piano','nature','white'];
    const current = trackSelector.value;
    let idx = options.indexOf(current);
    idx = (idx - 1 + options.length) % options.length;
    trackSelector.value = options[idx];
    if (playBtn.classList.contains('playing')) playAmbient(options[idx]);
});

// ============ POMODORO TIMER ============
let timerInterval = null;
let totalSeconds = 25 * 60;
let remainingSeconds = 25 * 60;
let currentMode = 'focus';
const ringProgress = document.getElementById('ringProgress');
const timeDisplay = document.getElementById('timeDisplay');
const timerModeEl = document.getElementById('timerMode');

function updateTimerDisplay() {
    const m = Math.floor(remainingSeconds / 60).toString().padStart(2, '0');
    const s = (remainingSeconds % 60).toString().padStart(2, '0');
    timeDisplay.textContent = `${m}:${s}`;
    const circumference = 2 * Math.PI * 100;
    const offset = circumference - (remainingSeconds / totalSeconds) * circumference;
    ringProgress.style.strokeDashoffset = offset;
    document.title = `${m}:${s} — FocusFlow`;
}

function startTimer() {
    if (timerInterval) return;
    timerInterval = setInterval(() => {
        remainingSeconds--;
        updateTimerDisplay();
        if (remainingSeconds <= 0) {
            clearInterval(timerInterval);
            timerInterval = null;
            completeSession();
        }
    }, 1000);
}

function completeSession() {
    const minutes = Math.round(totalSeconds / 60);
    if (currentMode === 'focus') {
        state.focusMinutes += minutes;
        state.pomodoros++;
        addHistory(document.getElementById('subjectInput').value || 'Focus Session', 'Focus', minutes);
        showToast(`🎉 ${minutes} min focus session complete!`);
    } else {
        state.breakMinutes += minutes;
        addHistory('Break', 'Break', minutes);
        showToast(`☕ Break over! Time to focus.`);
    }
    saveState();
    updateStats();
    renderHistory();
    beep();
    resetTimer();
}

function beep() {
    try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        [0, 0.15, 0.3].forEach(t => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.frequency.value = 800;
            osc.connect(gain).connect(ctx.destination);
            gain.gain.setValueAtTime(0.3, ctx.currentTime + t);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + t + 0.1);
            osc.start(ctx.currentTime + t);
            osc.stop(ctx.currentTime + t + 0.1);
        });
    } catch(e) {}
}

function resetTimer() {
    clearInterval(timerInterval);
    timerInterval = null;
    const min = parseInt(document.querySelector('.mode-btn.active').dataset.min);
    totalSeconds = min * 60;
    remainingSeconds = totalSeconds;
    updateTimerDisplay();
    document.getElementById('startTimer').innerHTML = '<i class="fa-solid fa-play"></i> Start';
}

document.getElementById('startTimer').addEventListener('click', (e) => {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
        e.currentTarget.innerHTML = '<i class="fa-solid fa-play"></i> Resume';
    } else {
        startTimer();
        e.currentTarget.innerHTML = '<i class="fa-solid fa-pause"></i> Pause';
    }
});
document.getElementById('resetTimer').addEventListener('click', resetTimer);

document.querySelectorAll('.mode-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentMode = btn.dataset.mode;
        timerModeEl.textContent = btn.textContent;
        resetTimer();
    });
});

// ============ WATER TRACKER ============
function renderWater() {
    const wrap = document.getElementById('waterGlasses');
    wrap.innerHTML = '';
    for (let i = 0; i < state.waterGoal; i++) {
        const glass = document.createElement('div');
        glass.className = 'water-glass' + (i < state.waterGlasses ? ' filled' : '');
        wrap.appendChild(glass);
    }
    document.getElementById('waterBar').style.width = Math.min(100, (state.waterGlasses / state.waterGoal) * 100) + '%';
    document.getElementById('waterGoalText').textContent = `${state.waterGlasses} / ${state.waterGoal} glasses`;
}

document.getElementById('addWater').addEventListener('click', () => {
    if (state.waterGlasses >= state.waterGoal) {
        state.waterGlasses = 0;
        showToast('🔄 Water counter reset for the day.');
    } else {
        state.waterGlasses++;
        showToast(`💧 Great! ${state.waterGlasses} glass${state.waterGlasses>1?'es':''} today.`);
    }
    saveState();
    renderWater();
    updateStats();
});

// ============ TASKS ============
function renderTasks() {
    const list = document.getElementById('taskList');
    list.innerHTML = '';
    if (state.tasks.length === 0) {
        list.innerHTML = '<li class="text-muted text-center w-100">No tasks yet. Add one to get started! ✨</li>';
        return;
    }
    state.tasks.forEach((task, idx) => {
        const li = document.createElement('li');
        if (task.done) li.classList.add('done');
        li.innerHTML = `
            <input type="checkbox" ${task.done ? 'checked' : ''} data-idx="${idx}">
            <span class="task-text">${escapeHtml(task.text)}</span>
            <button class="task-delete" data-idx="${idx}"><i class="fa-solid fa-trash"></i></button>
        `;
        list.appendChild(li);
    });
    list.querySelectorAll('input[type=checkbox]').forEach(cb => {
        cb.addEventListener('change', (e) => {
            const i = +e.target.dataset.idx;
            state.tasks[i].done = e.target.checked;
            saveState();
            renderTasks();
        });
    });
    list.querySelectorAll('.task-delete').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const i = +e.currentTarget.dataset.idx;
            state.tasks.splice(i, 1);
            saveState();
            renderTasks();
        });
    });
}

document.getElementById('addTask').addEventListener('click', addTask);
document.getElementById('taskInput').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') addTask();
});
function addTask() {
    const input = document.getElementById('taskInput');
    const txt = input.value.trim();
    if (!txt) return;
    state.tasks.push({ text: txt, done: false });
    input.value = '';
    saveState();
    renderTasks();
    showToast('✅ Task added!');
}

// ============ HISTORY ============
function addHistory(subject, mode, minutes) {
    state.history.unshift({
        subject, mode, minutes,
        time: new Date().toLocaleTimeString()
    });
    if (state.history.length > 50) state.history.pop();
    saveState();
}

function renderHistory() {
    const body = document.getElementById('historyBody');
    if (state.history.length === 0) {
        body.innerHTML = '<tr><td colspan="4" class="text-center text-muted">No sessions yet. Start focusing! 🚀</td></tr>';
        return;
    }
    body.innerHTML = state.history.slice(0, 10).map(h => `
        <tr>
            <td><i class="fa-solid fa-book"></i> ${escapeHtml(h.subject)}</td>
            <td><span class="badge bg-primary">${h.mode}</span></td>
            <td>${h.minutes} min</td>
            <td>${h.time}</td>
        </tr>
    `).join('');
}

// ============ STATS ============
function updateStats() {
    document.getElementById('statFocus').innerHTML = state.focusMinutes + '<small>m</small>';
    document.getElementById('statBreak').innerHTML = state.breakMinutes + '<small>m</small>';
    document.getElementById('statWater').textContent = state.waterGlasses;
    document.getElementById('statStreak').textContent = state.pomodoros;
}

// ============ UTIL ============
function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, c => ({
        '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
    }[c]));
}

// ============ INIT ============
function init() {
    loadState();
    createBubbles();
    updateTimerDisplay();
    renderWater();
    renderTasks();
    renderHistory();
    updateStats();
}
init();

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT') return;
    if (e.code === 'Space') { e.preventDefault(); document.getElementById('startTimer').click(); }
    if (e.key === 'm' || e.key === 'M') playBtn.click();
    if (e.key === 'w' || e.key === 'W') document.getElementById('addWater').click();
});

console.log('%c🎧 FocusFlow Ready! ', 'background:#7f5af0;color:white;padding:6px 12px;border-radius:6px;font-weight:bold;');
console.log('Shortcuts: SPACE = timer, M = music, W = water');
