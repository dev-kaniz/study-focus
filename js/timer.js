/* Pomodoro timer with animated SVG ring */
const Timer = (() => {
  const CFG = { work: 25 * 60, short: 5 * 60, long: 15 * 60 };
  let phase = 'work';
  let remain = CFG.work;
  let total = CFG.work;
  let running = false;
  let tickId = null;
  let session = 0;
  const circumference = 2 * Math.PI * 110;

  const timeEl = document.getElementById('timeDisplay');
  const phaseEl = document.getElementById('phaseLabel');
  const sessEl = document.getElementById('sessionCount');
  const ringEl = document.getElementById('ringProgress');

  ringEl.style.strokeDasharray = circumference;

  function fmt(s) {
    const m = Math.floor(s / 60), ss = s % 60;
    return String(m).padStart(2, '0') + ':' + String(ss).padStart(2, '0');
  }

  function paint() {
    timeEl.textContent = fmt(remain);
    phaseEl.textContent = phase === 'work' ? 'FOCUS' : 'BREAK';
    sessEl.textContent = 'Session ' + session;
    const pct = 1 - remain / total;
    gsap.to(ringEl, {
      strokeDashoffset: circumference * (1 - pct),
      duration: 0.4,
      ease: 'power2.out'
    });
  }

  function start() {
    if (running) return;
    running = true;
    Sound.play('click');
    Sound.startAmbient();
    tickId = setInterval(() => {
      remain--;
      if (remain <= 0) nextPhase();
      else paint();
    }, 1000);
  }

  function pause() {
    if (!running) return;
    running = false;
    clearInterval(tickId);
    Sound.play('click');
    Sound.stopAmbient();
  }

  function resume() { start(); }

  function stop() {
    running = false;
    clearInterval(tickId);
    remain = CFG[phase];
    total = CFG[phase];
    Sound.stopAmbient();
    paint();
  }

  function nextPhase() {
    Sound.play('warning');
    confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
    if (phase === 'work') {
      session++;
      XP.add(25);
      Badges.unlock(Math.min(session - 1, 7));
      phase = session % 4 === 0 ? 'long' : 'short';
    } else {
      phase = 'work';
    }
    remain = total = CFG[phase];
    paint();
    addAILine(`> ${phase === 'work' ? 'Back to focus! 💪' : 'Break time 🎉'}`, 'ai');
    if (typeof pushSessionToServer === 'function' && phase === 'work') {
      pushSessionToServer(session * 25);
    }
  }

  function setPhase(p) {
    phase = p; remain = total = CFG[p];
    paint();
  }

  function getState() {
    return { phase, remain, total, running, session };
  }

  paint();
  return { start, pause, resume, stop, setPhase, getState, CFG };
})();
