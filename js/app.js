/* Main app — command parser, AI, progress bars */

const aiOutput = document.getElementById('aiOutput');
const cmdInput = document.getElementById('cmdInput');
const history = [];
let histIdx = -1;

// ---------- Terminal helpers ----------
function addAILine(text, type = '') {
  const d = document.createElement('div');
  d.className = 'term-line ' + type;
  aiOutput.appendChild(d);
  aiOutput.scrollTop = aiOutput.scrollHeight;
  return typeWriter(d, text, 12);
}
window.addAILine = addAILine;

// ---------- Command router ----------
async function handleCommand(raw) {
  const cmd = raw.trim();
  if (!cmd) return;

  history.push(cmd); histIdx = history.length;
  const [c, ...rest] = cmd.split(' ');
  const arg = rest.join(' ');

  switch (c.toLowerCase()) {
    case '/help':
      Sound.play('click');
      await addAILine('Commands: /start /pause /resume /stop /break /goal <min> /stats /music /ai <question> /help', 'ai');
      break;
    case '/start':
      Sound.play('click');
      Timer.start();
      await addAILine('> Timer started. Focus! 🚀', 'ai');
      break;
    case '/pause':
      Timer.pause();
      await addAILine('> Paused. ⏸', 'ai');
      break;
    case '/resume':
      Timer.resume();
      await addAILine('> Resumed. ▶', 'ai');
      break;
    case '/stop':
      Timer.stop();
      await addAILine('> Stopped & reset. 🛑', 'ai');
      break;
    case '/break':
      Timer.setPhase('short');
      await addAILine('> Switched to short break. ☕', 'ai');
      break;
    case '/goal': {
      const v = parseInt(arg);
      if (isNaN(v)) { await addAILine('> Usage: /goal <minutes>', 'err'); break; }
      localStorage.setItem('goal', v);
      updateProgress();
      await addAILine(`> Daily goal set to ${v} minutes. 🎯`, 'ai');
      break;
    }
    case '/stats':
      await addAILine('> Fetching stats…', 'ai');
      await fetchStats();
      break;
    case '/music':
      if (Sound.isMuted()) { Sound.toggle(); }
      Sound.startAmbient();
      await addAILine('> Ambient focus music on 🎵', 'ai');
      break;
    case '/ai':
      if (!arg) { await addAILine('> Usage: /ai <question>', 'err'); break; }
      await askAI(arg);
      break;
    default:
      await addAILine(`> Unknown command: ${c}. Type /help`, 'err');
  }
}

// ---------- AI proxy ----------
async function askAI(question) {
  addAILine('🤖 thinking…', 'ai');
  try {
    const res = await fetch('api.php?action=ai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: question })
    });
    const data = await res.json();
    aiOutput.removeChild(aiOutput.lastChild);
    await addAILine('🤖 ' + (data.reply || 'No reply.'), 'ai');
    Sound.play('success');
  } catch (e) {
    aiOutput.removeChild(aiOutput.lastChild);
    await addAILine('> AI error: ' + e.message, 'err');
  }
}

// ---------- Stats ----------
async function fetchStats() {
  try {
    const res = await fetch('api.php?action=stats');
    const data = await res.json();
    await addAILine(
      `> Daily: ${data.daily || 0}min · Weekly: ${data.weekly || 0}min · Sessions: ${data.sessions || 0}`,
      'ai'
    );
    if (data.weeklySeries) Charts.updateLineData(data.weeklySeries);
    if (data.focusScore != null) {
      document.getElementById('focusTxt').textContent = data.focusScore + '%';
      const el = document.getElementById('focusBar');
      el.style.width = data.focusScore + '%';
      el.className = 'pfill ' + (data.focusScore > 70 ? '' : data.focusScore > 40 ? 'warn' : 'bad');
    }
  } catch (e) {
    await addAILine('> Stats error: ' + e.message, 'err');
  }
}

// ---------- Progress bars ----------
function updateProgress() {
  const goal = +(localStorage.getItem('goal') || 120);
  const done = +(localStorage.getItem('todayMin') || 0);
  const week = +(localStorage.getItem('weekMin') || 0);

  document.getElementById('dailyTxt').textContent = `${done}/${goal} min`;
  document.getElementById('weeklyTxt').textContent = `${week}/${goal * 5} min`;

  const dPct = Math.min(100, (done / goal) * 100);
  const wPct = Math.min(100, (week / (goal * 5)) * 100);

  const dB = document.getElementById('dailyBar');
  const wB = document.getElementById('weeklyBar');
  dB.style.width = dPct + '%';
  wB.style.width = wPct + '%';
  dB.className = 'pfill ' + (dPct > 70 ? '' : dPct > 40 ? 'warn' : 'bad');
  wB.className = 'pfill ' + (wPct > 70 ? '' : wPct > 40 ? 'warn' : 'bad');

  if (dPct >= 100) Badges.unlock(6);
}

// ---------- Server sync ----------
function pushSessionToServer(minutes) {
  const today = +(localStorage.getItem('todayMin') || 0) + minutes;
  const week  = +(localStorage.getItem('weekMin') || 0) + minutes;
  localStorage.setItem('todayMin', today);
  localStorage.setItem('weekMin', week);
  updateProgress();

  fetch('api.php?action=session_end', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ minutes })
  }).catch(() => {});
}
window.pushSessionToServer = pushSessionToServer;

// ---------- Input & keys ----------
cmdInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    const val = cmdInput.value;
    addAILine('› ' + val, 'user');
    cmdInput.value = '';
    handleCommand(val);
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    if (histIdx > 0) cmdInput.value = history[--histIdx] || '';
  } else if (e.key === 'ArrowDown') {
    e.preventDefault();
    if (histIdx < history.length - 1) cmdInput.value = history[++histIdx] || '';
  } else if (e.key === 'Tab') {
    e.preventDefault();
    const v = cmdInput.value;
    const cmds = ['/start','/pause','/resume','/stop','/break','/goal','/stats','/music','/ai','/help'];
    const match = cmds.find(c => c.startsWith(v));
    if (match) cmdInput.value = match + ' ';
  }
});

document.addEventListener('keydown', (e) => {
  if (e.code === 'Space' && document.activeElement !== cmdInput) {
    e.preventDefault();
    const st = Timer.getState();
    st.running ? Timer.pause() : Timer.start();
  }
  if (e.ctrlKey && e.key.toLowerCase() === 'k') {
    e.preventDefault();
    cmdInput.focus();
  }
});

// ---------- Mute ----------
document.getElementById('muteBtn').addEventListener('click', () => {
  const m = Sound.toggle();
  document.getElementById('muteBtn').textContent = m ? '🔇' : '🔊';
});

// ---------- Bubble stats ----------
function refreshBubbles() {
  const today = +(localStorage.getItem('todayMin') || 0);
  const st = Timer.getState();
  Bubbles.render([today, st.session, XP.getLevel() * 10, (localStorage.getItem('weekMin') || 0)]);
}
setInterval(refreshBubbles, 3000);

// ---------- Init ----------
window.addEventListener('load', () => {
  document.getElementById('muteBtn').textContent = Sound.isMuted() ? '🔇' : '🔊';
  updateProgress();
  refreshBubbles();
  Badges.render([0]);
  fetchStats();
  // Streak demo
  const streak = +(localStorage.getItem('streak') || 0);
  document.getElementById('streakDays').textContent = streak || 0;
});
